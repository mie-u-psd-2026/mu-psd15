"""クレトレの自動テスト。

AIへの問い合わせ(ask_llm)を差し替え(モック)て、AIを起動せずに
判定ロジックと API の入出力を確かめる。実行は `pytest` の1コマンド。

境界値の根拠は app.py の定数(RESOLVED_ANGER / MAX_TURNS / MAX_ANGER_DELTA)。
数値を直書きせず定数から導くことで、しきい値を変えてもテストがズレない。
"""

import pytest

import app as kuretore
from app import (
    MAX_ANGER,
    MAX_ANGER_DELTA,
    MAX_TURNS,
    MIN_ANGER,
    RESOLVED_ANGER,
    app,
    judge_status,
    limit_anger_change,
    parse_comment,
    parse_customer_reply,
    parse_scores,
)


@pytest.fixture
def client():
    app.config["TESTING"] = True
    return app.test_client()


@pytest.fixture
def fake_llm(monkeypatch):
    """AIの返事を固定文に差し替える。テスト側で返したい文章を渡す。"""

    def _install(reply_text: str):
        monkeypatch.setattr(kuretore, "ask_llm", lambda system_prompt, user_prompt: reply_text)

    return _install


# ---------------------------------------------------------------------------
# 境界値: 終了判定(テスト仕様書 B-1, B-2, B-3, B-6, B-7)
# ---------------------------------------------------------------------------


def test_b1_anger_at_threshold_is_resolved():
    assert judge_status(RESOLVED_ANGER, turn=1) == "resolved"


def test_b2_anger_just_above_threshold_continues():
    assert judge_status(RESOLVED_ANGER + 1, turn=1) == "continue"


def test_b3_max_anger_is_escalated():
    assert judge_status(MAX_ANGER, turn=1) == "escalated"


def test_b6_last_turn_is_escalated():
    assert judge_status(50, turn=MAX_TURNS) == "escalated"


def test_b7_turn_before_last_continues():
    assert judge_status(50, turn=MAX_TURNS - 1) == "continue"


# ---------------------------------------------------------------------------
# 境界値: AIが返した怒りの丸め(B-4, B-5)と変化幅の制限
# ---------------------------------------------------------------------------


def test_b4_anger_over_100_is_clamped():
    anger, _ = parse_customer_reply("【怒り】150\n【セリフ】ふざけるな", previous_anger=80)
    assert anger == MAX_ANGER


def test_b5_negative_anger_is_clamped():
    anger, _ = parse_customer_reply("【怒り】-5\n【セリフ】まあいいか", previous_anger=80)
    assert anger == MIN_ANGER


def test_anger_change_is_limited_per_turn():
    assert limit_anger_change(80, 20) == 80 - MAX_ANGER_DELTA
    assert limit_anger_change(80, 100) == 80 + MAX_ANGER_DELTA


def test_anger_change_within_limit_is_kept():
    assert limit_anger_change(80, 75) == 75


# ---------------------------------------------------------------------------
# 異常系: AIの返事の形が崩れたとき(E-8)と不具合1の再発防止
# ---------------------------------------------------------------------------


def test_e8_missing_anger_keeps_previous_value():
    anger, message = parse_customer_reply("【セリフ】で、どうしてくれるの？", previous_anger=70)
    assert anger == 70
    assert message == "で、どうしてくれるの？"


def test_bug1_anger_line_is_not_shown_in_message():
    """不具合1: 【セリフ】が欠けても【怒り】の行を本文に混ぜない。"""
    _, message = parse_customer_reply("【怒り】60\nそれで、代わりの品はいつ届くの？", previous_anger=70)
    assert "【怒り】" not in message
    assert message == "それで、代わりの品はいつ届くの？"


def test_empty_reply_falls_back_to_placeholder():
    _, message = parse_customer_reply("", previous_anger=70)
    assert message == "……"


def test_scores_fallback_to_middle_and_are_bounded():
    scores = parse_scores("【傾聴】9\n【謝罪】0\n【講評】よい")
    assert scores == {"listening": 5, "apology": 1, "solution": 3}


