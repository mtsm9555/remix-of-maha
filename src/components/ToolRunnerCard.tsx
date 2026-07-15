import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Play, Loader2, FlaskConical } from "lucide-react";
import type { ToolRunner } from "@/lib/toolRunners";

interface Props {
  runner: ToolRunner;
}

export function ToolRunnerCard({ runner }: Props) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function runWith(value: string) {
    if (!value.trim() || pending) return;
    setPending(true);
    setOutput(null);
    setError(null);
    try {
      const result = await runner.run(value.trim());
      setOutput(result);
      toast.success(`${runner.label} finished — logged`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg);
      toast.error(`${runner.label} failed — logged`);
    } finally {
      setPending(false);
    }
  }

  const handleRun = () => runWith(input);
  const handleTest = () => {
    setInput(runner.sampleInput);
    runWith(runner.sampleInput);
  };

  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold">{runner.label}</h3>
        <Badge variant="secondary">{runner.category}</Badge>
      </div>
      <label className="text-xs text-muted-foreground">{runner.inputLabel}</label>
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={runner.placeholder}
          disabled={pending}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRun();
          }}
        />
        <Button size="icon" onClick={handleRun} disabled={pending || !input.trim()}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        </Button>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleTest}
        disabled={pending}
        className="self-start"
      >
        <FlaskConical className="h-3 w-3 mr-1" />
        Test with sample
      </Button>
      {output && (
        <pre className="text-xs bg-muted rounded p-2 overflow-x-auto whitespace-pre-wrap max-h-64">
          {output}
        </pre>
      )}
      {error && (
        <pre className="text-xs bg-destructive/10 text-destructive rounded p-2 whitespace-pre-wrap">
          {error}
        </pre>
      )}
    </Card>
  );
}
