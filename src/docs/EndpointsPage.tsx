import { Lock, Unlock } from 'lucide-react'
import { PageHeader, Section, Callout, Code, CodeBlock } from './primitives'

type Method = 'GET' | 'POST'

const METHOD_STYLE: Record<Method, string> = {
  GET: 'bg-emerald-600',
  POST: 'bg-blue-600',
}

function MethodBadge({ method }: { method: Method }) {
  return (
    <span className={`rounded px-2 py-0.5 font-mono text-xs font-bold tracking-wide text-white ${METHOD_STYLE[method]}`}>
      {method}
    </span>
  )
}

function PathBadge({ method, path, auth }: { method: Method; path: string; auth: boolean }) {
  return (
    <span className="flex items-center gap-2">
      <MethodBadge method={method} />
      <code className="font-mono text-sm text-slate-800">{path}</code>
      {auth ? (
        <Lock size={13} className="text-amber-600" aria-label="requires auth" />
      ) : (
        <Unlock size={13} className="text-slate-400" aria-label="public" />
      )}
    </span>
  )
}

function ParamsTable({ rows }: { rows: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-900">
          <tr>
            <th className="px-3 py-2 font-medium">Name</th>
            <th className="px-3 py-2 font-medium">In</th>
            <th className="px-3 py-2 font-medium">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-xs">
          {rows.map(([name, where, desc], i) => (
            <tr key={i}>
              <td className="px-3 py-2 font-mono text-blue-800">{name}</td>
              <td className="px-3 py-2 text-slate-500">{where}</td>
              <td className="px-3 py-2 text-slate-600">{desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EndpointsPage() {
  return (
    <>
      <PageHeader
        title="REST API Reference"
        subtitle="Every HTTP endpoint the FastAPI backend exposes, Swagger-style. All routes are under the /api prefix except the health check. A lock 🔒 means a valid Bearer JWT is required; only the login and health routes are public."
      />

      <Callout title="Authentication" tone="blue">
        Obtain a token from <Code>POST /api/auth/login</Code>, then send it on every other call as{' '}
        <Code>Authorization: Bearer &lt;token&gt;</Code>. The token is an HS256 JWT whose subject is the
        allowed email; it expires after <Code>JWT_EXPIRY_MINUTES</Code> (default 24h). A missing or invalid
        token returns <Code>401</Code>; a valid token for a non-allowed email never issues in the first
        place (login returns <Code>403</Code>).
      </Callout>

      <p className="mb-2 text-xs text-slate-500">
        Interactive Swagger UI is also served live by FastAPI at{' '}
        <Code>http://localhost:8000/docs</Code> (and ReDoc at <Code>/redoc</Code>).
      </p>

      <Section
        title="Sign in"
        titleBadge={<MethodBadge method="POST" />}
        summary="POST /api/auth/login — public — issues a JWT for the allowed email, else 403."
      >
        <PathBadge method="POST" path="/api/auth/login" auth={false} />
        <p>Exchanges an email for a JWT. The only public data route.</p>
        <p className="font-medium text-slate-800">Request body (JSON)</p>
        <ParamsTable rows={[['email', 'body', 'The email to authenticate. Must equal ALLOWED_EMAIL.']]} />
        <CodeBlock
          caption="200 OK"
          code={`{ "token": "eyJhbGciOiJIUzI1NiI...", "token_type": "bearer" }`}
        />
        <CodeBlock caption="403 Forbidden (email not allowed)" code={`{ "detail": "User is not authorized" }`} />
      </Section>

      <Section
        title="List indexed resumes"
        titleBadge={<MethodBadge method="GET" />}
        summary="GET /api/resumes — 🔒 — all indexed candidates for the searchable table."
      >
        <PathBadge method="GET" path="/api/resumes" auth={true} />
        <p>Returns every indexed candidate. Powers the Upload session’s searchable table.</p>
        <CodeBlock
          caption="200 OK"
          code={`{
  "resumes": [
    {
      "resume_id": "bc6bb2af-…",
      "display_name": "John Doe",
      "seniority": "senior",
      "primary_role": "Java Microservices Developer",
      "skills": "Java, Spring, Kafka, Microservices, …",
      "years_experience": 14.0,
      "download_url": "/api/resumes/bc6bb2af-…/download"
    }
  ]
}`}
        />
      </Section>

      <Section
        title="Upload resumes"
        titleBadge={<MethodBadge method="POST" />}
        summary="POST /api/upload — 🔒 — multipart files; saves to inbox then drains the whole inbox through the graph."
      >
        <PathBadge method="POST" path="/api/upload" auth={true} />
        <p>
          Accepts one or more files (<Code>.pdf</Code>, <Code>.docx</Code>, <Code>.txt</Code>), saves them
          into the inbox, then synchronously runs the folder-drain graph over the <em>entire</em> inbox
          before responding.
        </p>
        <p className="font-medium text-slate-800">Request (multipart/form-data)</p>
        <ParamsTable rows={[['files', 'form-data', 'One or more resume files. Others in the inbox are drained too.']]} />
        <CodeBlock
          caption="200 OK"
          code={`{
  "thread_id": "a0a3…",
  "uploaded": ["Sam_Kumar_14.txt"],
  "indexed":  ["2cbd1d25-…", "bc6bb2af-…"],   // resume_ids classified this run
  "rejected": [],                              // > 2 MB
  "failed":   []                               // parse failures
}`}
        />
      </Section>

      <Section
        title="Query resumes"
        titleBadge={<MethodBadge method="POST" />}
        summary="POST /api/query — 🔒 — guardrail → vector search → synthesis; returns answer + matches."
      >
        <PathBadge method="POST" path="/api/query" auth={true} />
        <p>
          Runs the query branch: guardrail screen → Chroma vector search (top 20) → Claude synthesis of the
          top 3–5. A guardrail block returns <Code>400</Code> with the reason.
        </p>
        <p className="font-medium text-slate-800">Request (form-data)</p>
        <ParamsTable
          rows={[
            ['query', 'form-data', 'The recruiter’s search text.'],
            ['seniority', 'form-data', 'Optional metadata filter (e.g. "senior").'],
          ]}
        />
        <CodeBlock
          caption="200 OK"
          code={`{
  "answer": "Ranked prose summary of the top matches…",
  "matches": [
    {
      "resume_id": "bc6bb2af-…",
      "display_name": "John Doe",
      "seniority": "senior",
      "primary_role": "Java Microservices Developer",
      "skills": "Java, Spring, Kafka, …",
      "years_experience": 14.0,
      "download_url": "/api/resumes/bc6bb2af-…/download",
      "distance": 0.958
    }
    // … up to 20
  ]
}`}
        />
        <CodeBlock
          caption="400 Bad Request (guardrail block)"
          code={`{ "detail": "The query explicitly requests filtering candidates by age and gender, which constitutes discriminatory search intent." }`}
        />
      </Section>

      <Section
        title="Download a resume"
        titleBadge={<MethodBadge method="GET" />}
        summary="GET /api/resumes/{resume_id}/download — 🔒 — streams the original file by opaque UUID."
      >
        <PathBadge method="GET" path="/api/resumes/{resume_id}/download" auth={true} />
        <p>
          Streams the original stored file as an attachment. The client only ever sends the opaque
          <Code>resume_id</Code> UUID — never a filesystem path — which eliminates path-traversal risk.
        </p>
        <p className="font-medium text-slate-800">Path parameter</p>
        <ParamsTable rows={[['resume_id', 'path', 'The UUID returned in query/list results.']]} />
        <CodeBlock
          caption="200 OK — binary file"
          code={`Content-Type: text/plain; charset=utf-8
Content-Disposition: attachment; filename="John_Doe_14.txt"

<file bytes>`}
        />
        <CodeBlock caption="404 Not Found" code={`{ "detail": "Resume not found" }`} />
      </Section>

      <Section
        title="Health check"
        titleBadge={<MethodBadge method="GET" />}
        summary="GET / — public — liveness probe."
      >
        <PathBadge method="GET" path="/" auth={false} />
        <p>Root liveness probe. Not under the <Code>/api</Code> prefix, and requires no auth.</p>
        <CodeBlock caption="200 OK" code={`{ "status": "ok" }`} />
      </Section>
    </>
  )
}
