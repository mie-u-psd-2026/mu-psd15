# クレトレ｜クレーム対応トレーニング

怒らせても、誰にも迷惑がかからない。何度でも失敗できる、クレーム対応の練習場。

実践ソフトウェア開発 チーム15 ／ 中川 颯都

## これは何か

AIが**怒っている顧客**を演じます。利用者は店員として応対します。

応対の良し悪しは **怒りの数値(0〜100)** として動きます。誠実な謝罪や具体的な解決策を出せば下がり、言い訳や責任逃れをすれば上がります。会話が終わると、AIが「傾聴」「謝罪」「解決策」の3観点で講評します。

### なぜ作ったか

新人がクレーム対応を覚える機会は、実質**本番しかありません**。研修は月に1回、練習相手は上司や先輩で気をつかい、自分の対応が良かったのかを測る目安もない。結果として、本物のお客様に迷惑をかけながら覚えることになります。

練習の場を切り離して用意すれば、この構造は変えられます。

### 主な機能

| できること |
|---|
| 3つの事例(商品の不具合 / 納期の遅れ / 店員の態度)と3段階の手ごわさを選んで練習を始める |
| 顧客役のAIと文字で会話し、自分の返答に対する反応をもらう |
| 自分の返答で増減する怒りの値を、数値・バー・**顧客の表情**で確認する |
| 怒りが十分下がるか上限に達した時点で、成功か失敗かの判定を見る |
| 終了後に3観点の点数と講評を見る |
| **どの一言が怒りを何点動かしたか**を振り返る |

## 動かし方

### 必要なもの

| ソフト | 用途 |
|---|---|
| Python 3.11〜3.13 | サーバーを動かす |
| Ollama | AIをパソコンの中で動かす |
| Visual Studio Code | コードを編集する |

インターネット接続は**不要**です。AIも画面の部品もすべて手元で動きます。

### 初回の準備

**Windows の場合**

```
winget install --id Microsoft.VisualStudioCode -e --source winget --accept-package-agreements --accept-source-agreements
winget install --id Python.Python.3.13 -e --source winget --accept-package-agreements --accept-source-agreements
winget install --id SST.opencode -e --source winget --accept-package-agreements --accept-source-agreements
winget install --id Ollama.Ollama -e --source winget --accept-package-agreements --accept-source-agreements
start /b ollama serve > NUL 2>&1
timeout /t 3 /nobreak > NUL
```

**macOS の場合**

```
brew install --cask visual-studio-code
brew install python@3.13
brew install ollama
brew services start ollama
```

**AIモデルの取得(共通・約5.4GB)**

```
ollama pull gemma2:9b
```

**Pythonライブラリの導入**

```
pip install -r requirements.txt
```

VS Code の拡張機能から、以下を入れておくと編集が楽になります。

- Python
- Vue.js Extension Pack

### 起動

```
python app.py
```

ブラウザで以下を開きます。

```
http://localhost:5001
```

止めるときは、ターミナルで **Ctrl + C** を押します。

> **ポート番号について**
> ひな型は 5000 番でしたが、macOS では AirPlay Receiver がこの番号を使っているため **5001** に変更しています。Windows でも 5001 で動きます。

### うまくいかないとき

| 症状 | 原因と対処 |
|---|---|
| `Address already in use` | 前のサーバーが残っている。macOS/Linux は `lsof -tiTCP:5001 \| xargs kill` |
| 返事に20秒以上かかる | AIがメモリから外れている。サーバーを再起動すると読み込み直される |
| 「サーバーにつながりません」 | `python app.py` が動いていない |
| `ollama は認識されていません` | インストール後にターミナルを開き直すか、PCを再起動する |

## ファイル構成

```
mu-psd15/
├── app.py                サーバー本体。3つのAPIの窓口
├── requirements.txt      必要なライブラリの一覧
├── readme.md             このファイル
├── design-document.md    要件定義書 + 基本設計書
├── test-spec.md          テスト仕様書と実施結果
├── wbs.md                作業計画とスケジュール
└── static/
    ├── index.html        画面のすべて(HTML + CSS + Vue.js)
    └── vendor/
        └── vue.global.prod.js   Vue本体。ネットなしで動かすため手元に配置
```

### APIの窓口

| 窓口 | いつ使う | 返ってくるもの |
|---|---|---|
| `POST /api/conversations` | 練習を始めるとき | 顧客の第一声と初期の怒り |
| `POST /api/turns` | 返答を送るたび | 新しい怒りの値と顧客のセリフ |
| `POST /api/reviews` | 会話が終わったとき | 3観点の点数と講評 |

エラーは Problem Details (RFC 7807) 形式で返します。

### 調整できる値

`app.py` の先頭にまとまっています。ここを変えると挙動が変わります。

```python
OLLAMA_MODEL    = "gemma2:9b"   # 使うAI
LLM_TEMPERATURE = 0.3           # AIの気まぐれ度。上げると表現が多彩、下げると安定
RESOLVED_ANGER  = 15            # ここまで下げたら成功
MAX_TURNS       = 12            # 何回やり取りできるか
MAX_ANGER_DELTA = 12            # 1回で動く怒りの上限
```

新しい事例を増やすときは、`SCENARIOS` 辞書に1件追加するだけで済みます。

## 技術的な選択と、その理由

| 決めたこと | 理由 |
|---|---|
| AIは `gemma2:9b` | 4種類を実測で比較し、日本語の品質が最良だった(外国語の混入 0/10回) |
| `temperature` は 0.3 | 既定値 0.8 では応答に英語やスペイン語が混入した |
| 起動時にAIを読み込む | Ollamaは5分使わないとモデルを解放し、次の1回目に最大95秒かかっていた |
| データベースを使わない | 会話はその場かぎり。ブラウザが覚えれば足りる |
| Vue を手元に配置 | 「ネットがつながらなくても動く」という要件を満たすため |
| 怒りの変化幅を12までに制限 | AIに任せると一気に20以上動き、会話が3往復で終わってしまうため |

詳しくは `design-document.md` を参照してください。

## 参考リンク

- [Flask](https://flask.palletsprojects.com/en/stable/) — Python で書かれた Web アプリケーションサーバ
- [Vue.js](https://vuejs.org/) — JavaScript 製の Web フロントエンド フレームワーク
- [Vue.js Tutorial](https://ja.vuejs.org/tutorial/) — Vue.js の入門用チュートリアル
- [OpenAI API](https://github.com/openai/openai-python) — Python から OpenAI 互換 API を呼び出すライブラリ
- [Ollama](https://ollama.com/) — ローカルで大規模言語モデルを動かす基盤

## 開発時の参考(配布時の資料より)

AIアシスタント(opencode)を使う場合の接続方法です。

**ローカルの Ollama を使う場合**(低性能だが利用制限なし)

```
ollama launch opencode --model=gemma2:9b
```

**クラウドの無料モデルを使う場合**(中性能、無料枠少ない)

ターミナルで `opencode` と入力し、`/models` から Free 表示のあるモデルを選択します。

**Google AI Studio を使う場合**(高性能、無料枠多い)

1. [Google AI Studio](https://aistudio.google.com/api-keys) でAPIキーを作成します
2. [プロジェクト一覧](https://aistudio.google.com/projects) で無料枠になっていることを確認します
3. ターミナルで `opencode` と入力し、`/connect` から Google を選び、APIキーを貼り付けます
