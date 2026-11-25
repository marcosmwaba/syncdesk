import type { FeatureDefinition } from '../../core/capabilities';
import { AgentQueuePage } from './pages/AgentQueuePage';

export const agentFeature: FeatureDefinition = {
  id: 'agent',
  requires: { module: 'agent' },
  routes: [
    {
      path: '/agent/queue',
      title: 'Agent Queue',
      Component: AgentQueuePage,
      requires: { module: 'agent', permission: 'agent:queue' },
    },
  ],
  nav: [
    {
      id: 'agent-queue',
      label: 'Agent Queue',
      to: '/agent/queue',
      icon: 'Inbox',
      group: 'operations',
      order: 40,
      requires: { module: 'agent', permission: 'agent:queue' },
    },
  ],
};
