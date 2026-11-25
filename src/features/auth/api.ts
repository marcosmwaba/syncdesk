import { apiClient } from '../../core/api';
import type {
  AuthRequestCodePayload,
  AuthRequestCodeResult,
  AuthVerifyPayload,
  AuthVerifyResult,
} from '../../types/contract';

export async function requestAuthCode(
  payload: AuthRequestCodePayload
): Promise<AuthRequestCodeResult> {
  const res = await apiClient.post<AuthRequestCodeResult>('/auth/request-code', payload, {
    skipAuthRefresh: true,
  });
  return res.data;
}

export async function verifyAuthCode(
  payload: AuthVerifyPayload
): Promise<AuthVerifyResult> {
  const res = await apiClient.post<AuthVerifyResult>('/auth/verify', payload, {
    skipAuthRefresh: true,
  });
  return res.data;
}
