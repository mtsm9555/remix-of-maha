import { useState } from "react";
import { Plus, X } from "lucide-react";
import { usePlanner } from "@/hooks/usePlanner";
import TaskCard from "./TaskCard";
import GoalTracker from "./GoalTracker";

interface Props {
  onClose?: () => void;
}

export default function PlannerPanel({ onClose }: Props) {
  const { tasks, addTask, updateTask, removeTask } = usePlanner();
  const [title, setTitle] = useState("");

  const createTask = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    addTask(trimmed);
    setTitle("");
  };

  const total = tasks.length;
  const done = tasks.filter((t) => t.status === "completed").length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  return (
    <div className="planner-panel" role="dialog" aria-label="Planner">
      <div className="planner-header">
        <h2>Planner</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close planner"
            className="planner-close"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <GoalTracker title={`Today's progress (${done}/${total})`} progress={progress} />

      <div className="planner-input">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") createTask();
          }}
          placeholder="New task..."
          aria-label="New task title"
        />
        <button type="button" onClick={createTask} aria-label="Add task">
          <Plus size={18} />
        </button>
      </div>

      <div className="planner-list">
        {tasks.length === 0 && (
          <p style={{ opacity: 0.5, fontSize: 13, padding: "16px 4px" }}>
            No tasks yet. Add one above.
          </p>
        )}
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onComplete={(id) =>
              updateTask(id, task.status === "completed" ? "todo" : "completed")
            }
            onDelete={removeTask}
          />
        ))}
      </div>
    </div>
  );
}