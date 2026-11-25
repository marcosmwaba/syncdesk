import type { FeatureDefinition } from '../core/capabilities';
import { adminFeature } from './admin';
import { agentFeature } from './agent';
import { analyticsFeature } from './analytics';
import { authFeature } from './auth';
import { boardFeature } from './board';
import { ticketsFeature } from './tickets';

export const FEATURE_REGISTRY: FeatureDefinition[] = [
  authFeature,
  boardFeature,
  ticketsFeature,
  agentFeature,
  analyticsFeature,
  adminFeature,
];
