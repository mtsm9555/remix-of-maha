import type { OSMilestone } from "../../os/PlanTypes";

export interface DependencyMap {
  [milestoneId: string]: {
    parents: string[];
    children: string[];
    isBlocked: boolean;
  };
}

export class DependencyResolver {
  static buildDependencyMap(milestones: OSMilestone[]): DependencyMap {
    const map: DependencyMap = {};
    for (const m of milestones) {
      map[m.id] = { parents: m.dependencies, children: [], isBlocked: m.dependencies.length > 0 };
    }
    for (const m of milestones) {
      for (const parentId of m.dependencies) {
        if (map[parentId]) map[parentId].children.push(m.id);
      }
    }
    return map;
  }

  static countDownstreamDependencies(milestoneId: string, map: DependencyMap): number {
    let count = 0;
    const queue = [milestoneId];
    const visited = new Set<string>();
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      const children = map[currentId]?.children || [];
      count += children.length;
      queue.push(...children);
    }
    return count;
  }

  static getExecutableTasks(
    milestones: OSMilestone[],
    completedTaskIds: Set<string>,
    _dependencyMap: DependencyMap,
  ): OSMilestone[] {
    return milestones.filter((m) => {
      if (m.status !== "pending") return false;
      return m.dependencies.every((parentId) => completedTaskIds.has(parentId));
    });
  }
}
