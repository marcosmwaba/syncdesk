export interface ApiErrorPayload {
  code: string;
  message: string;
  fields?: Record<string, string>;
}

export interface PaginationMeta {
  cursor?: string | null;
  nextCursor?: string | null;
  hasMore?: boolean;
  total?: number;
  limit?: number;
}

export interface ApiSuccessResponse<T, M = PaginationMeta> {
  data: T;
  meta?: M;
}

export interface ApiErrorResponse {
  error: ApiErrorPayload;
}

export type ApiEnvelope<T, M = PaginationMeta> = ApiSuccessResponse<T, M> | ApiErrorResponse;

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

export interface AuthRequestCodePayload {
  email: string;
}

export interface AuthRequestCodeResult {
  sent: boolean;
  email?: string;
  expiresInSeconds?: number;
}

export interface AuthVerifyPayload {
  email: string;
  code: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface AuthVerifyResult extends AuthTokens {
  user?: UserProfile;
}

export interface AuthRefreshPayload {
  refreshToken?: string;
}

export interface AuthLogoutResult {
  loggedOut: boolean;
}

/* -------------------------------------------------------------------------- */
/* Me & Capabilities                                                          */
/* -------------------------------------------------------------------------- */

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role?: string;
  departmentId?: string | null;
  departmentName?: string | null;
  active?: boolean;
  createdAt?: string;
}

export interface MeResponse {
  user: UserProfile;
  permissions: string[];
  modules: string[];
}

/* -------------------------------------------------------------------------- */
/* Config                                                                     */
/* -------------------------------------------------------------------------- */

export interface DepartmentConfig {
  id: string;
  name: string;
  code?: string;
  description?: string | null;
  active?: boolean;
}

export interface CategoryConfig {
  id: string;
  name: string;
  departmentId?: string | null;
  description?: string | null;
  active?: boolean;
}

export type CustomFieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'select'
  | 'boolean'
  | 'checkbox'
  | 'date'
  | 'email'
  | 'url';

export interface CustomFieldOption {
  label: string;
  value: string;
}

export interface CustomFieldConfig {
  id?: string;
  key: string;
  label: string;
  type: CustomFieldType;
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  departmentId?: string | null;
  categoryId?: string | null;
  ticketTypes?: TicketType[];
  options?: Array<CustomFieldOption | string>;
  defaultValue?: string | number | boolean;
}

export type CustomFieldsConfig =
  | CustomFieldConfig[]
  | Record<string, CustomFieldConfig[]>;

export interface VisibilityConfig {
  publicBoard?: boolean;
  allowConfidential?: boolean;
  maskedTitlePlaceholder?: string;
  allowedTicketTypes?: TicketType[];
  statuses?: string[];
  priorities?: string[];
  [key: string]: unknown;
}

export interface AppConfig {
  departments: DepartmentConfig[];
  categories: CategoryConfig[];
  customFields: CustomFieldsConfig;
  visibility: VisibilityConfig;
}

/* -------------------------------------------------------------------------- */
/* Board                                                                      */
/* -------------------------------------------------------------------------- */

export type BoardLoadLevel = 'calm' | 'busy' | 'congested';

export interface BoardTotals {
  open: number;
  inProgress: number;
  resolved: number;
  total?: number;
}

export interface BoardDepartmentTile {
  id: string;
  name: string;
  code?: string;
  open: number;
  inProgress: number;
  resolved: number;
  loadLevel: BoardLoadLevel;
}

export interface BoardFeedItem {
  id: string;
  reference?: string;
  title: string | null;
  type?: TicketType;
  priority: TicketPriority;
  status: TicketStatus;
  departmentId?: string;
  departmentName?: string | null;
  categoryName?: string | null;
  aiConfidence: number | null;
  createdAt: string;
  updatedAt?: string;
}

export interface BoardResponse {
  totals: BoardTotals;
  departments: BoardDepartmentTile[];
  feed: BoardFeedItem[];
  generatedAt?: string;
}

