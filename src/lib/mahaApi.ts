// Same-origin API client for the Maha AI OS backend routes.
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

async function fetchAPI(endpoint: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error || response.statusText);
  }
  return response.json();
}

export const mahaApi = {
  sendMessage: (message: string, sessionId: string) =>
    fetchAPI("/api/chat", { method: "POST", body: JSON.stringify({ message, sessionId }) }),

  executeGoal: (goal: string) =>
    fetchAPI("/api/goals/execute", { method: "POST", body: JSON.stringify({ goal }) }),
  getGoals: () => fetchAPI("/api/goals"),

  getDepartments: () => fetchAPI("/api/departments"),
  getAgentStatus: () => fetchAPI("/api/departments/agents/status").catch(() => ({ agents: [] })),

  processVoice: (audioBlob: Blob, sessionId: string) => {
    const formData = new FormData();
    formData.append("audio", audioBlob, "recording.webm");
    formData.append("sessionId", sessionId);
    return fetch(`${API_BASE_URL}/api/voice/process`, { method: "POST", body: formData }).then((r) => r.json());
  },

  processImage: (imageFile: File, tasks: string[]) => {
    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("tasks", tasks.join(","));
    return fetch(`${API_BASE_URL}/api/vision/process`, { method: "POST", body: formData }).then((r) => r.json());
  },
};