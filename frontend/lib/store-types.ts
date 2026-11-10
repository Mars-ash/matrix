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
  PoTracking,
  TrialSession,
  TrialSessionSnapshot,
  TrialFinding,
  TrialTextEntry,
  TrialCorrectiveActionEntry,
  TrialEntryPhoto,
} from "./types";

export type TrialEntrySection = "problems" | "causes" | "correctiveActions";

export interface AppState {
  projects: Project[];
  isHydrated?: boolean;
}

export type AppAction =
  | {
      type: "HYDRATE_PROJECTS";
      projects: Project[];
    }
  | {
      type: "SET_PROJECTS";
      projects: Project[];
    }
  | {
      type: "SET_HYDRATED";
      isHydrated: boolean;
    }
  | {
      type: "SYNC_PROJECT";
      tempId?: string;
      project: Project;
    }
  | {
      type: "SYNC_JO";
      projectId: string;
      tempJoId?: string;
      jo: JO;
    }
  | {
      type: "SYNC_CATEGORY";
      projectId: string;
      joId: string;
      category: Category;
      tempCategoryId?: string;
      tempCategoryLabel?: string;
    }
  | {
      type: "SYNC_ITEM";
      projectId: string;
      joId: string;
      categoryId: string;
      item: Item;
      tempItemId?: string;
    }
  | {
      type: "SYNC_ITEMS_BATCH";
      projectId: string;
      joId: string;
      categoryId: string;
      items: Item[];
      tempItemIds?: string[];
    }
  | {
      type: "CREATE_PROJECT";
      id: string;
      name: string;
      customer: string;
      company?: CompanyEntity;
    }
  | {
      type: "CREATE_JO";
      id: string;
      projectId: string;
      joNumber: string;
      product: string;
      joType: JoType;
      targetDate?: string;
      categories: { label: string; kind: CategoryKind; isCustom: boolean }[];
    }
  | {
      type: "UPDATE_PROJECT";
      projectId: string;
      name?: string;
      customer?: string;
      company?: CompanyEntity;
    }
  | {
      type: "DELETE_PROJECT";
      projectId: string;
    }
  | {
      type: "DELETE_JO";
      projectId: string;
      joId: string;
    }
  | {
      type: "ADD_CATEGORY";
      projectId: string;
      joId: string;
      label: string;
      kind: CategoryKind;
      isCustom: boolean;
    }
  | {
      type: "UPDATE_CATEGORY";
      projectId: string;
      joId: string;
      categoryId: string;
      label: string;
    }
  | {
      type: "DELETE_CATEGORY";
      projectId: string;
      joId: string;
      categoryId: string;
    }
  | {
      type: "ADD_ITEM";
      projectId: string;
      joId: string;
      categoryId: string;
      itemId?: string;
      item: Omit<Item, "id" | "controls">;
      kind: CategoryKind;
    }
  | {
      type: "ADD_ITEMS_BATCH";
      projectId: string;
      joId: string;
      categoryId: string;
      items: (Omit<Item, "id" | "controls"> & { id?: string })[];
      kind: CategoryKind;
    }
  | {
      type: "UPDATE_ITEM";
      projectId: string;
      joId: string;
      categoryId: string;
      itemId: string;
      data: {
        no?: string;
        description: string;
        dimension?: string;
        material?: string;
        qty?: number;
        hrc?: string;
      };
    }
  | {
      type: "DELETE_ITEM";
      projectId: string;
      joId: string;
      categoryId: string;
      itemId: string;
    }
  | {
      type: "BATCH_DELETE_ITEMS";
      projectId: string;
      joId: string;
      itemIds: string[];
    }
  | {
      type: "UPDATE_STATUS";
      projectId: string;
      joId: string;
      categoryId: string;
      itemId: string;
      process: string;
      status: ControlStatus;
      notes: string;
    }
  | {
      type: "UPDATE_CONTROL_TARGET_DATE";
      projectId: string;
      joId: string;
      categoryId: string;
      itemId: string;
      process: string;
      targetDate: string;
    }
  | {
      type: "UPDATE_PO_TRACKING";
      projectId: string;
      joId: string;
      categoryId: string;
      itemId: string;
      process: "Material" | "PO";
      status?: ControlStatus;
      problemNotes?: string;
      tracking: PoTracking;
      qty?: number;
    }
  | {
      type: "BULK_UPDATE_TARGET_ARRIVAL";
      projectId: string;
      joId: string;
      itemIds: string[];
      targetDate: string;
    }
  | {
      type: "BULK_UPDATE_STATUS";
      projectId: string;
      joId: string;
      itemIds: string[];
      process?: string;
      processes?: string[];
      status: ControlStatus;
      notes?: string;
    }
  | {
      type: "BULK_SEND_SUBCONT";
      projectId: string;
      joId: string;
      itemIds: string[];
      process: string;
      supplier?: string;
      arrivalTargetDate?: string;
    }
  | {
      type: "BULK_SEND_PO";
      projectId: string;
      joId: string;
      itemIds: string[];
      supplier?: string;
      poNo?: string;
      poDate?: string;
      targetArrival?: string;
      notes?: string;
    }
  | {
      type: "FINISH_JO";
      projectId: string;
      joId: string;
    }
  | {
      type: "RESTORE_JO";
      projectId: string;
      joId: string;
    }
  | {
      type: "UPDATE_ITEM_SUBCONT";
      projectId: string;
      joId: string;
      categoryId: string;
      itemId: string;
      isSubcont: boolean;
      subcontNotes?: string;
      subcontSupplier?: string;
      subcontStatus?: "In Progress" | "Done" | "Problem";
      subcontProcess?: string;
      qty?: number;
      arrivalTargetDate?: string;
    }
  | {
      type: "ADD_PROCESS_PHOTO";
      projectId: string;
      joId: string;
      categoryId: string;
      itemId: string;
      process: string;
      photo: { id: string; name: string; previewUrl: string };
      file?: File;
    }
  | {
      type: "SYNC_PROCESS_PHOTO";
      projectId: string;
      joId: string;
      categoryId: string;
      itemId: string;
      process: string;
      tempPhotoId: string;
      photo: ProcessPhoto;
    }
  | {
      type: "REMOVE_PROCESS_PHOTO";
      projectId: string;
      joId: string;
      categoryId: string;
      itemId: string;
      process: string;
      photoId: string;
    }
  | {
      type: "CREATE_TRIAL_SESSION";
      projectId: string;
      joId: string;
      session: TrialSession;
    }
  | {
      type: "DUPLICATE_TRIAL_SESSION";
      projectId: string;
      joId: string;
      sourceSessionId: string;
      session: TrialSession;
    }
  | {
      type: "UPDATE_TRIAL_SESSION";
      projectId: string;
      joId: string;
      sessionId: string;
      updates: Partial<Omit<TrialSession, "id" | "joId" | "findings" | "createdAt">>;
    }
  | {
      type: "PUBLISH_TRIAL_SESSION_TO_VIEWER";
      projectId: string;
      joId: string;
      sessionId: string;
    }
  | {
      type: "DELETE_TRIAL_SESSION";
      projectId: string;
      joId: string;
      sessionId: string;
    }
  | {
      type: "ADD_TRIAL_FINDING";
      projectId: string;
      joId: string;
      sessionId: string;
      finding: TrialFinding;
    }
  | {
      type: "DELETE_TRIAL_FINDING";
      projectId: string;
      joId: string;
      sessionId: string;
      findingId: string;
    }
  | {
      type: "REORDER_TRIAL_FINDING";
      projectId: string;
      joId: string;
      sessionId: string;
      findingId: string;
      direction: "up" | "down";
    }
  | {
      type: "ADD_TRIAL_ENTRY";
      projectId: string;
      joId: string;
      sessionId: string;
      findingId: string;
      section: TrialEntrySection;
      entry: TrialTextEntry | TrialCorrectiveActionEntry;
    }
  | {
      type: "UPDATE_TRIAL_ENTRY";
      projectId: string;
      joId: string;
      sessionId: string;
      findingId: string;
      section: TrialEntrySection;
      entryId: string;
      updates:
        | Partial<Omit<TrialTextEntry, "id" | "photos" | "createdAt">>
        | Partial<Omit<TrialCorrectiveActionEntry, "id" | "photos" | "createdAt">>;
    }
  | {
      type: "DELETE_TRIAL_ENTRY";
      projectId: string;
      joId: string;
      sessionId: string;
      findingId: string;
      section: TrialEntrySection;
      entryId: string;
    }
  | {
      type: "REORDER_TRIAL_ENTRY";
      projectId: string;
      joId: string;
      sessionId: string;
      findingId: string;
      section: TrialEntrySection;
      entryId: string;
      direction: "up" | "down";
    }
  | {
      type: "ADD_TRIAL_ENTRY_PHOTO";
      projectId: string;
      joId: string;
      sessionId: string;
      findingId: string;
      section: TrialEntrySection;
      entryId: string;
      photo: { id: string; name: string; previewUrl: string };
      file?: File;
    }
  | {
      type: "REMOVE_TRIAL_ENTRY_PHOTO";
      projectId: string;
      joId: string;
      sessionId: string;
      findingId: string;
      section: TrialEntrySection;
      entryId: string;
      photoId: string;
    }
  | {
      type: "HYDRATE_TRIAL_STORAGE";
      stored?: Record<string, TrialSession[]>;
    }
  | {
      type: "INSERT_TRACKER_ITEM";
      project: Pick<Project, "id" | "name" | "customer" | "company" | "isSystem">;
      jo: Pick<JO, "id" | "joNumber" | "product" | "type">;
      category: Pick<Category, "id" | "label" | "kind" | "isCustom">;
      item: Item;
    };

// ---------------------------------------------------------------------------
// Helpers & Storage
// ---------------------------------------------------------------------------
import {
  TRIAL_STORAGE_KEY,
  CLIENT_TAB_ID,
  updateTrialMemoryCache,
  saveTrialSessionsToStorage,
  loadTrialSessionsFromStorage,
  loadTrialSessionsFromIndexedDB,
  hydrateTrialSessions,
  canonicalMergeTrialSessions,
  clearTrialStorageCache,
} from "./trial-storage";

export {
  TRIAL_STORAGE_KEY,
  CLIENT_TAB_ID,
  updateTrialMemoryCache,
  saveTrialSessionsToStorage,
  loadTrialSessionsFromStorage,
  loadTrialSessionsFromIndexedDB,
  hydrateTrialSessions,
  canonicalMergeTrialSessions,
  clearTrialStorageCache,
};
