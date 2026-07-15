import {
  PageHeader,
  Section,
  Card,
  Callout,
  Code,
  CodeBlock,
  KeyValueTable,
} from './primitives'

/** Full application graph: nodes = agents, solid = edges, dashed = loop-back, arcs = self-loops. */
function AppGraph() {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white p-3">
      <svg viewBox="0 0 780 560" className="mx-auto w-full min-w-[680px]" role="img" aria-labelledby="lg-t lg-d">
        <title id="lg-t">The resume-classifier LangGraph</title>
        <desc id="lg-d">
          A supervisor node routes to an upload branch (scan_folder, analyzer, ingestion, classifier, rename,
          indexer, looping back to scan_folder) or a query branch (guardrail, retrieval, synthesizer).
        </desc>
        <defs>
          <marker id="lg-ah" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L7,3 L0,6 Z" fill="#2563eb" />
          </marker>
          <marker id="lg-ahg" markerWidth="9" markerHeight="9" refX="7" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L7,3 L0,6 Z" fill="#64748b" />
          </marker>
        </defs>

        <g fontFamily="ui-monospace, monospace" fontSize="11">
          {/* entry + supervisor */}
          <text x="390" y="16" textAnchor="middle" fill="#64748b" fontSize="10">▼ entry_point</text>
          <rect x="320" y="22" width="140" height="34" rx="8" fill="#dbeafe" stroke="#60a5fa" />
          <text x="390" y="43" textAnchor="middle" fill="#1e3a8a">supervisor</text>

          {/* branch labels */}
          <text x="222" y="86" textAnchor="middle" fill="#64748b" fontSize="10">intent = upload</text>
          <text x="560" y="86" textAnchor="middle" fill="#64748b" fontSize="10">intent = query</text>
          <path d="M340,56 C250,80 180,92 150,116" fill="none" stroke="#2563eb" strokeWidth="1.6" markerEnd="url(#lg-ah)" />
          <path d="M440,56 C540,80 605,92 630,116" fill="none" stroke="#2563eb" strokeWidth="1.6" markerEnd="url(#lg-ah)" />

          {/* ===== upload column (x center 150) ===== */}
          {[
            ['scan_folder', 120],
            ['analyzer_agent', 182],
            ['ingestion_agent', 244],
            ['classifier_agent', 306],
            ['rename_agent', 368],
            ['indexer_agent', 430],
          ].map(([label, y]) => (
            <g key={label as string}>
              <rect x="80" y={y as number} width="140" height="32" rx="8" fill="#eff6ff" stroke="#93c5fd" />
              <text x="150" y={(y as number) + 20} textAnchor="middle" fill="#1e3a8a">{label}</text>
            </g>
          ))}
          {/* forward arrows */}
          {[152, 214, 276, 338, 400].map((y) => (
            <line key={y} x1="150" y1={y} x2="150" y2={y + 30} stroke="#2563eb" strokeWidth="1.6" markerEnd="url(#lg-ah)" />
          ))}
          {/* ingestion self-loop (parse-retry) */}
          <path d="M220,250 C268,244 268,274 220,270" fill="none" stroke="#2563eb" strokeWidth="1.6" strokeDasharray="4 3" markerEnd="url(#lg-ah)" />
          <text x="300" y="263" textAnchor="middle" fill="#64748b" fontSize="10">self-loop · retry (pypdf → pdfplumber)</text>
          {/* folder-drain loop-back indexer → scan_folder */}
          <path d="M80,446 L40,446 L40,136 L80,136" fill="none" stroke="#2563eb" strokeWidth="1.6" strokeDasharray="5 4" markerEnd="url(#lg-ah)" />
          <text x="26" y="300" textAnchor="middle" fill="#2563eb" fontSize="10" transform="rotate(-90 26 300)">folder-drain · re-scan after each file</text>
          {/* scan_folder empty → END */}
          <line x1="220" y1="136" x2="250" y2="136" stroke="#64748b" strokeWidth="1.6" markerEnd="url(#lg-ahg)" />
          <rect x="252" y="123" width="52" height="26" rx="13" fill="#ecfdf5" stroke="#6ee7b7" />
          <text x="278" y="140" textAnchor="middle" fill="#065f46">END</text>
          <text x="278" y="116" textAnchor="middle" fill="#64748b" fontSize="9">empty</text>

          {/* ===== query column (x center 630) ===== */}
          {[
            ['query_guardrail', 120],
            ['retrieval_agent', 210],
            ['synthesizer_agent', 300],
          ].map(([label, y]) => (
            <g key={label as string}>
              <rect x="555" y={y as number} width="150" height="34" rx="8" fill="#eff6ff" stroke="#93c5fd" />
              <text x="630" y={(y as number) + 21} textAnchor="middle" fill="#1e3a8a">{label}</text>
            </g>
          ))}
          {/* pass / synthesize arrows */}
          <line x1="630" y1="154" x2="630" y2="210" stroke="#2563eb" strokeWidth="1.6" markerEnd="url(#lg-ah)" />
          <text x="648" y="186" fill="#64748b" fontSize="10">pass</text>
          <line x1="630" y1="244" x2="630" y2="300" stroke="#2563eb" strokeWidth="1.6" markerEnd="url(#lg-ah)" />
          <text x="648" y="276" fill="#64748b" fontSize="10">synthesize</text>
          {/* retrieval self-loop (broaden) */}
          <path d="M555,216 C507,210 507,240 555,236" fill="none" stroke="#2563eb" strokeWidth="1.6" strokeDasharray="4 3" markerEnd="url(#lg-ah)" />
          <text x="470" y="228" textAnchor="middle" fill="#64748b" fontSize="10">self-loop · broaden</text>
          {/* guardrail reject → END */}
          <line x1="555" y1="137" x2="524" y2="137" stroke="#64748b" strokeWidth="1.6" markerEnd="url(#lg-ahg)" />
          <rect x="470" y="124" width="52" height="26" rx="13" fill="#ecfdf5" stroke="#6ee7b7" />
          <text x="496" y="141" textAnchor="middle" fill="#065f46">END</text>
          <text x="496" y="117" textAnchor="middle" fill="#64748b" fontSize="9">reject</text>
          {/* synthesizer → END */}
          <line x1="630" y1="334" x2="630" y2="366" stroke="#2563eb" strokeWidth="1.6" markerEnd="url(#lg-ah)" />
          <rect x="604" y="368" width="52" height="26" rx="13" fill="#ecfdf5" stroke="#6ee7b7" />
          <text x="630" y="385" textAnchor="middle" fill="#065f46">END</text>

          {/* legend */}
          <g fontSize="10" fill="#64748b">
            <rect x="80" y="500" width="20" height="12" rx="3" fill="#eff6ff" stroke="#93c5fd" />
            <text x="106" y="510">node (agent)</text>
            <line x1="200" y1="506" x2="228" y2="506" stroke="#2563eb" strokeWidth="1.6" markerEnd="url(#lg-ah)" />
            <text x="234" y="510">edge</text>
            <line x1="290" y1="506" x2="318" y2="506" stroke="#2563eb" strokeWidth="1.6" strokeDasharray="5 4" />
            <text x="324" y="510">loop / self-loop</text>
            <rect x="430" y="500" width="20" height="12" rx="6" fill="#ecfdf5" stroke="#6ee7b7" />
            <text x="456" y="510">END</text>
          </g>
        </g>
      </svg>
      <p className="mt-2 text-center text-xs text-slate-500">
        Not drawn, to keep it readable: <Code>analyzer → rejected/</Code> (file &gt; 2&nbsp;MB) and{' '}
        <Code>ingestion → failed/</Code> (retries exhausted) also loop back to <Code>scan_folder</Code>.
      </p>
    </div>
  )
}

