const pptxgen = require("pptxgenjs");
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";           // 13.3 x 7.5 inch

// アプリ自身の配色をそのまま使う
// アプリと同じライトベースの配色
const BG="FBFBFD",    // 地の色
      CARD="FFFFFF",  // 浮いた面
      SUNK="F0F2F6",  // へこんだ面
      LINE="DFE3EA",  // 罫線
      INK="1B2230",   // 主な文字
      MIST="6B7688",  // 補助の文字
      EMBER="C4402A", AMBER="B57B12", JADE="1F7A56";
const H="Cambria", B="Calibri", M="Courier New";

// 強調したいスライドだけ濃い面にして、緩急をつける
const deep  = s => { s.background = { color: INK } };
const plain = s => { s.background = { color: BG } };

// 見出し(ダーク面)
function titleOnDeep(s, text, sub) {
  s.addText(text, { x:0.7, y:0.5, w:11.9, h:0.8, fontSize:36, bold:true,
    color:"FFFFFF", fontFace:H, isTextBox:true, margin:0 });
  if (sub) s.addText(sub, { x:0.7, y:1.32, w:11.9, h:0.4, fontSize:15,
    color:MIST, fontFace:B, isTextBox:true, margin:0 });
}
// 見出し(ライト面)
function titleOnPlain(s, text, sub) {
  s.addText(text, { x:0.7, y:0.5, w:11.9, h:0.8, fontSize:36, bold:true,
    color:INK, fontFace:H, isTextBox:true, margin:0 });
  if (sub) s.addText(sub, { x:0.7, y:1.32, w:11.9, h:0.4, fontSize:15,
    color:MIST, fontFace:B, isTextBox:true, margin:0 });
}
// 怒りメーター風の帯(比較の共通言語)
function meter(s, x, y, w, pct, color, label, value) {
  s.addText(label, { x, y:y-0.34, w:Math.max(w-1.75, 1.2), h:0.3, fontSize:12, color:MIST,
    fontFace:B, isTextBox:true, margin:0 });
  s.addText(value, { x:x+w-1.6, y:y-0.4, w:1.6, h:0.4, fontSize:20, bold:true,
    color, fontFace:M, align:"right", isTextBox:true, margin:0 });
  s.addShape(pres.ShapeType.rect, { x, y, w, h:0.22, fill:{ color:SUNK } });
  s.addShape(pres.ShapeType.rect, { x, y, w:Math.max(w*pct,0.06), h:0.22, fill:{ color } });
}

/* 1 ── 表紙 */
{ const s = pres.addSlide(); deep(s);
  s.addText("クレトレ", { x:0.9, y:2.2, w:8, h:1.6, fontSize:66, bold:true,
    color:"FFFFFF", fontFace:H, charSpacing:6, isTextBox:true, margin:0 });
  s.addText("怒らせても、誰にも迷惑がかからない。\n何度でも失敗できる、クレーム対応の練習場。",
    { x:0.95, y:3.95, w:8, h:1.1, fontSize:19, color:MIST, fontFace:B, lineSpacing:30, isTextBox:true, margin:0 });
  s.addText("実践ソフトウェア開発  成果発表", { x:0.95, y:5.1, w:6, h:0.3, fontSize:12,
    color:MIST, fontFace:M, charSpacing:2, isTextBox:true, margin:0 });
  s.addText("チーム15  中川 颯都", { x:0.95, y:5.5, w:6, h:0.4, fontSize:16,
    color:"FFFFFF", fontFace:B, isTextBox:true, margin:0 });
  // 怒りメーターを表紙の主役に
  meter(s, 9.3, 3.2, 3.1, 0.80, EMBER, "怒りの強さ", "80");
  meter(s, 9.3, 4.3, 3.1, 0.12, JADE,  "対応のあと", "12");
  s.addNotes("クレーム対応を安全に練習できるWebアプリ、クレトレを作りました。チーム15、中川颯都です。");
}

