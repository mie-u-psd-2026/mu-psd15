"""クレトレ: クレーム対応トレーニングアプリのバックエンド。

AIが怒っている顧客を演じ、利用者の応対に応じて怒りレベルを増減させる。
サーバーは状態を持たず、会話履歴と怒りレベルはリクエストごとに受け取る。
"""

import json
import re
import urllib.request

from flask import Flask, jsonify, request, send_from_directory
from openai import OpenAI

app = Flask(__name__)

if app.debug:

    @app.after_request
    def add_no_cache_header(response):
        # 開発中は静的ファイルのキャッシュを無効にし、編集がすぐ反映されるようにする
        if request.endpoint == "static":
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        return response


client = OpenAI(base_url="http://localhost:11434/v1", api_key="ollama")

OLLAMA_MODEL = "gemma2:9b"
# 既定値(0.8)では応答に英語・スペイン語が混入したため下げている
LLM_TEMPERATURE = 0.3
# Ollamaは既定では5分でモデルを解放する。解放後の初回は読み込みに20秒以上かかり
# 「5秒以内」の非機能要件を満たせない。これを避けるためモデルを常駐させる。
# keep_alive はOpenAI互換API側では無視されるため、Ollama純正APIへ直接指定する。
OLLAMA_NATIVE_CHAT_URL = "http://localhost:11434/api/chat"
KEEP_MODEL_RESIDENT = -1

# シナリオを増やすときは、この辞書に1件追加するだけで済む
SCENARIOS = {
    "product_defect": {
        "label": "商品の不具合",
        "customer_situation": "購入したばかりの商品が壊れていた顧客",
        "opening_line": "買ったばかりなのに、もう壊れてるんだけど！どうしてくれるの？",
    },
    "delivery_delay": {
        "label": "納期の遅れ",
        "customer_situation": "指定した日に商品が届かなかった顧客",
        "opening_line": "今日届くはずでしょ？予定があったのに、どうしてくれるんですか。",
    },
    "staff_attitude": {
        "label": "店員の態度",
        "customer_situation": "店員の接客態度に腹を立てている顧客",
        "opening_line": "さっきの店員の態度、あれはないでしょう。どういう教育してるの？",
    },
}

INITIAL_ANGER_BY_DIFFICULTY = {"easy": 60, "normal": 80, "hard": 95}
DEFAULT_DIFFICULTY = "normal"

RESOLVED_ANGER = 15
MAX_ANGER = 100
MIN_ANGER = 0
MAX_TURNS = 12
# 1回のやり取りで怒りが動く幅の上限。AIに任せると一気に20以上動かして
# 会話が3往復で終わってしまうため、コード側で制限して練習量を確保する。
MAX_ANGER_DELTA = 12

ANGER_PATTERN = re.compile(r"【怒り】\s*(-?\d+)")
LINE_PATTERN = re.compile(r"【セリフ】\s*(.+)", re.DOTALL)
SCORE_PATTERNS = {
    "listening": re.compile(r"【傾聴】\s*(\d+)"),
    "apology": re.compile(r"【謝罪】\s*(\d+)"),
    "solution": re.compile(r"【解決策】\s*(\d+)"),
}
COMMENT_PATTERN = re.compile(r"【講評】\s*(.+)", re.DOTALL)


def problem_response(error_type: str, title: str, status: int, detail: str):
    """RFC 7807 (Problem Details) 形式のエラーを返す。

    エラーの形をひとつに揃えることで、画面側の処理を1か所にまとめられる。
    """
    body = {"type": f"/errors/{error_type}", "title": title, "status": status, "detail": detail}
    return jsonify(body), status


def ask_llm(system_prompt: str, user_prompt: str) -> str:
    """AIに1回問い合わせ、本文を返す。"""
    completion = client.chat.completions.create(
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        model=OLLAMA_MODEL,
        temperature=LLM_TEMPERATURE,
    )
    if not completion.choices or not completion.choices[0].message:
        return ""
    return (completion.choices[0].message.content or "").strip()


def clamp_anger(value: int) -> int:
    return max(MIN_ANGER, min(MAX_ANGER, value))


