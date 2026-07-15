import {
  PageHeader,
  Section,
  Card,
  Callout,
  Code,
  CodeBlock,
  Badge,
  Flow,
  type FlowStepDef,
} from './primitives'

const AGENTS: { node: string; llm: boolean; role: string }[] = [
  { node: 'supervisor', llm: false, role: 'Entry node. Routes the request to the upload branch or the query branch based on intent.' },
  { node: 'scan_folder', llm: false, role: 'Lists files in the uploads/resume/ inbox. This is the loop entry & re-entry point.' },
  { node: 'analyzer_agent', llm: false, role: 'Checks the next file’s size on disk against the 2 MB cap.' },
  { node: 'ingestion_agent', llm: false, role: 'Parses file text (pypdf → pdfplumber on retry) and mints a resume_id UUID on success.' },
  { node: 'classifier_agent', llm: true, role: 'Claude with_structured_output → skills, seniority, primary_role, summary, first/last name, years_experience.' },
  { node: 'rename_agent', llm: false, role: 'Renames to Firstname_Lastname_Years.ext (auto-increment on collision), moves file to indexed/.' },
  { node: 'indexer_agent', llm: false, role: 'Builds the composite document text and upserts into Chroma, keyed by resume_id.' },
  { node: 'query_guardrail_agent', llm: true, role: 'Deterministic keyword screen; only escalates to a Claude judge on a keyword hit.' },
  { node: 'retrieval_agent', llm: false, role: 'Queries Chroma for the top 20 matches; applies a metadata filter on the first pass.' },
  { node: 'synthesizer_agent', llm: true, role: 'Writes a ranked prose summary of only the top 3–5 matches.' },
]

const UPLOAD_FLOW: FlowStepDef[] = [
  { name: 'POST /api/upload', kind: 'api', detail: 'JWT-protected. Saves uploaded file(s) into the uploads/resume/ inbox, then invokes the graph.' },
  { name: 'supervisor', kind: 'agent', condition: 'route_intent → "ingest"' },
  { name: 'scan_folder', kind: 'agent', detail: 'Lists every file in the inbox.', condition: 'route_has_work: has_files' },
  { name: 'analyzer_agent', kind: 'agent', detail: 'Reads file size.', condition: 'route_by_size: under_2mb' },
  { name: 'ingestion_agent', kind: 'agent', detail: 'Parses text, generates resume_id.', condition: 'route_after_ingestion: continue' },
  { name: 'classifier_agent', kind: 'agent', llm: true, detail: 'Claude extracts structured fields.' },
  { name: 'rename_agent', kind: 'agent', detail: 'Rename + move to indexed/.' },
  { name: 'indexer_agent', kind: 'store', detail: 'Upsert into ChromaDB by resume_id.', condition: 'edge → back to scan_folder' },
  { name: 'scan_folder', kind: 'agent', detail: 'Re-scans inbox. Empty → END, else process next file.', condition: 'route_has_work: empty' },
  { name: 'END', kind: 'end', detail: 'HTTP response returns { indexed, rejected, failed }.' },
]

const QUERY_FLOW: FlowStepDef[] = [
  { name: 'POST /api/query', kind: 'api', detail: 'JWT-protected. Passes query text + optional seniority filter into the graph.' },
  { name: 'supervisor', kind: 'agent', condition: 'route_intent → "query"' },
  { name: 'query_guardrail_agent', kind: 'agent', llm: true, detail: 'Keyword screen → Claude judge only on a hit.', condition: 'route_after_guardrail: pass' },
  { name: 'retrieval_agent', kind: 'store', detail: 'Chroma vector search, top 20.', condition: 'route_after_retrieval: synthesize' },
  { name: 'synthesizer_agent', kind: 'agent', llm: true, detail: 'Ranked prose over the top 3–5.' },
  { name: 'END', kind: 'end', detail: 'HTTP response returns { answer, matches[] }.' },
]

