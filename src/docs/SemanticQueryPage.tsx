import {
  PageHeader,
  Section,
  Card,
  Callout,
  Code,
  CodeBlock,
  Badge,
  Flow,
  KeyValueTable,
  type FlowStepDef,
} from './primitives'

const QUERY_STEPS: FlowStepDef[] = [
  { name: 'query_guardrail_agent', kind: 'agent', llm: true, detail: 'Keyword screen (always) → Claude judge (only on a hit).', condition: 'pass' },
  { name: 'retrieval_agent', kind: 'store', detail: 'collection.query(query_texts=[q], n_results=20, where=filter)', condition: 'synthesize' },
  { name: 'synthesizer_agent', kind: 'agent', llm: true, detail: 'get_llm().invoke(prompt) over top 3–5 → prose answer' },
  { name: 'END', kind: 'end', detail: 'routes.py returns { answer, matches[] }' },
]

export function SemanticQueryPage() {
  return (
    <>
      <PageHeader
        title="How Semantic Query Works"
        subtitle="A recruiter query flows through a guardrail, a vector search over ChromaDB, and an LLM synthesis step. The full match list is returned as structured data; only the top few are narrated."
      />

      <Section title="End-to-end query flow">
        <Card>
          <Flow steps={QUERY_STEPS} />
        </Card>
      </Section>

      <Section title="Step 1 — the guardrail (cheap first, LLM only if needed)">
        <p>
          The guardrail is two layers. A <strong>deterministic keyword screen</strong> always runs at zero
          cost against a plain comma-separated keyword file. <strong>Only on a keyword hit</strong> does it
          escalate to a single Claude judge call that decides whether the match is a genuine problem
          (prompt injection, or discriminatory intent by age/gender/disability) versus a false positive
          (e.g. “senior” as a legitimate job level).
        </p>
        <CodeBlock
          caption="app/agents/query_guardrail.py (core logic)"
          code={`matches = _matched_keywords(query_text)      # substring screen, no LLM
if not matches:
    return {"guardrail_blocked": False}      # pass straight through

# keyword hit → escalate to a structured LLM judge
judgement: GuardrailJudgement = (
    get_llm().with_structured_output(GuardrailJudgement)
             .invoke(_JUDGE_PROMPT.format(query=query_text,
                                          keywords=", ".join(matches)))
)
if judgement.is_problem:
    return {"guardrail_blocked": True, "guardrail_reason": judgement.reason}`}
        />
        <p>
          <Code>GuardrailJudgement</Code> is a Pydantic model with <Code>is_problem: bool</Code> and{' '}
          <Code>reason: str</Code>. A block short-circuits to <Code>END</Code>; the route returns HTTP 400
          with the reason, and the UI renders it as a blocked chat message.
        </p>
      </Section>

      <Section title="Step 2 — retrieval against ChromaDB">
        <p>
          The retrieval agent calls the store, which delegates to Chroma’s <Code>collection.query</Code>.
          The query text is embedded by the <em>same local model</em> attached to the collection — no LLM,
          no API call for the embedding. Distances are cosine.
        </p>
        <CodeBlock
          caption="app/agents/retrieval.py → app/services/chroma_store.py"
          code={`# retrieval_agent: first pass honors metadata filter, retry drops it
where = state.get("where_filter") if attempts == 0 else None
results = store.query(state["query_text"], n_results=settings.top_k, where=where)

# ChromaStore.query
def query(self, query_text, n_results=20, where=None):
    return self.collection.query(
        query_texts=[query_text],   # Chroma embeds this with all-MiniLM-L6-v2
        n_results=n_results,
        where=where,                # e.g. {"seniority": "senior"}
    )`}
        />
        <KeyValueTable
          rows={[
            ['Method call', <Code>collection.query(query_texts, n_results, where)</Code>],
            ['Input', <>the recruiter’s query string + optional metadata filter</>],
            ['Embedding model', <>all-MiniLM-L6-v2 (ONNX, local, 384-dim) via <Code>DefaultEmbeddingFunction</Code></>],
            ['Distance metric', <>cosine (Chroma default for this embedding function)</>],
            ['Output', <>parallel lists: <Code>documents</Code>, <Code>metadatas</Code>, <Code>distances</Code> (top 20)</>],
            ['Broaden loop', <>if empty and <Code>broaden_attempts &lt; 2</Code>, retry with the filter dropped</>],
          ]}
        />
      </Section>

      <Section title="Step 3 — LLM synthesis">
        <p>
          The synthesizer builds a compact context from only the top <Code>narration_count</Code> (5)
          matches’ metadata and asks Claude for a ranked prose summary. This is an unstructured call —
          the return value is the message’s <Code>.content</Code> string.
        </p>
        <CodeBlock
          caption="app/agents/synthesizer.py"
          code={`top = retrieved[: settings.narration_count]           # top 5
context = "\\n\\n".join(
    f"- {r['metadata'].get('display_name')}: skills=[{r['metadata'].get('skills')}], "
    f"seniority={r['metadata'].get('seniority')}, role={r['metadata'].get('primary_role')}"
    for r in top
)
response = get_llm().invoke(_PROMPT.format(query=state["query_text"], context=context))
return {"answer": response.content}`}
        />
        <div className="grid gap-3 sm:grid-cols-3">
          <Card>
            <p className="text-xs font-semibold text-slate-500">LIBRARY</p>
            <p className="mt-1 text-sm text-slate-700">langchain-anthropic <Code>ChatAnthropic</Code></p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-slate-500">METHOD</p>
            <p className="mt-1 text-sm text-slate-700"><Code>llm.invoke(prompt)</Code></p>
          </Card>
          <Card>
            <p className="text-xs font-semibold text-slate-500">RETURNS</p>
            <p className="mt-1 text-sm text-slate-700"><Code>AIMessage</Code> → <Code>.content</Code> (str)</p>
          </Card>
        </div>
        <Callout title="Structured vs. unstructured LLM calls" tone="blue">
          The classifier and guardrail use <Code>.with_structured_output(PydanticModel)</Code> — Claude
          returns a validated object. The synthesizer uses a plain <Code>.invoke()</Code> because its
          output is free-form prose. Same client (<Code>get_llm()</Code>), different binding.
        </Callout>
      </Section>

      <Section title="The response shape">
        <p>
          Narration covers only the top 3–5, but the API returns the full fetched list separately, so the
          UI can render a complete, scannable results table with downloadable names.
        </p>
        <CodeBlock
          caption="POST /api/query response"
          code={`{
  "answer": "Ranked prose summary of the top matches…",
  "matches": [
    {
      "resume_id": "bc6bb2af-…",
      "display_name": "John Doe",
      "seniority": "senior",
      "primary_role": "Java Microservices Developer",
      "skills": "Java, Spring, Kafka, Microservices, …",
      "years_experience": 14.0,
      "download_url": "/api/resumes/bc6bb2af-…/download",
      "distance": 0.958
    }
    // … up to 20
  ]
}`}
        />
        <p className="flex flex-wrap gap-2 text-xs">
          <Badge tone="purple">2 LLM calls max</Badge>
          <Badge tone="green">0 LLM calls for embedding</Badge>
          <Badge tone="blue">top 20 fetched</Badge>
          <Badge tone="slate">top 5 narrated</Badge>
        </p>
      </Section>
    </>
  )
}
