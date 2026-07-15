import { apiClient } from './client'

function parseFilename(contentDisposition: string | undefined, fallback: string): string {
  if (!contentDisposition) return fallback
  const match = /filename="?([^"]+)"?/.exec(contentDisposition)
  return match?.[1] ?? fallback
}

export async function downloadResume(resumeId: string, displayName: string) {
  const response = await apiClient.get(`/resumes/${resumeId}/download`, { responseType: 'blob' })
  const filename = parseFilename(response.headers['content-disposition'], displayName)

  const url = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