export function ArchitecturePage() {
  return (
    <>
      <PageHeader
        title="Architecture & Process Flow"
        subtitle="A supervisor/router multi-agent graph built on LangGraph. Every request enters through FastAPI, is routed by a supervisor node, and flows through a chain of specialized agents connected by conditional edges."
      />

      <Section title="How we arrived at an agentic approach">
        <p>
          The task — “ingest arbitrary resumes, classify them, index them, and answer recruiter
          queries” — is not a single function call. It is a <strong>pipeline of distinct decisions</strong>:
          is this file too big? did parsing succeed? what backend should the retry use? is this query
          discriminatory? did the search return anything? Each decision has its own branch and its own
          failure mode.
        </p>
        <p>
          Rather than bury that branching inside one tangled function, we model each responsibility as a
          <strong> node (agent)</strong> and each decision as a <strong>conditional edge</strong>. This
          gives three concrete benefits:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>Inspectability</strong> — every step is a named node; a run is a traceable path through the graph.</li>
          <li><strong>Isolated retries</strong> — a parse failure loops only the ingestion node, not the whole request.</li>
          <li><strong>Swappable triggers</strong> — the graph is identical whether invoked synchronously on upload or by a future background poller; only the call site changes.</li>
        </ul>
        <Callout title="Supervisor / Router pattern" tone="blue">
          A single <Code>supervisor</Code> entry node inspects <Code>intent</Code> and routes to one of
          two sub-graphs (upload vs. query). The agents themselves stay small and single-purpose — the
          routing intelligence lives in the edges, not the nodes.
        </Callout>
      </Section>

      <Section title="The agent roster">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-900">
              <tr>
                <th className="px-3 py-2 font-medium">Node</th>
                <th className="px-3 py-2 font-medium">LLM?</th>
                <th className="px-3 py-2 font-medium">Responsibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {AGENTS.map((a) => (
                <tr key={a.node}>
                  <td className="px-3 py-2 font-mono text-xs text-blue-800">{a.node}</td>
                  <td className="px-3 py-2">
                    {a.llm ? <Badge tone="purple">Claude</Badge> : <Badge tone="slate">no</Badge>}
                  </td>
                  <td className="px-3 py-2 text-slate-600">{a.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">
          Only 3 of 10 nodes call the LLM. Everything else — routing, size checks, parsing, renaming,
          vector indexing — is deterministic Python, which keeps cost and latency low.
        </p>
      </Section>

      <Section
        title="Agent roles, responsibilities & tools"
        summary="Each agent is a plain function; deterministic ones use the filesystem/Chroma, LLM ones build a Claude client."
      >
        <p>
          There is no agent base class or framework object. Every agent is a plain Python function with the
          signature <Code>def agent(state: GraphState) -&gt; dict</Code> — it reads the shared state and
          returns a partial update. LangGraph registers any such callable as a node, so “creating an agent”
          is just writing a function and calling <Code>add_node</Code>.
        </p>

        <p className="font-medium text-slate-800">Creating a deterministic agent (no LLM) — analyzer_agent:</p>
        <CodeBlock
          caption="app/agents/analyzer.py"
          code={`def analyzer_agent(state: GraphState) -> dict:
    current_file = state["file_paths"][0]
    size = Path(current_file).stat().st_size                 # tool: os / pathlib
    if size > settings.max_file_size_bytes:
        shutil.move(current_file,                            # tool: shutil → rejected/
                    Path(settings.rejected_dir) / Path(current_file).name)
        return {"current_file": current_file, "oversized": True,
                "rejected_files": [current_file]}
    return {"current_file": current_file, "oversized": False}`}
        />

        <p className="font-medium text-slate-800">Creating an LLM agent — classifier_agent (structured output):</p>
        <CodeBlock
          caption="app/agents/classifier.py"
          code={`class ResumeClassification(BaseModel):          # the tool contract (Pydantic)
    first_name: str; last_name: str; years_experience: float
    skills: list[str]; seniority: str; primary_role: str; summary: str

def classifier_agent(state: GraphState) -> dict:
    record = state["current_record"]
    llm = get_llm().with_structured_output(ResumeClassification)   # Claude + schema
    result = llm.invoke(_PROMPT.format(text=record["text"][:8000]))
    return {"classified": [rec_from(result)], "current_classified": rec_from(result)}`}
        />

        <p className="font-medium text-slate-800">Responsibilities &amp; tools, per agent:</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-900">
              <tr>
                <th className="px-3 py-2 font-medium">Agent</th>
                <th className="px-3 py-2 font-medium">Responsibility</th>
                <th className="px-3 py-2 font-medium">Tools / libraries</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="px-3 py-2 font-mono text-blue-800">supervisor</td>
                <td className="px-3 py-2 text-slate-600">Entry node; routing delegated to the edge.</td>
                <td className="px-3 py-2 text-slate-600">— (pure state)</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-blue-800">scan_folder</td>
                <td className="px-3 py-2 text-slate-600">Lists the inbox; loop entry / re-entry.</td>
                <td className="px-3 py-2 text-slate-600">os, pathlib</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-blue-800">analyzer_agent</td>
                <td className="px-3 py-2 text-slate-600">Size gate against the 2 MB cap.</td>
                <td className="px-3 py-2 text-slate-600">pathlib, shutil</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-blue-800">ingestion_agent</td>
                <td className="px-3 py-2 text-slate-600">Parse text; mint the resume_id UUID.</td>
                <td className="px-3 py-2 text-slate-600">pypdf, pdfplumber, python-docx, uuid</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-blue-800">classifier_agent</td>
                <td className="px-3 py-2 text-slate-600">Extract structured candidate fields.</td>
                <td className="px-3 py-2 text-slate-600">ChatAnthropic (Claude), Pydantic</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-blue-800">rename_agent</td>
                <td className="px-3 py-2 text-slate-600">Rename Firstname_Lastname_Years + move to indexed/.</td>
                <td className="px-3 py-2 text-slate-600">re, shutil, pathlib</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-blue-800">indexer_agent</td>
                <td className="px-3 py-2 text-slate-600">Build composite doc; upsert to Chroma.</td>
                <td className="px-3 py-2 text-slate-600">chromadb (+ DefaultEmbeddingFunction)</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-blue-800">query_guardrail_agent</td>
                <td className="px-3 py-2 text-slate-600">Keyword screen; gated LLM judge.</td>
                <td className="px-3 py-2 text-slate-600">keyword file, ChatAnthropic, Pydantic</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-blue-800">retrieval_agent</td>
                <td className="px-3 py-2 text-slate-600">Vector search, top 20 (+ metadata filter).</td>
                <td className="px-3 py-2 text-slate-600">chromadb collection.query</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-mono text-blue-800">synthesizer_agent</td>
                <td className="px-3 py-2 text-slate-600">Ranked prose over the top 3–5.</td>
                <td className="px-3 py-2 text-slate-600">ChatAnthropic (Claude)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Request path — Upload Resume">
        <p>
          The upload endpoint uses a <strong>synchronous drain-on-upload</strong> trigger: it saves the
          incoming file(s) to the inbox, then invokes the graph, which drains the <em>entire</em> inbox
          (not just this request’s files) before the HTTP response returns.
        </p>
        <Card>
          <Flow steps={UPLOAD_FLOW} />
        </Card>
        <Callout title="Branch: oversized or unparseable files" tone="amber">
          <Code>route_by_size: over_2mb</Code> moves the file to <Code>rejected/</Code> and loops back to
          <Code>scan_folder</Code>. <Code>route_after_ingestion: retries_exhausted</Code> moves it to
          <Code>failed/</Code> and loops back. Neither blocks the other files in the batch — rejection is
          per-file, not per-batch.
        </Callout>
      </Section>

      <Section title="Request path — Query">
        <Card>
          <Flow steps={QUERY_FLOW} />
        </Card>
        <Callout title="Branch: guardrail rejection" tone="amber">
          <Code>route_after_guardrail: reject</Code> short-circuits straight to <Code>END</Code> with a
          blocked response — no vector search is ever performed for a discriminatory or injection query.
        </Callout>
      </Section>

      <Section title="Conditional edges (the routing table)">
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-900">
              <tr>
                <th className="px-3 py-2 font-medium">Router fn</th>
                <th className="px-3 py-2 font-medium">After node</th>
                <th className="px-3 py-2 font-medium">Outcomes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-xs text-slate-600">
              <tr><td className="px-3 py-2 text-blue-800">route_intent</td><td className="px-3 py-2">supervisor</td><td className="px-3 py-2">ingest → scan_folder · query → query_guardrail_agent</td></tr>
              <tr><td className="px-3 py-2 text-blue-800">route_has_work</td><td className="px-3 py-2">scan_folder</td><td className="px-3 py-2">has_files → analyzer_agent · empty → END</td></tr>
              <tr><td className="px-3 py-2 text-blue-800">route_by_size</td><td className="px-3 py-2">analyzer_agent</td><td className="px-3 py-2">under_2mb → ingestion · over_2mb → scan_folder</td></tr>
              <tr><td className="px-3 py-2 text-blue-800">route_after_ingestion</td><td className="px-3 py-2">ingestion_agent</td><td className="px-3 py-2">retry → ingestion · continue → classifier · retries_exhausted → scan_folder</td></tr>
              <tr><td className="px-3 py-2 text-blue-800">route_after_guardrail</td><td className="px-3 py-2">query_guardrail_agent</td><td className="px-3 py-2">pass → retrieval · reject → END</td></tr>
              <tr><td className="px-3 py-2 text-blue-800">route_after_retrieval</td><td className="px-3 py-2">retrieval_agent</td><td className="px-3 py-2">broaden → retrieval · synthesize → synthesizer</td></tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Anatomy of a conditional node"
        summary="A router function reads state → returns a branch key; add_conditional_edges maps keys to next nodes."
      >
        <p>
          A conditional node is a normal node whose <em>outgoing edge is chosen at runtime</em>. You register
          a <strong>router function</strong> with <Code>add_conditional_edges</Code>: it inspects the state
          and returns a string key, and LangGraph looks that key up in a mapping to decide the next node.
          Returning a key that points back to an earlier node is exactly how a loop is formed.
        </p>
        <CodeBlock
          caption="app/graph.py — a router and its wiring"
          code={`# the router: a pure function, state in → branch key out
def route_after_ingestion(state: GraphState) -> str:
    result = state.get("last_ingestion_result")
    if result == "retry":            return "retry"
    if result == "success":          return "continue"
    return "retries_exhausted"

# the wiring: map each key to a destination node (or END)
graph.add_conditional_edges(
    "ingestion_agent",
    route_after_ingestion,
    {
        "retry": "ingestion_agent",        # ← loops back to itself
        "continue": "classifier_agent",
        "retries_exhausted": "scan_folder",
    },
)`}
        />
        <Callout title="Why routing lives in the edge, not the node" tone="blue">
          Keeping the decision in a small pure function (rather than inside the agent) means an agent never
          needs to know who runs next — the graph can be re-wired without touching agent code.
        </Callout>
      </Section>

      <Section
        title="Assembling the graph — nodes & edges"
        summary="build_graph() registers nodes, sets the entry point, wires static + conditional edges, compiles with a checkpointer."
      >
        <p>
          The whole topology is assembled in one <Code>build_graph()</Code> function: register every node,
          set the entry point, add <strong>static edges</strong> (<Code>add_edge</Code>, always the same
          next node) and <strong>conditional edges</strong> (<Code>add_conditional_edges</Code>,
          branch/loop), then compile with a <Code>MemorySaver</Code> checkpointer. The compiled graph is
          created once at import time.
        </p>
        <CodeBlock
          caption="app/graph.py — build_graph() (node registration condensed)"
          code={`def build_graph():
    graph = StateGraph(GraphState)

    # 1) register every agent as a node (add_node is called per agent in the source)
    for name, fn in NODES:            # supervisor, scan_folder, analyzer_agent, …
        graph.add_node(name, fn)

    # 2) entry point
    graph.set_entry_point("supervisor")

    # 3) conditional edges — branches & loops
    graph.add_conditional_edges("supervisor", route_intent,
        {"ingest": "scan_folder", "query": "query_guardrail_agent"})
    graph.add_conditional_edges("scan_folder", route_has_work,
        {"has_files": "analyzer_agent", "empty": END})
    graph.add_conditional_edges("analyzer_agent", route_by_size,
        {"under_2mb": "ingestion_agent", "over_2mb": "scan_folder"})
    graph.add_conditional_edges("ingestion_agent", route_after_ingestion,
        {"retry": "ingestion_agent", "continue": "classifier_agent",
         "retries_exhausted": "scan_folder"})
    graph.add_conditional_edges("query_guardrail_agent", route_after_guardrail,
        {"pass": "retrieval_agent", "reject": END})
    graph.add_conditional_edges("retrieval_agent", route_after_retrieval,
        {"broaden": "retrieval_agent", "synthesize": "synthesizer_agent"})

    # 4) static edges — always the same next node
    graph.add_edge("classifier_agent", "rename_agent")
    graph.add_edge("rename_agent", "indexer_agent")
    graph.add_edge("indexer_agent", "scan_folder")      # ← folder-drain loop
    graph.add_edge("synthesizer_agent", END)

    # 5) compile once, with short-term memory per thread
    return graph.compile(checkpointer=MemorySaver())

resume_graph = build_graph()`}
        />
        <p className="text-xs text-slate-500">
          The real source lists each <Code>add_node</Code> call individually; the loop above only condenses
          registration to keep the snippet readable.
        </p>
      </Section>

      <Section
        title="How the loops are implemented"
        summary="Two shapes — a self-loop (parse-retry, broaden) and a multi-node cycle (folder-drain) — all bounded."
      >
        <p>
          Loops are just conditional edges that point back to an earlier node. LangGraph keeps invoking
          nodes until an edge routes to <Code>END</Code>, so a loop terminates by having its router stop
          returning the “repeat” branch. Two <em>shapes</em> of loop appear here:
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="font-semibold text-blue-900">Self-loop</p>
            <p className="mt-1 text-xs text-slate-600">
              A node whose conditional edge can point back to <em>itself</em> —
              <Code>ingestion_agent → ingestion_agent</Code> and{' '}
              <Code>retrieval_agent → retrieval_agent</Code>. Used for retrying the same step with different
              parameters.
            </p>
          </Card>
          <Card>
            <p className="font-semibold text-blue-900">Multi-node cycle</p>
            <p className="mt-1 text-xs text-slate-600">
              A whole path that returns to an earlier node —
              <Code>scan_folder → … → indexer_agent → scan_folder</Code>. Used to process items one at a
              time and come back for the next.
            </p>
          </Card>
        </div>

        <p className="text-xs text-slate-500">
          Every loop here is <strong>bounded / guarded</strong>: a counter in state (or an empty inbox)
          eventually flips the router to a non-repeat branch, so no loop can run forever.
        </p>

        <p className="font-medium text-slate-800">The folder-drain cycle, visually:</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-4">
          <svg viewBox="0 0 640 150" className="mx-auto w-full max-w-2xl" role="img" aria-label="Folder-drain loop diagram">
            <defs>
              <marker id="arrow" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
                <path d="M0,0 L7,3 L0,6 Z" fill="#3b82f6" />
              </marker>
            </defs>
            {/* nodes */}
            <g fontSize="11" fontFamily="ui-monospace, monospace" textAnchor="middle">
              <rect x="20" y="55" width="96" height="40" rx="8" fill="#eff6ff" stroke="#93c5fd" />
              <text x="68" y="79" fill="#1e3a8a">scan_folder</text>
              <rect x="150" y="55" width="96" height="40" rx="8" fill="#eff6ff" stroke="#93c5fd" />
              <text x="198" y="79" fill="#1e3a8a">analyzer</text>
              <rect x="280" y="55" width="96" height="40" rx="8" fill="#eff6ff" stroke="#93c5fd" />
              <text x="328" y="79" fill="#1e3a8a">ingestion</text>
              <rect x="410" y="55" width="96" height="40" rx="8" fill="#eff6ff" stroke="#93c5fd" />
              <text x="458" y="73" fill="#1e3a8a">classifier</text>
              <text x="458" y="86" fill="#1e3a8a">→ rename</text>
              <rect x="540" y="55" width="86" height="40" rx="8" fill="#ecfdf5" stroke="#6ee7b7" />
              <text x="583" y="79" fill="#065f46">indexer</text>
              {/* forward arrows */}
              <line x1="116" y1="75" x2="150" y2="75" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="246" y1="75" x2="280" y2="75" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="376" y1="75" x2="410" y2="75" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />
              <line x1="506" y1="75" x2="540" y2="75" stroke="#3b82f6" strokeWidth="2" markerEnd="url(#arrow)" />
              {/* loop-back arrow: indexer → scan_folder */}
              <path d="M583,95 L583,130 L68,130 L68,95" fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="5 4" markerEnd="url(#arrow)" />
              <text x="325" y="145" fill="#64748b" fontSize="10">re-scan inbox after every file — empty ⇒ END</text>
            </g>
          </svg>
        </div>

        <Card className="border-l-4 border-l-blue-500">
          <p className="font-semibold text-blue-900">1. Folder-drain loop <span className="font-normal text-slate-500">(multi-node cycle)</span></p>
          <p className="mt-1 text-xs text-slate-600">
            <Code>indexer_agent → scan_folder</Code> (and the rejected/failed branches). After each file
            is handled it re-scans the inbox, so files dropped in mid-run also get processed. Ends when
            <Code>route_has_work</Code> sees an empty inbox.
          </p>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <p className="font-semibold text-amber-900">2. Parse-retry loop <span className="font-normal text-slate-500">(self-loop)</span></p>
          <p className="mt-1 text-xs text-slate-600">
            <Code>ingestion_agent → ingestion_agent</Code>. On retry it switches PDF backend
            (pypdf → pdfplumber) rather than blindly repeating. Capped by <Code>MAX_PARSE_RETRIES</Code>
            (default 2); exhaustion moves the file to <Code>failed/</Code>.
          </p>
        </Card>

        <Card className="border-l-4 border-l-emerald-500">
          <p className="font-semibold text-emerald-900">3. Broaden-search loop <span className="font-normal text-slate-500">(self-loop)</span></p>
          <p className="mt-1 text-xs text-slate-600">
            <Code>retrieval_agent → retrieval_agent</Code>. First pass honors the metadata filter (e.g.
            seniority); if it returns nothing, the retry drops the filter and relies on semantic
            similarity alone. Capped by <Code>MAX_BROADEN_ATTEMPTS</Code> (default 2).
          </p>
        </Card>

        <Callout title="Why recursion_limit = 1000" tone="blue">
          Each file traverses ~6 nodes before the loop reaches the next one, so the limit must scale with
          inbox size, not with the step count of a single file. The upload endpoint passes
          <Code>recursion_limit: 1000</Code> in the graph config.
        </Callout>
      </Section>

      <Section
        title="Why whole-document embedding (no chunking)"
        summary="Resumes are short and queried per-candidate, so one embedding per resume beats splitting."
      >
        <p>
          A common RAG default is to split documents into overlapping chunks. We deliberately do{' '}
          <strong>not</strong> chunk. Each resume becomes exactly <strong>one composite embedding</strong>.
        </p>

        <p className="font-medium text-slate-800">Chunking strategies we compared:</p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-900">
              <tr>
                <th className="px-3 py-2 font-medium">Strategy</th>
                <th className="px-3 py-2 font-medium">What it does</th>
                <th className="px-3 py-2 font-medium">Verdict here</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr className="bg-emerald-50/40">
                <td className="px-3 py-2 font-medium text-slate-800">Whole-document</td>
                <td className="px-3 py-2 text-slate-600">One embedding for the entire resume (what we use).</td>
                <td className="px-3 py-2"><Badge tone="green">Chosen</Badge></td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Fixed-size / sliding window</td>
                <td className="px-3 py-2 text-slate-600">Split into N-token chunks with overlap, ignoring structure.</td>
                <td className="px-3 py-2 text-slate-600">Rejected — fragments a 1-page doc and scatters one candidate across many vectors.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Sentence / paragraph</td>
                <td className="px-3 py-2 text-slate-600">Embed each sentence or paragraph separately.</td>
                <td className="px-3 py-2 text-slate-600">Rejected — same fragmentation, plus needing to collapse duplicate candidates at query time.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Section-based</td>
                <td className="px-3 py-2 text-slate-600">Split on resume sections (experience / skills / education).</td>
                <td className="px-3 py-2 text-slate-600">Rejected — needs a section parser and re-ranking across a candidate’s own sections.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Recursive character split</td>
                <td className="px-3 py-2 text-slate-600">Hierarchically split on separators (paragraphs → lines → words).</td>
                <td className="px-3 py-2 text-slate-600">Rejected — built for long documents; overkill at 1–2 pages.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Hybrid (whole-doc + skills vector)</td>
                <td className="px-3 py-2 text-slate-600">Keep the whole-doc vector, add a second skills-only vector.</td>
                <td className="px-3 py-2"><Badge tone="blue">Deferred upgrade</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
        <CodeBlock
          caption="indexer_agent — composite document shape"
          code={`doc_text = (
    f"Skills: {', '.join(skills)}\\n"
    f"Role: {primary_role}\\n"
    f"Seniority: {seniority}\\n"
    f"Summary: {summary}\\n\\n"
    f"{full_raw_resume_text}"
)`}
        />
        <p>The reasoning:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Documents are short.</strong> Resumes are 1–2 pages — well within the embedding
            model’s context. Chunking exists to fit long documents into a limited window; that problem
            doesn’t apply here.
          </li>
          <li>
            <strong>The query is document-level.</strong> A recruiter searches for a <em>candidate</em>
            (“senior Java engineer with Kafka”), not a paragraph. One vector per candidate matches the
            unit the recruiter actually reasons about.
          </li>
          <li>
            <strong>Structure is front-loaded.</strong> We prepend the classifier’s extracted skills,
            role, seniority, and summary before the raw text, so the most query-relevant signal is
            concentrated in the embedding.
          </li>
          <li>
            <strong>Less complexity, fewer failure modes.</strong> No chunk-boundary tuning, no
            re-ranking across chunks of the same person, no duplicate-candidate collapsing.
          </li>
        </ul>
        <Callout title="Identified upgrade path" tone="green">
          If precise skill-keyword recall ever proves insufficient, the plan is a <strong>hybrid</strong>:
          keep the whole-doc vector and add a second skills-only vector (reusing the classifier’s already
          extracted skills list — no extra LLM call). Section-based and recursive chunking were considered
          and rejected as not worth the added complexity for this document length.
        </Callout>
      </Section>

      <Section
        title="Embedding options — and why local MiniLM"
        summary="Chroma’s DefaultEmbeddingFunction runs all-MiniLM-L6-v2 locally: free, no API call, private, enough for short resumes."
      >
        <p>
          An embedding turns text into a vector so similarity search works. Chroma’s{' '}
          <Code>DefaultEmbeddingFunction</Code> runs <strong>all-MiniLM-L6-v2</strong> locally via ONNX —
          no network call, no API key, no per-token cost. We compared the realistic options:
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-900">
              <tr>
                <th className="px-3 py-2 font-medium">Embedding model</th>
                <th className="px-3 py-2 font-medium">Runs</th>
                <th className="px-3 py-2 font-medium">Cost</th>
                <th className="px-3 py-2 font-medium">Verdict here</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr className="bg-emerald-50/40">
                <td className="px-3 py-2 font-medium text-slate-800">all-MiniLM-L6-v2 (ONNX)</td>
                <td className="px-3 py-2 text-slate-600">Locally</td>
                <td className="px-3 py-2 text-slate-600">Free</td>
                <td className="px-3 py-2"><Badge tone="green">Chosen</Badge> — 384-dim, fast, fine for short resumes</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">OpenAI text-embedding-3</td>
                <td className="px-3 py-2 text-slate-600">API</td>
                <td className="px-3 py-2 text-slate-600">Paid / token</td>
                <td className="px-3 py-2 text-slate-600">Rejected — adds a second vendor + cost for marginal gain on 1-page docs.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Cohere / Voyage embeddings</td>
                <td className="px-3 py-2 text-slate-600">API</td>
                <td className="px-3 py-2 text-slate-600">Paid / token</td>
                <td className="px-3 py-2 text-slate-600">Rejected — same trade-off; another key to manage.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Anthropic (first-party)</td>
                <td className="px-3 py-2 text-slate-600">—</td>
                <td className="px-3 py-2 text-slate-600">—</td>
                <td className="px-3 py-2 text-slate-600">N/A — Claude has no embeddings endpoint; would need a second provider anyway.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">bge-large / e5 (local, heavier)</td>
                <td className="px-3 py-2 text-slate-600">Locally</td>
                <td className="px-3 py-2 text-slate-600">Free</td>
                <td className="px-3 py-2"><Badge tone="blue">Deferred</Badge> — higher quality, but larger download &amp; slower.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Why local MiniLM won:</p>
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>Zero cost, no extra vendor</strong> — the only paid dependency stays Claude, which is used sparingly (3 of 10 nodes).</li>
          <li><strong>Local &amp; private</strong> — resume text never leaves the machine just to be embedded.</li>
          <li><strong>Good enough</strong> — 384-dim cosine handles short, keyword-rich resumes well; the live test ranked the Java vs. Python candidates correctly.</li>
          <li><strong>Trivial upgrade path</strong> — swapping to a bigger local model (bge, e5) or an API model is a one-line change to the collection’s embedding function.</li>
        </ul>
        <Callout title="Embedding vs. the LLM" tone="blue">
          Embedding is <em>not</em> an LLM call. The classifier, guardrail judge, and synthesizer call Claude;
          the vector search embeds text with this local model. That separation is why semantic retrieval costs
          nothing per query.
        </Callout>
      </Section>

      <Section
        title="How the agents communicate"
        summary="A shared-state blackboard, not direct message passing — nodes read/write GraphState; edges route."
      >
        <p>
          The agents never call each other directly. LangGraph uses a <strong>shared-state
          (“blackboard”) model</strong>: every node receives the current <Code>GraphState</Code>, returns a
          partial update, and LangGraph merges that update into the state before the next node runs.
          Routing is a separate concern handled by the conditional-edge functions — so an agent doesn’t
          know, or need to know, who runs next.
        </p>
        <CodeBlock
          caption="A node returns a partial state update; the reducer merges it"
          code={`def ingestion_agent(state: GraphState) -> dict:
    record = {"resume_id": str(uuid.uuid4()), "file_path": current_file, "text": text}
    return {
        "raw_texts": [record],        # Annotated[..., add] → appended, not overwritten
        "current_record": record,     # plain field → handed to the next node
        "last_ingestion_result": "success",
    }`}
        />
        <ul className="ml-5 list-disc space-y-1">
          <li><strong>Blackboard state</strong> — all inter-agent data lives in one typed <Code>GraphState</Code> dict; there is no direct agent-to-agent API.</li>
          <li><strong>Reducers merge</strong> — <Code>Annotated[List, add]</Code> fields accumulate across loop iterations; plain fields (like <Code>current_record</Code>) hand this iteration’s working data to the next node.</li>
          <li><strong>Edges route</strong> — conditional-edge functions read state and return the next node name, decoupling “what an agent does” from “where control goes.”</li>
          <li><strong>Threaded identity</strong> — <Code>resume_id</Code> plus the <Code>current_*</Code> fields carry one file’s context through ingestion → classifier → rename → indexer.</li>
          <li><strong>Isolation</strong> — each request runs on its own <Code>thread_id</Code> under the <Code>MemorySaver</Code> checkpointer, so concurrent requests never cross state.</li>
        </ul>
      </Section>

      <Section
        title="Improving agent communication"
        summary="Command handoffs, parallel Send fan-out, typed contracts, an error channel, and streaming observability."
      >
        <p>
          The blackboard model is simple and robust, but a few upgrades would make coordination more
          explicit, more parallel, and more observable:
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-900">
              <tr>
                <th className="px-3 py-2 font-medium">Upgrade</th>
                <th className="px-3 py-2 font-medium">What it buys us</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Command handoffs</td>
                <td className="px-3 py-2 text-slate-600">Return a LangGraph <Code>Command(update=…, goto=…)</Code> so a node’s state change and its next hop live together, instead of being split across a separate router function.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Send API (map-reduce)</td>
                <td className="px-3 py-2 text-slate-600">Fan out classification of many files <em>in parallel</em> with <Code>Send</Code>, instead of the current one-file-per-iteration drain — big speedup on large batches.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Typed node contracts</td>
                <td className="px-3 py-2 text-slate-600">Give each agent an explicit Pydantic input/output shape so the shared state stops accumulating loosely-typed keys, and mismatches are caught at the boundary.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Dedicated error channel</td>
                <td className="px-3 py-2 text-slate-600">A standard <Code>errors</Code> field / dead-letter path every agent writes to, instead of overloading <Code>parse_failures</Code> — uniform failure reporting.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Streaming + tracing</td>
                <td className="px-3 py-2 text-slate-600">Use <Code>graph.stream()</Code> / <Code>astream_events</Code> and LangSmith so each hop is visible live; today an agent failure only surfaces as an HTTP 500.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Supervisor-as-tool-caller</td>
                <td className="px-3 py-2 text-slate-600">Promote the static router to an LLM supervisor that picks the next agent as a tool call, enabling dynamic, data-dependent routing.</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Conversational channel</td>
                <td className="px-3 py-2 text-slate-600">Add a <Code>messages</Code> field with the <Code>add_messages</Code> reducer if query follow-ups (“now narrow to seniors”) ever need memory.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        title="Future improvements"
        summary="Retrieval quality, real memory, background ingestion, PII/auth hardening, and ops/scale."
      >
        <p>The system-wide roadmap beyond agent coordination:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="font-semibold text-blue-900">Retrieval quality</p>
            <p className="mt-1 text-xs text-slate-600">
              Hybrid whole-doc + skills-only vector; add a cross-encoder re-ranker; richer metadata
              pre-filtering (years, role).
            </p>
          </Card>
          <Card>
            <p className="font-semibold text-blue-900">Real memory</p>
            <p className="mt-1 text-xs text-slate-600">
              Introduce user/session identity → thread-scoped follow-ups and a LangGraph <Code>Store</Code>
              for cross-session memory.
            </p>
          </Card>
          <Card>
            <p className="font-semibold text-blue-900">Ingestion trigger</p>
            <p className="mt-1 text-xs text-slate-600">
              Swap synchronous drain for a background task or scheduled poller; stream batch progress over
              SSE / WebSocket.
            </p>
          </Card>
          <Card>
            <p className="font-semibold text-blue-900">Pagination</p>
            <p className="mt-1 text-xs text-slate-600">
              Cursor/offset over results once corpora grow past the top 20 fetched today.
            </p>
          </Card>
          <Card>
            <p className="font-semibold text-blue-900">Security &amp; PII</p>
            <p className="mt-1 text-xs text-slate-600">
              Optional Presidio redaction; multi-user auth with refresh tokens and roles instead of the
              single allowed email.
            </p>
          </Card>
          <Card>
            <p className="font-semibold text-blue-900">Ops &amp; scale</p>
            <p className="mt-1 text-xs text-slate-600">
              Dockerize; add an evaluation harness for classification/retrieval quality; move Chroma to a
              hosted vector DB with batch embedding.
            </p>
          </Card>
        </div>
      </Section>
    </>
  )
}
