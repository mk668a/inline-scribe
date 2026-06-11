# inline-scribe

**ブラウザで書いた文章を、PC内で動くAIが校正してくれるChrome拡張です。** 入力欄で**Alt+G**を押すと修正案が出て、1ヶ所ずつ「採用する/しない」を選んで反映できます。文章がPCの外に送信されることはありません。

[English README](README.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/screenshot.png" alt="誤字を含むtextareaの下にinline-scribeのレビューパネルが開き、削除は赤の打ち消し線、追加は緑で表示され、修正ごとに採用・却下ボタンが並んでいる" width="100%"></p>

## 使い方

### 1. Ollamaをインストールする(初回のみ)

文章をチェックするAIを自分のPCで動かします。すでにOllamaを使っているなら飛ばしてください。

```sh
brew install ollama          # または https://ollama.com/download
ollama pull llama3.2         # 約2GB。メモリ8GBのMacでも動く
ollama serve
```

### 2. 拡張をChromeに入れる(初回のみ)

**方法A — Chrome Web Store(推奨。ビルド不要):**
[Chrome Web Storeの掲載ページ](https://github.com/mk668a/inline-scribe/releases)からインストール *(審査申請中 — 審査が通り次第ここがストアの直リンクになります。それまでは最新リリースの`inline-scribe.zip`をダウンロード→解凍→方法Bの手順で読み込んでください)*。

**方法B — ソースから:**

```sh
git clone https://github.com/mk668a/inline-scribe && cd inline-scribe
npm install && npm run build
```

`chrome://extensions`を開く → 右上の「デベロッパーモード」をON → 「パッケージ化されていない拡張機能を読み込む」→ `dist/`フォルダ(またはzipを解凍したフォルダ)を選択。

### 3. 文章を書いて、Alt+Gを押す

メールの本文、GitHubのコメント欄、問い合わせフォームなど、ブラウザ上のテキスト入力欄ならどこでも使えます。文章を書いたら、その入力欄にカーソルを置いたまま**Alt+G**。

Google翻訳の拡張と同じ感覚で使えるトリガーも2つあります。

- **文章を選択する** → 選択箇所のそばに小さな**✎アイコン**が出るのでクリック
- **文章を選択して右クリック** → **「Proofread selection — inline-scribe」**

選択して実行した場合は**選択した部分だけ**がチェック・置換されます(長いメールの1段落だけ直したいときに便利)。編集できないページの文章でも使えて、その場合は修正後の文章が**クリップボードにコピー**されます。

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/selection-icon.png" alt="ページ上で選択した文章のそばにinline-scribeの✎アイコンが浮かんでいる" width="100%">
</p>

### 4. 修正案を1ヶ所ずつ確認する

入力欄の下にパネルが開き、あなたの文章に修正案が重ねて表示されます。Wordの「変更履歴」と同じ見た目です。

- 消すべき箇所 → ~~赤の打ち消し線~~
- 足すべき箇所 → 緑の文字

修正ごとに**✓**(採用する)か**✕**(元のままにする)を選びます。全部まとめて採用するなら**Accept all**。

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/review-panel.png" alt="メール下書きの下にinline-scribeのレビューパネルが開き、llama3.2による4件の修正案が赤の打ち消し線と緑の挿入で表示され、各修正に✓/✕ボタンが付いている" width="100%">
</p>

### 5. Applyを押して反映する

**Apply accepted**を押すと、✓を付けた修正だけが入力欄に書き戻されます。気が変わったら**Esc** — 文章は1文字も変わりません。

### 操作一覧

| やりたいこと | 操作 |
|---|---|
| いま書いている欄をチェック | **Alt+G**(`chrome://extensions/shortcuts`で変更可) |
| 選択した部分だけチェック | 選択してから**Alt+G** / **✎アイコン** / 右クリック→**Proofread selection** |
| 編集できない文章を校正 | 選択→✎アイコン — 修正後の文章がクリップボードにコピーされる |
| この修正を採用 | 修正箇所の**✓** |
| ここは元のままにする | 修正箇所の**✕** |
| 全部採用して反映 | **Accept all** |
| ✓を付けた分だけ反映 | **Apply accepted**(未判断の候補は反映されない) |
| 何もせず閉じる | **Esc** |

`<textarea>`、1行のテキスト`<input>`、`contenteditable`なエディタ(Gmailなど)で動きます。contenteditableへの書き戻しはv0.1ではプレーンテキストです。

## なぜ必要?

ブラウザでの文章チェック、いま選べる手段はどれも難ありです。

- **Grammarly** — 使い勝手は抜群。ただし書いた内容がすべて先方のサーバーに送られるため、社外秘や未公開コードを扱う環境では使えません(禁止している会社も多い)。肝心な機能は月額課金。
- **ChatGPTに貼り付け** — 直した文章が丸ごと返ってくるだけで、**どこを直されたのか分からない**。意図しない書き換えが混ざっていないか結局全文を読み直すことになるし、これも外部送信。
- **諦める** — typoごと送信。

一方で、AI自体はもう手元にあります。Ollamaならコマンド2つで、無料で、十分賢いモデルが自分のPCで動きます。

足りていないのはAIではなく**UI**でした。Grammarlyが選ばれてきた本当の理由は文法エンジンの精度ではなく、「どこをどう直すのか」が一目で分かって1つずつ自分で選べる、あのdiff表示です。

**あのdiff表示を、自分のローカルモデルの上で再現する** — それがinline-scribeです。

| | 校正エンジン | 文章の送信先 | 修正を1つずつ選べるdiff表示 | 料金 |
|---|---|---|---|---|
| Grammarly | クラウドAI | 先方のサーバー | ✅ ← みんなこれにお金を払っている | 月$12〜 |
| Harper (10k★) | ローカル(ルールベース) | なし✅ | ❌ typoに下線が付くだけ。文の書き直しはできない | 無料 |
| scramble / Typollama | ローカルLLM✅ | なし✅ | ❌ 全文が丸ごと置き換わる/ポップアップ表示のみ | 無料 |
| **inline-scribe** | ローカルLLM✅ | なし✅ | ✅ | 無料 |

## 仕組み

```
入力欄でAlt+G
   │
   ▼ 文章を、自分で設定したエンドポイントに送る
     (既定は127.0.0.1のOllama / llama3.2。約2GB・無料)
   │
   ▼ モデルは「直した後の文章」だけを返す
   │
   ▼ 元の文章と見比べて、拡張側がword単位のdiffを計算
     (LLMにdiffを作らせない — ここが肝)
   │
   ▼ レビューパネルで✓/✕ → Applyで採用分だけ書き戻し
```

設計上の約束は2つだけです。

1. **diffを作るのはLLMではなく拡張側のアルゴリズム。** 小さいローカルモデルは文章を直すのは得意でも、決まった形式で出力するのは苦手です。だからモデルには「直した文章」だけを返させて、変更箇所の検出は決定的なdiff計算で行います。モデルが多少おしゃべりでもUIは壊れません。
2. **✓を押すまで、元の文章には指一本触れない。** 全部✕にしてもEscで閉じても、入力欄は元のままです。

もう1つ、地味に重要な話。素のOllamaはブラウザ拡張からのリクエストを`403 Forbidden`で弾きます(Originチェック)。本来は`OLLAMA_ORIGINS`という環境変数の設定が必要になるところ、inline-scribeは`declarativeNetRequest`で`Origin`ヘッダ自体を外して送るため、**インストールしたままのOllamaがそのまま動きます**。設定ゼロです。

## 設定

拡張アイコンを右クリック → オプション:

- **Endpoint** — OpenAI互換APIなら何でも。Ollama / llama.cpp / LM Studio / vLLM、自分のAPIキーでクラウドに繋ぐのも可。既定は`http://127.0.0.1:11434/v1`
- **Model** — 既定`llama3.2`。大きいモデルに替えれば提案の質だけが上がります
- **System prompt** — モデルへの指示文。ここを書き換えると校正以外にも使えます。「日本語に翻訳して」にすれば翻訳機に、「敬語に直して」にすればトーン変換器に — レビューの流れはそのままで
- **Selection icon** — 文章を選択したときに出る✎アイコンのON/OFF(OFFにしてもAlt+Gと右クリックメニューは使えます)

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/options.png" alt="inline-scribeの設定画面: Endpoint、Model、APIキー(任意)、System prompt、✎アイコンのON/OFF" width="70%">
</p>

## プライバシー

- 文章が送られるのは**自分で設定したエンドポイントだけ**。既定(localhostのOllama)ならPCの外に一切出ません
- アカウント登録なし、アナリティクスなし、テレメトリなし。保存されるのは設定値だけ(`chrome.storage.sync`)
- このプロジェクトにサーバーはありません。メンテナが費用を払うことも、あなたの文章を見ることもできない構造です

## 今後

- Chrome内蔵の**Proofreader API**(Gemini Nano)対応 — Ollamaすら入れずに使える選択肢として、同じレビューUIの裏に追加(現在origin trial中)
- Firefox対応
- contenteditableへのリッチテキスト書き戻し

ライセンスはMITです。
