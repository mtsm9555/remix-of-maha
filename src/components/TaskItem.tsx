import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, CalendarIcon } from "lucide-react";
import type { Task } from "@/types";

const PRIORITY_LABEL: Record<number, string> = { 1: "Low", 2: "Medium", 3: "High" };
const PRIORITY_VARIANT: Record<number, "secondary" | "default" | "destructive"> = {
  1: "secondary",
  2: "default",
  3: "destructive",
};

interface TaskItemProps {
  task: Task;
  onToggle: (taskId: string, completed: boolean) => void;
  onDelete: (taskId: string) => void;
}

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  return (
    <Card className={`p-3 transition-opacity ${task.completed ? "opacity-60" : ""}`}>
      <div className="flex items-start gap-2">
        <Checkbox
          checked={task.completed}
          onCheckedChange={() => onToggle(task.id, task.completed)}
          className="mt-1"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`text-sm font-medium ${
                task.completed ? "line-through text-muted-foreground" : ""
              }`}
            >
              {task.title}
            </h3>
            <Badge variant={PRIORITY_VARIANT[task.priority]}>
              {PRIORITY_LABEL[task.priority]}
            </Badge>
          </div>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
          )}
          {task.due_date && (
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <CalendarIcon className="h-3 w-3" />
              {new Date(task.due_date).toLocaleString()}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onDelete(task.id)}
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

export default TaskItem;
