import type {
  Project,
  JO,
  Item,
  Category,
  Control,
  ControlStatus,
  JoType,
  CategoryKind,
  CompanyEntity,
  ProcessPhoto,
} from "./types";
import { API_BASE_URL } from "./config";
import { getAuthToken, clearAuthStorage } from "./auth-storage";

class ApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

function handleUnauthorized(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname === "/login") return; // avoid a redirect loop
  clearAuthStorage();
  window.location.href = "/login";
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = getAuthToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) handleUnauthorized();

  if (!response.ok) {
    let errorData = null;
    try {
      errorData = await response.json();
    } catch {
      // no json response
    }
    const message = errorData?.message || `API request failed with status ${response.status}`;
    throw new ApiError(message, response.status, errorData);
  }

  return response.json();
}

export const api = {
  // Projects
  async getProjects(): Promise<{ data: Project[] }> {
    return request<{ data: Project[] }>("/projects");
  },

  async createProject(
    name: string,
    customer: string,
    company?: CompanyEntity,
    id?: string
  ): Promise<{ data: Project; message: string }> {
    return request<{ data: Project; message: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({ name, customer, company: company || "BKP", ...(id ? { id } : {}) }),
    });
  },

  async getProject(projectId: string): Promise<{ data: Project }> {
    return request<{ data: Project }>(`/projects/${projectId}`);
  },

  async updateProject(
    projectId: string,
    payload: {
      name?: string;
      customer?: string;
      company?: CompanyEntity;
    }
  ): Promise<{ data: Project; message: string }> {
    return request<{ data: Project; message: string }>(`/projects/${projectId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteProject(projectId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/projects/${projectId}`, {
      method: "DELETE",
    });
  },

  // JOs
  async createJO(
    projectId: string,
    payload: {
      id?: string;
      joNumber: string;
      product: string;
      type: JoType;
      targetDate?: string;
      categories?: { id?: string; label: string; kind: CategoryKind; isCustom: boolean }[];
    }
  ): Promise<{ data: JO; message: string }> {
    return request<{ data: JO; message: string }>(`/projects/${projectId}/jos`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getJO(joId: string): Promise<{ data: JO }> {
    return request<{ data: JO }>(`/jos/${joId}`);
  },

  async finishJO(joId: string): Promise<{ data: JO; message: string }> {
    return request<{ data: JO; message: string }>(`/jos/${joId}/finish`, {
      method: "PATCH",
    });
  },

  async restoreJO(joId: string): Promise<{ data: JO; message: string }> {
    return request<{ data: JO; message: string }>(`/jos/${joId}/restore`, {
      method: "PATCH",
    });
  },

  async deleteJO(joId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/jos/${joId}`, {
      method: "DELETE",
    });
  },

  // Categories & Items
  async addCategory(
    joId: string,
    payload: { label: string; kind: CategoryKind; isCustom?: boolean }
  ): Promise<{ data: Category; message: string }> {
    return request<{ data: Category; message: string }>(`/jos/${joId}/categories`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async addItem(
    categoryId: string,
    item: {
      no?: string;
      description: string;
      dimension?: string;
      material?: string;
      qty?: number;
      hrc?: string;
    }
  ): Promise<{ data: Item; message: string }> {
    return request<{ data: Item; message: string }>(`/categories/${categoryId}/items`, {
      method: "POST",
      body: JSON.stringify(item),
    });
  },

  async batchAddItems(
    categoryId: string,
    items: Array<{
      no?: string;
      description: string;
      dimension?: string;
      material?: string;
      qty?: number;
      hrc?: string;
    }>
  ): Promise<{ data: Item[]; message: string }> {
    return request<{ data: Item[]; message: string }>(`/categories/${categoryId}/items/batch`, {
      method: "POST",
      body: JSON.stringify({ items }),
    });
  },

  async updateItemSubcont(
    itemId: string,
    payload: {
      isSubcont: boolean;
      subcontNotes?: string;
      subcontSupplier?: string;
      subcontStatus?: "In Progress" | "Done" | "Problem";
      subcontProcess?: string;
      qty?: number;
      arrivalTargetDate?: string;
    }
  ): Promise<{ data: Item; message: string }> {
    return request<{ data: Item; message: string }>(`/items/${itemId}/subcont`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async updateItem(
    itemId: string,
    payload: {
      no?: string;
      description: string;
      dimension?: string;
      material?: string;
      qty?: number;
      hrc?: string;
    }
  ): Promise<{ data: Item; message: string }> {
    return request<{ data: Item; message: string }>(`/items/${itemId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteItem(itemId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/items/${itemId}`, {
      method: "DELETE",
    });
  },

  async batchDeleteItems(itemIds: string[]): Promise<{ deletedCount: number; message: string }> {
    return request<{ deletedCount: number; message: string }>(`/items/batch-delete`, {
      method: "POST",
      body: JSON.stringify({ itemIds }),
    });
  },

  // Controls
  async updateControlStatus(
    controlId: string,
    status: ControlStatus,
    notes?: string
  ): Promise<{ data: Control; message: string }> {
    return request<{ data: Control; message: string }>(`/controls/${controlId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status, notes }),
    });
  },

  async updateControlTargetDate(
    controlId: string,
    targetDate: string
  ): Promise<{ data: Control; message: string }> {
    return request<{ data: Control; message: string }>(`/controls/${controlId}/target-date`, {
      method: "PATCH",
      body: JSON.stringify({ targetDate }),
    });
  },

  async updatePoTracking(
    controlId: string,
    payload: {
      status?: ControlStatus;
      problemNotes?: string;
      supplier?: string;
      poNo?: string;
      poDate?: string;
      targetArrival?: string;
      notes?: string;
      qty?: number;
    }
  ): Promise<{ data: Control; message: string }> {
    return request<{ data: Control; message: string }>(`/controls/${controlId}/po-tracking`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  // Bulk Operations
  async bulkSendPo(
    joId: string,
    payload: {
      itemIds: string[];
      supplier?: string;
      poNo?: string;
      poDate?: string;
      targetArrival?: string;
      notes?: string;
    }
  ): Promise<{ message: string }> {
    return request<{ message: string }>(`/jos/${joId}/bulk/send-po`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async bulkUpdateStatus(
    joId: string,
    payload: {
      itemIds: string[];
      processes: string[];
      status: ControlStatus;
      notes?: string;
    }
  ): Promise<{ message: string }> {
    return request<{ message: string }>(`/jos/${joId}/bulk/update-status`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async bulkSendSubcont(
    joId: string,
    payload: {
      itemIds: string[];
      process: string;
      supplier?: string;
      arrivalTargetDate?: string;
    }
  ): Promise<{ message: string }> {
    return request<{ message: string }>(`/jos/${joId}/bulk/send-subcont`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async bulkTargetArrival(
    joId: string,
    payload: {
      itemIds: string[];
      targetDate: string;
    }
  ): Promise<{ message: string }> {
    return request<{ message: string }>(`/jos/${joId}/bulk/target-arrival`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  // Trackers
  async getSubcontTracker(): Promise<{ data: any[] }> {
    return request<{ data: any[] }>("/trackers/subcont");
  },

  async getPoTracker(): Promise<{ data: any[] }> {
    return request<{ data: any[] }>("/trackers/po");
  },

  // Trial Sessions
  async getTrialSessions(joId: string): Promise<{ data: any[] }> {
    return request<{ data: any[] }>(`/jos/${joId}/trial-sessions`);
  },

  async getTrialSession(sessionId: string): Promise<{ data: any }> {
    return request<{ data: any }>(`/trial-sessions/${sessionId}`);
  },

  async createTrialSession(
    joId: string,
    payload: {
      id?: string;
      name: string;
      trialDate?: string;
      updateDate?: string;
      customer?: string;
      jobNo?: string;
      picName?: string;
      approvedByName?: string;
    }
  ): Promise<{ data: any; message: string }> {
    return request<{ data: any; message: string }>(`/jos/${joId}/trial-sessions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateTrialSession(
    sessionId: string,
    payload: Record<string, any>
  ): Promise<{ data: any; message: string }> {
    return request<{ data: any; message: string }>(`/trial-sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async publishTrialSession(sessionId: string, snapshot?: any): Promise<{ data: any; message: string }> {
    return request<{ data: any; message: string }>(`/trial-sessions/${sessionId}/publish`, {
      method: "POST",
      body: JSON.stringify(snapshot ? { snapshot } : {}),
    });
  },

  async duplicateTrialSession(
    sessionId: string,
    name?: string
  ): Promise<{ data: any; message: string }> {
    return request<{ data: any; message: string }>(`/trial-sessions/${sessionId}/duplicate`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  async deleteTrialSession(sessionId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/trial-sessions/${sessionId}`, {
      method: "DELETE",
    });
  },

  async addTrialFinding(sessionId: string, payload?: { id?: string }): Promise<{ data: any; message: string }> {
    return request<{ data: any; message: string }>(`/trial-sessions/${sessionId}/findings`, {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    });
  },

  async deleteTrialFinding(findingId: string): Promise<{ data: any; message: string }> {
    return request<{ data: any; message: string }>(`/trial-findings/${findingId}`, {
      method: "DELETE",
    });
  },

  async addTrialEntry(
    findingId: string,
    payload: {
      id?: string;
      section: "problems" | "causes" | "correctiveActions";
      text?: string;
      targetDate?: string;
      pic?: string;
      status?: string;
    }
  ): Promise<{ data: any; message: string }> {
    return request<{ data: any; message: string }>(`/trial-findings/${findingId}/entries`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateTrialEntry(
    entryId: string,
    payload: {
      text?: string;
      targetDate?: string;
      pic?: string;
      status?: string;
    }
  ): Promise<{ data: any; message: string }> {
    return request<{ data: any; message: string }>(`/trial-entries/${entryId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async deleteTrialEntry(entryId: string): Promise<{ data: any; message: string }> {
    return request<{ data: any; message: string }>(`/trial-entries/${entryId}`, {
      method: "DELETE",
    });
  },

  async uploadTrialPhoto(
    entryId: string,
    file: File
  ): Promise<{ data: any; session: any; message: string }> {
    const formData = new FormData();
    formData.append("photo", file);

    const token = typeof window !== "undefined" ? localStorage.getItem("matrix_auth_token") : null;
    const res = await fetch(`${API_BASE_URL}/trial-entries/${entryId}/photos`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Failed to upload photo");
    }

    return res.json();
  },

  async deleteTrialPhoto(photoId: string): Promise<{ data: any; message: string }> {
    return request<{ data: any; message: string }>(`/trial-entry-photos/${photoId}`, {
      method: "DELETE",
    });
  },

  // Process Evidence Photos
  async uploadControlPhoto(
    controlId: string,
    file: File
  ): Promise<{ data: ProcessPhoto; message: string }> {
    const formData = new FormData();
    formData.append("photo", file);

    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/controls/${controlId}/photos`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (res.status === 401) handleUnauthorized();

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "Upload process photo failed");
    }

    return res.json();
  },

  async deleteControlPhoto(photoId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/process-photos/${photoId}`, {
      method: "DELETE",
    });
  },

  // OCR Vision AI
  async uploadOcrImage(
    categoryId: string,
    file: File,
    consent: boolean = true
  ): Promise<{ success: boolean; provider: string; items: any[]; message: string }> {
    const formData = new FormData();
    formData.append("image", file);
    formData.append("consent", consent ? "1" : "0");

    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/categories/${categoryId}/ocr-upload`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (res.status === 401) handleUnauthorized();

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "OCR extraction failed");
    }

    return res.json();
  },
};
