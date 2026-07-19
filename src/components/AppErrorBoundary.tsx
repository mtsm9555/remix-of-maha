import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

type Props = {
  children: ReactNode;
  fallback?: ReactNode;
  label?: string;
  onReset?: () => void;
};

type State = { error: Error | null };

/**
 * Client-side React error boundary for isolating subtree failures
 * (e.g. 3D reactor, streaming text) so one bad component can't blank
 * the whole page. Reports to Lovable error capture.
 */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(`[AppErrorBoundary${this.props.label ? `:${this.props.label}` : ""}]`, error, info);
    try {
      reportLovableError(error, { boundary: this.props.label ?? "app_error_boundary" });
    } catch {
      /* swallow — reporting must never re-throw */
    }
  }

  reset = () => {
    this.setState({ error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      return (
        <div
          role="alert"
          className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <p className="font-medium">Something went wrong.</p>
          <p className="mt-1 opacity-80">{this.state.error.message}</p>
          <button
            type="button"
            onClick={this.reset}
            className="mt-2 inline-flex items-center rounded border border-destructive/40 px-2 py-1 text-xs hover:bg-destructive/20"
          >
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}