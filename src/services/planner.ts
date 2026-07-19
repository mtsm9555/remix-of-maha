import type { Task } from "@/types/planner";

const STORAGE_KEY = "maha_planner";

export class PlannerService {
  getTasks(): Task[] {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as Task[];
    } catch {
      return [];
    }
  }

  saveTasks(tasks: Task[]) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
}

export const plannerService = new PlannerService();