def test_comment_fallback_when_format_broken():
    assert parse_comment("") == "講評を取得できませんでした。"
    assert parse_comment("形式のない文章") == "形式のない文章"


# ---------------------------------------------------------------------------
# API: 正常系(N-3, N-4)と異常系(E-2, E-3, E-4, E-5, E-7)
# ---------------------------------------------------------------------------


@pytest.mark.parametrize(
    ("difficulty", "expected"),
    [("easy", 60), ("normal", 80), ("hard", 95)],
)
def test_n4_initial_anger_by_difficulty(client, difficulty, expected):
    res = client.post("/api/conversations", json={"scenario": "product_defect", "difficulty": difficulty})
    assert res.status_code == 200
    assert res.get_json()["anger"] == expected


def test_n3_conversation_starts_with_opening_line(client):
    res = client.post("/api/conversations", json={"scenario": "delivery_delay"})
    body = res.get_json()
    assert body["turn"] == 0
    assert body["status"] == "continue"
    assert "届く" in body["message"]


def test_e3_unknown_scenario_returns_400(client):
    res = client.post("/api/conversations", json={"scenario": "nope"})
    assert res.status_code == 400
    assert res.get_json()["detail"] == "場面の指定が正しくありません。"


def test_e4_empty_body_returns_400(client):
    assert client.post("/api/turns", json={}).status_code == 400


def test_e2_blank_reply_returns_400(client):
    res = client.post("/api/turns", json={"scenario": "product_defect", "reply": "   "})
    assert res.status_code == 400
    assert res.get_json()["detail"] == "応対内容を入力してください。"


def test_e5_review_without_history_returns_400(client):
    res = client.post("/api/reviews", json={"messages": []})
    assert res.status_code == 400
    assert res.get_json()["detail"] == "会話の履歴が空です。"


def test_e7_llm_failure_returns_500_problem_details(client, monkeypatch):
    def broken(system_prompt, user_prompt):
        raise ConnectionError("Ollama is down")

    monkeypatch.setattr(kuretore, "ask_llm", broken)
    res = client.post(
        "/api/turns",
        json={"scenario": "product_defect", "anger": 80, "turn": 0, "messages": [], "reply": "申し訳ございません。"},
    )
    assert res.status_code == 500
    body = res.get_json()
    assert body["type"] == "/errors/llm-unavailable"
    assert body["detail"] == "AIとの通信中にエラーが発生しました。"


def test_turn_applies_limit_and_judges_status(client, fake_llm):
    """良い応対で怒りが下がり、1回の変化幅が制限され、会話が続く。"""
    fake_llm("【怒り】40\n【セリフ】それなら、いつ交換してもらえるの？")
    res = client.post(
        "/api/turns",
        json={"scenario": "product_defect", "anger": 80, "turn": 0, "messages": [], "reply": "申し訳ございません。すぐ交換します。"},
    )
    body = res.get_json()
    assert body["anger"] == 80 - MAX_ANGER_DELTA
    assert body["turn"] == 1
    assert body["status"] == "continue"
    assert body["message"] == "それなら、いつ交換してもらえるの？"


def test_turn_reaches_resolved_at_threshold(client, fake_llm):
    fake_llm(f"【怒り】{RESOLVED_ANGER}\n【セリフ】分かりました。それでお願いします。")
    res = client.post(
        "/api/turns",
        json={"scenario": "product_defect", "anger": RESOLVED_ANGER + 5, "turn": 3, "messages": [], "reply": "本日中に新品をお届けします。"},
    )
    assert res.get_json()["status"] == "resolved"


def test_review_returns_scores_and_comment(client, fake_llm):
    fake_llm("【傾聴】4\n【謝罪】5\n【解決策】3\n【講評】謝罪は丁寧でした。解決策をもう一歩具体的に。")
    res = client.post(
        "/api/reviews",
        json={"messages": [{"role": "customer", "text": "壊れてた"}, {"role": "staff", "text": "申し訳ございません"}]},
    )
    body = res.get_json()
    assert body["scores"] == {"listening": 4, "apology": 5, "solution": 3}
    assert body["comment"].startswith("謝罪は丁寧でした")
