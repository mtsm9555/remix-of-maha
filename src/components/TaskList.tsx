import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import type { Task } from "@/types";
import { TaskItem } from "./TaskItem";
import { listTasks, addTask, toggleTask, deleteTask } from "@/lib/data.functions";

export function TaskList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("1");
  const [dueDate, setDueDate] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTasks();
  }, []);

  async function fetchTasks() {
    try {
      const data = await listTasks();
      setTasks((data ?? []) as Task[]);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load tasks");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await addTask({
        data: {
          title: title.trim(),
          description: description.trim() || null,
          priority: Number(priority),
          due_date: dueDate ? new Date(dueDate).toISOString() : null,
        },
      });
      setTitle("");
      setDescription("");
      setPriority("1");
      setDueDate("");
      toast.success("Task added");
      fetchTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleToggle(taskId: string, completed: boolean) {
    try {
      await toggleTask({ data: { id: taskId, completed } });
      fetchTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  async function handleDelete(taskId: string) {
    try {
      await deleteTask({ data: { id: taskId } });
      toast.success("Task deleted");
      fetchTasks();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    }
  }

  const activeCount = tasks.filter((t) => !t.completed).length;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="mb-4">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <p className="text-xs text-muted-foreground">
          {activeCount} active · {tasks.length} total
        </p>
      </div>

      <Card className="p-4 mb-4">
        <form onSubmit={handleAdd} className="space-y-3">
          <Input
            placeholder="What needs to be done?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <Textarea
            placeholder="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
          <div className="grid gap-2 grid-cols-2">
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Low</SelectItem>
                <SelectItem value="2">Medium</SelectItem>
                <SelectItem value="3">High</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={submitting} className="w-full" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </form>
      </Card>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {loading ? (
          <p className="text-center text-muted-foreground text-sm py-8">Loading…</p>
        ) : tasks.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-8">No tasks yet.</p>
        ) : (
          tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}
