import type { FeatureDefinition } from '../../core/capabilities';
import { MyTicketsPage } from './pages/MyTicketsPage';
import { SubmitTicketPage } from './pages/SubmitTicketPage';
import { TicketDetailPage } from './pages/TicketDetailPage';

export const ticketsFeature: FeatureDefinition = {
  id: 'tickets',
  requires: { module: 'tickets' },
  routes: [
    {
      path: '/submit',
      title: 'Submit Ticket',
      Component: SubmitTicketPage,
      requires: { module: 'tickets', permission: 'tickets:create' },
    },
    {
      path: '/my-tickets',
      title: 'My Tickets',
      Component: MyTicketsPage,
      requires: { module: 'tickets', permission: 'tickets:read' },
    },
    {
      path: '/tickets/:id',
      title: 'Ticket Details',
      Component: TicketDetailPage,
      requires: { module: 'tickets', permission: 'tickets:read' },
    },
  ],
  nav: [
    {
      id: 'submit-ticket',
      label: 'New Request',
      to: '/submit',
      icon: 'PlusCircle',
      group: 'workspace',
      order: 20,
      requires: { module: 'tickets', permission: 'tickets:create' },
    },
    {
      id: 'my-tickets',
      label: 'My Tickets',
      to: '/my-tickets',
      icon: 'Ticket',
      group: 'workspace',
      order: 30,
      requires: { module: 'tickets', permission: 'tickets:read' },
    },
  ],
};