/* 2 ── 課題 */
{ const s = pres.addSlide(); plain(s);
  titleOnPlain(s, "新人は、本番でしか練習できない", "クレーム対応の習得には構造的な問題がある");
  const rows = [
    ["練習の機会が足りない", "ロールプレイ研修は月に1回だけ"],
    ["思いきり失敗できない", "相手が上司や先輩だと気をつかう"],
    ["良し悪しが分からない", "自分の対応を測る目安がない"],
  ];
  rows.forEach(([h2, d], i) => {
    const y = 2.3 + i*1.35;
    s.addShape(pres.ShapeType.ellipse, { x:0.8, y:y+0.05, w:0.5, h:0.5, fill:{ color:EMBER } });
    s.addText(String(i+1), { x:0.8, y:y+0.05, w:0.5, h:0.5, fontSize:16, bold:true,
      color:"FFFFFF", fontFace:M, align:"center", valign:"middle", isTextBox:true, margin:0 });
    s.addText(h2, { x:1.6, y:y, w:5.2, h:0.4, fontSize:21, bold:true, color:INK,
      fontFace:B, isTextBox:true, margin:0 });
    s.addText(d, { x:1.6, y:y+0.45, w:5.2, h:0.4, fontSize:14, color:MIST,
      fontFace:B, isTextBox:true, margin:0 });
  });
  s.addShape(pres.ShapeType.roundRect, { x:7.6, y:2.3, w:5, h:3.9,
    fill:{ color:INK }, rectRadius:0.06 });
  s.addText("結果として", { x:8.1, y:2.7, w:4, h:0.3, fontSize:12, color:MIST,
    fontFace:M, charSpacing:2, isTextBox:true, margin:0 });
  s.addText("本物のお客様に\n迷惑をかけながら\n覚えるしかない",
    { x:8.1, y:3.2, w:4, h:1.8, fontSize:28, bold:true, color:"FFFFFF", fontFace:H,
      lineSpacing:40, isTextBox:true, margin:0 });
  s.addText("練習の場を切り離して用意すれば、この構造は変えられる",
    { x:8.1, y:5.3, w:4, h:0.6, fontSize:13, color:JADE, fontFace:B, isTextBox:true, margin:0 });
  s.addNotes("新人のクレーム対応には構造的な問題があります。練習の機会が足りず、思いきり失敗もできず、良し悪しを測る目安もない。結果として本物のお客様に迷惑をかけながら覚えるしかありません。");
}

/* 3 ── 解決策 + 実画面 */
{ const s = pres.addSlide(); deep(s);
  titleOnDeep(s, "AIをお客様役にして、何度でも練習する", "怒りの強さが数値で見えるから、上達が分かる");
  s.addImage({ path:"talking_crop.png", x:0.7, y:2.05, w:4.55, h:4.9 });
  const pts = [
    ["AIが怒った顧客を演じる", "3つの場面 × 3段階の手ごわさ"],
    ["怒りの強さが数値で動く", "自分の一言の効果がその場で分かる"],
    ["終了後にAIが講評する", "傾聴・謝罪・解決策の3観点で採点"],
  ];
  pts.forEach(([h2, d], i) => {
    const y = 2.3 + i*1.35;
    s.addShape(pres.ShapeType.roundRect, { x:6.4, y, w:6.2, h:1.05,
      fill:{ color:"2A3446" }, rectRadius:0.05 });
    s.addText(h2, { x:6.75, y:y+0.12, w:5.6, h:0.4, fontSize:18, bold:true,
      color:"FFFFFF", fontFace:B, isTextBox:true, margin:0 });
    s.addText(d, { x:6.75, y:y+0.55, w:5.6, h:0.35, fontSize:13, color:MIST,
      fontFace:B, isTextBox:true, margin:0 });
  });
  s.addText("チャットアプリではなく、相手の状態を計器で読む「訓練コンソール」として設計",
    { x:6.4, y:6.5, w:6.2, h:0.5, fontSize:13, color:AMBER, fontFace:B, isTextBox:true, margin:0 });
  s.addNotes("そこで作ったのがクレトレです。AIが怒った顧客を演じ、こちらは店員として応対します。怒りの強さが数値で動くので、自分の一言が効いたかどうかがその場で分かります。");
}

/* 4 ── デモ */
{ const s = pres.addSlide(); deep(s);
  s.addText("実演デモ", { x:0.9, y:2.6, w:6, h:1.2, fontSize:54, bold:true,
    color:"FFFFFF", fontFace:H, isTextBox:true, margin:0 });
  s.addText("商品の不具合 ／ ふつう で実際に対応します",
    { x:0.95, y:3.9, w:6, h:0.5, fontSize:17, color:MIST, fontFace:B, isTextBox:true, margin:0 });
  meter(s, 8.0, 3.0, 4.3, 0.80, EMBER, "開始時", "80");
  s.addText("↓", { x:8.0, y:3.5, w:4.3, h:0.6, fontSize:24, color:MIST, align:"center", isTextBox:true, margin:0 });
  meter(s, 8.0, 4.6, 4.3, 0.15, JADE, "目標", "15 以下");
  s.addNotes("ここで実際に動かします。商品の不具合、ふつうの手ごわさで開始し、良い応対と悪い応対で怒りがどう動くかをお見せします。");
}