def limit_anger_change(previous: int, requested: int) -> int:
    """怒りの変化幅を1回あたり MAX_ANGER_DELTA までに抑える。"""
    lower = previous - MAX_ANGER_DELTA
    upper = previous + MAX_ANGER_DELTA
    return clamp_anger(max(lower, min(upper, requested)))


def build_customer_prompt(scenario_key: str, anger: int) -> str:
    """顧客役AIへの指示文を組み立てる。"""
    situation = SCENARIOS[scenario_key]["customer_situation"]
    return (
        f"あなたは{situation}です。現在の怒りレベルは{anger}です(0〜100)。\n"
        "店員の対応を評価し、必ず次の2行の形式だけで出力してください。\n"
        "【怒り】数値(0〜100)\n"
        "【セリフ】顧客としての発言(80字以内)\n"
        "\n"
        "怒りの動かし方:\n"
        f"- 1回で大きく変えず、{MAX_ANGER_DELTA}以内で少しずつ動かす\n"
        "- 誠実な謝罪・傾聴・具体的な解決策があれば下げる\n"
        "- 言い訳や責任逃れ、話をそらす対応なら上げる\n"
        "\n"
        "セリフの作り方:\n"
        "- 店員が答えられる要求・質問・不満を必ず1つ入れる\n"
        "- 「ありがとう」だけで終わらせず、次に何をしてほしいかを述べる\n"
        "- 怒りが下がっても、納得しきるまでは店員に判断を委ねない\n"
        "- 直前の自分の発言をそのまま繰り返さず、必ず言い回しか論点を変える\n"
        "\n"
        "顧客以外の役を演じてはいけません。日本語だけで書いてください。"
    )


def parse_customer_reply(raw_text: str, previous_anger: int) -> tuple[int, str]:
    """AIの返答から怒りレベルとセリフを取り出す。

    AIが形式を守らないことがあるため、読み取れない項目は安全な値で補い、
    例外を投げずに会話を継続させる。
    """
    anger_match = ANGER_PATTERN.search(raw_text)
    anger = clamp_anger(int(anger_match.group(1))) if anger_match else previous_anger

    line_match = LINE_PATTERN.search(raw_text)
    if line_match:
        message = line_match.group(1).strip()
    else:
        # 【セリフ】が欠けることがあるため、【怒り】の行を取り除いた残りを本文とみなす
        message = ANGER_PATTERN.sub("", raw_text).strip()

    return anger, message or "……"


def judge_status(anger: int, turn: int) -> str:
    if anger <= RESOLVED_ANGER:
        return "resolved"
    if anger >= MAX_ANGER:
        return "escalated"
    if turn >= MAX_TURNS:
        return "escalated"
    return "continue"


def format_transcript(messages: list[dict]) -> str:
    """会話履歴を、AIが読みやすい1つの文章にまとめる。"""
    speaker_labels = {"customer": "顧客", "staff": "店員"}
    lines = [
        f"{speaker_labels.get(m.get('role'), '不明')}: {m.get('text', '')}" for m in messages
    ]
    return "\n".join(lines)


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/conversations", methods=["POST"])
def create_conversation():
    """練習を開始し、顧客役AIの第一声を返す。"""
    data = request.get_json(silent=True) or {}

    scenario_key = data.get("scenario")
    if scenario_key not in SCENARIOS:
        return problem_response(
            "unknown-scenario", "Invalid Parameter", 400, "場面の指定が正しくありません。"
        )

    difficulty = data.get("difficulty", DEFAULT_DIFFICULTY)
    anger = INITIAL_ANGER_BY_DIFFICULTY.get(difficulty, INITIAL_ANGER_BY_DIFFICULTY[DEFAULT_DIFFICULTY])

    # 第一声はAIに作らせず固定文にする。毎回同じ入口にすることで練習を比較しやすくするため
    return jsonify(
        {
            "anger": anger,
            "message": SCENARIOS[scenario_key]["opening_line"],
            "turn": 0,
            "status": "continue",
        }
    )


