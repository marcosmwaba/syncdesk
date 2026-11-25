import { apiClient, type ApiResult } from '../../core/api';
import type {
  AdminCategory,
  AdminDepartment,
  AdminUser,
  AuditLogEntry,
  CreateAdminCategoryPayload,
  CreateAdminDepartmentPayload,
  CreateAdminUserPayload,
  PaginationMeta,
  Ticket,
  TicketQueryParams,
  UpdateAdminCategoryPayload,
  UpdateAdminDepartmentPayload,
  UpdateAdminUserPayload,
} from '../../types/contract';

export async function listAdminTickets(
  params?: TicketQueryParams
): Promise<ApiResult<Ticket[], PaginationMeta>> {
  return apiClient.get<Ticket[], PaginationMeta>('/admin/tickets', {
    query: {
      status: params?.status,
      priority: params?.priority,
      department: params?.department,
      cursor: params?.cursor,
    },
  });
}

export async function listAdminAudit(
  cursor?: string
): Promise<ApiResult<AuditLogEntry[], PaginationMeta>> {
  return apiClient.get<AuditLogEntry[], PaginationMeta>('/admin/audit', {
    query: { cursor },
  });
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const res = await apiClient.get<AdminUser[]>('/admin/users');
  return res.data;
}

export async function createAdminUser(
  payload: CreateAdminUserPayload
): Promise<AdminUser> {
  const res = await apiClient.post<AdminUser>('/admin/users', payload);
  return res.data;
}

export async function updateAdminUser(
  id: string,
  payload: UpdateAdminUserPayload
): Promise<AdminUser> {
  const res = await apiClient.patch<AdminUser>(
    `/admin/users/${encodeURIComponent(id)}`,
    payload
  );
  return res.data;
}

export async function listAdminDepartments(): Promise<AdminDepartment[]> {
  const res = await apiClient.get<AdminDepartment[]>('/admin/departments');
  return res.data;
}

export async function createAdminDepartment(
  payload: CreateAdminDepartmentPayload
): Promise<AdminDepartment> {
  const res = await apiClient.post<AdminDepartment>('/admin/departments', payload);
  return res.data;
}

export async function updateAdminDepartment(
  id: string,
  payload: UpdateAdminDepartmentPayload
): Promise<AdminDepartment> {
  const res = await apiClient.patch<AdminDepartment>(
    `/admin/departments/${encodeURIComponent(id)}`,
    payload
  );
  return res.data;
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const res = await apiClient.get<AdminCategory[]>('/admin/categories');
  return res.data;
}

export async function createAdminCategory(
  payload: CreateAdminCategoryPayload
): Promise<AdminCategory> {
  const res = await apiClient.post<AdminCategory>('/admin/categories', payload);
  return res.data;
}

export async function updateAdminCategory(
  id: string,
  payload: UpdateAdminCategoryPayload
): Promise<AdminCategory> {
  const res = await apiClient.patch<AdminCategory>(
    `/admin/categories/${encodeURIComponent(id)}`,
    payload
  );
  return res.data;
}