/* 5 ── 仕組み */
{ const s = pres.addSlide(); plain(s);
  titleOnPlain(s, "3層構成とデータの流れ", "サーバーは何も覚えない。ブラウザが会話と怒りを保持する");
  const boxes = [
    ["ブラウザ", "Vue.js", "画面を描く\n会話と怒りを保持", 0.8],
    ["サーバー", "Flask", "指示文を組み立てる\n返答を読み解く", 5.1],
    ["AI", "Ollama / gemma2:9b", "顧客のセリフと\n怒りの値を作る", 9.4],
  ];
  boxes.forEach(([t, sub, d, x]) => {
    s.addShape(pres.ShapeType.roundRect, { x, y:2.6, w:3.1, h:2.2, fill:{ color:INK }, rectRadius:0.06 });
    s.addText(t, { x:x+0.3, y:2.85, w:2.5, h:0.4, fontSize:20, bold:true, color:"FFFFFF",
      fontFace:B, isTextBox:true, margin:0 });
    s.addText(sub, { x:x+0.3, y:3.25, w:2.5, h:0.3, fontSize:11, color:AMBER,
      fontFace:M, isTextBox:true, margin:0 });
    s.addText(d, { x:x+0.3, y:3.65, w:2.5, h:0.9, fontSize:13, color:MIST,
      fontFace:B, lineSpacing:18, isTextBox:true, margin:0 });
  });
  [[3.9,"HTTP / JSON"],[8.2,"OpenAI互換API"]].forEach(([x,label])=>{
    s.addShape(pres.ShapeType.line, { x, y:3.7, w:1.2, h:0,
      line:{ color:EMBER, width:2, endArrowType:"triangle" } });
    s.addText(label, { x:x-0.15, y:3.85, w:1.5, h:0.3, fontSize:10, color:MIST,
      fontFace:M, align:"center", isTextBox:true, margin:0 });
  });
  s.addShape(pres.ShapeType.roundRect, { x:0.8, y:5.3, w:11.8, h:1.4,
    fill:{ color:CARD }, line:{ color:LINE, width:1 }, rectRadius:0.05 });
  s.addText("データベースを作らないという判断", { x:1.2, y:5.5, w:5, h:0.35, fontSize:16,
    bold:true, color:INK, fontFace:B, isTextBox:true, margin:0 });
  s.addText("会話はその場かぎりで、あとから見返す必要がない。ブラウザが覚えれば足りる。\n作るものを減らし、必須機能の作り込みに時間を使うための設計判断。",
    { x:1.2, y:5.88, w:10.8, h:0.7, fontSize:13, color:INK, fontFace:B,
      lineSpacing:19, isTextBox:true, margin:0 });
  s.addNotes("構成は3層です。特徴はサーバーが何も覚えないこと。会話と怒りの値はブラウザが持ち、毎回まとめて送ります。データベースを作らない判断で、必須機能に時間を使えました。");
}


