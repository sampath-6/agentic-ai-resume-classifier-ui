# Resume Classifier — Frontend (React + Vite + Tailwind)

A blue-themed, AI-chat-style UI for the [Resume Classifier backend](../resume-classifier).
Log in, upload resumes, query candidates in a chat session, download the original files —
plus a built-in **Architecture documentation** section that teaches the whole system
(agents, LangGraph, semantic search, REST API) using this app as the example.

---

## Features

- **JWT login** — a single-email allowlist screen; the token is attached to every API call
  and persisted in `localStorage`.
- **Multi-session sidebar** — a pinned **Upload Resumes** session plus any number of
  **query chat** sessions, mimicking a general AI-chat app.
- **Upload session** — a searchable/sortable table of indexed candidates (clickable names
  download the original file) with a multi-file select + upload control.
- **Query chat** — type a search, get a synthesized ranked answer (rendered Markdown) and a
  matches table with per-candidate download links and match scores.
- **Architecture docs** — six collapsible reference tabs: Design Journey, Architecture &
  Flow, LangGraph & Stack, Semantic Query, REST API (Swagger-style), and Frontend — with
  code snippets and SVG diagrams.
- **Static export** — build the entire app into one self-contained HTML file for offline
  viewing / GitHub (see below).

---

## Tech stack

| Concern      | Choice                                             |
| ------------ | -------------------------------------------------- |
| Build tool   | Vite                                               |
| Framework    | React 19 + TypeScript                              |
| Styling      | Tailwind CSS v4 (`@tailwindcss/vite`) — blue theme |
| HTTP         | axios (one configured client + JWT interceptor)    |
| Markdown     | react-markdown (renders the synthesized answer)    |
| Icons        | lucide-react                                       |
| Static build | vite-plugin-singlefile                             |

---

## Prerequisites

- **Node.js 18+** (Node 24 used in development)
- The **backend running** on `http://localhost:8000` for live features (see
  `../resume-classifier`).

---

## Setup & run (development)

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. Log in with the email configured as `ALLOWED_EMAIL` in the
backend's `.env` (default: `retrieve-agent-test@gmail.com`); any other email is rejected
with "User is not authorized".

### Configuration

The API base URL defaults to `http://localhost:8000/api`. To point elsewhere, create a
`.env` file:

```ini
VITE_API_BASE_URL=http://localhost:8000/api
```

(Only `VITE_`-prefixed variables are exposed to the browser.)

---

## Scripts

| Script                 | What it does                                                        |
| ---------------------- | ------------------------------------------------------------------ |
| `npm run dev`          | Start the Vite dev server on :5173                                 |
| `npm run build`        | Type-check (`tsc -b`) and build the app to `dist/`                 |
| `npm run build:static` | Bundle the whole app into a single self-contained `static-site/index.html` |
| `npm run lint`         | Run oxlint                                                          |
| `npm run preview`      | Preview a production `dist/` build                                  |

---

## Static / offline build (for Git, no server)

`npm run build:static` produces **one self-contained file** —
`static-site/index.html` (~520 KB, all JS/CSS inlined, no external references). It renders
the full app layout and the complete documentation with **no dev server and no build step
for the viewer**.

```bash
npm run build:static
# → static-site/index.html
```

- **Open locally**: double-click the file, or serve the folder with any static host.
- **GitHub Pages**: commit `static-site/` and point Pages at it — it serves `index.html`.

The **documentation is fully functional offline**. **Live features** (upload / query /
download) still call the backend at `http://localhost:8000`; without it they show a benign
"could not load" state — expected for a static export.

> How it works: `src/static-main.tsx` renders the real `App.tsx` but pre-seeds a placeholder
> auth session in `localStorage`, so the static file lands on the app layout instead of the
> login screen. The build is driven by `vite.static.config.ts` (`app.html` entry +
> `vite-plugin-singlefile`). The dev app and its source are unchanged.

---

## Project structure

```
src/
├── main.tsx                 # dev entry (renders <App/> with the login gate)
├── static-main.tsx          # static/offline entry (pre-seeds auth, renders <App/>)
├── App.tsx                  # AuthGate + MainShell (sidebar + active session/docs)
├── index.css                # Tailwind + theme + markdown-answer styles
├── api/
│   ├── client.ts            # axios instance, Bearer header, 401 → logout
│   ├── download.ts          # blob download by resume_id
│   └── types.ts             # shared response types
├── auth/
│   ├── AuthContext.tsx      # login/logout, token persistence
│   └── Login.tsx            # sign-in screen
├── sessions/
│   ├── SessionsContext.tsx  # multi-session state (localStorage)
│   ├── UploadSession.tsx    # searchable table + upload
│   └── ChatSession.tsx      # query chat bubbles + matches table
├── components/
│   ├── Sidebar.tsx          # sessions + Architecture nav + sign out
│   └── ResumeTable.tsx      # sortable/searchable candidate table
└── docs/                    # the Architecture documentation section
    ├── Docs.tsx             # tab shell + Expand/Collapse-all
    ├── primitives.tsx       # Section (collapsible), Card, CodeBlock, Flow, …
    ├── DesignJourneyPage.tsx
    ├── ArchitecturePage.tsx
    ├── LangGraphPage.tsx
    ├── SemanticQueryPage.tsx
    ├── EndpointsPage.tsx     # Swagger-style REST reference
    └── FrontendPage.tsx
```

---

## How the frontend talks to the backend

- One axios instance (`src/api/client.ts`) with `baseURL` from `VITE_API_BASE_URL`.
- On login, the JWT is set as a default `Authorization: Bearer` header; a response
  interceptor logs out on `401`.
- Endpoints used: `POST /auth/login`, `GET /resumes`, `POST /upload` (multipart),
  `POST /query` (form-data), `GET /resumes/{id}/download` (blob).
- Errors are normalized via `extractErrorMessage` (reads FastAPI's `detail`); a guardrail
  block (`400`) surfaces as an inline blocked message in the chat.

See the in-app **REST API** and **Frontend** documentation tabs for full details.
