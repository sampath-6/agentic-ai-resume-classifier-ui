import { useState } from 'react'
import {
  GitBranch,
  Workflow,
  Search,
  Layout,
  Sparkles,
  Network,
  ChevronsDownUp,
  ChevronsUpDown,
} from 'lucide-react'
import { DesignJourneyPage } from './DesignJourneyPage'
import { ArchitecturePage } from './ArchitecturePage'
import { LangGraphPage } from './LangGraphPage'
import { SemanticQueryPage } from './SemanticQueryPage'
import { FrontendPage } from './FrontendPage'
import { EndpointsPage } from './EndpointsPage'
import { CollapseProvider, useCollapseControls } from './primitives'

const PAGES = [
  { id: 'design', label: 'Design Journey', icon: Sparkles, Component: DesignJourneyPage },
  { id: 'architecture', label: 'Architecture & Flow', icon: Workflow, Component: ArchitecturePage },
  { id: 'langgraph', label: 'LangGraph & Stack', icon: GitBranch, Component: LangGraphPage },
  { id: 'query', label: 'Semantic Query', icon: Search, Component: SemanticQueryPage },
  { id: 'endpoints', label: 'REST API', icon: Network, Component: EndpointsPage },
  { id: 'frontend', label: 'Frontend', icon: Layout, Component: FrontendPage },
] as const

function CollapseButtons() {
  const controls = useCollapseControls()
  if (!controls) return null
  return (
    <div className="ml-auto flex shrink-0 items-center gap-1.5">
      <button
        onClick={controls.openAll}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
      >
        <ChevronsUpDown size={14} />
        Expand all
      </button>
      <button
        onClick={controls.closeAll}
        className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-blue-50 hover:text-blue-700"
      >
        <ChevronsDownUp size={14} />
        Collapse all
      </button>
    </div>
  )
}

export function Docs() {
  const [active, setActive] = useState<(typeof PAGES)[number]['id']>('design')
  const ActiveComponent = PAGES.find((p) => p.id === active)!.Component

  return (
    <CollapseProvider>
      <div className="flex flex-1 flex-col overflow-hidden">
        <nav className="flex shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2">
          {PAGES.map((page) => {
            const Icon = page.icon
            const isActive = page.id === active
            return (
              <button
                key={page.id}
                onClick={() => setActive(page.id)}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Icon size={16} />
                {page.label}
              </button>
            )
          })}
          <CollapseButtons />
        </nav>
        <div className="flex-1 overflow-y-auto bg-slate-50">
          <div className="mx-auto max-w-4xl p-6">
            {/* ActiveComponent changes per tab; its Sections remount collapsed */}
            <ActiveComponent />
          </div>
        </div>
      </div>
    </CollapseProvider>
  )
}
