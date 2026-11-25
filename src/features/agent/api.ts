import { apiClient, type ApiResult } from '../../core/api';
import type {
  PaginationMeta,
  Ticket,
  TicketDetail,
  TicketQueryParams,
  UpdateTicketStatusPayload,
} from '../../types/contract';

export async function getAgentQueue(
  params: TicketQueryParams,
  signal?: AbortSignal
): Promise<ApiResult<Ticket[], PaginationMeta>> {
  return apiClient.get<Ticket[], PaginationMeta>('/tickets', {
    query: {
      status: params.status,
      priority: params.priority,
      department: params.department,
      cursor: params.cursor,
      limit: params.limit,
    },
    signal,
  });
}

export async function updateQueueTicketStatus(
  id: string,
  payload: UpdateTicketStatusPayload
): Promise<TicketDetail> {
  const res = await apiClient.patch<TicketDetail>(
    `/tickets/${encodeURIComponent(id)}/status`,
    payload
  );
  return res.data;
}