/* -------------------------------------------------------------------------- */
/* Tickets                                                                    */
/* -------------------------------------------------------------------------- */

export type TicketType = 'request' | 'incident' | 'change';
export type TicketStatus = 'open' | 'in_progress' | 'waiting' | 'resolved' | 'closed' | string;
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent' | 'critical' | string;

export interface Ticket {
  id: string;
  reference?: string;
  title: string | null;
  description?: string | null;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  departmentId: string;
  departmentName?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  requesterId?: string;
  requesterName?: string | null;
  requesterEmail?: string | null;
  assigneeId?: string | null;
  assigneeName?: string | null;
  aiConfidence?: number | null;
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  authorId?: string;
  authorName: string | null;
  authorRole?: string | null;
  body: string;
  internal?: boolean;
  createdAt: string;
}

export interface TicketDetail extends Ticket {
  comments?: TicketComment[];
  availableTransitions?: TicketStatus[];
}

export interface TicketQueryParams {
  status?: string;
  priority?: string;
  department?: string;
  cursor?: string;
  limit?: number;
  mine?: boolean;
  search?: string;
}

export interface CreateTicketPayload {
  type: TicketType;
  title: string;
  description: string;
  departmentId: string;
  categoryId?: string;
  priority: TicketPriority;
  customFields?: Record<string, unknown>;
}

export interface UpdateTicketPayload {
  title?: string;
  description?: string;
  priority?: TicketPriority;
  departmentId?: string;
  categoryId?: string | null;
  assigneeId?: string | null;
  customFields?: Record<string, unknown>;
}

export interface UpdateTicketStatusPayload {
  status: TicketStatus;
  note?: string;
}

export interface CreateTicketCommentPayload {
  body: string;
  internal?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Analytics                                                                  */
/* -------------------------------------------------------------------------- */

export interface AnalyticsStatusBreakdown {
  status: TicketStatus;
  count: number;
}

export interface AnalyticsPriorityBreakdown {
  priority: TicketPriority;
  count: number;
}

export interface AnalyticsDepartmentBreakdown {
  departmentId: string;
  departmentName: string;
  open: number;
  inProgress: number;
  resolved: number;
  total: number;
  avgResolutionHours?: number | null;
}

export interface AnalyticsTrendPoint {
  date: string;
  created: number;
  resolved: number;
}

export interface AnalyticsSummary {
  totals: {
    total: number;
    open: number;
    inProgress: number;
    resolved: number;
    avgResolutionHours?: number | null;
    slaComplianceRate?: number | null;
  };
  byStatus: AnalyticsStatusBreakdown[];
  byPriority: AnalyticsPriorityBreakdown[];
  byDepartment: AnalyticsDepartmentBreakdown[];
  trend?: AnalyticsTrendPoint[];
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                      */
/* -------------------------------------------------------------------------- */

export interface AuditLogEntry {
  id: string;
  actorId?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  summary?: string | null;
  metadata?: Record<string, unknown> | null;
  ipAddress?: string | null;
  createdAt: string;
}

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  departmentId?: string | null;
  departmentName?: string | null;
  permissions?: string[];
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminUserPayload {
  email: string;
  name: string;
  role: string;
  departmentId?: string | null;
  active?: boolean;
}

export interface UpdateAdminUserPayload {
  name?: string;
  role?: string;
  departmentId?: string | null;
  active?: boolean;
}

export interface AdminDepartment {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminDepartmentPayload {
  name: string;
  code: string;
  description?: string;
  active?: boolean;
}

export interface UpdateAdminDepartmentPayload {
  name?: string;
  code?: string;
  description?: string | null;
  active?: boolean;
}

export interface AdminCategory {
  id: string;
  name: string;
  departmentId?: string | null;
  departmentName?: string | null;
  description?: string | null;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAdminCategoryPayload {
  name: string;
  departmentId?: string | null;
  description?: string;
  active?: boolean;
}

export interface UpdateAdminCategoryPayload {
  name?: string;
  departmentId?: string | null;
  description?: string | null;
  active?: boolean;
}