/* 6 ── 工夫: 出力形式の強制 */
{ const s = pres.addSlide(); deep(s);
  titleOnDeep(s, "AIに数値を出させる工夫", "「必ず数値を出して」と頼むだけでは、守ってもらえなかった");
  s.addShape(pres.ShapeType.roundRect, { x:0.7, y:2.3, w:5.7, h:3.4, fill:{ color:"2A3446" }, rectRadius:0.06 });
  s.addText("うまくいかなかった指示", { x:1.05, y:2.55, w:5, h:0.35, fontSize:15, bold:true,
    color:EMBER, fontFace:B, isTextBox:true, margin:0 });
  s.addText("「怒りの数値を必ず出力してください」", { x:1.05, y:3.05, w:5, h:0.5, fontSize:15,
    color:"FFFFFF", fontFace:B, isTextBox:true, margin:0 });
  s.addText("AIの返答", { x:1.05, y:3.75, w:5, h:0.3, fontSize:11, color:MIST, fontFace:M, isTextBox:true, margin:0 });
  s.addText("それは大変申し訳ございません。\nすぐに確認いたします。", { x:1.05, y:4.1, w:5, h:0.8,
    fontSize:14, color:MIST, fontFace:B, lineSpacing:22, isTextBox:true, margin:0 });
  s.addText("数値が出てこない", { x:1.05, y:5.05, w:5, h:0.4, fontSize:15, bold:true,
    color:EMBER, fontFace:B, isTextBox:true, margin:0 });

  s.addShape(pres.ShapeType.roundRect, { x:6.9, y:2.3, w:5.7, h:3.4, fill:{ color:"2A3446" }, rectRadius:0.06 });
  s.addText("うまくいった指示", { x:7.25, y:2.55, w:5, h:0.35, fontSize:15, bold:true,
    color:JADE, fontFace:B, isTextBox:true, margin:0 });
  s.addText("次の2行の形式だけで出力してください\n【怒り】数値\n【セリフ】発言", { x:7.25, y:3.05, w:5, h:1.0,
    fontSize:14, color:"FFFFFF", fontFace:M, lineSpacing:21, isTextBox:true, margin:0 });
  s.addText("AIの返答", { x:7.25, y:4.15, w:5, h:0.3, fontSize:11, color:MIST, fontFace:M, isTextBox:true, margin:0 });
  s.addText("【怒り】72\n【セリフ】返品対応してくれる？", { x:7.25, y:4.5, w:5, h:0.7,
    fontSize:14, color:"FFFFFF", fontFace:M, lineSpacing:21, isTextBox:true, margin:0 });
  s.addText("必ず守ってくれる", { x:7.25, y:5.25, w:5, h:0.4, fontSize:15, bold:true,
    color:JADE, fontFace:B, isTextBox:true, margin:0 });

  s.addText("抽象的な命令より、埋めるべき「型」を渡すほうが確実に従う", { x:0.7, y:6.15, w:11.9, h:0.5,
    fontSize:16, bold:true, color:AMBER, fontFace:B, isTextBox:true, margin:0 });
  s.addNotes("最初の工夫です。AIに数値を出させたかったのですが、必ず出してと頼むだけでは無視されました。穴埋めの型を渡すと必ず守ってくれます。抽象的な命令より型のほうが強い、という発見でした。");
}

/* 7 ── モデル選定 */
{ const s = pres.addSlide(); plain(s);
  titleOnPlain(s, "AIモデルは実測で選んだ", "4種類を同じ質問で比べた。大きさだけでは決まらなかった");
  const rows = [
    ["qwen2.5-coder:0.5b", "出鱈目を回答", "最速", "EMBER", "不採用"],
    ["qwen2.5:1.5b",       "日本語が破綻",  "0.3秒", "EMBER", "不採用"],
    ["qwen2.5:7b",         "外国語が混入 3/10回", "1〜2秒", "AMBER", "不採用"],
    ["gemma2:9b",          "混入 0/10回",  "1.8秒", "JADE",  "採用"],
  ];
  const C = { EMBER, AMBER, JADE };
  s.addText(["モデル","日本語の品質","応答","判定"].join("        "), { x:1.0, y:2.35, w:11, h:0.3,
    fontSize:11, color:MIST, fontFace:M, isTextBox:true, margin:0 });
  rows.forEach(([m, q, t, c, v], i) => {
    const y = 2.8 + i*0.92;
    s.addShape(pres.ShapeType.roundRect, { x:0.8, y, w:11.8, h:0.75,
      fill:{ color: v==="採用" ? "DCEFE6" : "E4E9F0" }, rectRadius:0.04 });
    s.addText(m, { x:1.1, y:y+0.17, w:3.4, h:0.4, fontSize:15, bold:v==="採用",
      color:INK, fontFace:M, isTextBox:true, margin:0 });
    s.addText(q, { x:4.6, y:y+0.17, w:3.6, h:0.4, fontSize:14, color:INK,
      fontFace:B, isTextBox:true, margin:0 });
    s.addText(t, { x:8.3, y:y+0.17, w:1.6, h:0.4, fontSize:14, color:INK,
      fontFace:M, isTextBox:true, margin:0 });
    s.addShape(pres.ShapeType.roundRect, { x:10.6, y:y+0.16, w:1.5, h:0.42,
      fill:{ color:C[c] }, rectRadius:0.08 });
    s.addText(v, { x:10.6, y:y+0.16, w:1.5, h:0.42, fontSize:12, bold:true, color:"FFFFFF",
      fontFace:B, align:"center", valign:"middle", isTextBox:true, margin:0 });
  });
  s.addText("パラメータ数が近い 7B と 9B で差が出た。決め手は「日本語でどれだけ訓練されたか」",
    { x:0.8, y:6.6, w:11.8, h:0.4, fontSize:14, color:MIST, fontFace:B, isTextBox:true, margin:0 });
  s.addNotes("AIモデルは4種類を実測で比べました。小さいモデルは日本語が破綻します。7Bと9Bはサイズが近いのに差が出ました。カタログではなく実測で選ぶべきという学びです。");
}

