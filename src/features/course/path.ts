import type { CaseNode } from "./schemas";

export type NodeStatus = "done" | "current" | "locked";

// Status tiap node dihitung dari node yang sudah selesai. Node kotak bukti
// ikut selesai ketika node sebelumnya selesai, karena belum ada aksi membukanya.
export function computeNodeStatuses(
  nodes: CaseNode[],
  completedKeys: Set<string>,
): Map<string, NodeStatus> {
  const statuses = new Map<string, NodeStatus>();
  let previousDone = true;
  let currentAssigned = false;

  for (const node of nodes) {
    const done: boolean =
      node.type === "chest" ? previousDone : completedKeys.has(node.key);

    if (done) {
      statuses.set(node.key, "done");
    } else if (!currentAssigned) {
      statuses.set(node.key, "current");
      currentAssigned = true;
    } else {
      statuses.set(node.key, "locked");
    }
    previousDone = done;
  }

  return statuses;
}
