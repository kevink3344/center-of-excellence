// Shared formatting + status mapping helpers.
import type {
  ProjectStatus,
  ProjectPriority,
  TicketStatus,
  TicketPriority,
  ChangeStatus,
  ChangePriority,
  ChangeRisk,
  ChangeType,
} from '@eidh/shared';

export function formatCurrency(n?: number | null): string {
  if (n == null) return '—';
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });
}

export function formatDate(d?: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatPercent(n?: number | null): string {
  if (n == null) return '—';
  return `${n}%`;
}

// Map a project status to a semantic badge color (mirrors CSS doc isEmotional palette).
export function projectStatusBadge(status: ProjectStatus): string {
  switch (status) {
    case 'intake': return 'badge-slate';
    case 'scored': return 'badge-slate';
    case 'approved': return 'badge-amber';
    case 'discovery': return 'badge-blue';
    case 'in_progress': return 'badge-orange';
    case 'uat': return 'badge-blue';
    case 'deployed': return 'badge-green';
    case 'on_hold': return 'badge-slate';
    case 'retired': return 'badge-slate';
    default: return 'badge-slate';
  }
}

export function projectStatusLabel(status: ProjectStatus): string {
  return status.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function priorityBadge(priority?: ProjectPriority | null): string {
  switch (priority) {
    case 'critical': return 'badge-red';
    case 'high': return 'badge-amber';
    case 'medium': return 'badge-orange';
    case 'low': return 'badge-slate';
    default: return 'badge-slate';
  }
}

export function priorityDotColor(priority?: ProjectPriority | null): string {
  switch (priority) {
    case 'critical': return '#ba3040';
    case 'high': return '#a56c00';
    case 'medium': return '#b35d19';
    case 'low': return '#546274';
    default: return '#546274';
  }
}

export function ticketPriorityBadge(priority: TicketPriority): string {
  switch (priority) {
    case 'p1': return 'badge-red';
    case 'p2': return 'badge-amber';
    case 'p3': return 'badge-orange';
    case 'p4': return 'badge-slate';
    default: return 'badge-slate';
  }
}

export function ticketPriorityDotColor(priority: TicketPriority): string {
  switch (priority) {
    case 'p1': return '#ba3040';
    case 'p2': return '#a56c00';
    case 'p3': return '#b35d19';
    case 'p4': return '#546274';
    default: return '#546274';
  }
}

export function ticketStatusBadge(status: TicketStatus): string {
  switch (status) {
    case 'open': return 'badge-red';
    case 'in_progress': return 'badge-amber';
    case 'resolved': return 'badge-green';
    case 'closed': return 'badge-slate';
    default: return 'badge-slate';
  }
}

export function statusBadgeClass(status: string): string {
  const s = status.toLowerCase();
  if (['deployed', 'done', 'resolved', 'closed', 'approved', 'active', 'completed'].includes(s)) return 'badge-green';
  if (['in_progress', 'uat', 'scored', 'discovery'].includes(s)) return 'badge-blue';
  if (['open', 'critical', 'failed'].includes(s)) return 'badge-red';
  if (['planned', 'backlog', 'intake'].includes(s)) return 'badge-slate';
  if (['on_hold', 'pending'].includes(s)) return 'badge-amber';
  return 'badge-amber';
}

// ── Change Management helpers ──
export function changeStatusLabel(status: ChangeStatus): string {
  switch (status) {
    case 'pending_approval': return 'Pending Approval';
    case 'in_implementation': return 'In Implementation';
    case 'rolled_back': return 'Rolled Back';
    default: return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}

export function changeStatusBadge(status: ChangeStatus): string {
  switch (status) {
    case 'draft': return 'badge-slate';
    case 'pending_approval': return 'badge-amber';
    case 'approved': return 'badge-green';
    case 'scheduled': return 'badge-blue';
    case 'in_implementation': return 'badge-orange';
    case 'testing': return 'badge-blue';
    case 'closed': return 'badge-green';
    case 'rejected': return 'badge-red';
    case 'rolled_back': return 'badge-red';
    case 'cancelled': return 'badge-slate';
    default: return 'badge-slate';
  }
}

export function changePriorityBadge(priority: ChangePriority): string {
  return priorityBadge(priority);
}

export function changeRiskBadge(risk: ChangeRisk): string {
  switch (risk) {
    case 'high': return 'badge-red';
    case 'medium': return 'badge-amber';
    case 'low': return 'badge-slate';
    default: return 'badge-slate';
  }
}

export function changeTypeLabel(type: ChangeType): string {
  return type.replace(/\b\w/g, (c) => c.toUpperCase());
}
