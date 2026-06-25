# inline-scribe

**Una extensión de Chrome que corrige lo que escribes en el navegador, usando una IA que se ejecuta en tu propio ordenador.** Pulsa **Alt+G** en cualquier campo de texto para obtener sugerencias y, después, acepta o rechaza cada corrección de forma individual. Tu texto nunca sale de tu máquina. De forma predeterminada usa la IA integrada de Chrome (Gemini Nano): no hay nada que instalar ni ningún servidor que ejecutar.

[**▶ Instalar desde Chrome Web Store**](https://chromewebstore.google.com/detail/inline-scribe/kmcgponcdfdpbmkahiolhnignkkpnkgm) · [English](../../README.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [한국어](README.ko.md) · **Español** · [Français](README.fr.md)

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/screenshot.png" alt="Un área de texto con erratas y, debajo, el panel de revisión de inline-scribe: eliminaciones tachadas en rojo, inserciones en verde, cada una con botones de aceptar/rechazar, revisadas por llama3.2 de forma local" width="100%">
</p>

## Cómo usarlo

### 1. Instala la extensión

**Opción A — Chrome Web Store (recomendada, sin herramientas de compilación):**
instálala desde la [ficha de Chrome Web Store](https://chromewebstore.google.com/detail/inline-scribe/kmcgponcdfdpbmkahiolhnignkkpnkgm).

**Opción B — desde el código fuente:**

```sh
git clone https://github.com/mk668a/inline-scribe && cd inline-scribe
npm install && npm run build
```

Abre `chrome://extensions` → activa el **Modo de desarrollador** (arriba a la derecha) → **Cargar descomprimida** → selecciona la carpeta `dist/` (o la carpeta de la versión descomprimida).

### 2. Elige dónde se ejecuta la IA (funciona sin configuración)

De forma predeterminada, inline-scribe usa la **IA integrada Gemini Nano de Chrome**: no hay nada que instalar ni ningún servidor que iniciar. La primera comprobación descarga el modelo una sola vez (Chrome 138+, ~22 GB de disco libre). Si tu dispositivo no puede ejecutarlo, el panel te lo indica y puedes cambiar de backend.

¿Prefieres un modelo más grande o personalizado? Abre las **Opciones** de la extensión, cambia el backend a **Servidor local** y apúntalo a cualquier endpoint compatible con OpenAI que ejecutes tú mismo:

```sh
brew install ollama          # or https://ollama.com/download
ollama pull llama3.2         # ~2GB, runs fine on 8GB RAM
ollama serve
```

En cualquier caso, el mantenedor no paga nada y no ve nada: tu texto se queda en tu máquina.

### 3. Escribe algo y luego pulsa Alt+G

Funciona en cualquier campo de texto del navegador: el cuerpo de un correo, un cuadro de comentarios de GitHub, un formulario de contacto. Escribe tu texto, mantén el cursor en el campo y pulsa **Alt+G**.

Otras dos formas de activar una comprobación, al estilo de Google Translate:

- **Selecciona texto** → aparece un pequeño **icono ✎** junto a la selección: haz clic en él.
- **Selecciona texto → clic derecho** → **Corregir selección — inline-scribe**.

Con una selección, solo se comprueba y se reemplaza la parte seleccionada: práctico para un único párrafo de un correo largo. Incluso funciona en texto que *no* puedes editar (por ejemplo, el borrador de otra persona en una wiki): la versión corregida se **copia en tu portapapeles** en lugar de escribirse de vuelta.

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/selection-icon.png" alt="Texto seleccionado en una página con el icono ✎ de inline-scribe flotando junto a la selección" width="100%">
</p>

### 4. Revisa cada sugerencia

Se abre un panel debajo del campo que muestra tu texto con las correcciones sugeridas marcadas en su sitio, igual que el Control de cambios de Word:

- texto a eliminar → ~~tachado en rojo~~
- texto a añadir → mostrado en verde

Para cada corrección, elige **✓** (aceptar) o **✕** (mantener tu redacción). O acéptalas todas a la vez con **Aceptar todo**.

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/review-panel.png" alt="El borrador de un correo con el panel de revisión de inline-scribe debajo: cuatro sugerencias de llama3.2, eliminaciones tachadas en rojo, inserciones en verde, botones ✓/✕ en cada una" width="100%">
</p>

### 5. Pulsa Aplicar

**Aplicar aceptadas** escribe de vuelta solo las correcciones que aceptaste. ¿Cambiaste de opinión? Pulsa **Esc**: tu texto permanece intacto, byte a byte.

### Chuleta

| acción | cómo |
|---|---|
| comprobar el campo enfocado | **Alt+G** (reasígnalo en `chrome://extensions/shortcuts`) |
| comprobar solo una selección | selecciónala y luego **Alt+G** / el **icono ✎** / clic derecho → **Corregir selección** |
| corregir texto de solo lectura | selecciónalo → icono ✎ — el texto corregido se copia en tu portapapeles |
| aceptar una sugerencia | botón **✓** en el bloque |
| mantener tu redacción original | botón **✕** en el bloque |
| aceptar todo | **Aceptar todo** |
| aplicar solo lo que aceptaste | **Aplicar aceptadas** (las sugerencias pendientes se descartan) |
| cancelar, dejar el texto intacto | **Esc** |

Funciona en `<textarea>`, `<input>` de texto y editores `contenteditable` (Gmail, editores tipo Notion: la escritura de vuelta pasa por el propio comando de inserción del editor, de modo que se preservan el formato circundante y la función de deshacer).

## ¿Por qué tiene que existir esto?

Hoy en día, todo el que escribe en un navegador elige una de tres malas opciones:

1. **Grammarly** — excelente experiencia de usuario, pero cada pulsación de tecla se sube a la nube de una empresa, las buenas funciones están detrás de una suscripción y muchos lugares de trabajo lo prohíben precisamente por eso (documentos legales, código sin publicar, datos de pacientes, cualquier cosa confidencial).
2. **Copiar y pegar en ChatGPT** — recibes de vuelta un único bloque grande reescrito. ¿Qué palabras cambió? ¿Alteró algo que querías decir? Vuelves a leerlo todo, cada vez, y tu texto igualmente acabó en el servidor de otra persona.
3. **Nada** — y publicas con las erratas.

Mientras tanto, el ingrediente que falta ya no es la IA. Cualquiera puede ejecutar un modelo competente de forma local con [Ollama](https://ollama.com) en dos comandos, gratis. Lo que falta es la **interfaz**: lo que hacía que Grammarly valiera la pena pagar nunca fue el motor gramatical, sino el *diff amigable* que te permite ver y controlar cada cambio.

Esa interfaz, sobre un modelo que es tuyo, es todo el producto:

| | correcciones | tu texto va a | diff en línea, aceptar/rechazar por corrección | precio |
|---|---|---|---|---|
| **Grammarly** | IA en la nube | sus servidores | ✅ (la razón por la que la gente paga) | $12+/mes |
| **Harper** (10k★) | local, basado en reglas | a ningún sitio ✅ | ❌ solo subraya erratas — no puede reescribir una frase torpe | gratis |
| **scramble / Typollama** | LLM local ✅ | a ningún sitio ✅ | ❌ reemplazo de todo el texto o ventana emergente | gratis |
| **inline-scribe** | LLM local ✅ | a ningún sitio ✅ | ✅ | gratis |

Harper no es realmente un rival aquí: es *complementario*, e inline-scribe puede usarlo directamente:
activa el [pre-pase de Harper](#configuracion) opcional y Harper se encarga de las correcciones instantáneas y
deterministas mientras el LLM local hace la reescritura que el motor basado en reglas no puede.
Ambas mitades se ejecutan en tu máquina.

## Cómo funciona

```
pulsas Alt+G en un campo de texto
        │
        ▼
tu texto va a una IA que se ejecuta en tu máquina  ← predeterminado: Gemini Nano
(Gemini Nano integrado, o un endpoint local            integrado de Chrome (sin instalar);
 compatible con OpenAI como Ollama si cambias)         o tu propio endpoint de Ollama
        │
        ▼
el modelo devuelve la prosa corregida — solo texto
        │
        ▼
inline-scribe calcula un diff a nivel de palabra     ← algoritmo determinista,
entre tu texto y la corrección                          NO la opinión del LLM
        │
        ▼
panel de revisión: aceptar ✓ / rechazar ✕ cada cambio → Aplicar escribe solo lo que aprobaste
```

De ese diagrama se derivan dos reglas de diseño:

- **El LLM nunca produce el diff.** Los modelos locales pequeños son excelentes corrigiendo
  prosa y pésimos produciendo salida estructurada. Por eso el modelo solo devuelve el texto
  corregido, y los bloques de Control de cambios los calcula un diff determinista a nivel de
  palabra dentro de la extensión. Un modelo 3B parlanchín no puede romper la interfaz.
- **Tu texto no se modifica hasta que aceptas.** Rechaza todo (o pulsa Esc) y
  el campo queda exactamente como lo dejaste.
- **El trabajo determinista va a un motor determinista (opcional).** Con el pre-pase de
  Harper activado, las correcciones mecánicas las hace el motor basado en reglas de Harper
  antes de que se ejecute el modelo, de modo que el LLM solo dedica esfuerzo a lo que
  realmente requiere criterio. El WASM de Harper se ejecuta en el dispositivo y solo se carga
  cuando activas el pre-pase.

Y un detalle práctico que le ahorra 20 minutos a cada nuevo usuario: Ollama de fábrica rechaza
las peticiones de las extensiones del navegador con `403 Forbidden` (comprobación de origen CORS). inline-scribe
elimina la cabecera `Origin` en las peticiones a tu endpoint mediante `declarativeNetRequest`,
de modo que funciona con un `ollama serve` puro: sin la variable de entorno `OLLAMA_ORIGINS`,
sin archivo de configuración.

## Configuración

Haz clic derecho en el icono de la extensión → **Opciones**:

- **Backend** — **IA integrada de Chrome (Gemini Nano)** (predeterminado, nada que instalar) o
  **Servidor local** (trae tu propio endpoint). La interfaz de revisión es idéntica en ambos casos.
- **Endpoint** *(solo Servidor local)* — cualquier servidor compatible con OpenAI: Ollama, llama.cpp,
  LM Studio, vLLM o un endpoint en la nube con tu propia clave de API. Predeterminado
  `http://127.0.0.1:11434/v1`.
- **Modelo** *(solo Servidor local)* — predeterminado `llama3.2`. Un modelo más grande = mejores sugerencias, la misma interfaz.
- **Prompt del sistema** — la instrucción de edición. Reescríbela e inline-scribe se convierte en un
  traductor, un suavizador de tono o un de-corporativizador: el mismo flujo de revisión.
- **Icono de selección** — desmárcalo para desactivar el icono ✎ que aparece cuando seleccionas texto
  (Alt+G y el menú del clic derecho siguen funcionando).
- **Pre-pase de Harper** *(opcional, desactivado de forma predeterminada)* — márcalo para ejecutar
  [Harper](https://writewithharper.com), un motor gramatical rápido, basado en reglas y totalmente local,
  *antes* de la IA. Harper corrige los errores deterministas y mecánicos (mayúsculas,
  puntuación, espaciado, concordancia entre sujeto y verbo, palabras repetidas) al instante y sin conexión; la
  IA solo tiene que ocuparse entonces de la fluidez y la elección de palabras. Las conjeturas léxicas (ortografía, erratas) se
  dejan deliberadamente a la IA, que dispone del contexto completo. Harper se ejecuta como
  WebAssembly en el dispositivo, así que esto también sigue siendo 100% local. Consulta [Cómo funciona](#como-funciona).

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/options.png" alt="Página de opciones de inline-scribe: endpoint, modelo, clave de API opcional, prompt del sistema y el interruptor del icono de selección" width="70%">
</p>

## Modelo de privacidad

- Con el **backend predeterminado**, el modelo se ejecuta en el dispositivo (la Gemini Nano integrada de Chrome):
  tu texto nunca sale de tu máquina. Con el backend **Servidor local**, va al
  endpoint que configuraste y a ningún otro sitio.
- Sin analíticas, sin cuentas, sin telemetría, nada almacenado salvo tus ajustes
  (`chrome.storage.sync`).
- El mantenedor no paga por nada y no puede ver nada: este proyecto no tiene servidor.

## Hoja de ruta

- **API integrada de Proofreader de Chrome** (Gemini Nano) como backend alternativo en el dispositivo
  con correcciones de primera clase, adoptada bajo la misma interfaz de revisión una vez salga del periodo de
  prueba (origin trial). (La ruta predeterminada en el dispositivo hoy es la Prompt API en disponibilidad general.)
- Port a Firefox (diferencias de MV3)

## Desarrollo

```sh
npm test            # 36 unit tests for the diff + checker + Harper pre-pass core (no LLM needed)
npm run typecheck
npm run build       # esbuild → dist/
```

El motor de diff y la abstracción del corrector viven en `src/core/` y no importan ninguna API de navegador:
son TypeScript puro, probado con Vitest. Las capas específicas de Chrome
(`src/content`, `src/background`, `src/options`) se asientan encima.

MIT.
