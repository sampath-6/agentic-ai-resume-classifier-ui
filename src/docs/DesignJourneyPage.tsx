import { User, Sparkles, CheckCircle2 } from 'lucide-react'
import { PageHeader, Section, Card, Callout, Badge } from './primitives'

interface Iteration {
  phase: string
  sam: string
  claude: string
  outcome: string
  why: string
}

const ITERATIONS: Iteration[] = [
  {
    phase: '1. Opening ask',
    sam: 'Can you generate a Python project for resume classification? I want to upload resumes, query them for relevant keywords, and pull up the matching ones. Act as a senior Python dev who knows multi-agent systems — I’m especially keen to explore LangGraph itself: states, routing, memory, loops, conditional edges, and how many agents we can realistically create.',
    claude:
      'Before writing anything, laid out the LangGraph primitives (state, nodes, edges, conditional edges as the branch + loop mechanism) and four multi-agent topologies (pipeline, supervisor/router, network, hierarchical) — recommending supervisor/router because the project’s control logic maps directly onto conditional edges off a central dispatcher.',
    outcome: 'Landed on the supervisor/router pattern: 5 specialist agents + 1 supervisor.',
    why: 'This is the one decision that never got revisited — everything after iterated on top of this skeleton, not around it.',
  },
  {
    phase: '2. Environment reality check',
    sam: '(implicit — proceeded assuming chromadb was already installed)',
    claude:
      'Checked the actual Python environments on the machine before scaffolding and found neither chromadb nor langgraph installed anywhere — only pinecone was present. Flagged it rather than assuming.',
    outcome: 'Surfaced the gap early instead of discovering it at first run.',
    why: 'Set the pattern for the whole session: verify before building, don’t take a stated assumption at face value.',
  },
  {
    phase: '3. Locking the stack',
    sam: '(answered via three quick scoping questions)',
    claude: 'Asked three scoping questions rather than guessing: LLM provider, interface, and Python environment.',
    outcome: 'Anthropic Claude + FastAPI + a new dedicated venv.',
    why: 'Avoided building a CLI or Streamlit app that would have been thrown away once the FastAPI answer came in.',
  },
  {
    phase: '4. First scaffold, then a venv detour',
    sam: 'I’ve got another project that already pulls in ChromaDB — you can reuse its environment at E:/claude-workspace/insurance/claims-assistant/back-end/.venv.',
    claude:
      'Checked that venv’s installed versions instead of reinstalling, tried to pin requirements.txt to match, hit a real conflict (that project’s langchain-core was too old for langchain-anthropic), and relaxed just those two pins rather than the whole file.',
    outcome: 'requirements.txt became a hybrid: exact pins where compatible, relaxed floors only where a new dependency demanded it.',
    why: 'A real example of not treating “reuse the other venv’s versions” as a blind copy-paste — the conflict had to be diagnosed, not just retried.',
  },
  {
    phase: '5. Guardrails — design first',
    sam: 'How would we apply guardrails here? Let’s not jump into coding yet — I’d like to work through the design first.',
    claude:
      'Mapped guardrails onto five categories (input/injection, schema, output/bias, process/runaway, human-in-the-loop) and showed where each would attach onto the graph as new nodes — before writing anything.',
    outcome: 'A menu of options, not a decision yet.',
    why: 'Sam explicitly stopped an in-progress pip install to force a design conversation first. This became the template: talk it through, then build.',
  },
  {
    phase: '6. Cost reality check on third-party tools',
    sam: 'What would the third-party tools cost us? And do any of them actually require an LLM call?',
    claude:
      'Broke down Presidio (free, local, no LLM), Guardrails AI (free lib, per-validator cost varies), and NeMo Guardrails (free lib, but needs LLM/embedding calls) — and recommended against all three for the two checks actually needed, since plain code was simpler than a framework.',
    outcome: 'No third-party guardrail library adopted.',
    why: 'Sam was pricing this like a real budget decision, which kept the guardrail design lean instead of framework-heavy.',
  },
  {
    phase: '7. Sam’s own guardrail design',
    sam: 'Could we just build our own guardrails? Something like: keep a file of comma-separated words to exclude — PII and certain keywords — check those first, and only then hand it off to an LLM (maybe a dedicated agent) for a closer look. What do you think of that approach?',
    claude:
      'Validated the layered idea (cheap deterministic gate before the expensive LLM call) and refined the edges: word-boundary matching over substring, splitting PII (needs regex) from bias/injection terms (a keyword list works), and sending only the flagged snippet to the judge.',
    outcome: 'Layered keyword-screen + gated LLM-judge confirmed as the mechanism, applied generically.',
    why: 'This was Sam’s own architectural idea — Claude’s role was pressure-testing it, not proposing an alternative.',
  },
  {
    phase: '8. Scope correction — guardrail on the query, not the document',
    sam: 'I don’t think we should be running the guardrail over the whole document. Once a resume is uploaded, the user queries it — so the guardrail belongs on that query, not the document. Sending the entire document would just burn tokens.',
    claude:
      'Corrected course immediately — dropped the resume-document guardrail entirely and moved the whole mechanism onto query_text, which is small enough that even the LLM-judge step is cheap regardless of corpus size.',
    outcome: 'Guardrail scope: query-side only.',
    why: 'A real scope catch from Sam — the original design would have meant one LLM call per uploaded resume at scale.',
  },
  {
    phase: '9. The requirement that reshaped the Chroma key',
    sam: 'The core functionality is to query the resumes and make each one downloadable — the end user is going to download and read the actual file anyway.',
    claude:
      'Two things fell out: (1) dropped PII-redaction-on-answer, since redacting the summary is pointless when the raw file is one click away; (2) designed the download as a plain FastAPI route, NOT a LangGraph node, since fetching a file by ID involves no judgment or branching.',
    outcome: 'Download scoped as GET /api/resumes/{resume_id}/download, outside the agent graph.',
    why: 'Established a principle reused repeatedly: not every feature belongs inside the multi-agent system — some things are just a database read.',
  },
  {
    phase: '10. Storing context + filename → the stable-key redesign',
    sam: 'Could we add an agent that stores the resume’s context along with its filename? And what should we actually use as the key when indexing into ChromaDB?',
    claude:
      'Pointed out this was already indexer_agent’s job, but that the existing key (the mutable filename) was fragile — any rename would orphan the old entry. Proposed a stable UUID (resume_id), generated once at first parse, with filename demoted to metadata.',
    outcome: 'resume_id (UUID) became the permanent Chroma document ID; no new agent needed.',
    why: 'Sam’s “can we create an agent” led to explaining why the existing agent was fine but its key scheme wasn’t — a design change, not more code.',
  },
  {
    phase: '11. Confirming the click-to-download flow',
    sam: 'We need to store everything in Chroma and surface the filenames back to the user — and clicking a filename should download that file. Let’s build it in the best-architected way we can with the multi-agent system.',
    claude:
      'Tied resume_id, the query response shape (display_name + download_url per match), and the download endpoint into one flow, and explained why an opaque UUID for downloads closes the path-traversal risk that the upload endpoint must actively guard against.',
    outcome: 'Full click-to-download flow finalized: resume_id key, download_url in responses, ID-only download endpoint.',
    why: 'Where the security benefit of the UUID redesign (iter. 10) paid off concretely, not just as hygiene.',
  },
  {
    phase: '12. Sam’s upload pipeline proposal',
    sam: 'Here’s the flow I’m picturing: the supervisor hands off to an analyzer agent that reads the file size, then a conditional node before the next agent — if it’s over 2MB, reject it; otherwise continue. After that, rename the file to Firstname_Lastname_YearsOfExperience and index it into Chroma.',
    claude:
      'Mapped this onto the graph but flagged a naming collision Sam hadn’t noticed: “retriever agent” was already the query-side search node. Proposed rename_agent as a distinct name, and surfaced two edge cases: which fields the rename needs (from the classifier) and what happens on a filename collision.',
    outcome: 'analyzer_agent (size gate) and rename_agent (distinct from retrieval_agent) added; classifier schema extended.',
    why: 'Sam designed the pipeline shape here — Claude caught the naming collision and the rename edge case before they became bugs.',
  },
  {
    phase: '13. The folder-watcher pivot',
    sam: 'I’d like the files stored in /uploads/resume/, and the classification agent should pick them up in a loop whenever a new file is uploaded. I definitely want a loop here — which LangGraph looping approach would you suggest?',
    claude:
      'Redesigned the upload branch around an inbox/indexed/rejected/failed folder tree with a scan_folder node that drains the inbox in a loop, re-scanning after every file. Recommended synchronous drain-on-upload because the loop mechanics are identical regardless of trigger, and background/scheduled triggers add infrastructure orthogonal to learning LangGraph.',
    outcome: 'Folder-drain loop, triggered synchronously from the upload endpoint, swappable later without touching the graph.',
    why: 'The most direct example of the stated goal (explore LangGraph loops) shaping a decision — the simplest trigger best demonstrated the concept.',
  },
  {
    phase: '14. Diagram detour',
    sam: 'Could you show me the design visually? I’m having trouble following the text — and just the upload mechanism for now.',
    claude: 'Started building an SVG flowchart of the upload branch and loaded the diagram design guidance.',
    outcome: 'Sam interrupted before it finished and asked for text instead.',
    why: 'A rare reversal — the visual format didn’t land, and Sam redirected to structured text (tables, node lists), the format the rest of the session used successfully.',
  },
  {
    phase: '15. Memory, chunking & result-count — knob tuning',
    sam: 'What about the memory design — what are our options for contextual memory? Top 20 results is fine, by the way. And while we’re indexing, what are the chunking options? Could you put them in a table so I can see which is more efficient?',
    claude:
      'For memory: separated within-conversation follow-up memory (needs a session concept) from cross-session persistent memory (LangGraph Store, needs a user identity) and recommended stateless queries since neither prerequisite exists. For chunking: a five-option comparison table, recommending whole-document now with a cheap hybrid skills-vector as the upgrade path.',
    outcome: 'Queries stay stateless; chunking stays whole-document; top_k = 20 fetched, top 5 narrated.',
    why: 'Several “what are my options” questions in a row — the thread was picking the option that fit what already existed over the theoretically-best one.',
  },
  {
    phase: '16. Closing the loop before implementation',
    sam: 'Is there anything else we should talk through before we start implementing?',
    claude:
      'Did a settled-vs-open pass across the whole conversation and found two genuinely unresolved decisions: what happens on a rename collision, and what format the guardrail keyword file should take. Asked both directly instead of assuming.',
    outcome: 'Auto-increment suffix on collision (John_Smith_5 → John_Smith_5_2); plain comma-separated keyword list (Sam’s simpler proposal, kept over category-tagged pairs).',
    why: 'Even at the end, one of Sam’s earlier proposals won over Claude’s refinement — simplicity was preferred where extra structure wasn’t earning its keep.',
  },
]

