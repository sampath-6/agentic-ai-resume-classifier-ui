import { apiClient } from './client'
import type { CheckpointsResponse } from './types'

export async function fetchCheckpoints(threadId: string): Promise<CheckpointsResponse> {
  const { data } = await apiClient.get<CheckpointsResponse>(
    `/checkpoints/${encodeURIComponent(threadId)}`,
  )
  return data
}
