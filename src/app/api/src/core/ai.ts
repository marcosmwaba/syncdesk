import type { Env } from './types';

export interface Classification {
  priority: 'critical' | 'high' | 'medium' | 'low' | null;
  confidence: number | null;
}

// Phase 4 plugs Workers AI in here. Until then every ticket falls back to the
// category default and is flagged for manual triage. Callers never change.
export async function classifyTicket(_env: Env, _text: string): Promise<Classification> {
  return { priority: null, confidence: null };
}
