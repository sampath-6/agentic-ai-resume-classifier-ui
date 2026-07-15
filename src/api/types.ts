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
  answer: string
  matches: Match[]
}
