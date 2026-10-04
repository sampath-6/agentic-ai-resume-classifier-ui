export interface Resume {
  resume_id: string
  display_name: string
  seniority: string
  primary_role: string
  skills: string
  years_experience: number
  download_url: string
}

export interface Match extends Resume {
  distance: number
}

export interface UploadResult {
  thread_id: string
  uploaded: string[]
  indexed: string[]
  rejected: string[]
  failed: string[]
}

export interface QueryResult {
  thread_id: string
  answer: string
  matches: Match[]
}

export interface Checkpoint {
  checkpoint_id: string
  created_at: string
  source: string | null
  step: number
  next: string[]
  state: Record<string, unknown>
}

export interface CheckpointsResponse {
  thread_id: string
  count: number
  langsmith_enabled: boolean
  checkpoints: Checkpoint[]
}
