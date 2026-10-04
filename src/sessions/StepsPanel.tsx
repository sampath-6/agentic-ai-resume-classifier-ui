import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, XCircle } from 'lucide-react'
import { fetchCheckpoints } from '../api/checkpoints'
import { extractErrorMessage } from '../api/client'
import type { Checkpoint } from '../api/types'

// "query_guardrail_agent" -> "Query Guardrail"
function prettify(node: string): string {
  return node
    .replace(/_agent$/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// The backend persists one checkpoint per graph superstep, each carrying the
// nodes queued to run next. Flattening those in chronological order yields the
// actual execution path (loops included).
function executionPath(chronological: Checkpoint[]): string[] {
  const nodes: string[] = []
  for (const c of chronological) {
    for (const n of c.next) {
      if (n.startsWith('__')) continue // skip LangGraph internals like __start__/__end__
      nodes.push(n)
    }
  }
  return nodes
}

export function StepsPanel({ threadId }: { threadId: string }) {
  const [chronological, setChronological] = useState<Checkpoint[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchCheckpoints(threadId)
      // backend returns newest-first; reverse to chronological
      setChronological([...data.checkpoints].reverse())
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load steps for this thread'))
    } finally {
      setIsLoading(false)
    }
  }, [threadId])

  useEffect(() => {
    load()
  }, [load])

  const path = chronological ? executionPath(chronological) : []
  const completed =
    chronological != null && chronological.length > 0 && chronological[chronological.length - 1].next.length === 0

  return (
    <div className="border-b border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-700">Graph steps</h3>
            <p className="font-mono text-[11px] text-slate-400" title={threadId}>
              {threadId}
            </p>
          </div>
          <button
            onClick={load}
            disabled={isLoading}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
            Refresh
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <XCircle size={14} /> {error}
          </div>
        )}

        {!error && isLoading && !chronological && (
          <p className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={14} className="animate-spin" /> Loading steps…
          </p>
        )}

        {!error && chronological && path.length === 0 && (
          <p className="text-sm text-slate-400">No steps recorded for this thread yet.</p>
        )}

        {!error && path.length > 0 && (
          <ol className="relative ml-2 border-l border-slate-300">
            {path.map((node, i) => (
              <li key={i} className="mb-3 ml-4 last:mb-0">
                <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-blue-500" />
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-medium text-slate-400">{i + 1}</span>
                  <span className="text-sm text-slate-700">{prettify(node)}</span>
                  <span className="font-mono text-[10px] text-slate-400">{node}</span>
                </div>
              </li>
            ))}
            {completed && (
              <li className="ml-4">
                <span className="absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-emerald-600">✓ Completed</span>
              </li>
            )}
          </ol>
        )}

        {chronological && (
          <p className="mt-3 text-[11px] text-slate-400">
            {chronological.length} checkpoint{chronological.length === 1 ? '' : 's'} persisted · read from
            SQLite (no LangSmith key required)
          </p>
        )}
      </div>
    </div>
  )
}
