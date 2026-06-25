# inline-scribe

**자신의 컴퓨터에서 실행되는 AI를 사용해 브라우저에서 작성한 글을 교정해 주는 Chrome 확장 프로그램.** 아무 텍스트 입력란에서 **Alt+G** 를 누르면 수정 제안을 받고, 각 수정 사항을 하나씩 수락하거나 거부할 수 있습니다. 작성한 텍스트는 절대 기기를 벗어나지 않습니다. 기본적으로 Chrome 내장 AI(Gemini Nano)를 사용하므로 설치할 것도, 실행할 서버도 없습니다.

[**▶ Chrome 웹 스토어에서 설치**](https://chromewebstore.google.com/detail/inline-scribe/kmcgponcdfdpbmkahiolhnignkkpnkgm) · [English](../../README.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · **한국어** · [Español](README.es.md) · [Français](README.fr.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/screenshot.png" alt="오타가 있는 텍스트 영역과 그 아래의 inline-scribe 검토 패널: 삭제는 빨간색 취소선, 삽입은 초록색으로 표시되고 각 항목에 수락/거부 버튼이 있으며, llama3.2로 로컬에서 검사됨" width="100%">
</p>

## 사용 방법

### 1. 확장 프로그램 설치

**옵션 A — Chrome 웹 스토어 (권장, 빌드 도구 불필요):**
[Chrome 웹 스토어 페이지](https://chromewebstore.google.com/detail/inline-scribe/kmcgponcdfdpbmkahiolhnignkkpnkgm)에서 설치하세요.

**옵션 B — 소스에서 설치:**

```sh
git clone https://github.com/mk668a/inline-scribe && cd inline-scribe
npm install && npm run build
```

`chrome://extensions` 를 열고 → **개발자 모드**(오른쪽 위)를 켠 다음 → **압축해제된 확장 프로그램을 로드합니다** → `dist/` 폴더(또는 압축을 푼 릴리스 폴더)를 선택하세요.

### 2. AI를 어디서 실행할지 선택 (설치 직후 바로 동작)

기본적으로 inline-scribe는 **Chrome 내장 Gemini Nano** 를 사용하므로 설치할 것도, 시작할 서버도 없습니다. 첫 검사 시 모델을 한 번만 내려받습니다(Chrome 138+, 여유 디스크 약 22GB). 기기에서 실행할 수 없는 경우 패널이 이를 알려 주며 백엔드를 전환할 수 있습니다.

더 크거나 직접 만든 모델을 사용하고 싶나요? 확장 프로그램의 **옵션**을 열고 백엔드를 **로컬 서버**로 전환한 다음, 직접 실행하는 OpenAI 호환 엔드포인트를 지정하세요:

```sh
brew install ollama          # or https://ollama.com/download
ollama pull llama3.2         # ~2GB, runs fine on 8GB RAM
ollama serve
```

어느 쪽이든 유지보수자는 비용을 한 푼도 내지 않고 아무것도 볼 수 없습니다 — 작성한 텍스트는 당신의 기기에 머뭅니다.

### 3. 글을 쓴 다음 Alt+G 누르기

브라우저의 모든 텍스트 입력란에서 동작합니다 — 이메일 본문, GitHub 댓글 상자, 연락처 양식 등. 텍스트를 작성하고 커서를 입력란에 둔 상태로 **Alt+G** 를 누르세요.

Google 번역과 비슷한 방식으로 검사를 시작하는 두 가지 방법이 더 있습니다:

- **텍스트 선택** → 선택 영역 옆에 작은 **✎ 아이콘**이 나타납니다 — 클릭하세요.
- **텍스트 선택 → 우클릭** → **선택 영역 교정 — inline-scribe**.

선택한 상태에서는 선택한 부분만 검사하고 교체됩니다 — 긴 이메일의 한 단락만 다룰 때 유용합니다. 심지어 *편집할 수 없는* 텍스트(예: 위키에 있는 다른 사람의 초안)에서도 동작합니다: 교정된 버전이 입력란에 다시 쓰이는 대신 **클립보드에 복사됩니다**.

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/selection-icon.png" alt="페이지에서 선택된 텍스트 옆에 inline-scribe ✎ 아이콘이 떠 있는 모습" width="100%">
</p>

### 4. 각 제안 검토

입력란 아래에 패널이 열려, Word의 변경 내용 추적처럼 제안된 수정 사항이 제자리에 표시된 텍스트를 보여 줍니다:

- 삭제할 텍스트 → ~~빨간색 취소선~~
- 추가할 텍스트 → 초록색으로 표시

각 수정 사항마다 **✓**(수락) 또는 **✕**(원래 표현 유지)를 선택하세요. 또는 **모두 수락**으로 한 번에 전부 적용할 수도 있습니다.

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/review-panel.png" alt="이메일 초안과 그 아래의 inline-scribe 검토 패널: llama3.2가 제시한 네 가지 제안, 삭제는 빨간색 취소선, 삽입은 초록색, 각 항목에 ✓/✕ 버튼" width="100%">
</p>

### 5. 적용 누르기

**수락한 항목 적용**은 수락한 수정 사항만 다시 써넣습니다. 마음이 바뀌었나요? **Esc** 를 누르세요 — 텍스트는 한 바이트도 건드리지 않은 채 그대로 유지됩니다.

### 빠른 참조표

| 동작 | 방법 |
|---|---|
| 포커스된 입력란 검사 | **Alt+G** (`chrome://extensions/shortcuts`에서 재설정 가능) |
| 선택 영역만 검사 | 선택한 다음 **Alt+G** / **✎ 아이콘** / 우클릭 → **선택 영역 교정** |
| 읽기 전용 텍스트 교정 | 선택 → ✎ 아이콘 — 교정된 텍스트가 클립보드에 복사됨 |
| 제안 하나 수락 | 해당 청크의 **✓** 버튼 |
| 원래 표현 유지 | 해당 청크의 **✕** 버튼 |
| 전부 수락 | **모두 수락** |
| 수락한 것만 적용 | **수락한 항목 적용** (대기 중인 제안은 폐기됨) |
| 취소, 텍스트 그대로 두기 | **Esc** |

`<textarea>`, 텍스트 `<input>`, 그리고 `contenteditable` 에디터(Gmail, Notion 스타일 에디터)에서 동작합니다 — 다시 써넣을 때 에디터 자체의 삽입 명령을 거치므로 주변 서식과 실행 취소가 보존됩니다.

## 왜 이것이 필요한가?

오늘날 브라우저에서 글을 쓰는 모든 사람은 세 가지 나쁜 선택지 중 하나를 고릅니다:

1. **Grammarly** — 훌륭한 UX를 갖췄지만, 모든 키 입력이 한 회사의 클라우드로 업로드되고, 좋은 기능은 구독 뒤에 가려져 있으며, 많은 직장에서는 바로 그 이유로 사용을 금지합니다(법률 문서, 미공개 코드, 환자 데이터 등 기밀이라면 무엇이든).
2. **ChatGPT에 복사·붙여넣기** — 통째로 다시 쓰인 큰 덩어리 하나를 돌려받습니다. 어떤 단어를 바꿨을까요? 의도한 무언가를 변경하진 않았을까요? 매번 모든 것을 다시 읽어야 하고, 그러는 동안에도 텍스트는 여전히 다른 사람의 서버로 갔습니다.
3. **아무것도 안 함** — 그리고 오타를 그대로 내보냅니다.

한편, 이제 부족한 재료는 더 이상 AI가 아닙니다. 누구나 [Ollama](https://ollama.com)로 명령어 두 줄이면 무료로 유능한 모델을 로컬에서 실행할 수 있습니다. 부족한 것은 바로 **인터페이스**입니다: Grammarly가 돈을 낼 만하게 만든 것은 결코 문법 엔진이 아니라, 각 변경 사항을 보고 제어할 수 있게 해 주는 *친절한 diff* 였습니다.

당신이 소유한 모델 위에 올라간 그 인터페이스, 그것이 제품의 전부입니다:

| | 교정 방식 | 텍스트가 가는 곳 | 인라인 diff, 수정별 수락/거부 | 가격 |
|---|---|---|---|---|
| **Grammarly** | 클라우드 AI | 자사 서버 | ✅ (사람들이 돈을 내는 이유) | $12+/mo |
| **Harper** (10k★) | 로컬, 규칙 기반 | 아무 데도 안 감 ✅ | ❌ 오타에 밑줄만 그음 — 어색한 문장을 다시 쓸 수 없음 | 무료 |
| **scramble / Typollama** | 로컬 LLM ✅ | 아무 데도 안 감 ✅ | ❌ 전체 텍스트 교체 또는 팝업 | 무료 |
| **inline-scribe** | 로컬 LLM ✅ | 아무 데도 안 감 ✅ | ✅ | 무료 |

Harper는 사실 여기서 경쟁 상대가 아닙니다 — *보완재*이며, inline-scribe가 직접 활용할 수 있습니다:
선택적인 [Harper 사전 처리](#configuration)를 켜면 Harper가 즉각적이고 결정론적인 수정을 처리하고, 로컬 LLM은 규칙 기반 엔진이 할 수 없는 다시 쓰기를 담당합니다.
두 부분 모두 당신의 기기에서 실행됩니다.

## 작동 방식

```
텍스트 입력란에서 Alt+G 를 누른다
        │
        ▼
텍스트가 당신의 기기에서 실행되는 AI로 간다       ← 기본값: Chrome 내장
(내장 Gemini Nano, 또는 백엔드를 전환하면              Gemini Nano (설치 불필요);
 Ollama 같은 로컬 OpenAI 호환 엔드포인트)              또는 당신의 Ollama 엔드포인트
        │
        ▼
모델이 교정된 문장을 돌려준다 — 그냥 텍스트
        │
        ▼
inline-scribe가 당신의 텍스트와 교정본 사이의         ← 결정론적 알고리즘,
단어 단위 diff를 계산한다                              LLM의 의견이 아님
        │
        ▼
검토 패널: 각 변경을 수락 ✓ / 거부 ✕ → 적용은 당신이 승인한 것만 다시 써넣는다
```

이 도식에서 두 가지 설계 원칙이 나옵니다:

- **LLM은 절대 diff를 만들지 않습니다.** 작은 로컬 모델은 문장을 고치는 데는 뛰어나지만
  구조화된 출력을 만드는 데는 형편없습니다. 그래서 모델은 교정된 텍스트만 돌려주고,
  변경 내용 추적 청크는 확장 프로그램 안의 결정론적 단어 단위 diff로 계산됩니다.
  수다스러운 3B 모델도 UI를 망가뜨릴 수 없습니다.
- **수락하기 전까지 텍스트는 절대 수정되지 않습니다.** 전부 거부하거나(또는 Esc를 누르면)
  입력란은 당신이 남겨 둔 그대로입니다.
- **결정론적 작업은 결정론적 엔진으로(선택 사항).** Harper 사전 처리를 켜면
  기계적인 수정은 모델이 실행되기 전에 Harper의 규칙 기반 엔진이 처리하므로,
  LLM은 실제로 판단이 필요한 것에만 노력을 들입니다. Harper의 WASM은 기기에서 실행되며
  사전 처리를 켤 때만 로드됩니다.

그리고 모든 신규 사용자의 20분을 아껴 주는 실용적인 세부 사항 하나: 기본 상태의 Ollama는
브라우저 확장 프로그램의 요청을 `403 Forbidden`으로 거부합니다(CORS origin 검사). inline-scribe는
`declarativeNetRequest`를 통해 당신의 엔드포인트로 가는 요청에서 `Origin` 헤더를 제거하므로,
순정 `ollama serve`에서도 동작합니다 — `OLLAMA_ORIGINS` 환경 변수도, 설정 파일도 필요 없습니다.

## 설정

확장 프로그램 아이콘 우클릭 → **옵션**:

- **백엔드** — **Chrome 내장 AI (Gemini Nano)**(기본값, 설치 불필요) 또는
  **로컬 서버**(직접 엔드포인트 제공). 검토 UI는 어느 쪽이든 동일합니다.
- **엔드포인트** *(로컬 서버 전용)* — OpenAI 호환 서버라면 무엇이든: Ollama, llama.cpp,
  LM Studio, vLLM, 또는 직접 보유한 API 키를 쓰는 클라우드 엔드포인트. 기본값
  `http://127.0.0.1:11434/v1`.
- **모델** *(로컬 서버 전용)* — 기본값 `llama3.2`. 더 큰 모델 = 더 나은 제안, 동일한 UI.
- **시스템 프롬프트** — 편집 지시문. 이를 다시 쓰면 inline-scribe는
  번역기, 어조 완화기, 또는 사무적 표현 제거기가 됩니다 — 검토 워크플로는 동일합니다.
- **선택 아이콘** — 텍스트를 선택할 때 나타나는 ✎ 아이콘을 끄려면 체크를 해제하세요
  (Alt+G와 우클릭 메뉴는 계속 동작합니다).
- **Harper 사전 처리** *(선택 사항, 기본 꺼짐)* — 체크하면 AI보다 *먼저*
  빠르고 규칙 기반이며 완전히 로컬인 문법 엔진 [Harper](https://writewithharper.com)를 실행합니다.
  Harper는 결정론적이고 기계적인 실수(대소문자, 문장 부호, 띄어쓰기, 주어-동사 일치, 중복 단어)를
  즉시 오프라인으로 고치고, 그다음 AI는 유창성과 단어 선택만 처리하면 됩니다. 어휘적 추측(맞춤법, 오타)은
  전체 맥락을 가진 AI에게 일부러 맡깁니다. Harper는 기기에서 WebAssembly로 실행되므로
  이 또한 100% 로컬로 유지됩니다. [작동 방식](#작동-방식)을 참조하세요.

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/options.png" alt="inline-scribe 옵션 페이지: 엔드포인트, 모델, 선택적 API 키, 시스템 프롬프트, 그리고 선택 아이콘 토글" width="70%">
</p>

## 개인정보 보호 모델

- **기본 백엔드**에서는 모델이 기기에서 실행됩니다(Chrome 내장 Gemini Nano):
  텍스트가 절대 기기를 벗어나지 않습니다. **로컬 서버** 백엔드에서는 당신이 설정한
  엔드포인트로만 가고 그 외 어디로도 가지 않습니다.
- 분석 도구도, 계정도, 텔레메트리도 없으며, 당신의 설정(`chrome.storage.sync`) 외에는
  아무것도 저장되지 않습니다.
- 유지보수자는 아무 비용도 내지 않고 아무것도 볼 수 없습니다 — 이 프로젝트에는 서버가 없습니다.

## 로드맵

- **Chrome 내장 Proofreader API**(Gemini Nano)를 일급 교정 기능을 갖춘 대안 온디바이스 백엔드로 —
  origin trial을 벗어나면 동일한 검토 UI 뒤에서 채택할 예정입니다.
  (오늘날 기본 온디바이스 경로는 정식 출시된 Prompt API입니다.)
- Firefox 포팅 (MV3 차이점)

## 개발

```sh
npm test            # 36 unit tests for the diff + checker + Harper pre-pass core (no LLM needed)
npm run typecheck
npm run build       # esbuild → dist/
```

diff 엔진과 checker 추상화는 `src/core/`에 있으며 브라우저 API를 전혀 임포트하지 않습니다 —
순수한 TypeScript이며 Vitest로 테스트됩니다. Chrome 전용 레이어
(`src/content`, `src/background`, `src/options`)가 그 위에 올라갑니다.

MIT.
