import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { ChevronDown } from 'lucide-react'

export function PageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6 border-b border-blue-100 pb-5">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed text-slate-500">{subtitle}</p>
    </div>
  )
}

// ---- collapse-all coordination ----
interface CollapseCtxValue {
  command: 'open' | 'close' | null
  version: number
  openAll: () => void
  closeAll: () => void
}
const CollapseContext = createContext<CollapseCtxValue | null>(null)

export function CollapseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<{ command: 'open' | 'close' | null; version: number }>({
    command: null,
    version: 0,
  })
  const openAll = () => setState((s) => ({ command: 'open', version: s.version + 1 }))
  const closeAll = () => setState((s) => ({ command: 'close', version: s.version + 1 }))
  return (
    <CollapseContext.Provider value={{ ...state, openAll, closeAll }}>
      {children}
    </CollapseContext.Provider>
  )
}

export function useCollapseControls() {
  return useContext(CollapseContext)
}

export function Section({
  title,
  summary,
  titleBadge,
  defaultOpen = false,
  children,
}: {
  title: string
  summary?: string
  titleBadge?: ReactNode
  defaultOpen?: boolean
  children: ReactNode
}) {
  const ctx = useContext(CollapseContext)
  const [open, setOpen] = useState(defaultOpen)
  const lastVersion = useRef(ctx?.version ?? 0)

  // respond to Expand all / Collapse all, but not on initial mount
  useEffect(() => {
    if (!ctx) return
    if (ctx.version !== lastVersion.current) {
      lastVersion.current = ctx.version
      if (ctx.command) setOpen(ctx.command === 'open')
    }
  }, [ctx, ctx?.version])

  return (
    <section className="mb-2.5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50/60"
      >
        <span className="h-5 w-1 shrink-0 rounded-full bg-blue-600" />
        <span className="flex-1">
          <span className="flex items-center gap-2">
            {titleBadge}
            <span className="text-base font-semibold text-blue-900">{title}</span>
          </span>
          {summary && !open && (
            <span className="mt-0.5 block text-xs font-normal text-slate-500">{summary}</span>
          )}
        </span>
        <ChevronDown
          size={18}
          className={`shrink-0 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-100 px-4 py-4 text-sm leading-relaxed text-slate-700">
          {children}
        </div>
      )}
    </section>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm ${className}`}>
      {children}
    </div>
  )
}

export function Badge({
  children,
  tone = 'blue',
}: {
  children: ReactNode
  tone?: 'blue' | 'green' | 'amber' | 'slate' | 'purple'
}) {
  const tones: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-emerald-100 text-emerald-700',
    amber: 'bg-amber-100 text-amber-700',
    slate: 'bg-slate-200 text-slate-700',
    purple: 'bg-violet-100 text-violet-700',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-blue-50 px-1.5 py-0.5 font-mono text-[0.8em] text-blue-800">
      {children}
    </code>
  )
}

export function CodeBlock({ code, caption }: { code: string; caption?: string }) {
  return (
    <figure className="my-3 overflow-hidden rounded-lg border border-slate-800">
      {caption && (
        <figcaption className="border-b border-slate-700 bg-slate-800 px-3 py-1.5 font-mono text-xs text-slate-300">
          {caption}
        </figcaption>
      )}
      <pre className="overflow-x-auto bg-slate-900 p-3 text-xs leading-relaxed text-slate-100">
        <code className="font-mono">{code}</code>
      </pre>
    </figure>
  )
}

export function Callout({
  title,
  tone = 'blue',
  children,
}: {
  title: string
  tone?: 'blue' | 'amber' | 'green'
  children: ReactNode
}) {
  const tones: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50',
    amber: 'border-amber-200 bg-amber-50',
    green: 'border-emerald-200 bg-emerald-50',
  }
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${tones[tone]}`}>
      <p className="mb-1 font-semibold text-slate-800">{title}</p>
      <div className="text-slate-600">{children}</div>
    </div>
  )
}

export type FlowKind = 'api' | 'agent' | 'edge' | 'end' | 'store'

export interface FlowStepDef {
  name: string
  kind: FlowKind
  llm?: boolean
  detail?: string
  condition?: string
}

const KIND_STYLE: Record<FlowKind, { box: string; label: string }> = {
  api: { box: 'border-violet-300 bg-violet-50 text-violet-900', label: 'REST' },
  agent: { box: 'border-blue-300 bg-blue-50 text-blue-900', label: 'agent' },
  edge: { box: 'border-amber-300 bg-amber-50 text-amber-900', label: 'edge' },
  store: { box: 'border-emerald-300 bg-emerald-50 text-emerald-900', label: 'store' },
  end: { box: 'border-slate-300 bg-slate-100 text-slate-700', label: 'end' },
}

export function Flow({ steps }: { steps: FlowStepDef[] }) {
  return (
    <div className="flex flex-col">
      {steps.map((step, i) => (
        <div key={i} className="flex flex-col">
          <div className={`rounded-lg border px-3 py-2 ${KIND_STYLE[step.kind].box}`}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-semibold">{step.name}</span>
              <span className="rounded bg-white/60 px-1.5 py-0.5 text-[0.65rem] uppercase tracking-wide">
                {KIND_STYLE[step.kind].label}
              </span>
              {step.llm && (
                <span className="rounded bg-violet-600 px-1.5 py-0.5 text-[0.65rem] font-medium text-white">
                  LLM call
                </span>
              )}
            </div>
            {step.detail && <p className="mt-1 text-xs text-slate-600">{step.detail}</p>}
          </div>
          {i < steps.length - 1 && (
            <div className="flex flex-col items-center py-1">
              <div className="h-4 w-px bg-slate-300" />
              {step.condition && (
                <span className="my-0.5 rounded-full border border-slate-200 bg-white px-2 py-0.5 font-mono text-[0.7rem] text-slate-500">
                  {step.condition}
                </span>
              )}
              <span className="text-slate-400">▼</span>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export function KeyValueTable({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full min-w-[520px] text-left text-sm">
        <tbody className="divide-y divide-slate-100">
          {rows.map(([k, v], i) => (
            <tr key={i} className="align-top">
              <td className="w-1/3 bg-slate-50 px-3 py-2 font-medium text-slate-700">{k}</td>
              <td className="px-3 py-2 text-slate-600">{v}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