export function LangGraphPage() {
  return (
    <>
      <PageHeader
        title="Learn LangGraph — using this app as the textbook"
        subtitle="A guided tour of LangGraph's building blocks — nodes, edges, state, loops, tools, and memory — each mapped to the exact agent and source file where we used it. Read top to bottom to learn the framework, or jump to a concept and cross-reference the code."
      />

      <Section
        title="Start here — the mental model"
        summary="Six primitives (state, node, edge, conditional edge, loop, checkpointer) and where each lives in this repo."
        defaultOpen
      >
        <p>
          LangGraph models an application as a <strong>directed graph of functions that share one typed
          state object</strong>. There are only a handful of primitives to learn — here is each one, what it
          is, and the exact place we built it in this app:
        </p>
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-blue-50 text-xs uppercase tracking-wide text-blue-900">
              <tr>
                <th className="px-3 py-2 font-medium">Primitive</th>
                <th className="px-3 py-2 font-medium">What it is</th>
                <th className="px-3 py-2 font-medium">In this app (source)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">State</td>
                <td className="px-3 py-2 text-slate-600">The typed dict every node reads &amp; writes.</td>
                <td className="px-3 py-2 font-mono text-blue-800">GraphState · app/state.py</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Node</td>
                <td className="px-3 py-2 text-slate-600">A function <Code>state → partial state</Code>.</td>
                <td className="px-3 py-2 font-mono text-blue-800">10 agents · app/agents/*.py, app/graph.py</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Edge</td>
                <td className="px-3 py-2 text-slate-600">A fixed hop from one node to the next.</td>
                <td className="px-3 py-2 font-mono text-blue-800">add_edge(...) · app/graph.py</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Conditional edge</td>
                <td className="px-3 py-2 text-slate-600">A router picks the next node at runtime.</td>
                <td className="px-3 py-2 font-mono text-blue-800">route_* + add_conditional_edges · app/graph.py</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Loop</td>
                <td className="px-3 py-2 text-slate-600">A conditional edge pointing back to an earlier node.</td>
                <td className="px-3 py-2 font-mono text-blue-800">3 loops · app/graph.py</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-slate-800">Checkpointer</td>
                <td className="px-3 py-2 text-slate-600">Saves state per thread; short-term memory.</td>
                <td className="px-3 py-2 font-mono text-blue-800">MemorySaver · app/graph.py</td>
              </tr>
            </tbody>
          </table>
        </div>
        <Callout title="How to use these docs together" tone="blue">
          This page teaches the <em>framework</em>. The <strong>Architecture &amp; Flow</strong> tab walks the
          request paths end to end, and the <strong>REST API</strong> tab shows the endpoints that invoke the
          graph. Where a concept has a fuller treatment there, we link across.
        </Callout>
      </Section>

      <Section
        title="The whole graph in one picture"
        summary="Supervisor routes to the upload branch or the query branch; two self-loops and one folder-drain cycle."
      >
        <p>
          Everything below is a zoom-in on part of this diagram. Blue boxes are <strong>nodes</strong>
          (our agents), solid arrows are <strong>edges</strong>, dashed arrows are <strong>loops</strong>,
          and green pills are <Code>END</Code>.
        </p>
        <AppGraph />
        <p className="text-xs text-slate-500">
          Source of truth: <Code>build_graph()</Code> in <Code>app/graph.py</Code>. The compiled object is
          <Code>resume_graph</Code>, invoked by the API routes.
        </p>
      </Section>

      <Section
        title="Nodes — every agent is a function"
        summary="A node is any callable state → dict; we register 10 of them with add_node."
      >
        <p>
          A <strong>node</strong> is just a function that takes the current state and returns a partial
          update. There is no base class — you write a function and register it with <Code>add_node</Code>.
          We have 10 nodes; <Code>supervisor</Code> and <Code>scan_folder</Code> live in{' '}
          <Code>app/graph.py</Code>, the rest in <Code>app/agents/</Code>.
        </p>
        <CodeBlock
          caption="the node signature (any agent)"
          code={`def some_agent(state: GraphState) -> dict:
    value = state["some_field"]      # read from shared state
    ...                              # do work (parse, call Claude, query Chroma…)
    return {"other_field": result}   # return a PARTIAL update, merged into state`}
        />
        <CodeBlock
          caption="app/graph.py — registering nodes"
          code={`graph = StateGraph(GraphState)
graph.add_node("supervisor", supervisor)
graph.add_node("scan_folder", scan_folder)
graph.add_node("analyzer_agent", analyzer_agent)
graph.add_node("classifier_agent", classifier_agent)
# … 10 nodes total …
graph.set_entry_point("supervisor")   # where every run begins`}
        />
        <Callout title="Cross-reference" tone="blue">
          Full per-agent responsibilities, tools, and “create a deterministic vs. an LLM agent” snippets are
          on the <strong>Architecture &amp; Flow</strong> tab → <em>“Agent roles, responsibilities &amp;
          tools.”</em>
        </Callout>
      </Section>

      <Section
        title="Edges — static vs. conditional"
        summary="add_edge is an unconditional hop; add_conditional_edges routes on a key the router returns."
      >
        <p>
          Edges connect nodes. There are two kinds, and this app uses both heavily:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="font-semibold text-blue-900">Static edge — <Code>add_edge</Code></p>
            <p className="mt-1 text-xs text-slate-600">
              Always goes to the same next node. Used for the fixed part of the pipeline, e.g.{' '}
              <Code>classifier_agent → rename_agent → indexer_agent</Code>.
            </p>
          </Card>
          <Card>
            <p className="font-semibold text-blue-900">Conditional edge — <Code>add_conditional_edges</Code></p>
            <p className="mt-1 text-xs text-slate-600">
              A <em>router function</em> reads state and returns a key; a mapping turns that key into the next
              node. This is how every branch and loop is built.
            </p>
          </Card>
        </div>
        <CodeBlock
          caption="app/graph.py — both kinds side by side"
          code={`# static: always the same next node
graph.add_edge("classifier_agent", "rename_agent")
graph.add_edge("rename_agent", "indexer_agent")

# conditional: the router decides
def route_after_retrieval(state: GraphState) -> str:
    if not state.get("retrieved") and state["broaden_attempts"] < 2:
        return "broaden"
    return "synthesize"

graph.add_conditional_edges(
    "retrieval_agent",
    route_after_retrieval,
    {"broaden": "retrieval_agent", "synthesize": "synthesizer_agent"},
)`}
        />
        <p className="text-xs text-slate-500">
          Every router in the app: <Code>route_intent</Code>, <Code>route_has_work</Code>,{' '}
          <Code>route_by_size</Code>, <Code>route_after_ingestion</Code>, <Code>route_after_guardrail</Code>,{' '}
          <Code>route_after_retrieval</Code> — all in <Code>app/graph.py</Code>. The routing table is on the
          Architecture tab.
        </p>
      </Section>

      <Section
        title="State & messaging — how nodes talk to each other"
        summary="Nodes never call each other; they pass data through the shared GraphState, with reducers to accumulate."
      >
        <p>
          In many agent frameworks, agents <em>message</em> each other directly. In LangGraph there is no
          direct call — nodes communicate through the <strong>shared state</strong>. A node returns a partial
          dict; LangGraph merges it into the state; the next node reads it. That merge is controlled per field
          by a <strong>reducer</strong>.
        </p>
        <CodeBlock
          caption="app/state.py — plain fields vs. reducer fields"
          code={`class GraphState(TypedDict, total=False):
    intent: Literal["upload", "query"]

    current_record: Optional[ResumeRecord]     # plain: overwritten each write (a hand-off)
    current_classified: Optional[ClassifiedRecord]

    # Annotated[..., add] uses operator.add → new writes are APPENDED, not overwritten
    raw_texts:  Annotated[List[ResumeRecord], add]
    classified: Annotated[List[ClassifiedRecord], add]
    indexed:    Annotated[List[str], add]`}
        />
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Hand-off fields</strong> (<Code>current_record</Code>, <Code>current_classified</Code>)
            carry one file’s working data forward: ingestion writes it, classifier / rename / indexer read it.
          </li>
          <li>
            <strong>Accumulator fields</strong> (the <Code>Annotated[..., add]</Code> lists) build a running
            audit trail across every loop iteration — that’s how one upload run reports everything it indexed.
          </li>
        </ul>
        <Callout title="What about a “messages” channel?" tone="blue">
          LangGraph’s chat agents use a <Code>messages</Code> field with the <Code>add_messages</Code> reducer
          to accumulate a conversation. We deliberately don’t — this app’s agents exchange <em>structured
          records</em>, not chat turns. If query follow-ups (“now narrow to seniors”) ever needed memory,
          adding a <Code>messages</Code> channel is the idiomatic way (noted under “Improving agent
          communication” on the Architecture tab).
        </Callout>
      </Section>

      <Section
        title="Loops — cycles that always terminate"
        summary="A loop is an edge back to an earlier node; a counter or empty inbox flips the router to exit."
      >
        <p>
          A loop is nothing special — it’s a conditional edge whose mapping points back to a node that already
          ran. LangGraph keeps stepping until a router routes to <Code>END</Code>. This app has three, in two
          shapes:
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="border-l-4 border-l-amber-500">
            <p className="font-semibold text-amber-900">Self-loop</p>
            <p className="mt-1 text-xs text-slate-600">
              <Code>ingestion_agent → ingestion_agent</Code> (parse-retry, switches pypdf → pdfplumber) and{' '}
              <Code>retrieval_agent → retrieval_agent</Code> (broaden, drops the filter). Bounded by{' '}
              <Code>MAX_PARSE_RETRIES</Code> / <Code>MAX_BROADEN_ATTEMPTS</Code>.
            </p>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <p className="font-semibold text-blue-900">Multi-node cycle</p>
            <p className="mt-1 text-xs text-slate-600">
              <Code>scan_folder → … → indexer_agent → scan_folder</Code> (folder-drain). Processes one file,
              then re-scans the inbox. Ends when <Code>route_has_work</Code> sees it empty.
            </p>
          </Card>
        </div>
        <CodeBlock
          caption="app/graph.py — a self-loop and the drain cycle"
          code={`# self-loop: the "retry" key routes back to the same node
graph.add_conditional_edges("ingestion_agent", route_after_ingestion,
    {"retry": "ingestion_agent", "continue": "classifier_agent",
     "retries_exhausted": "scan_folder"})

# multi-node cycle: a static edge closes the loop back to the start
graph.add_edge("indexer_agent", "scan_folder")`}
        />
        <Callout title="Termination & recursion_limit" tone="amber">
          Because the drain loop re-runs many nodes per file, a single invocation can take hundreds of steps.
          The upload route passes <Code>recursion_limit: 1000</Code> so LangGraph doesn’t abort a legitimate
          long run. The loop still <em>terminates</em> because each pass either shrinks the inbox or trips a
          counter. See the loops diagram + details on the Architecture tab.
        </Callout>
      </Section>

      <Section
        title="Tools — what a node is allowed to do"
        summary="A node’s “tools” are just the libraries it calls: filesystem, Chroma, or Claude."
      >
        <p>
          LangGraph doesn’t impose a tool abstraction — a node’s “tools” are simply the libraries it calls.
          Grouping our nodes by the tool they reach for makes the dependency map obvious:
        </p>
        <KeyValueTable
          rows={[
            ['Filesystem (os, shutil, pathlib)', <><Code>scan_folder</Code>, <Code>analyzer_agent</Code>, <Code>rename_agent</Code> — list, size-check, move files</>],
            ['Parsers (pypdf, pdfplumber, python-docx)', <><Code>ingestion_agent</Code> → <Code>app/services/parsing.py</Code></>],
            ['Claude (langchain-anthropic)', <><Code>classifier_agent</Code>, <Code>query_guardrail_agent</Code>, <Code>synthesizer_agent</Code> → <Code>app/services/llm.py</Code></>],
            ['ChromaDB (vector store + local embeddings)', <><Code>indexer_agent</Code>, <Code>retrieval_agent</Code> → <Code>app/services/chroma_store.py</Code></>],
            ['Pydantic (structured-output contract)', <><Code>classifier_agent</Code>, <Code>query_guardrail_agent</Code> — schemas passed to <Code>with_structured_output()</Code></>],
          ]}
        />
        <Callout title="LLM tool-calling vs. our “tools”" tone="blue">
          Note this is <em>not</em> LLM function-calling. Our nodes call Python libraries directly. A future
          upgrade (Architecture tab → “Improving agent communication”) is to let the supervisor pick the next
          agent as an actual LLM tool call.
        </Callout>
      </Section>

      <Section
        title="Memory, threads & the checkpointer"
        summary="MemorySaver stores state per thread_id; each request is its own isolated, replayable thread."
      >
        <p>
          The graph is compiled with a <Code>MemorySaver</Code> checkpointer. Every step’s state is saved
          under a <Code>thread_id</Code>, so a run is inspectable and replayable, and concurrent requests never
          cross state.
        </p>
        <CodeBlock
          caption="app/graph.py + app/api/routes.py"
          code={`# graph.py — compile with short-term memory
resume_graph = build_graph()   # graph.compile(checkpointer=MemorySaver())

# routes.py — every request gets a fresh, isolated thread
resume_graph.invoke(
    {"intent": "upload", "parse_retries": 0},
    config={"configurable": {"thread_id": str(uuid.uuid4())},
            "recursion_limit": settings.graph_recursion_limit},
)`}
        />
        <Callout title="Three tiers of memory" tone="blue">
          <strong>Within a run</strong> — the <Code>add</Code> reducers accumulate results.{' '}
          <strong>Per request</strong> — the checkpointer isolates each <Code>thread_id</Code>.{' '}
          <strong>Across sessions</strong> — a LangGraph <Code>Store</Code> would persist memory between users,
          intentionally deferred until the API has a user-identity concept.
        </Callout>
      </Section>

      <Section
        title="Libraries used"
        summary="langgraph, langchain-anthropic, chromadb, pypdf/pdfplumber/python-docx, fastapi, PyJWT, dotenv."
      >
        <KeyValueTable
          rows={[
            ['Graph runtime', <>langgraph — <Code>StateGraph</Code>, <Code>MemorySaver</Code>, conditional edges</>],
            ['LLM binding', <>langchain-anthropic — <Code>ChatAnthropic</Code> (model <Code>claude-sonnet-5</Code>)</>],
            ['Structured output', <>pydantic — <Code>BaseModel</Code> schemas passed to <Code>with_structured_output()</Code></>],
            ['Vector store', <>chromadb — <Code>PersistentClient</Code>, on-disk, cosine distance</>],
            ['Embeddings', <>chromadb <Code>DefaultEmbeddingFunction</Code> — local ONNX all-MiniLM-L6-v2 (no API call, free)</>],
            ['PDF parsing', <>pypdf (first attempt) → pdfplumber (tolerant retry backend)</>],
            ['DOCX parsing', <>python-docx — reads paragraph text</>],
            ['API layer', <>fastapi + uvicorn + python-multipart (file uploads)</>],
            ['Auth', <>PyJWT — HS256 tokens, verified by a FastAPI <Code>HTTPBearer</Code> dependency</>],
            ['Config', <>python-dotenv — loads <Code>.env</Code> into the environment</>],
          ]}
        />
      </Section>

      <Section
        title="“Chunking” libraries — the honest answer"
        summary="None — whole-document embedding means no text splitter; only parsers turn files into text."
      >
        <p>
          Because we use whole-document embedding, there is <strong>no text-splitter library</strong>
          (no <Code>RecursiveCharacterTextSplitter</Code>, no LangChain splitters). The only
          document-processing libraries are the <em>parsers</em> that turn a file into raw text:
        </p>
        <CodeBlock
          caption="app/services/parsing.py — attempt-based backend switch"
          code={`def extract_text(file_path: str, attempt: int = 1) -> str:
    ext = Path(file_path).suffix.lower()
    if ext == ".pdf":
        # attempt 1 = pypdf (fast); attempt 2 = pdfplumber (tolerant)
        return (_extract_pdf_pypdf(file_path) if attempt == 1
                else _extract_pdf_pdfplumber(file_path))
    if ext == ".docx":
        return _extract_docx(file_path)          # python-docx
    if ext == ".txt":
        return Path(file_path).read_text(encoding="utf-8", errors="ignore")`}
        />
      </Section>

      <Section
        title="ChromaDB setup"
        summary="In-process PersistentClient with a local embedding function attached to the collection."
      >
        <p>
          Chroma runs in-process as a <Code>PersistentClient</Code> pointed at a local directory, so the
          index survives restarts with no external service. The embedding function is attached to the
          collection, meaning Chroma embeds both stored documents and incoming queries with the{' '}
          <em>same</em> local model automatically.
        </p>
        <CodeBlock
          caption="app/services/chroma_store.py"
          code={`self.client = chromadb.PersistentClient(path=settings.chroma_dir)
self.embedding_fn = embedding_functions.DefaultEmbeddingFunction()
self.collection = self.client.get_or_create_collection(
    name=settings.chroma_collection,
    embedding_function=self.embedding_fn,
)`}
        />
        <Callout title="Why resume_id, not filename, is the Chroma key" tone="blue">
          Filenames are mutable (the rename agent changes them). Using a filename as the document ID would
          orphan the old entry on any rename. A UUID <Code>resume_id</Code> is minted once at parse time and
          threaded unchanged through classify → rename → index, so re-indexing cleanly upserts.
        </Callout>
      </Section>

      <Section
        title="How env files load the keys"
        summary="config.py calls load_dotenv() then reads os.getenv into a Settings class; the key flows to get_llm()."
      >
        <p>
          <Code>app/config.py</Code> calls <Code>load_dotenv()</Code> at import, which reads the{' '}
          <Code>.env</Code> file into the process environment. A <Code>Settings</Code> class then pulls each
          value with <Code>os.getenv</Code>, applying defaults. Secrets never appear in code — they live
          only in <Code>.env</Code> (which is git-ignored; <Code>.env.example</Code> is the committed
          template).
        </p>
        <CodeBlock
          caption="app/config.py"
          code={`from dotenv import load_dotenv
load_dotenv()

class Settings:
    anthropic_api_key: str = os.getenv("ANTHROPIC_API_KEY", "")
    anthropic_model: str   = os.getenv("ANTHROPIC_MODEL", "claude-sonnet-5")
    allowed_email: str     = os.getenv("ALLOWED_EMAIL", "your-email@example.com")
    jwt_secret: str        = os.getenv("JWT_SECRET", "dev-secret-change-me")

settings = Settings()`}
        />
        <p>The key then flows into the LLM client — the only place the raw secret is used:</p>
        <CodeBlock
          caption="app/services/llm.py"
          code={`def get_llm() -> ChatAnthropic:
    # temperature omitted: claude-sonnet-5 rejects it as deprecated
    return ChatAnthropic(
        model=settings.anthropic_model,
        api_key=settings.anthropic_api_key,
    )`}
        />
      </Section>
    </>
  )
}
