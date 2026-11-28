import type { CaseNode } from "./schemas";

export type NodeStatus = "done" | "current" | "retry" | "locked";

// Status tiap node dihitung dari node yang sudah selesai. Node kotak bukti
// ikut selesai ketika node sebelumnya selesai, karena belum ada aksi membukanya.
// Node aktif yang pernah gagal diberi status "retry" agar pengguna tahu harus mengulang.
export function computeNodeStatuses(
  nodes: CaseNode[],
  completedKeys: Set<string>,
  failedKeys: Set<string>,
): Map<string, NodeStatus> {
  const statuses = new Map<string, NodeStatus>();
  let previousDone = true;
  let activeAssigned = false;

  for (const node of nodes) {
    const done: boolean =
      node.type === "chest" ? previousDone : completedKeys.has(node.key);

    if (done) {
      statuses.set(node.key, "done");
    } else if (!activeAssigned) {
      statuses.set(node.key, failedKeys.has(node.key) ? "retry" : "current");
      activeAssigned = true;
    } else {
      statuses.set(node.key, "locked");
    }
    previousDone = done;
  }

  return statuses;
}