/* 8 ── 95秒問題 */
{ const s = pres.addSlide(); deep(s);
  titleOnDeep(s, "テストで見つけた、最も危険な問題", "「5秒以内」と約束していたのに、実際は最大95秒かかっていた");
  s.addShape(pres.ShapeType.roundRect, { x:0.7, y:2.2, w:11.9, h:1.15, fill:{ color:"2A3446" }, rectRadius:0.05 });
  s.addText("なぜ気づけなかったか", { x:1.05, y:2.35, w:4, h:0.35, fontSize:14, bold:true,
    color:AMBER, fontFace:B, isTextBox:true, margin:0 });
  s.addText("連続して試していたため、AIが常にメモリに載った状態で計測していた。実際の利用者は久しぶりに開く。",
    { x:1.05, y:2.75, w:11.2, h:0.4, fontSize:14, color:MIST, fontFace:B, isTextBox:true, margin:0 });

  s.addText("修正前", { x:0.9, y:3.9, w:3, h:0.35, fontSize:14, bold:true, color:EMBER,
    fontFace:B, isTextBox:true, margin:0 });
  meter(s, 0.9, 4.5, 11.4, 1.0, EMBER, "久しぶりの1回目", "95.2 秒");
  s.addText("約束の19倍", { x:0.9, y:4.85, w:4, h:0.3, fontSize:12, color:EMBER,
    fontFace:M, isTextBox:true, margin:0 });

  s.addText("修正後", { x:0.9, y:5.5, w:3, h:0.35, fontSize:14, bold:true, color:JADE,
    fontFace:B, isTextBox:true, margin:0 });
  meter(s, 0.9, 6.1, 11.4, 0.035, JADE, "久しぶりの1回目", "3.3 秒");
  s.addText("起動時にAIを温め、メモリから追い出されない設定にした", { x:0.9, y:6.45, w:8, h:0.3,
    fontSize:12, color:MIST, fontFace:B, isTextBox:true, margin:0 });
  s.addNotes("テストで最も危険な問題が見つかりました。5秒以内と約束していたのに、実際は95秒かかっていたのです。連続して試していたので気づけませんでした。発表本番で起きていたら致命的でした。");
}

/* 9 ── 3ラリー問題 */
{ const s = pres.addSlide(); plain(s);
  titleOnPlain(s, "自分では気づけなかった問題", "実際に使ってもらって初めて分かった");
  s.addShape(pres.ShapeType.roundRect, { x:0.8, y:2.3, w:5.7, h:2.0, fill:{ color:"FBE9E4" }, rectRadius:0.06 });
  s.addText("使ってもらった感想", { x:1.15, y:2.5, w:5, h:0.3, fontSize:12, color:EMBER,
    fontFace:M, isTextBox:true, margin:0 });
  s.addText("「お客様のメッセージが返信しづらい。\n会話が3ラリーで終わってしまう」",
    { x:1.15, y:2.9, w:5, h:1.1, fontSize:17, bold:true, color:EMBER, fontFace:B,
      lineSpacing:26, isTextBox:true, margin:0 });

  s.addShape(pres.ShapeType.roundRect, { x:6.9, y:2.3, w:5.7, h:2.0, fill:{ color:CARD }, line:{ color:LINE, width:1 }, rectRadius:0.06 });
  s.addText("原因", { x:7.25, y:2.5, w:5, h:0.3, fontSize:12, color:MIST, fontFace:M, isTextBox:true, margin:0 });
  s.addText("良い応対1回で怒りが20下がる。\n80から始めると3回で目標に届く。",
    { x:7.25, y:2.9, w:5, h:1.1, fontSize:16, color:INK, fontFace:B, lineSpacing:26, isTextBox:true, margin:0 });

  s.addText("対応", { x:0.8, y:4.6, w:5, h:0.35, fontSize:16, bold:true, color:INK, fontFace:B, isTextBox:true, margin:0 });
  s.addText("1回で動く幅をコード側で最大12に制限した。指示文だけでは守られないため、受け取った値を必ず検算する。",
    { x:0.8, y:5.0, w:11.8, h:0.4, fontSize:14, color:INK, fontFace:B, isTextBox:true, margin:0 });
  meter(s, 0.8, 5.9, 5.3, 0.25, EMBER, "修正前", "3 ラリー");
  meter(s, 7.3, 5.9, 5.3, 0.58, JADE,  "修正後", "7 ラリー");
  s.addNotes("もう一つは自分では気づけなかった問題です。実際に使ってもらったところ、会話が3ラリーで終わると指摘を受けました。AIに頼らずコード側で変化幅を制限して解決しました。");
}


