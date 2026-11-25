import { apiClient, type ApiResult } from '../../core/api';
import type {
  CreateTicketCommentPayload,
  CreateTicketPayload,
  PaginationMeta,
  Ticket,
  TicketComment,
  TicketDetail,
  TicketQueryParams,
  UpdateTicketPayload,
  UpdateTicketStatusPayload,
} from '../../types/contract';

export async function createTicket(payload: CreateTicketPayload): Promise<Ticket> {
  const res = await apiClient.post<Ticket>('/tickets', payload);
  return res.data;
}

export async function listTickets(
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

export async function getTicket(
  id: string,
  signal?: AbortSignal
): Promise<TicketDetail> {
  const res = await apiClient.get<TicketDetail>(`/tickets/${encodeURIComponent(id)}`, {
    signal,
  });
  return res.data;
}

export async function updateTicket(
  id: string,
  payload: UpdateTicketPayload
): Promise<TicketDetail> {
  const res = await apiClient.patch<TicketDetail>(
    `/tickets/${encodeURIComponent(id)}`,
    payload
  );
  return res.data;
}

export async function updateTicketStatus(
  id: string,
  payload: UpdateTicketStatusPayload
): Promise<TicketDetail> {
  const res = await apiClient.patch<TicketDetail>(
    `/tickets/${encodeURIComponent(id)}/status`,
    payload
  );
  return res.data;
}

export async function listTicketComments(
  id: string,
  signal?: AbortSignal
): Promise<TicketComment[]> {
  const res = await apiClient.get<TicketComment[]>(
    `/tickets/${encodeURIComponent(id)}/comments`,
    { signal }
  );
  return res.data;
}

export async function addTicketComment(
  id: string,
  payload: CreateTicketCommentPayload
): Promise<TicketComment> {
  const res = await apiClient.post<TicketComment>(
    `/tickets/${encodeURIComponent(id)}/comments`,
    payload
  );
  return res.data;
}
