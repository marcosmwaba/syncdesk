import { apiClient } from '../../core/api';
import type { BoardResponse } from '../../types/contract';

export async function getBoard(signal?: AbortSignal): Promise<BoardResponse> {
  const res = await apiClient.get<BoardResponse>('/board', { signal });
  return res.data;
}
