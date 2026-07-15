import { useCallback, useEffect, useRef, useState } from 'react'
import { CheckCircle2, Loader2, UploadCloud, XCircle } from 'lucide-react'
import { apiClient, extractErrorMessage } from '../api/client'
import type { Resume, UploadResult } from '../api/types'
import { ResumeTable } from '../components/ResumeTable'

export function UploadSession() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [lastResult, setLastResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadResumes = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data } = await apiClient.get<{ resumes: Resume[] }>('/resumes')
      setResumes(data.resumes)
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not load resumes'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadResumes()
  }, [loadResumes])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    setSelectedFiles(Array.from(e.target.files ?? []))
  }

  async function handleUpload() {
    if (selectedFiles.length === 0) return
    setIsUploading(true)
    setError(null)
    setLastResult(null)
    try {
      const formData = new FormData()
      selectedFiles.forEach((file) => formData.append('files', file))
      const { data } = await apiClient.post<UploadResult>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setLastResult(data)
      setSelectedFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      await loadResumes()
    } catch (err) {
      setError(extractErrorMessage(err, 'Upload failed'))
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <div className="mx-auto flex max-w-4xl flex-1 flex-col gap-6 overflow-y-auto p-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-800">Upload Resumes</h1>
        <p className="text-sm text-slate-500">
          Upload candidate resumes (.pdf, .docx, .txt, up to 2MB each). They'll be parsed,
          classified, and indexed automatically.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-blue-300 bg-blue-50/50 p-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white">
            <UploadCloud size={20} />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.txt"
            onChange={handleFileSelect}
            className="text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
          />
          {selectedFiles.length > 0 && (
            <p className="text-xs text-slate-500">{selectedFiles.length} file(s) selected</p>
          )}
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || isUploading}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUploading ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            {isUploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>}

      {lastResult && (
        <div className="flex flex-col gap-1.5 rounded-lg border border-slate-200 bg-white p-4 text-sm">
          <p className="flex items-center gap-1.5 text-emerald-600">
            <CheckCircle2 size={14} /> Indexed: {lastResult.indexed.length}
          </p>
          {lastResult.rejected.length > 0 && (
            <p className="flex items-center gap-1.5 text-amber-600">
              <XCircle size={14} /> Rejected (over 2MB): {lastResult.rejected.length}
            </p>
          )}
          {lastResult.failed.length > 0 && (
            <p className="flex items-center gap-1.5 text-red-600">
              <XCircle size={14} /> Failed to parse: {lastResult.failed.length}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-slate-700">
          Indexed candidates ({resumes.length})
        </h2>
        {isLoading ? (
          <p className="text-sm text-slate-400">Loading…</p>
        ) : (
          <ResumeTable resumes={resumes} emptyMessage="No resumes uploaded yet." />
        )}
      </div>
    </div>
  )
}
