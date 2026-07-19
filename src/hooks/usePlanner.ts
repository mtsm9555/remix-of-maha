import { useCallback, useEffect, useState } from "react";
import { plannerService } from "@/services/planner";
import type { Task, Priority } from "@/types/planner";

export function usePlanner() {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    setTasks(plannerService.getTasks());
  }, []);

  const save = useCallback((updated: Task[]) => {
    plannerService.saveTasks(updated);
    setTasks(updated);
  }, []);

  const addTask = useCallback(
    (title: string, priority: Priority = "medium") => {
      const task: Task = {
        id: crypto.randomUUID(),
        title,
        priority,
        status: "todo",
        createdAt: Date.now(),
      };
      setTasks((prev) => {
        const next = [task, ...prev];
        plannerService.saveTasks(next);
        return next;
      });
    },
    [],
  );

  const updateTask = useCallback(
    (taskId: string, status: Task["status"]) => {
      setTasks((prev) => {
        const next = prev.map((task) =>
          task.id === taskId ? { ...task, status } : task,
        );
        plannerService.saveTasks(next);
        return next;
      });
    },
    [],
  );

  const removeTask = useCallback((taskId: string) => {
    setTasks((prev) => {
      const next = prev.filter((task) => task.id !== taskId);
      plannerService.saveTasks(next);
      return next;
    });
  }, []);

  return { tasks, addTask, updateTask, removeTask, save };
}