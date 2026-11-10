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
  Partner,
  PartnerType,
  PartnerStatus,
  TrialSession,
  TrialSessionSnapshot,
  TrialFinding,
  TrialEntryPhoto,
} from "./types";
import { API_BASE_URL } from "./config";
import { getAuthToken, clearAuthStorage } from "./auth-storage";

export interface PoTrackerApiResponse {
  id: string;
  itemId: string;
  itemNo: string;
  itemDescription: string;
  itemDimension: string;
  itemMaterial: string;
  itemQty: number;
  itemHrc: string;
  joId: string;
  joNumber: string;
  joProduct: string;
  joType: JoType;
  projectId: string;
  projectName: string;
  projectCustomer: string;
  supplier?: string;
  poNo?: string;
  poDate?: string;
  targetArrival?: string;
  status: ControlStatus;
  notes?: string;
}

export interface SubcontTrackerApiResponse {
  id: string;
  itemNo: string;
  itemDescription: string;
  itemDimension: string;
  itemMaterial: string;
  itemQty: number;
  joId: string;
  joNumber: string;
  joProduct: string;
  joType: JoType;
  projectId: string;
  projectName: string;
  projectCustomer: string;
  subcontSupplier?: string;
  subcontProcess?: string;
  subcontStatus?: string;
  arrivalTargetDate?: string;
  subcontNotes?: string;
}

export interface OcrExtractedItem {
  no: string;
  description: string;
  dimension: string;
  material: string;
  qty: number;
  hrc: string;
}

class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
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

  async updateCategory(
    categoryId: string,
    payload: { label: string }
  ): Promise<{ data: Category; message: string }> {
    return request<{ data: Category; message: string }>(`/categories/${categoryId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deleteCategory(categoryId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/categories/${categoryId}`, {
      method: "DELETE",
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

  async createTrackerItem(payload: {
    tracker: "po" | "subcont";
    categoryId?: string;
    kind?: CategoryKind;
    no?: string;
    description: string;
    dimension?: string;
    material?: string;
    qty?: number;
    hrc?: string;
    targetArrival?: string;
    subcontNotes?: string;
  }): Promise<{ data: { project: Project; jo: JO; category: Category; item: Item }; message: string }> {
    return request<{ data: { project: Project; jo: JO; category: Category; item: Item }; message: string }>(
      `/trackers/items`,
      { method: "POST", body: JSON.stringify(payload) }
    );
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
  async getSubcontTracker(): Promise<{ data: SubcontTrackerApiResponse[] }> {
    return request<{ data: SubcontTrackerApiResponse[] }>("/trackers/subcont");
  },

  async getPoTracker(): Promise<{ data: PoTrackerApiResponse[] }> {
    return request<{ data: PoTrackerApiResponse[] }>("/trackers/po");
  },

  // Trial Sessions
  async getTrialSessions(joId: string): Promise<{ data: TrialSession[] }> {
    return request<{ data: TrialSession[] }>(`/jos/${joId}/trial-sessions`);
  },

  async getTrialSession(sessionId: string): Promise<{ data: TrialSession }> {
    return request<{ data: TrialSession }>(`/trial-sessions/${sessionId}`);
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
  ): Promise<{ data: TrialSession; message: string }> {
    return request<{ data: TrialSession; message: string }>(`/jos/${joId}/trial-sessions`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updateTrialSession(
    sessionId: string,
    payload: Partial<Omit<TrialSession, "id" | "joId" | "findings" | "createdAt">>
  ): Promise<{ data: TrialSession; message: string }> {
    return request<{ data: TrialSession; message: string }>(`/trial-sessions/${sessionId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async publishTrialSession(sessionId: string, snapshot?: TrialSessionSnapshot): Promise<{ data: TrialSession; message: string }> {
    return request<{ data: TrialSession; message: string }>(`/trial-sessions/${sessionId}/publish`, {
      method: "POST",
      body: JSON.stringify(snapshot ? { snapshot } : {}),
    });
  },

  async duplicateTrialSession(
    sessionId: string,
    name?: string
  ): Promise<{ data: TrialSession; message: string }> {
    return request<{ data: TrialSession; message: string }>(`/trial-sessions/${sessionId}/duplicate`, {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  },

  async deleteTrialSession(sessionId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/trial-sessions/${sessionId}`, {
      method: "DELETE",
    });
  },

  async addTrialFinding(sessionId: string, payload?: { id?: string }): Promise<{ data: TrialSession; message: string }> {
    return request<{ data: TrialSession; message: string }>(`/trial-sessions/${sessionId}/findings`, {
      method: "POST",
      body: payload ? JSON.stringify(payload) : undefined,
    });
  },

  async deleteTrialFinding(findingId: string): Promise<{ data: TrialSession; message: string }> {
    return request<{ data: TrialSession; message: string }>(`/trial-findings/${findingId}`, {
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
  ): Promise<{ data: TrialSession; message: string }> {
    return request<{ data: TrialSession; message: string }>(`/trial-findings/${findingId}/entries`, {
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
  ): Promise<{ data: TrialSession; message: string }> {
    return request<{ data: TrialSession; message: string }>(`/trial-entries/${entryId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  },

  async deleteTrialEntry(entryId: string): Promise<{ data: TrialSession; message: string }> {
    return request<{ data: TrialSession; message: string }>(`/trial-entries/${entryId}`, {
      method: "DELETE",
    });
  },

  async uploadTrialPhoto(
    entryId: string,
    file: File
  ): Promise<{ data: TrialEntryPhoto; session: TrialSession; message: string }> {
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

  async deleteTrialPhoto(photoId: string): Promise<{ data: TrialSession; message: string }> {
    return request<{ data: TrialSession; message: string }>(`/trial-entry-photos/${photoId}`, {
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
  ): Promise<{ success: boolean; provider: string; items: OcrExtractedItem[]; message: string }> {
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
      const firstErr = err.errors ? Object.values(err.errors).flat()[0] : null;
      const statusText = res.status === 413 ? "Ukuran file terlalu besar (maksimal 15MB)." : null;
      throw new Error((firstErr as string) || err.message || statusText || `OCR extraction failed (HTTP ${res.status})`);
    }

    return res.json();
  },

  // Partners (Customer & Supplier Management)
  async getPartners(type?: PartnerType, status?: PartnerStatus): Promise<Partner[]> {
    const params = new URLSearchParams();
    if (type) params.append("type", type);
    if (status) params.append("status", status);
    const queryString = params.toString() ? `?${params.toString()}` : "";
    const res = await request<{ data: Partner[] }>(`/partners${queryString}`);
    return res.data;
  },

  async createPartner(payload: {
    name: string;
    type: PartnerType;
    status?: PartnerStatus;
  }): Promise<{ data: Partner; message: string }> {
    return request<{ data: Partner; message: string }>(`/partners`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async updatePartner(
    partnerId: string,
    payload: {
      name?: string;
      type?: PartnerType;
      status?: PartnerStatus;
    }
  ): Promise<{ data: Partner; message: string }> {
    return request<{ data: Partner; message: string }>(`/partners/${partnerId}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },

  async deletePartner(partnerId: string): Promise<{ message: string }> {
    return request<{ message: string }>(`/partners/${partnerId}`, {
      method: "DELETE",
    });
  },
};
