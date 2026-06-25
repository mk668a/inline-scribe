# inline-scribe

**Une extension Chrome qui relit ce que vous écrivez dans le navigateur, à l'aide d'une IA qui s'exécute sur votre propre ordinateur.** Appuyez sur **Alt+G** dans n'importe quel champ de texte pour obtenir des suggestions, puis acceptez ou rejetez chaque correction individuellement. Votre texte ne quitte jamais votre machine. Par défaut, elle utilise l'IA intégrée à Chrome (Gemini Nano) — rien à installer, aucun serveur à faire tourner.

[**▶ Installer depuis le Chrome Web Store**](https://chromewebstore.google.com/detail/inline-scribe/kmcgponcdfdpbmkahiolhnignkkpnkgm) · [English](../../README.md) · [日本語](README.ja.md) · [简体中文](README.zh-CN.md) · [한국어](README.ko.md) · [Español](README.es.md) · **Français**

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/screenshot.png" alt="Une zone de texte contenant des fautes de frappe, et en dessous le panneau de relecture d'inline-scribe : suppressions barrées en rouge, insertions en vert, chacune avec des boutons accepter/rejeter, vérifiées par llama3.2 en local" width="100%">
</p>

## Comment l'utiliser

### 1. Installer l'extension

**Option A — Chrome Web Store (recommandé, aucun outil de build nécessaire) :**
installez depuis la [fiche du Chrome Web Store](https://chromewebstore.google.com/detail/inline-scribe/kmcgponcdfdpbmkahiolhnignkkpnkgm).

**Option B — depuis les sources :**

```sh
git clone https://github.com/mk668a/inline-scribe && cd inline-scribe
npm install && npm run build
```

Ouvrez `chrome://extensions` → activez le **mode développeur** (en haut à droite) → **Charger l'extension non empaquetée** → sélectionnez le dossier `dist/` (ou le dossier de la version décompressée).

### 2. Choisir où l'IA s'exécute (cela fonctionne d'emblée)

Par défaut, inline-scribe utilise **Gemini Nano intégré à Chrome** — il n'y a rien à
installer et aucun serveur à démarrer. La première vérification télécharge le modèle une
seule fois (Chrome 138+, ~22 Go d'espace disque libre). Si votre appareil ne peut pas
l'exécuter, le panneau vous le signale et vous pouvez changer de backend.

Vous préférez un modèle plus grand ou personnalisé ? Ouvrez les **Options** de l'extension,
basculez le backend sur **Serveur local**, et pointez-le vers n'importe quel point de
terminaison compatible OpenAI que vous faites tourner vous-même :

```sh
brew install ollama          # or https://ollama.com/download
ollama pull llama3.2         # ~2GB, runs fine on 8GB RAM
ollama serve
```

Dans les deux cas, le mainteneur ne paie rien et ne voit rien — votre texte reste sur votre machine.

### 3. Écrivez quelque chose, puis appuyez sur Alt+G

Fonctionne dans n'importe quel champ de texte du navigateur — un corps d'e-mail, une zone de commentaire GitHub, un formulaire de contact. Rédigez votre texte, gardez le curseur dans le champ, et appuyez sur **Alt+G**.

Deux autres façons de déclencher une vérification, à la manière de Google Traduction :

- **Sélectionnez du texte** → une petite **icône ✎** apparaît à côté de la sélection — cliquez dessus.
- **Sélectionnez du texte → clic droit** → **Relire la sélection — inline-scribe**.

Avec une sélection, seule la partie sélectionnée est vérifiée et remplacée — pratique pour un paragraphe d'un long e-mail. Cela fonctionne même sur du texte que vous *ne pouvez pas* modifier (le brouillon de quelqu'un d'autre sur un wiki, par exemple) : la version corrigée est **copiée dans votre presse-papiers** au lieu d'être réécrite.

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/selection-icon.png" alt="Du texte sélectionné sur une page avec l'icône ✎ d'inline-scribe flottant à côté de la sélection" width="100%">
</p>

### 4. Examiner chaque suggestion

Un panneau s'ouvre sous le champ et affiche votre texte avec les corrections suggérées marquées en place, à la manière du suivi des modifications de Word :

- texte à supprimer → ~~barré en rouge~~
- texte à ajouter → affiché en vert

Pour chaque correction, choisissez **✓** (accepter) ou **✕** (conserver votre formulation). Ou prenez tout d'un coup avec **Tout accepter**.

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/review-panel.png" alt="Un brouillon d'e-mail avec le panneau de relecture d'inline-scribe en dessous : quatre suggestions de llama3.2, suppressions barrées en rouge, insertions en vert, boutons ✓/✕ sur chacune" width="100%">
</p>

### 5. Appuyez sur Appliquer

**Appliquer les acceptées** réécrit uniquement les corrections que vous avez acceptées. Vous avez changé d'avis ? Appuyez sur **Esc** — votre texte reste intact, octet pour octet.

### Aide-mémoire

| action | comment |
|---|---|
| vérifier le champ actif | **Alt+G** (réassignable dans `chrome://extensions/shortcuts`) |
| vérifier uniquement une sélection | sélectionnez-la, puis **Alt+G** / l'**icône ✎** / clic droit → **Relire la sélection** |
| relire du texte en lecture seule | sélectionnez-le → icône ✎ — le texte corrigé est copié dans votre presse-papiers |
| accepter une suggestion | bouton **✓** sur le segment |
| conserver votre formulation d'origine | bouton **✕** sur le segment |
| tout accepter | **Tout accepter** |
| appliquer uniquement ce que vous avez accepté | **Appliquer les acceptées** (les suggestions en attente sont abandonnées) |
| annuler, laisser le texte intact | **Esc** |

Fonctionne dans les `<textarea>`, les `<input>` de type texte, et les éditeurs `contenteditable` (Gmail, éditeurs de style Notion — la réécriture passe par la commande d'insertion propre à l'éditeur, ce qui préserve la mise en forme environnante et l'annulation).

## Pourquoi cela doit-il exister ?

Toute personne qui écrit dans un navigateur aujourd'hui choisit l'une de trois mauvaises options :

1. **Grammarly** — excellente expérience utilisateur, mais chaque frappe est téléversée vers le cloud d'une entreprise, les bonnes fonctionnalités sont derrière un abonnement, et de nombreux lieux de travail l'interdisent précisément pour cette raison (documents juridiques, code non publié, données de patients, tout ce qui est confidentiel).
2. **Copier-coller dans ChatGPT** — vous récupérez un gros bloc réécrit. Quels mots a-t-il changés ? A-t-il modifié quelque chose que vous vouliez dire ? Vous relisez tout, à chaque fois, et votre texte est tout de même parti sur le serveur de quelqu'un d'autre.
3. **Rien** — et vous publiez avec les fautes.

Pendant ce temps, l'ingrédient manquant n'est plus l'IA. N'importe qui peut faire tourner un modèle performant en local avec [Ollama](https://ollama.com) en deux commandes, gratuitement. Ce qui manque, c'est l'**interface** : ce qui rendait Grammarly digne d'être payé n'a jamais été le moteur grammatical — c'était le *diff convivial* qui vous laisse voir et contrôler chaque changement.

Cette interface, posée sur un modèle qui vous appartient, c'est tout le produit :

| | corrections | votre texte va vers | diff en ligne, accepter/rejeter par correction | prix |
|---|---|---|---|---|
| **Grammarly** | IA dans le cloud | leurs serveurs | ✅ (la raison pour laquelle les gens paient) | 12 $+/mois |
| **Harper** (10k★) | local, basé sur des règles | nulle part ✅ | ❌ souligne uniquement les fautes de frappe — ne peut pas réécrire une phrase maladroite | gratuit |
| **scramble / Typollama** | LLM local ✅ | nulle part ✅ | ❌ remplacement du texte entier ou popup | gratuit |
| **inline-scribe** | LLM local ✅ | nulle part ✅ | ✅ | gratuit |

Harper n'est pas vraiment un rival ici — il est *complémentaire*, et inline-scribe peut l'utiliser directement :
activez la [pré-passe Harper](#configuration) optionnelle et Harper s'occupe des corrections
instantanées et déterministes pendant que le LLM local effectue la réécriture que le moteur
basé sur des règles ne peut pas faire. Les deux moitiés s'exécutent sur votre machine.

## Comment ça marche

```
vous appuyez sur Alt+G dans un champ de texte
        │
        ▼
votre texte va vers une IA qui s'exécute sur votre machine  ← par défaut : Gemini Nano
(Gemini Nano intégré, ou un point de terminaison local         intégré à Chrome (sans
 compatible OpenAI comme Ollama si vous changez de backend)    installation) ; ou votre
        │                                                       propre point Ollama
        ▼
le modèle renvoie une prose corrigée — juste du texte
        │
        ▼
inline-scribe calcule un diff au niveau des mots           ← algorithme déterministe,
entre votre texte et la correction                            PAS l'avis du LLM
        │
        ▼
panneau de relecture : accepter ✓ / rejeter ✕ chaque changement → Appliquer ne réécrit que ce que vous avez approuvé
```

Deux règles de conception découlent de ce schéma :

- **Le LLM ne produit jamais le diff.** Les petits modèles locaux sont excellents pour
  corriger la prose et nuls pour produire une sortie structurée. Le modèle ne renvoie donc
  que du texte corrigé, et les segments du suivi des modifications sont calculés par un diff
  déterministe au niveau des mots dans l'extension. Un modèle 3B bavard ne peut pas casser
  l'interface.
- **Votre texte n'est jamais modifié tant que vous n'acceptez pas.** Rejetez tout (ou
  appuyez sur Esc) et le champ reste exactement tel que vous l'avez laissé.
- **Le travail déterministe va à un moteur déterministe (optionnel).** Avec la pré-passe
  Harper activée, les corrections mécaniques sont effectuées par le moteur basé sur des
  règles de Harper avant que le modèle ne tourne, de sorte que le LLM ne dépense d'effort
  que sur ce qui nécessite réellement du jugement. Le WASM de Harper s'exécute sur l'appareil
  et n'est chargé que lorsque vous activez la pré-passe.

Et un détail pratique qui fait gagner 20 minutes à chaque nouvel utilisateur : Ollama tel
quel rejette les requêtes des extensions de navigateur avec un `403 Forbidden` (vérification
d'origine CORS). inline-scribe supprime l'en-tête `Origin` des requêtes vers votre point de
terminaison via `declarativeNetRequest`, de sorte que cela fonctionne avec un `ollama serve`
ordinaire — pas de variable d'environnement `OLLAMA_ORIGINS`, pas de fichier de configuration.

## Configuration

Cliquez avec le bouton droit sur l'icône de l'extension → **Options** :

- **Backend** — **IA intégrée à Chrome (Gemini Nano)** (par défaut, rien à installer) ou
  **Serveur local** (apportez votre propre point de terminaison). L'interface de relecture
  est identique dans les deux cas.
- **Point de terminaison** *(Serveur local uniquement)* — n'importe quel serveur compatible
  OpenAI : Ollama, llama.cpp, LM Studio, vLLM, ou un point de terminaison cloud avec votre
  propre clé API. Par défaut `http://127.0.0.1:11434/v1`.
- **Modèle** *(Serveur local uniquement)* — par défaut `llama3.2`. Un modèle plus grand = de meilleures suggestions, même interface.
- **Invite système** — l'instruction d'édition. Réécrivez-la et inline-scribe devient un
  traducteur, un adoucisseur de ton, ou un dé-corporatiseur — même flux de relecture.
- **Icône de sélection** — décochez pour désactiver l'icône ✎ qui apparaît lorsque vous
  sélectionnez du texte (Alt+G et le menu du clic droit continuent de fonctionner).
- **Pré-passe Harper** *(optionnelle, désactivée par défaut)* — cochez-la pour exécuter
  [Harper](https://writewithharper.com), un moteur grammatical rapide, basé sur des règles
  et entièrement local, *avant* l'IA. Harper corrige instantanément et hors ligne les fautes
  déterministes et mécaniques (majuscules, ponctuation, espacement, accord sujet-verbe, mots
  répétés) ; l'IA n'a alors plus qu'à gérer la fluidité et le choix des mots. Les suppositions
  lexicales (orthographe, fautes de frappe) sont délibérément laissées à l'IA, qui dispose du
  contexte complet. Harper s'exécute en tant que WebAssembly sur l'appareil, donc cela reste
  100 % local également. Voir [Comment ça marche](#comment-ça-marche).

<p align="center">
  <img src="https://raw.githubusercontent.com/mk668a/inline-scribe/main/docs/options.png" alt="Page d'options d'inline-scribe : point de terminaison, modèle, clé API optionnelle, invite système, et le commutateur de l'icône de sélection" width="70%">
</p>

## Modèle de confidentialité

- Avec le **backend par défaut**, le modèle s'exécute sur l'appareil (Gemini Nano intégré à
  Chrome) : votre texte ne quitte jamais votre machine. Avec le backend **Serveur local**, il
  va vers le point de terminaison que vous avez configuré et nulle part ailleurs.
- Aucune analytique, aucun compte, aucune télémétrie, rien de stocké à part vos paramètres
  (`chrome.storage.sync`).
- Le mainteneur ne paie rien et ne peut rien voir — ce projet n'a aucun serveur.

## Feuille de route

- **L'API Proofreader intégrée à Chrome** (Gemini Nano) comme backend alternatif sur
  l'appareil avec des corrections de première classe — adoptée derrière la même interface de
  relecture une fois sortie de l'origin trial. (Le chemin sur l'appareil par défaut aujourd'hui
  est l'API Prompt en disponibilité générale.)
- Portage Firefox (différences MV3)

## Développement

```sh
npm test            # 36 unit tests for the diff + checker + Harper pre-pass core (no LLM needed)
npm run typecheck
npm run build       # esbuild → dist/
```

Le moteur de diff et l'abstraction du checker se trouvent dans `src/core/` et n'importent
aucune API de navigateur — ce sont du TypeScript pur, testé avec Vitest. Les couches
spécifiques à Chrome (`src/content`, `src/background`, `src/options`) reposent par-dessus.

MIT.