@app.route("/api/turns", methods=["POST"])
def create_turn():
    """利用者の応対を受け取り、更新後の怒りレベルと顧客の返答を返す。"""
    data = request.get_json(silent=True) or {}

    scenario_key = data.get("scenario")
    if scenario_key not in SCENARIOS:
        return problem_response(
            "unknown-scenario", "Invalid Parameter", 400, "場面の指定が正しくありません。"
        )

    reply = (data.get("reply") or "").strip()
    if not reply:
        return problem_response(
            "empty-reply", "Invalid Parameter", 400, "応対内容を入力してください。"
        )

    previous_anger = clamp_anger(int(data.get("anger", INITIAL_ANGER_BY_DIFFICULTY[DEFAULT_DIFFICULTY])))
    turn = int(data.get("turn", 0)) + 1
    history = format_transcript(data.get("messages", []))

    system_prompt = build_customer_prompt(scenario_key, previous_anger)
    user_prompt = f"これまでのやり取り:\n{history}\n\n店員の今回の対応: {reply}"

    try:
        raw_text = ask_llm(system_prompt, user_prompt)
    except Exception as error:
        app.logger.error(f"Ollama API call failed: {error}")
        return problem_response(
            "llm-unavailable", "Service Unavailable", 500, "AIとの通信中にエラーが発生しました。"
        )

    raw_anger, message = parse_customer_reply(raw_text, previous_anger)
    anger = limit_anger_change(previous_anger, raw_anger)
    return jsonify(
        {"anger": anger, "message": message, "turn": turn, "status": judge_status(anger, turn)}
    )


@app.route("/api/reviews", methods=["POST"])
def create_review():
    """会話全体を評価し、3観点の点数と講評を返す。"""
    data = request.get_json(silent=True) or {}

    messages = data.get("messages")
    if not messages:
        return problem_response(
            "missing-field", "Invalid Parameter", 400, "会話の履歴が空です。"
        )

    system_prompt = (
        "あなたはクレーム対応研修の講師です。店員の対応を評価してください。\n"
        "必ず次の4行の形式だけで出力してください。\n"
        "【傾聴】1〜5の数値\n"
        "【謝罪】1〜5の数値\n"
        "【解決策】1〜5の数値\n"
        "【講評】良かった点と改善点(200字以内)\n"
        "日本語だけで書いてください。"
    )
    user_prompt = f"次のやり取りを評価してください。\n{format_transcript(messages)}"

    try:
        raw_text = ask_llm(system_prompt, user_prompt)
    except Exception as error:
        app.logger.error(f"Ollama API call failed: {error}")
        return problem_response(
            "llm-unavailable", "Service Unavailable", 500, "AIとの通信中にエラーが発生しました。"
        )

    return jsonify({"scores": parse_scores(raw_text), "comment": parse_comment(raw_text)})


def parse_scores(raw_text: str) -> dict:
    """講評から3観点の点数を取り出す。読み取れない項目は中央値の3を使う。"""
    scores = {}
    for key, pattern in SCORE_PATTERNS.items():
        match = pattern.search(raw_text)
        scores[key] = max(1, min(5, int(match.group(1)))) if match else 3
    return scores


def parse_comment(raw_text: str) -> str:
    match = COMMENT_PATTERN.search(raw_text)
    if match:
        return match.group(1).strip()
    return raw_text.strip() or "講評を取得できませんでした。"


def warm_up_model() -> None:
    """起動時にモデルをメモリへ読み込み、以後解放されないようにする。

    最初の利用者だけが20秒以上待たされる状態を避けるための準備処理。
    AIが起動していなくてもアプリ自体は立ち上がるよう、失敗しても続行する。
    """
    payload = {
        "model": OLLAMA_MODEL,
        "stream": False,
        "keep_alive": KEEP_MODEL_RESIDENT,
        "messages": [{"role": "user", "content": "準備はできましたか"}],
    }
    request_body = json.dumps(payload).encode()
    try:
        urllib.request.urlopen(
            urllib.request.Request(
                OLLAMA_NATIVE_CHAT_URL,
                data=request_body,
                headers={"Content-Type": "application/json"},
            ),
            timeout=180,
        ).read()
        app.logger.info("AIモデルを読み込み、常駐させました。")
    except Exception as error:
        app.logger.warning(f"AIモデルの事前読み込みに失敗しました: {error}")


if __name__ == "__main__":
    warm_up_model()
    # macOS では AirPlay Receiver がポート 5000 を占有するため 5001 を使用
    app.run(debug=True, host="0.0.0.0", port=5001)
