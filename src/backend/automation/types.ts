export type AutomationAction =
  | "open_url"
  | "search"
  | "click"
  | "fill"
  | "extract"
  | "scroll"
  | "screenshot";

export interface AutomationTask {
  id: string;
  action: AutomationAction;
  payload: any;
  requiresApproval?: boolean;
}

export interface AutomationResult {
  success: boolean;
  data?: any;
  error?: string;
  requiresApproval?: boolean;
}