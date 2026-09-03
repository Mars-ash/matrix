import type {
  Project,
  JO,
  Item,
  Category,
  Control,
  ControlStatus,
  PoTracking,
  JoType,
  CategoryKind,
} from "./types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api";

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

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  let token: string | null = null;
  if (typeof window !== "undefined") {
    token = localStorage.getItem("matrix_auth_token") || "demo-prototype-token";
  }

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

  async createProject(name: string, customer: string): Promise<{ data: Project; message: string }> {
    return request<{ data: Project; message: string }>("/projects", {
      method: "POST",
      body: JSON.stringify({ name, customer }),
    });
  },

  async getProject(projectId: string): Promise<{ data: Project }> {
    return request<{ data: Project }>(`/projects/${projectId}`);
  },

  // JOs
  async createJO(
    projectId: string,
    payload: {
      joNumber: string;
      product: string;
      type: JoType;
      targetDate?: string;
      categories?: { label: string; kind: CategoryKind; isCustom: boolean }[];
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
      subcontStatus?: "In Progress" | "Done";
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
      status: ControlStatus;
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

  async addTrialFinding(sessionId: string): Promise<{ data: any; message: string }> {
    return request<{ data: any; message: string }>(`/trial-sessions/${sessionId}/findings`, {
      method: "POST",
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

  // OCR Vision AI
  async uploadOcrImage(
    categoryId: string,
    file: File
  ): Promise<{ success: boolean; provider: string; items: any[]; message: string }> {
    const formData = new FormData();
    formData.append("image", file);

    const token =
      (typeof window !== "undefined" && localStorage.getItem("matrix_auth_token")) || "demo-prototype-token";
    const res = await fetch(`${API_BASE_URL}/categories/${categoryId}/ocr-upload`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || "OCR extraction failed");
    }

    return res.json();
  },
};
