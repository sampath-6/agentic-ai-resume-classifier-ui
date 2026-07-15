import {
  PageHeader,
  Section,
  Card,
  Callout,
  Code,
  CodeBlock,
  KeyValueTable,
} from './primitives'

export function FrontendPage() {
  return (
    <>
      <PageHeader
        title="Frontend Technology"
        subtitle="A Vite + React + TypeScript single-page app styled with Tailwind CSS, laid out like a general AI-chat interface with a multi-session sidebar. All server communication goes through one axios client that attaches the JWT and centralizes error handling."
      />

      <Section title="Stack">
        <KeyValueTable
          rows={[
            ['Build tool', <>Vite (dev server on <Code>:5173</Code>, HMR)</>],
            ['Framework', <>React 19 + TypeScript</>],
            ['Styling', <>Tailwind CSS v4 via the <Code>@tailwindcss/vite</Code> plugin — blue theme</>],
            ['HTTP client', <>axios — a single configured instance</>],
            ['Markdown', <>react-markdown — renders the synthesized answer in chat bubbles</>],
            ['Icons', <>lucide-react</>],
            ['IDs', <>uuid — client-side session IDs</>],
          ]}
        />
      </Section>

      <Section title="App structure">
        <p>
          Two React contexts hold all cross-cutting state, each backed by <Code>localStorage</Code> so a
          refresh preserves the session:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="font-semibold text-blue-900">AuthContext</p>
            <p className="mt-1 text-xs text-slate-600">
              Holds the logged-in email + JWT. Persists <Code>{'{ token, email }'}</Code> to localStorage,
              restores it on load, and exposes <Code>login()</Code> / <Code>logout()</Code>. An
              <Code>AuthGate</Code> shows the login screen until a token exists.
            </p>
          </Card>
          <Card>
            <p className="font-semibold text-blue-900">SessionsContext</p>
            <p className="mt-1 text-xs text-slate-600">
              Manages the sidebar sessions. The <Code>Upload Resumes</Code> session is pinned first; chat
              sessions are user-created, persisted, and each keep their own message history.
            </p>
          </Card>
        </div>
        <Callout title="Multi-session model" tone="blue">
          The sidebar mimics a general AI-chat app: a pinned <strong>Upload Resumes</strong> session (with a
          searchable resume table + upload button) plus any number of <strong>query chat</strong> sessions,
          each an independent conversation. An <strong>Architecture</strong> entry opens this documentation.
        </Callout>
      </Section>

      <Section title="The API client">
        <p>
          One axios instance is created with a base URL from an env variable. A helper sets the{' '}
          <Code>Authorization: Bearer</Code> header as a default, so every subsequent request is
          authenticated. A response interceptor watches for <Code>401</Code> and triggers logout.
        </p>
        <CodeBlock
          caption="src/api/client.ts"
          code={`const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api'
export const apiClient = axios.create({ baseURL: API_BASE_URL })

export function setAuthToken(token: string | null) {
  if (token) apiClient.defaults.headers.common.Authorization = \`Bearer \${token}\`
  else delete apiClient.defaults.headers.common.Authorization
}

// auto-logout when a token is rejected mid-session
apiClient.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) onUnauthorized?.()
    return Promise.reject(err)
  },
)`}
        />
        <Callout title="Configuration via env" tone="blue">
          The frontend reads <Code>VITE_API_BASE_URL</Code> from its own <Code>.env</Code> (Vite exposes
          only <Code>VITE_</Code>-prefixed vars to the browser). This decouples the UI from a hardcoded
          backend host.
        </Callout>
      </Section>

      <Section title="How each REST endpoint is called">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-900">
              <tr>
                <th className="px-3 py-2 font-medium">Action</th>
                <th className="px-3 py-2 font-medium">Call</th>
                <th className="px-3 py-2 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="px-3 py-2 font-medium text-slate-700">Login</td>
                <td className="px-3 py-2 font-mono text-blue-800">apiClient.post('/auth/login', {'{ email }'})</td>
                <td className="px-3 py-2 text-slate-600">JSON body; stores returned token</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-700">List resumes</td>
                <td className="px-3 py-2 font-mono text-blue-800">apiClient.get('/resumes')</td>
                <td className="px-3 py-2 text-slate-600">Feeds the searchable table</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-700">Upload</td>
                <td className="px-3 py-2 font-mono text-blue-800">apiClient.post('/upload', formData)</td>
                <td className="px-3 py-2 text-slate-600">multipart/form-data; multiple files</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-700">Query</td>
                <td className="px-3 py-2 font-mono text-blue-800">apiClient.post('/query', formData)</td>
                <td className="px-3 py-2 text-slate-600">Returns answer + matches</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-700">Download</td>
                <td className="px-3 py-2 font-mono text-blue-800">apiClient.get('/resumes/{'{id}'}/download', {'{ responseType: "blob" }'})</td>
                <td className="px-3 py-2 text-slate-600">Blob → object URL → anchor click</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="How responses are handled">
        <p>
          axios resolves with a <Code>.data</Code> payload on success. Three handling patterns cover the app:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Success data</strong> is dropped straight into React state (e.g. the resume list, or a
            new assistant message with its <Code>matches</Code> table).
          </li>
          <li>
            <strong>Errors</strong> are normalized by <Code>extractErrorMessage</Code>, which reads FastAPI’s{' '}
            <Code>response.data.detail</Code>. A guardrail block (HTTP 400) becomes a distinct “blocked”
            chat bubble; a <Code>401</Code> triggers logout via the interceptor.
          </li>
          <li>
            <strong>File downloads</strong> request a <Code>blob</Code>, read the filename from the{' '}
            <Code>Content-Disposition</Code> header, then create an object URL and programmatically click a
            hidden anchor to save the original resume.
          </li>
        </ul>
        <CodeBlock
          caption="src/api/download.ts (blob download)"
          code={`const response = await apiClient.get(\`/resumes/\${resumeId}/download\`,
                                     { responseType: 'blob' })
const filename = parseFilename(response.headers['content-disposition'], displayName)
const url = window.URL.createObjectURL(response.data)
const link = document.createElement('a')
link.href = url; link.download = filename
link.click(); link.remove()
window.URL.revokeObjectURL(url)`}
        />
        <Callout title="Match score in the table" tone="blue">
          Each match’s cosine <Code>distance</Code> is converted to a friendly percentage in the UI with{' '}
          <Code>(1 − distance / 2) × 100</Code>, so identical vectors read as 100% and opposite as 0%.
        </Callout>
      </Section>
    </>
  )
}
