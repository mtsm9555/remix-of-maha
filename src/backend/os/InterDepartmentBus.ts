import type { Department } from "../agents/departments/types";

export type RequestPriority = "low" | "normal" | "high" | "critical";

export interface InterDeptRequest {
  id: string;
  fromDepartment: Department;
  toDepartment: Department;
  requestType: string;
  payload: any;
  priority: RequestPriority;
  slaMinutes: number;
  status: "pending" | "in_progress" | "completed" | "rejected";
  createdAt: Date;
  completedAt?: Date;
}

export class InterDepartmentBus {
  private static requests: Map<string, InterDeptRequest> = new Map();
  private static handlers: Map<Department, (req: InterDeptRequest) => Promise<any>> = new Map();

  static registerHandler(department: Department, handler: (req: InterDeptRequest) => Promise<any>) {
    this.handlers.set(department, handler);
  }

  static async sendRequest(
    request: Omit<InterDeptRequest, "id" | "status" | "createdAt">,
  ): Promise<InterDeptRequest> {
    const fullRequest: InterDeptRequest = {
      ...request,
      id: `req_${crypto.randomUUID()}`,
      status: "pending",
      createdAt: new Date(),
    };
    this.requests.set(fullRequest.id, fullRequest);

    const handler = this.handlers.get(request.toDepartment);
    if (handler) {
      fullRequest.status = "in_progress";
      try {
        await handler(fullRequest);
        fullRequest.status = "completed";
        fullRequest.completedAt = new Date();
      } catch {
        fullRequest.status = "rejected";
      }
    } else {
      fullRequest.status = "rejected";
    }
    return fullRequest;
  }

  static getPendingRequests(department: Department): InterDeptRequest[] {
    return Array.from(this.requests.values()).filter(
      (req) => req.toDepartment === department && req.status === "pending",
    );
  }

  static getSLAViolations(): InterDeptRequest[] {
    return Array.from(this.requests.values()).filter((req) => {
      if (req.status !== "completed" || !req.completedAt) return false;
      const timeTaken = (req.completedAt.getTime() - req.createdAt.getTime()) / 60000;
      return timeTaken > req.slaMinutes;
    });
  }
}