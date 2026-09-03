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
    token = localStorage.getItem("matrix_auth_token");
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
};