/* 10 ── 振り返り機能(実画面) */
{ const s = pres.addSlide(); deep(s);
  titleOnDeep(s, "どの一言が効いたかを残す", "会話を並べ直すだけでは、次に何を直せばよいか分からない");
  s.addImage({ path:"closed_crop.png", x:0.7, y:2.05, w:4.25, h:4.9 });
  const rows = [
    ["-12", JADE,  "誠に申し訳ございません。すぐに新品と交換いたします。", "いちばん効いた一言"],
    ["+7",  EMBER, "規約上、お客様の使い方の問題は責任を負いかねます。", "いちばん怒らせた一言"],
    ["-63", JADE,  "先ほどは失礼いたしました。本日中に代替品を発送します。", ""],
  ];
  rows.forEach(([d, c, t, tag], i) => {
    const y = 2.5 + i*1.35;
    s.addShape(pres.ShapeType.roundRect, { x:6.0, y, w:6.6, h:1.1, fill:{ color:"2A3446" }, rectRadius:0.05 });
    s.addText(d, { x:6.25, y:y+0.18, w:0.95, h:0.4, fontSize:19, bold:true, color:c,
      fontFace:M, align:"right", isTextBox:true, margin:0 });
    s.addText(t, { x:7.35, y:y+0.13, w:5.1, h:0.5, fontSize:13, color:"FFFFFF",
      fontFace:B, lineSpacing:17, isTextBox:true, margin:0 });
    if (tag) {
      s.addShape(pres.ShapeType.roundRect, { x:7.35, y:y+0.68, w:2.2, h:0.28,
        fill:{ color:c }, rectRadius:0.05 });
      s.addText(tag, { x:7.35, y:y+0.68, w:2.2, h:0.28, fontSize:10, bold:true, color:INK,
        fontFace:B, align:"center", valign:"middle", isTextBox:true, margin:0 });
    }
  });
  s.addText("「規約上」という一言が +7 だったと分かれば、次に避けるべきものが具体的になる",
    { x:6.0, y:6.7, w:6.6, h:0.5, fontSize:13, color:AMBER, fontFace:B, lineSpacing:18, isTextBox:true, margin:0 });
  s.addNotes("振り返り機能では、どの一言が怒りをいくつ動かしたかを残します。規約上という一言がプラス7だったと分かれば、次に避けるべきものが具体的になります。");
}

