import type { Asset, AssetInput } from '@/types';

/** An item counts as assigned as soon as someone is named in "Assigned To". */
export function isAssigned(a: Pick<Asset, 'assigned_to'>): boolean {
  return !!a.assigned_to && a.assigned_to.trim() !== '';
}

/** Available stock = not assigned to anyone and still in good, usable (Active) condition. */
export function isAvailable(a: Pick<Asset, 'assigned_to' | 'status'>): boolean {
  return !isAssigned(a) && a.status === 'Active';
}

/** Short text used in audit log entries, e.g. "Ravi Kumar — Sharma Residence". */
export function describeAssignment(a: Pick<Asset, 'assigned_to' | 'project_name'>): string {
  if (!isAssigned(a)) return 'In stock';
  return a.project_name ? `${a.assigned_to} — ${a.project_name}` : String(a.assigned_to);
}

/**
 * Keeps assignment fields and status consistent so stock counts stay right:
 *  - project / assigned-by only make sense while the item is assigned
 *  - assigning an Active item marks it In Use; returning an In Use item to stock marks it Active
 */
export function normalizeAssignment(input: AssetInput, defaultAssignedBy: string): AssetInput {
  const assignee = input.assigned_to?.trim() || null;
  if (!assignee) {
    return {
      ...input,
      assigned_to: null,
      project_name: null,
      assigned_by: null,
      status: input.status === 'In Use' ? 'Active' : input.status,
    };
  }
  return {
    ...input,
    assigned_to: assignee,
    project_name: input.project_name?.trim() || null,
    assigned_by: input.assigned_by?.trim() || defaultAssignedBy || null,
    status: input.status === 'Active' ? 'In Use' : input.status,
  };
}
