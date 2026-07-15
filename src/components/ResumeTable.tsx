import { useMemo, useState } from 'react'
import { Download, Search } from 'lucide-react'
import type { Match, Resume } from '../api/types'
import { downloadResume } from '../api/download'

interface ResumeTableProps {
  resumes: (Resume | Match)[]
  searchable?: boolean
  emptyMessage?: string
}

function isMatch(resume: Resume | Match): resume is Match {
  return 'distance' in resume
}

export function ResumeTable({ resumes, searchable = true, emptyMessage }: ResumeTableProps) {
  const [query, setQuery] = useState('')
  const [downloadError, setDownloadError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!query.trim()) return resumes
    const q = query.trim().toLowerCase()
    return resumes.filter((r) =>
      [r.display_name, r.primary_role, r.skills, r.seniority].some((field) =>
        field?.toLowerCase().includes(q),
      ),
    )
  }, [resumes, query])

  async function handleDownload(resumeId: string, displayName: string) {
    setDownloadError(null)
    try {
      await downloadResume(resumeId, displayName)
    } catch {
      setDownloadError(`Could not download ${displayName}'s resume.`)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {searchable && (
        <div className="relative">
          <Search size={16} className="absolute top-1/2 left-3 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, role, skill, or seniority…"
            className="w-full rounded-lg border border-slate-200 py-2 pr-3 pl-9 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
      )}

      {downloadError && <p className="text-sm text-red-600">{downloadError}</p>}

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-blue-50 text-xs tracking-wide text-blue-900 uppercase">
            <tr>
              <th className="px-4 py-2.5 font-medium">Name</th>
              <th className="px-4 py-2.5 font-medium">Role</th>
              <th className="px-4 py-2.5 font-medium">Seniority</th>
              <th className="px-4 py-2.5 font-medium">Years</th>
              <th className="px-4 py-2.5 font-medium">Skills</th>
              {resumes.some(isMatch) && <th className="px-4 py-2.5 font-medium">Match</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  {emptyMessage ?? 'No resumes found.'}
                </td>
              </tr>
            ) : (
              filtered.map((resume) => (
                <tr key={resume.resume_id} className="hover:bg-blue-50/40">
                  <td className="px-4 py-2.5">
                    <button
                      onClick={() => handleDownload(resume.resume_id, resume.display_name)}
                      className="flex items-center gap-1.5 font-medium text-blue-700 hover:underline"
                    >
                      <Download size={14} />
                      {resume.display_name}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-slate-700">{resume.primary_role}</td>
                  <td className="px-4 py-2.5 text-slate-700 capitalize">{resume.seniority}</td>
                  <td className="px-4 py-2.5 text-slate-700">{resume.years_experience}</td>
                  <td className="max-w-xs truncate px-4 py-2.5 text-slate-500" title={resume.skills}>
                    {resume.skills}
                  </td>
                  {resumes.some(isMatch) && (
                    <td className="px-4 py-2.5 text-slate-700">
                      {isMatch(resume)
                        ? `${Math.min(100, Math.max(0, (1 - resume.distance / 2) * 100)).toFixed(0)}%`
                        : ''}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