/* 11 ── 開発の進め方 */
{ const s = pres.addSlide(); plain(s);
  titleOnPlain(s, "一人でも、チーム開発の作法で進めた", "評価対象であるコミット履歴を、意味のある単位で残す");
  const stats = [["13","コミット"],["3","Pull Request"],["40","テスト項目"],["7","機能要件すべて完了"]];
  stats.forEach(([n, l], i) => {
    const x = 0.8 + i*3.05;
    s.addShape(pres.ShapeType.roundRect, { x, y:2.3, w:2.8, h:1.75, fill:{ color:INK }, rectRadius:0.06 });
    s.addText(n, { x:x+0.2, y:2.42, w:2.4, h:1.0, fontSize:44, bold:true, color:"FFFFFF",
      fontFace:M, align:"center", isTextBox:true, margin:0 });
    s.addText(l, { x:x+0.15, y:3.48, w:2.5, h:0.4, fontSize:12, color:MIST,
      fontFace:B, align:"center", isTextBox:true, margin:0 });
  });
  const flow = ["main から枝分かれ","機能ごとに実装","Pull Request で申請","設計書と突き合わせ","main へ合流"];
  flow.forEach((t, i) => {
    const x = 0.8 + i*2.44;
    s.addShape(pres.ShapeType.roundRect, { x, y:4.5, w:2.15, h:0.85, fill:{ color:CARD }, line:{ color:LINE, width:1 }, rectRadius:0.05 });
    s.addText(t, { x:x+0.12, y:4.62, w:1.9, h:0.6, fontSize:12, color:INK, fontFace:B,
      align:"center", valign:"middle", lineSpacing:16, isTextBox:true, margin:0 });
    if (i < 4) s.addShape(pres.ShapeType.line, { x:x+2.18, y:4.93, w:0.22, h:0,
      line:{ color:EMBER, width:2, endArrowType:"triangle" } });
  });
  s.addText("一人開発なので自分でレビューして自分でマージすることになるが、意図と検証を記録に残す価値は変わらない",
    { x:0.8, y:5.8, w:11.8, h:0.5, fontSize:14, color:MIST, fontFace:B, isTextBox:true, margin:0 });
  s.addText("設計書と実装がずれないよう、コードを直したら必ず設計書も直した",
    { x:0.8, y:6.3, w:11.8, h:0.5, fontSize:14, color:MIST, fontFace:B, isTextBox:true, margin:0 });
  s.addNotes("一人開発ですが、チーム開発の作法で進めました。ブランチを切ってPull Requestを作り、設計書と突き合わせてからマージしています。");
}

/* 12 ── 学び */
{ const s = pres.addSlide(); deep(s);
  titleOnDeep(s, "この10日間で学んだこと", "");
  const L = [
    ["測り方を間違えると、問題は見えない", "都合のよい条件で測った2〜3秒は嘘だった。本番に近い条件で測って初めて95秒が見えた。", EMBER],
    ["AIは信用せず、コードで保証する", "「ゆっくり下げて」と頼んでも守られない。受け取った値を検算すれば確実になる。", AMBER],
    ["自分では、自分の作ったものを評価できない", "3ラリー問題は他人に使ってもらって初めて分かった。作り手は使い方を知りすぎている。", JADE],
  ];
  L.forEach(([h2, d, c], i) => {
    const y = 2.1 + i*1.65;
    s.addShape(pres.ShapeType.ellipse, { x:0.8, y:y+0.12, w:0.44, h:0.44, fill:{ color:c } });
    s.addText(String(i+1), { x:0.8, y:y+0.12, w:0.44, h:0.44, fontSize:15, bold:true, color:INK,
      fontFace:M, align:"center", valign:"middle", isTextBox:true, margin:0 });
    s.addText(h2, { x:1.55, y:y, w:11, h:0.5, fontSize:23, bold:true, color:"FFFFFF",
      fontFace:B, isTextBox:true, margin:0 });
    s.addText(d, { x:1.55, y:y+0.6, w:10.9, h:0.6, fontSize:14, color:MIST,
      fontFace:B, lineSpacing:20, isTextBox:true, margin:0 });
  });
  s.addNotes("学びは3つです。測り方を間違えると問題は見えない。AIは信用せずコードで保証する。そして自分では自分の作ったものを評価できない。どれも実際に失敗して学びました。");
}

/* 13 ── まとめ */
{ const s = pres.addSlide(); deep(s);
  s.addText("クレトレ", { x:0.9, y:2.2, w:8, h:1.0, fontSize:48, bold:true, color:"FFFFFF",
    fontFace:H, charSpacing:5, isTextBox:true, margin:0 });
  s.addText("新人が、誰にも迷惑をかけずにクレーム対応を練習できる場を作りました。\n怒りの強さが数値で見えるから、自分の一言の効果がその場で分かります。",
    { x:0.95, y:3.4, w:8.2, h:1.2, fontSize:17, color:MIST, fontFace:B, lineSpacing:28, isTextBox:true, margin:0 });
  s.addText("ご清聴ありがとうございました", { x:0.95, y:5.3, w:8, h:0.6, fontSize:22, bold:true,
    color:"FFFFFF", fontFace:H, isTextBox:true, margin:0 });
  meter(s, 9.6, 3.0, 2.9, 0.80, EMBER, "はじめ", "80");
  meter(s, 9.6, 4.0, 2.9, 0.45, AMBER, "対応中", "45");
  meter(s, 9.6, 5.0, 2.9, 0.12, JADE,  "おわり", "12");
  s.addNotes("以上です。ご清聴ありがとうございました。");
}

pres.writeFile({ fileName: "kuretore.pptx" }).then(f => console.log("作成:", f));
