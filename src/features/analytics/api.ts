import { apiClient } from '../../core/api';
import type { AnalyticsSummary } from '../../types/contract';

export async function getAnalyticsSummary(
  signal?: AbortSignal
): Promise<AnalyticsSummary> {
  const res = await apiClient.get<AnalyticsSummary>('/analytics/summary', {
    signal,
  });
  return res.data;
}
