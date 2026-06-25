# inline-scribe

**一款在浏览器里校对你所写内容的 Chrome 扩展，使用运行在你自己电脑上的 AI。** 在任意文本框中按下 **Alt+G** 即可获得修改建议，然后逐条接受或拒绝每一处修正。你的文本永远不会离开你的设备。默认情况下，它使用 Chrome 内置的 AI（Gemini Nano）——无需安装任何东西，也不用运行任何服务器。

[**▶ 从 Chrome 应用商店安装**](https://chromewebstore.google.com/detail/inline-scribe/kmcgponcdfdpbmkahiolhnignkkpnkgm) · [English](../../README.md) · [日本語](README.ja.md) · **简体中文** · [한국어](README.ko.md) · [Español](README.es.md) · [Français](README.fr.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/screenshot.png" alt="一个含有拼写错误的文本框，下方是 inline-scribe 的审阅面板：删除内容以红色删除线标出，插入内容以绿色标出，每一处都带有接受/拒绝按钮，由 llama3.2 在本地检查" width="100%">
</p>

## 如何使用

### 1. 安装扩展

**方式 A —— Chrome 应用商店（推荐，无需构建工具）：**
从 [Chrome 应用商店页面](https://chromewebstore.google.com/detail/inline-scribe/kmcgponcdfdpbmkahiolhnignkkpnkgm) 安装。

**方式 B —— 从源码安装：**

```sh
git clone https://github.com/mk668a/inline-scribe && cd inline-scribe
npm install && npm run build
```

打开 `chrome://extensions` → 启用 **开发者模式**（右上角）→ **加载已解压的扩展程序** → 选择 `dist/` 文件夹（或解压后的 release 文件夹）。

### 2. 选择 AI 运行的位置（开箱即用）

默认情况下，inline-scribe 使用 **Chrome 内置的 Gemini Nano**——无需安装任何东西，也不用启动任何服务器。首次检查时会一次性下载模型（Chrome 138+，约需 22 GB 可用磁盘空间）。如果你的设备无法运行它，面板会提示你，你可以切换后端。

想用更大或自定义的模型？打开扩展的 **选项**，将后端切换为 **本地服务器**，并将其指向任意你自己运行的 OpenAI 兼容端点：

```sh
brew install ollama          # or https://ollama.com/download
ollama pull llama3.2         # ~2GB, runs fine on 8GB RAM
ollama serve
```

无论哪种方式，维护者都不需要支付任何费用，也看不到任何内容——你的文本始终留在你的电脑上。

### 3. 写点东西，然后按 Alt+G

适用于浏览器中的任意文本框——邮件正文、GitHub 评论框、联系表单。写好你的文本，把光标保留在该字段中，然后按 **Alt+G**。

还有另外两种触发检查的方式，类似 Google 翻译的体验：

- **选中文本** → 选区旁边会弹出一个小小的 **✎ 图标**——点击它。
- **选中文本 → 右键** → **校对选中内容 — inline-scribe**。

选中文本时，只检查并替换被选中的部分——适合校对一封长邮件中的某个段落。它甚至适用于你*无法*编辑的文本（比如别人在 wiki 上的草稿）：修正后的版本会**复制到你的剪贴板**，而不是写回原处。

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/selection-icon.png" alt="页面上被选中的文本，旁边浮动着 inline-scribe 的 ✎ 图标" width="100%">
</p>

### 4. 审阅每一条建议

文本框下方会打开一个面板，原位标出建议的修正，看起来就像 Word 的修订模式：

- 要删除的文本 → ~~以红色删除线标出~~
- 要添加的文本 → 以绿色显示

对每一处修正，选择 **✓**（接受）或 **✕**（保留你的措辞）。也可以用 **全部接受** 一次性采纳所有建议。

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/review-panel.png" alt="一封邮件草稿，下方是 inline-scribe 审阅面板：来自 llama3.2 的四条建议，删除内容以红色删除线标出，插入内容以绿色标出，每条都带有 ✓/✕ 按钮" width="100%">
</p>

### 5. 按下 Apply

**应用已接受的修改** 只会写回你接受的那些修正。改主意了？按 **Esc**——你的文本会原封不动地保留，逐字节不变。

### 速查表

| 操作 | 方法 |
|---|---|
| 检查当前聚焦的字段 | **Alt+G**（可在 `chrome://extensions/shortcuts` 重新绑定） |
| 仅检查选中内容 | 选中它，然后 **Alt+G** / 点击 **✎ 图标** / 右键 → **校对选中内容** |
| 校对只读文本 | 选中它 → ✎ 图标 —— 修正后的文本会复制到你的剪贴板 |
| 接受单条建议 | 该修改块上的 **✓** 按钮 |
| 保留你的原始措辞 | 该修改块上的 **✕** 按钮 |
| 接受所有建议 | **全部接受** |
| 只应用你接受的内容 | **应用已接受的修改**（待处理的建议会被丢弃） |
| 取消，保持文本不变 | **Esc** |

适用于 `<textarea>`、文本 `<input>` 以及 `contenteditable` 编辑器（Gmail、Notion 风格的编辑器——写回通过编辑器自身的插入命令完成，因此周围的格式和撤销操作都会被保留）。

## 为什么需要它？

如今每个在浏览器中写作的人，都只能从三个糟糕的选项里挑一个：

1. **Grammarly** —— 体验出色，但你的每一次按键都会被上传到某家公司的云端，好用的功能藏在订阅之后，而且许多工作场所正是出于这个原因禁用它（法律文件、未发布的代码、患者数据，以及任何机密内容）。
2. **复制粘贴到 ChatGPT** —— 你拿回的是一大块被重写的文本。它改了哪些词？有没有改掉你本来想表达的意思？你每次都得重新通读一遍，而且你的文本依然发送到了别人的服务器上。
3. **什么都不做** —— 然后带着拼写错误发出去。

与此同时，缺失的那块拼图早已不再是 AI。任何人都能用 [Ollama](https://ollama.com) 两条命令在本地免费运行一个有能力的模型。真正缺的是**界面**：让 Grammarly 值得付费的，从来不是它的语法引擎——而是那个*友好的 diff*，让你能看到并掌控每一处改动。

那个界面，加上一个属于你自己的模型，就是这个产品的全部：

| | 修正方式 | 你的文本会去往 | 内联 diff、逐条接受/拒绝 | 价格 |
|---|---|---|---|---|
| **Grammarly** | 云端 AI | 他们的服务器 | ✅（人们付费的理由） | $12+/月 |
| **Harper**（10k★） | 本地、基于规则 | 哪都不去 ✅ | ❌ 只给拼写错误画下划线 —— 无法重写一个笨拙的句子 | 免费 |
| **scramble / Typollama** | 本地 LLM ✅ | 哪都不去 ✅ | ❌ 整段文本替换或弹窗 | 免费 |
| **inline-scribe** | 本地 LLM ✅ | 哪都不去 ✅ | ✅ | 免费 |

Harper 在这里其实算不上对手——它是*互补*的，而且 inline-scribe 可以直接使用它：
打开可选的 [Harper 预处理](#配置)，让 Harper 处理那些即时、确定性的修正，而本地 LLM 则负责基于规则的引擎做不到的重写。
两部分都运行在你的电脑上。

## 工作原理

```
你在文本框中按下 Alt+G
        │
        ▼
你的文本被送往运行在你电脑上的 AI            ← 默认：Chrome 内置的
（内置 Gemini Nano，或者在你切换后端时             Gemini Nano（无需安装）；
 使用像 Ollama 这样的本地 OpenAI 兼容端点）        或你自己的 Ollama 端点
        │
        ▼
模型返回修正后的文字 —— 只是文本
        │
        ▼
inline-scribe 计算词级别的 diff               ← 确定性算法，
对比你的文本和修正结果                            而非 LLM 的主观判断
        │
        ▼
审阅面板：逐条接受 ✓ / 拒绝 ✕ → Apply 只写回你批准的内容
```

从这张图里可以推导出两条设计原则：

- **LLM 从不生成 diff。** 小型本地模型很擅长修正文字，却极不擅长产出结构化输出。所以模型只返回修正后的文本，修订模式的修改块由扩展中一个确定性的词级别 diff 计算得出。一个话痨的 3B 模型也无法破坏界面。
- **在你接受之前，你的文本永远不会被修改。** 拒绝所有建议（或按 Esc），字段就和你离开时一模一样。
- **确定性的工作交给确定性的引擎（可选）。** 启用 Harper 预处理后，机械性的修正会在模型运行之前由 Harper 基于规则的引擎完成，于是 LLM 只把精力花在真正需要判断的地方。Harper 的 WASM 在设备本地运行，且仅在你启用预处理时才加载。

还有一个能帮每位新用户省下 20 分钟的实用细节：原版 Ollama 会以 `403 Forbidden`（CORS 来源检查）拒绝来自浏览器扩展的请求。inline-scribe 通过 `declarativeNetRequest` 去掉发往你端点的请求中的 `Origin` 头，因此它能与原生的 `ollama serve` 直接配合工作——无需 `OLLAMA_ORIGINS` 环境变量，也无需配置文件。

## 配置

右键点击扩展图标 → **选项**：

- **后端** —— **Chrome 内置 AI（Gemini Nano）**（默认，无需安装任何东西）或 **本地服务器**（自带端点）。两种方式下审阅界面完全相同。
- **端点** *（仅本地服务器）* —— 任意 OpenAI 兼容服务器：Ollama、llama.cpp、LM Studio、vLLM，或一个用你自己 API 密钥访问的云端点。默认为 `http://127.0.0.1:11434/v1`。
- **模型** *（仅本地服务器）* —— 默认 `llama3.2`。模型越大 = 建议越好，界面不变。
- **系统提示词** —— 编辑指令。改写它，inline-scribe 就会变成翻译器、语气软化器，或者去公文腔工具——审阅流程不变。
- **选区图标** —— 取消勾选可关闭你选中文本时出现的 ✎ 图标（Alt+G 和右键菜单仍然有效）。
- **Harper 预处理** *（可选，默认关闭）* —— 勾选它即可在 AI *之前* 运行 [Harper](https://writewithharper.com)——一个快速、基于规则、完全本地的语法引擎。Harper 会即时离线地修正那些确定性的、机械性的错误（大小写、标点、空格、主谓一致、重复词）；之后 AI 只需处理流畅度和措辞选择。词法层面的推断（拼写、笔误）则有意留给拥有完整上下文的 AI。Harper 以设备本地的 WebAssembly 运行，因此这部分也保持 100% 本地。参见 [工作原理](#工作原理)。

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/options.png" alt="inline-scribe 选项页面：端点、模型、可选 API 密钥、系统提示词，以及选区图标开关" width="70%">
</p>

## 隐私模型

- 使用**默认后端**时，模型在设备本地运行（Chrome 内置的 Gemini Nano）：你的文本永远不会离开你的电脑。使用 **本地服务器** 后端时，文本只会发往你所配置的端点，不会去往任何其他地方。
- 没有分析统计，没有账户，没有遥测，除了你的设置（`chrome.storage.sync`）之外不存储任何东西。
- 维护者不需要为任何东西付费，也看不到任何东西——这个项目没有服务器。

## 路线图

- 将 **Chrome 内置的 Proofreader API**（Gemini Nano）作为另一个设备本地后端，提供一流的修正能力——一旦它结束 origin trial，就在同一套审阅界面下采用。（如今默认的设备本地路径是已正式发布的 Prompt API。）
- Firefox 移植（MV3 的差异）

## 开发

```sh
npm test            # 36 unit tests for the diff + checker + Harper pre-pass core (no LLM needed)
npm run typecheck
npm run build       # esbuild → dist/
```

diff 引擎和 checker 抽象层位于 `src/core/`，不引入任何浏览器 API——它们是纯 TypeScript，用 Vitest 测试。Chrome 特定的层（`src/content`、`src/background`、`src/options`）构建在其之上。

MIT。