function Turn({ iter }: { iter: Iteration }) {
  const isNote = iter.sam.startsWith('(')
  return (
    <>
      <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-blue-700">
          <User size={13} /> Sam
        </p>
        {isNote ? (
          <p className="text-sm text-slate-500 italic">{iter.sam}</p>
        ) : (
          <p className="text-sm text-slate-700 italic">“{iter.sam}”</p>
        )}
      </div>
      <div className="rounded-lg border border-violet-100 bg-violet-50/40 p-3">
        <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-violet-700">
          <Sparkles size={13} /> Claude
        </p>
        <p className="text-sm text-slate-700">{iter.claude}</p>
      </div>
      <p className="flex items-start gap-1.5 text-sm text-emerald-700">
        <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
        <span>
          <strong>Outcome:</strong> {iter.outcome}
        </span>
      </p>
      <Callout title="Why it mattered" tone="amber">
        {iter.why}
      </Callout>
    </>
  )
}

export function DesignJourneyPage() {
  return (
    <>
      <PageHeader
        title="How This Project Was Designed with Claude"
        subtitle="Before a line of implementation code, the architecture was groomed through a back-and-forth between Sam and Claude. This is that design conversation — 16 iterations where a proposal met a trade-off, scope got corrected, and the design tightened one notch at a time."
      />

      <Section
        title="The overview"
        summary="Explore-LangGraph-first, not build-fastest. Propose → trade-offs → correct → tighten."
        defaultOpen
      >
        <p>
          Sam came in wanting to <strong>explore LangGraph multi-agent concepts through a real project</strong>,
          not just build the fastest thing that works. The conversation moved in a pattern that repeated
          itself: Sam proposed a feature or asked “what are my options,” Claude laid out the trade-offs, Sam
          corrected the scope or picked a direction, and the architecture tightened by one more notch.
        </p>
        <p>
          Almost nothing was accepted on the first pass — most of the interesting decisions (the Chroma key,
          the guardrail scope, the folder-drain loop) came from Sam pushing back on an initial version Claude
          proposed.
        </p>
        <Callout title="The recurring pattern" tone="blue">
          Sam proposes a feature or asks “what are the options” → Claude lays out trade-offs and a
          recommendation → Sam corrects the scope (guardrail on query not document; download makes
          PII-redaction moot) or picks between options (stateless memory, whole-doc chunking, plain keyword
          list) → the architecture gets one notch more specific. <strong>Very little was accepted exactly as
          first proposed by either side.</strong>
        </Callout>
      </Section>

      {ITERATIONS.map((iter) => (
        <Section key={iter.phase} title={iter.phase} summary={iter.outcome}>
          <Turn iter={iter} />
        </Section>
      ))}

      <Section
        title="Where it landed"
        summary="6-node supervisor/router graph · 3 loops · stable UUID key · query-only guardrails."
      >
        <p>The design conversation converged on:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Card>
            <p className="font-semibold text-blue-900">Upload side</p>
            <p className="mt-1 text-xs text-slate-600">
              scan_folder · analyzer_agent · ingestion_agent · classifier_agent · rename_agent · indexer_agent
            </p>
          </Card>
          <Card>
            <p className="font-semibold text-blue-900">Query side</p>
            <p className="mt-1 text-xs text-slate-600">
              query_guardrail_agent · retrieval_agent · synthesizer_agent
            </p>
          </Card>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue">3 loops: parse-retry · folder-drain · broaden-search</Badge>
          <Badge tone="green">Chroma keyed by stable resume_id UUID</Badge>
          <Badge tone="purple">Guardrails: query-side only</Badge>
          <Badge tone="slate">Download endpoint outside the graph</Badge>
        </div>
        <p className="text-xs text-slate-500">
          The full technical specification produced from this conversation was captured separately in{' '}
          <code className="rounded bg-blue-50 px-1 py-0.5 font-mono text-blue-800">design_summary.json</code>,
          which drove the implementation.
        </p>
      </Section>

      <Section
        title="The coding phase — how the build unfolded"
        summary="Design was settled, but implementation still surfaced its own decisions: offline testing, a model quirk, a billing mix-up, and UI polish from real runs."
      >
        <p>
          The design conversation settled the architecture, but building it surfaced a second round of
          decisions — this time driven by what the running code actually did. The same pattern held:
          hit a wall, discuss the options, pick the pragmatic one.
        </p>

        <div className="space-y-3">
          <Card className="border-l-4 border-l-blue-500">
            <p className="font-semibold text-blue-900">Testing the pipeline while the LLM was blocked</p>
            <p className="mt-1 text-xs text-slate-600">
              Anthropic credits weren’t live yet, so the classifier (the one LLM step in ingestion) couldn’t
              run. Rather than wait, we <strong>stubbed only that node</strong> with a deterministic fake and
              ran real files through the real folder-drain loop and real Chroma — proving pickup → rename →
              collision-handling → indexing → retrieval all worked offline. The blocker was isolated to a
              single node instead of stalling the whole build.
            </p>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <p className="font-semibold text-amber-900">A model quirk: temperature is deprecated</p>
            <p className="mt-1 text-xs text-slate-600">
              The first real Claude call failed with{' '}
              <code className="font-mono">temperature is deprecated for this model</code>.{' '}
              <code className="font-mono">claude-sonnet-5</code> rejects the parameter, so{' '}
              <code className="font-mono">get_llm()</code> was changed to omit it entirely — a one-line fix,
              but only findable by running the real call.
            </p>
          </Card>

          <Card className="border-l-4 border-l-rose-400">
            <p className="font-semibold text-rose-700">Diagnosing a billing mix-up, not a bug</p>
            <p className="mt-1 text-xs text-slate-600">
              Even after credits were purchased, calls still failed with “credit balance too low.” We traced
              it to an <strong>account/organization mismatch</strong> — the pasted API key belonged to a
              different Anthropic account than the funded one — rather than chasing it as a code error. The
              fix was a new key from the funded account.
            </p>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <p className="font-semibold text-emerald-900">UI polish driven by real output</p>
            <p className="mt-1 text-xs text-slate-600">
              Running actual queries exposed three fixes the mockups didn’t: the query response omitted{' '}
              <code className="font-mono">years_experience</code> (blank column), the match-score formula
              collapsed to 0% for real cosine distances, and the synthesized answer rendered as raw markdown.
              Each was caught by looking at the live result, not the spec.
            </p>
          </Card>

          <Card className="border-l-4 border-l-violet-500">
            <p className="font-semibold text-violet-900">Documentation as a first-class surface</p>
            <p className="mt-1 text-xs text-slate-600">
              These very pages grew iteratively too — from flat text, to collapsible accordions “so I can see
              all the sections at once,” to added tables, diagrams, and this design narrative. The docs were
              treated as part of the product, not an afterthought.
            </p>
          </Card>
        </div>

        <Callout title="The through-line" tone="blue">
          Whether designing or coding, the loop never changed: surface the real constraint (a cost, a model
          error, a billing quirk, a blank column), talk through the options, and take the simplest fix that
          fit what already existed.
        </Callout>
      </Section>
    </>
  )
}
