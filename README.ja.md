# inline-scribe

> **どんな textarea にも Track-Changes を。動かすのはあなた自身のローカル LLM。テキストはマシンの外に出ない。**

[English README](README.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/screenshot.png" alt="typo を含む textarea と、その下に表示された inline-scribe のレビューパネル。削除は赤の打ち消し線、挿入は緑で表示され、それぞれに accept/reject ボタンが付く" width="100%">
</p>

## これは何?

inline-scribe は、ブラウザで書いているあらゆる文章 — メール、GitHub のコメント、フォーム、CMS のエディタ — を **自分のパソコン上で動く AI モデル**で校正し、その結果を人間の編集者と同じ流儀 = **Track Changes (変更履歴)** で見せる Chrome 拡張です。

テキスト欄で **Alt+G** を押すと、パネルが開いて修正候補が文中にそのままマークされます — 削除は ~~赤の打ち消し線~~、挿入は緑。1 箇所ずつ ✓ (採用) / ✕ (元のまま) を選び、**Apply** を押すと承認した修正だけが書き戻されます。**Esc** を押せばテキストは 1 バイトも変わりません。

## なぜ必要?

ブラウザで文章を書く人は今、3 つの悪い選択肢から選んでいます:

1. **Grammarly** — UX は最高。ただし全キーストロークが他社クラウドに送信され、良い機能は有料で、機密を扱う職場 (法務文書・未公開コード・医療情報) では使用禁止されがち。
2. **ChatGPT にコピペ** — 返ってくるのは書き換え済みの 1 つの塊。どの単語が変わった? 意図まで変えられていない? 毎回全文を読み直すはめになり、しかもテキストは他人のサーバーに渡っている。
3. **何もしない** — typo ごと送信。

一方で、足りないのはもう AI ではありません。[Ollama](https://ollama.com) を使えば誰でもコマンド 2 つで、無料で、十分賢いモデルをローカルで動かせます。足りないのは**インターフェース**です。Grammarly にお金を払う理由は文法エンジンではなく、*どの変更も自分で見て選べる friendly な diff 表示*でした。

その diff インターフェースを、自分が所有するモデルの上に乗せる — それがこのプロダクトの全てです:

| | 校正 | テキストの行き先 | inline diff + 個別 accept/reject | 価格 |
|---|---|---|---|---|
| **Grammarly** | クラウド AI | 先方のサーバー | ✅ (人々が払う理由) | $12+/月 |
| **Harper** (10k★) | ローカル・ルールベース | どこにも行かない ✅ | ❌ typo の下線指摘のみ。下手な文の書き直しは不可 | 無料 |
| **scramble / Typollama** | ローカル LLM ✅ | どこにも行かない ✅ | ❌ 全文置換 or popup 表示 | 無料 |
| **inline-scribe** | ローカル LLM ✅ | どこにも行かない ✅ | ✅ | 無料 |

## 仕組み

```
テキスト欄で Alt+G
      │
      ▼
拡張があなたの設定したエンドポイントへテキスト送信   ← 既定: 127.0.0.1 の Ollama
(OpenAI 互換 /chat/completions API)                     モデル: llama3.2 (~2GB、無料)
      │
      ▼
モデルは「校正後の文章」だけを返す
      │
      ▼
inline-scribe が元の文章との word-level diff を計算   ← 決定的アルゴリズム。
      │                                                  LLM の出力形式に依存しない
      ▼
レビューパネルで 1 箇所ずつ ✓/✕ → Apply で承認分だけ書き戻し
```

この図から 2 つの設計ルールが導かれます:

- **LLM に diff を作らせない。** 小型ローカルモデルは文章修正は得意でも構造化出力は苦手。だからモデルは校正後のテキストだけを返し、Track-Changes の hunk は拡張側の決定的な word-level diff が計算します。おしゃべりな 3B モデルでも UI は壊れません。
- **accept するまで元テキストに触らない。** 全部 reject (または Esc) すれば、入力欄は完全に元のまま。

実用上の重要ディテールをもう 1 つ: 素の Ollama はブラウザ拡張からのリクエストを `403 Forbidden` で拒否します (Origin チェック)。inline-scribe は `declarativeNetRequest` でエンドポイント宛リクエストの `Origin` ヘッダを除去するので、**`OLLAMA_ORIGINS` の設定なしで、インストール直後の Ollama がそのまま動きます**。

## クイックスタート

**1. ローカルモデルを用意** (Ollama 利用中ならスキップ):

```sh
brew install ollama          # または https://ollama.com/download
ollama pull llama3.2         # ~2GB、8GB RAM で動く
ollama serve
```

**2. 拡張をインストール** (v0.1 は unpacked。Web Store 申請は roadmap):

```sh
git clone https://github.com/mk668a/inline-scribe && cd inline-scribe
npm install && npm run build
```

`chrome://extensions` を開き **デベロッパーモード** を ON → **パッケージ化されていない拡張機能を読み込む** → `dist/` を選択。

**3. 使う:** 任意のテキスト欄をクリックし、間違いを含む文を書いて **Alt+G**。

## 使い方

| 操作 | 方法 |
|---|---|
| フォーカス中の欄をチェック | **Alt+G** (`chrome://extensions/shortcuts` で変更可) |
| 修正を 1 つ採用 | hunk の **✓** |
| 元の表現を残す | hunk の **✕** |
| 全部採用 | **Accept all** |
| 採用分だけ反映 | **Apply accepted** (未判断の候補は破棄) |
| キャンセル (テキスト無変更) | **Esc** |

`<textarea>`、テキスト `<input>`、`contenteditable` エディタ (Gmail 等。v0.1 ではプレーンテキストで書き戻し) に対応。

## 設定

拡張アイコンを右クリック → **オプション**:

- **Endpoint** — OpenAI 互換サーバーなら何でも: Ollama / llama.cpp / LM Studio / vLLM / 自分の API キーでのクラウド。既定 `http://127.0.0.1:11434/v1`
- **Model** — 既定 `llama3.2`。大きいモデルほど提案の質が上がる (UI は同じ)
- **System prompt** — 編集指示。書き換えれば翻訳者にも、トーン調整器にも、脱・お役所言葉フィルタにもなる — レビューの流れはそのまま

## プライバシーモデル

- テキストは**あなたが設定したエンドポイントにだけ**送られます。既定 (localhost の Ollama) ならマシンの外に一切出ません。
- アナリティクスなし、アカウントなし、テレメトリなし。保存されるのは設定 (`chrome.storage.sync`) だけ。
- メンテナは費用を負担せず、あなたのテキストを見ることもできません — このプロジェクトにサーバーはありません。

## Roadmap

- Chrome 内蔵 **Proofreader API** (Gemini Nano) を同じレビュー UI の zero-install バックエンドに (現在 origin trial 中)
- Firefox 対応
- `contenteditable` のリッチテキスト書き戻し
- Chrome Web Store 公開

MIT.
