import { CheckCircle, Trash2, Circle } from "lucide-react";
import type { Task } from "@/types/planner";

interface Props {
  task: Task;
  onComplete: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function TaskCard({ task, onComplete, onDelete }: Props) {
  const done = task.status === "completed";
  return (
    <div className="task-card" data-status={task.status} data-priority={task.priority}>
      <div style={{ minWidth: 0, flex: 1 }}>
        <h4 style={{ textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1 }}>
          {task.title}
        </h4>
        <small>{task.priority}</small>
      </div>
      <div className="task-actions">
        <button
          type="button"
          onClick={() => onComplete(task.id)}
          aria-label={done ? "Mark as todo" : "Mark as completed"}
        >
          {done ? <Circle size={18} /> : <CheckCircle size={18} />}
        </button>
        <button type="button" onClick={() => onDelete(task.id)} aria-label="Delete task">
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
}