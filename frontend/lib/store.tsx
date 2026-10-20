"use client";
// ---------------------------------------------------------------------------
// In-memory store — React context + reducer for prototype state.
// Browser-session only; no persistence, no API calls.
// ---------------------------------------------------------------------------
import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from "react";
import { api } from "./api-client";
import { useAuth } from "./auth";
import type {
  Project,
  JO,
  Category,
  Item,
  ControlStatus,
  PoTracking,
  JoType,
  CategoryKind,
  TrialSession,
  TrialFinding,
  TrialTextEntry,
  TrialCorrectiveActionEntry,
  TrialEntryPhoto,
  CompanyEntity,
  ProcessPhoto,
} from "./types";
import { INITIAL_PROJECTS } from "./mock-data";
import { defaultControls } from "./category";
import { uid } from "./format";
import { isPoTrackingProcess, poTrackingLabel, isItemPoSent } from "./po-tracking";
import { isItemSubcontSent } from "./subcont-tracking";

export type TrialEntrySection = "problems" | "causes" | "correctiveActions";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
export interface AppState {
  projects: Project[];
  isHydrated?: boolean;
}

export const PROJECTS_CACHE_KEY = "matrix_projects_cache";

export function getCachedProjects(): Project[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROJECTS_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {}
  return null;
}

const initialState: AppState = {
  projects: structuredClone(INITIAL_PROJECTS),
  isHydrated: true,
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
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

function findProjectAndJo(
  projects: Project[],
  projectId: string,
  joId: string
): { project?: Project; jo?: JO } {
  let project = projects.find(
    (p) => p.id === projectId || (p as any).tempId === projectId
  );
  if (!project) {
    project = projects.find((p) =>
      p.jos?.some((j) => j.id === joId || (j as any).tempId === joId || j.joNumber === joId)
    );
  }
  const jo = project?.jos?.find(
    (j) => j.id === joId || (j as any).tempId === joId || j.joNumber === joId
  );
  return { project, jo };
}

function findCategoryContext(
  projects: Project[],
  projectId?: string,
  joId?: string,
  categoryId?: string
): { project?: Project; jo?: JO; category?: Category } {
  let project: Project | undefined;
  let jo: JO | undefined;
  let category: Category | undefined;

  if (projectId && joId) {
    const pj = findProjectAndJo(projects, projectId, joId);
    project = pj.project;
    jo = pj.jo;
    if (jo && categoryId) {
      category = jo.categories?.find((c) => c.id === categoryId);
    }
  } else if (joId) {
    for (const p of projects) {
      const j = p.jos?.find(
        (item) => item.id === joId || (item as any).tempId === joId || item.joNumber === joId
      );
      if (j) {
        jo = j;
        project = p;
        if (categoryId) {
          category = j.categories?.find((c) => c.id === categoryId);
        }
        break;
      }
    }
  }

  // Fallback: search globally across all projects and JOs by categoryId
  if (!category && categoryId) {
    for (const p of projects) {
      for (const j of p.jos || []) {
        const c = j.categories?.find((cat) => cat.id === categoryId);
        if (c) {
          category = c;
          jo = j;
          project = p;
          break;
        }
      }
      if (category) break;
    }
  }

  return { project, jo, category };
}

function addActivity(jo: JO, message: string): void {
  if (!jo.activities) {
    jo.activities = [];
  }
  jo.activities.unshift({
    id: uid(),
    timestamp: new Date().toISOString(),
    message,
  });
}

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------
function executeReducer(next: AppState, state: AppState, action: AppAction): AppState {

  switch (action.type) {
    case "HYDRATE_PROJECTS": {
      const stored = typeof window !== "undefined" ? loadTrialSessionsFromStorage() : {};
      const projectsWithTrials =
        Object.keys(stored).length > 0
          ? hydrateTrialSessions(action.projects, stored)
          : action.projects;
      return {
        ...state,
        projects: projectsWithTrials,
        isHydrated: true,
      };
    }

    case "SET_HYDRATED": {
      return {
        ...state,
        isHydrated: action.isHydrated,
      };
    }

    case "SET_PROJECTS": {
      const storedTrials = loadTrialSessionsFromStorage();
      const existingTrialsByJoNumber = new Map<string, TrialSession[]>();
      const existingTrialsById = new Map<string, TrialSession[]>();
      for (const p of state.projects) {
        for (const j of p.jos || []) {
          if (j.trialSessions && j.trialSessions.length > 0) {
            existingTrialsByJoNumber.set(j.joNumber, j.trialSessions);
            existingTrialsById.set(j.id, j.trialSessions);
          }
        }
      }

      next.projects = action.projects.map((p) => ({
        ...p,
        jos: (p.jos || []).map((j) => {
          const fromStored = storedTrials[j.id] || (j.joNumber ? storedTrials[j.joNumber] : undefined) || [];
          const fromExisting = existingTrialsById.get(j.id) || (j.joNumber ? existingTrialsByJoNumber.get(j.joNumber) : undefined) || [];
          const backendSessions = j.trialSessions || [];

          // Canonical merge of backend sessions (with database ULIDs), existing in-memory state, and storage
          const mergedSessions = canonicalMergeTrialSessions([
            ...backendSessions,
            ...fromExisting,
            ...fromStored,
          ]).map((s) => ({
            ...s,
            findings: s.findings || [],
          }));

          return {
            ...j,
            activities: j.activities || [],
            trialSessions: mergedSessions,
            categories: (j.categories || []).map((c) => ({
              ...c,
              items: (c.items || []).map((item) => ({
                ...item,
                controls: item.controls || [],
              })),
            })),
          };
        }),
      }));
      next.isHydrated = true;
      return next;
    }

    case "SYNC_PROJECT": {
      const existingIdx = next.projects.findIndex(
        (p) => p.id === action.project.id || (action.tempId && p.id === action.tempId)
      );
      if (existingIdx !== -1) {
        const existingJos = next.projects[existingIdx].jos || [];
        next.projects[existingIdx] = {
          ...action.project,
          jos: existingJos.length > 0 ? existingJos : (action.project.jos || []),
        };
      } else {
        next.projects.push(action.project);
      }
      return next;
    }

    case "SYNC_JO": {
      const project = next.projects.find(
        (p) => p.id === action.projectId || (p as any).tempId === action.projectId
      );
      if (!project) return state;

      const existingJoIdx = project.jos.findIndex(
        (j) =>
          j.id === action.jo.id ||
          (action.tempJoId && j.id === action.tempJoId) ||
          j.joNumber === action.jo.joNumber
      );
      if (existingJoIdx !== -1) {
        project.jos[existingJoIdx] = action.jo;
      } else {
        project.jos.push(action.jo);
      }
      return next;
    }

    case "SYNC_CATEGORY": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;

      const catIdx = jo.categories.findIndex(
        (c) =>
          c.id === action.category.id ||
          (action.tempCategoryId && c.id === action.tempCategoryId) ||
          (action.tempCategoryLabel && c.label.trim().toLowerCase() === action.tempCategoryLabel.trim().toLowerCase())
      );
      if (catIdx !== -1) {
        jo.categories[catIdx] = {
          ...action.category,
          items: jo.categories[catIdx].items.length > 0 ? jo.categories[catIdx].items : action.category.items,
        };
      } else {
        if (action.category.kind === "Part") {
          const firstComponentIdx = jo.categories.findIndex((c) => c.kind === "Component");
          if (firstComponentIdx !== -1) {
            jo.categories.splice(firstComponentIdx, 0, action.category);
          } else {
            jo.categories.push(action.category);
          }
        } else {
          jo.categories.push(action.category);
        }
      }
      return next;
    }

    case "SYNC_ITEM": {
      const { category: cat } = findCategoryContext(
        next.projects,
        action.projectId,
        action.joId,
        action.categoryId
      );
      if (!cat) return state;

      const itemIdx = cat.items.findIndex(
        (i) =>
          i.id === action.item.id ||
          (action.tempItemId && i.id === action.tempItemId) ||
          (i.description?.trim().toLowerCase() === action.item.description?.trim().toLowerCase() &&
            i.no === action.item.no)
      );
      if (itemIdx !== -1) {
        cat.items[itemIdx] = action.item;
      } else {
        cat.items.push(action.item);
      }
      return next;
    }

    case "SYNC_ITEMS_BATCH": {
      const { category: cat } = findCategoryContext(
        next.projects,
        action.projectId,
        action.joId,
        action.categoryId
      );
      if (!cat) return state;

      if (action.tempItemIds && action.tempItemIds.length > 0) {
        const tempSet = new Set(action.tempItemIds);
        cat.items = cat.items.filter((i) => !tempSet.has(i.id));
      }
      for (const item of action.items) {
        const idx = cat.items.findIndex((i) => i.id === item.id);
        if (idx !== -1) {
          cat.items[idx] = item;
        } else {
          cat.items.push(item);
        }
      }
      return next;
    }

    case "CREATE_PROJECT": {
      const newProj: Project = {
        id: action.id,
        name: action.name,
        customer: action.customer,
        company: action.company || "BKP",
        jos: [],
      };
      next.projects.push(newProj);
      return next;
    }

    case "UPDATE_PROJECT": {
      const project = next.projects.find((p) => p.id === action.projectId);
      if (!project) return state;
      if (action.name !== undefined) project.name = action.name;
      if (action.customer !== undefined) project.customer = action.customer;
      if (action.company !== undefined) project.company = action.company;
      return next;
    }

    case "DELETE_PROJECT": {
      next.projects = next.projects.filter((p) => p.id !== action.projectId);
      return next;
    }

    case "DELETE_JO": {
      const project =
        next.projects.find((p) => p.id === action.projectId) ||
        next.projects.find((p) => p.jos?.some((j) => j.id === action.joId || j.joNumber === action.joId));
      if (!project) return state;
      project.jos = (project.jos || []).filter((j) => j.id !== action.joId && j.joNumber !== action.joId);
      return next;
    }

    case "CREATE_JO": {
      const project = next.projects.find((p) => p.id === action.projectId);
      if (!project) return state;

      const newJo: JO = {
        id: action.id,
        joNumber: action.joNumber,
        product: action.product,
        type: action.joType,
        targetDate: action.targetDate,
        categories: action.categories.map((c) => ({
          id: uid(),
          label: c.label,
          kind: c.kind,
          isCustom: c.isCustom,
          items: [],
        })),
        activities: [],
      };
      addActivity(
        newJo,
        `JO ${action.joNumber} created${
          action.categories.length
            ? ` with categories: ${action.categories.map((c) => c.label).join(", ")}`
            : ""
        }.`
      );
      project.jos.push(newJo);
      return next;
    }

    case "ADD_CATEGORY": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;

      const newCategory: Category = {
        id: uid(),
        label: action.label,
        kind: action.kind,
        isCustom: action.isCustom,
        items: [],
      };

      if (action.kind === "Part") {
        const firstComponentIdx = jo.categories.findIndex((c) => c.kind === "Component");
        if (firstComponentIdx !== -1) {
          jo.categories.splice(firstComponentIdx, 0, newCategory);
        } else {
          jo.categories.push(newCategory);
        }
      } else {
        jo.categories.push(newCategory);
      }

      addActivity(jo, `Category "${action.label}" added.`);
      return next;
    }

    case "UPDATE_CATEGORY": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      const cat = jo?.categories.find((c) => c.id === action.categoryId);
      if (!cat || !jo) return state;

      const oldLabel = cat.label;
      cat.label = action.label;
      addActivity(jo, `Category "${oldLabel}" renamed to "${action.label}".`);
      return next;
    }

    case "DELETE_CATEGORY": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;

      const catIndex = jo.categories.findIndex((c) => c.id === action.categoryId);
      if (catIndex === -1) return state;

      const [deleted] = jo.categories.splice(catIndex, 1);
      addActivity(jo, `Category "${deleted.label}" deleted.`);
      return next;
    }

    case "ADD_ITEM": {
      const { jo, category: cat } = findCategoryContext(
        next.projects,
        action.projectId,
        action.joId,
        action.categoryId
      );
      if (!cat) return state;

      const newItem: Item = {
        ...action.item,
        id: action.itemId || uid(),
        controls: defaultControls(action.kind),
      };
      cat.items.push(newItem);
      if (jo) {
        addActivity(jo, `Item "${action.item.description}" added to ${cat.label}.`);
      }
      return next;
    }

    case "ADD_ITEMS_BATCH": {
      const { jo, category: cat } = findCategoryContext(
        next.projects,
        action.projectId,
        action.joId,
        action.categoryId
      );
      if (!cat) return state;

      const newItems: Item[] = action.items.map((item) => {
        const newItem: Item = {
          ...item,
          id: item.id || uid(),
          controls: defaultControls(action.kind),
        };
        return newItem;
      });
      cat.items.push(...newItems);
      if (jo) {
        addActivity(
          jo,
          `${action.items.length} items added to ${cat.label} via image conversion.`
        );
      }
      return next;
    }

    case "INSERT_TRACKER_ITEM": {
      let project = next.projects.find((p) => p.id === action.project.id);
      if (!project) {
        project = {
          id: action.project.id,
          name: action.project.name,
          customer: action.project.customer,
          company: action.project.company,
          isSystem: action.project.isSystem,
          jos: [],
        };
        next.projects.push(project);
      }

      let jo = project.jos.find((j) => j.id === action.jo.id);
      if (!jo) {
        jo = {
          id: action.jo.id,
          joNumber: action.jo.joNumber,
          product: action.jo.product,
          type: action.jo.type,
          categories: [],
          activities: [],
        };
        project.jos.push(jo);
      }

      let category = jo.categories.find((c) => c.id === action.category.id);
      if (!category) {
        category = {
          id: action.category.id,
          label: action.category.label,
          kind: action.category.kind,
          isCustom: action.category.isCustom,
          items: [],
        };
        jo.categories.push(category);
      }

      const existingItem = category.items.find((i) => i.id === action.item.id);
      if (!existingItem) {
        category.items.push({
          ...action.item,
          controls: action.item.controls ?? [],
        });
      }

      return next;
    }

    case "UPDATE_ITEM": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      const cat = jo?.categories.find((c) => c.id === action.categoryId);
      const item = cat?.items.find((i) => i.id === action.itemId);
      if (!item) return state;

      if (action.data.no !== undefined) item.no = action.data.no;
      if (action.data.description !== undefined) item.description = action.data.description;
      if (action.data.dimension !== undefined) item.dimension = action.data.dimension;
      if (action.data.material !== undefined) item.material = action.data.material;
      if (action.data.qty !== undefined) item.qty = action.data.qty;
      if (action.data.hrc !== undefined) item.hrc = action.data.hrc;

      addActivity(jo!, `Item "${item.description}" updated.`);
      return next;
    }

    case "DELETE_ITEM": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      const cat = jo?.categories.find((c) => c.id === action.categoryId);
      if (!cat) return state;

      const item = cat.items.find((i) => i.id === action.itemId);
      const desc = item ? item.description : "Item";

      cat.items = cat.items.filter((i) => i.id !== action.itemId);
      addActivity(jo!, `Item "${desc}" deleted.`);
      return next;
    }

    case "BATCH_DELETE_ITEMS": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;

      let deletedCount = 0;
      for (const cat of jo.categories) {
        const prevLength = cat.items.length;
        cat.items = cat.items.filter((i) => !action.itemIds.includes(i.id));
        deletedCount += prevLength - cat.items.length;
      }

      addActivity(jo, `Batch: ${deletedCount} items deleted.`);
      return next;
    }

    case "UPDATE_STATUS": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      const cat = jo?.categories.find((c) => c.id === action.categoryId);
      const item = cat?.items.find((i) => i.id === action.itemId);
      if (!item) return state;

      const control = item.controls.find((c) => c.process === action.process);
      if (!control) return state;

      // Problem requires notes — this is enforced at the UI layer,
      // but guard here too.
      if (action.status === "Problem" && !action.notes.trim()) {
        return state;
      }

      const prevStatus = control.status;
      control.status = action.status;
      control.notes = action.status === "Problem" ? action.notes : "";

      if (action.status === "Done") {
        control.doneAt = new Date().toISOString();
        if (action.process === "Arrival") {
          const poCtrl = item.controls.find((c) => isPoTrackingProcess(c.process));
          if (poCtrl?.poTracking) {
            poCtrl.poTracking.actualArrivalDate = poCtrl.poTracking.actualArrivalDate || new Date().toISOString().split("T")[0];
          }
        }
      } else {
        control.doneAt = undefined;
      }

      if (action.status === "In Progress" && ["PO", "Material", "Arrival"].includes(action.process)) {
        control.inProgressAt = new Date().toISOString();
      }

      if (action.status === "In Progress SC") {
        item.isSubcont = true;
        item.subcontProcess = action.process;
        if (!item.subcontDispatchDate) {
          item.subcontDispatchDate = new Date().toISOString();
        }
        if (!item.subcontStatus) {
          item.subcontStatus = "In Progress";
        }
      }

      addActivity(
        jo!,
        `${item.description} → ${action.process}: ${prevStatus} → ${action.status}${
          action.notes ? `. Note: ${action.notes}` : ""
        }`
      );
      return next;
    }

    case "UPDATE_CONTROL_TARGET_DATE": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      const cat = jo?.categories.find((c) => c.id === action.categoryId);
      const item = cat?.items.find((i) => i.id === action.itemId);
      if (!item) return state;

      const control = item.controls.find((c) => c.process === action.process);
      if (!control) return state;

      control.targetDate = action.targetDate;
      return next;
    }

    case "UPDATE_PO_TRACKING": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      const cat = jo?.categories.find((c) => c.id === action.categoryId);
      const item = cat?.items.find((i) => i.id === action.itemId);
      if (!item || !isPoTrackingProcess(action.process)) return state;

      const control = item.controls.find((c) => c.process === action.process);
      if (!control) return state;

      if (action.status === "Problem" && !action.problemNotes?.trim()) {
        return state;
      }

      if (action.status !== undefined) {
        control.status = action.status;
        control.notes = action.status === "Problem" ? (action.problemNotes?.trim() || "") : "";
        const arrivalCtrl = item.controls.find((c) => c.process === "Arrival");

        if (action.status === "Done") {
          const nowIso = new Date().toISOString();
          control.doneAt = nowIso;
          if (arrivalCtrl) {
            arrivalCtrl.status = "Done";
            arrivalCtrl.doneAt = nowIso;
          }
        } else if (action.status === "Problem") {
          control.doneAt = undefined;
          if (arrivalCtrl) {
            arrivalCtrl.status = "Problem";
            arrivalCtrl.doneAt = undefined;
            arrivalCtrl.notes = action.problemNotes?.trim() || "";
          }
        } else if (action.status === "In Progress") {
          control.doneAt = undefined;
          control.inProgressAt = action.tracking.poDate
            ? new Date(action.tracking.poDate).toISOString()
            : new Date().toISOString();
          if (arrivalCtrl && (arrivalCtrl.status === "Problem" || arrivalCtrl.status === "Done")) {
            if (arrivalCtrl.status === "Problem") {
              arrivalCtrl.notes = "";
            }
            arrivalCtrl.status = "In Progress";
            arrivalCtrl.doneAt = undefined;
          }
        }
      }

      const effectiveNotes = action.status === "Problem"
        ? (action.problemNotes?.trim() || action.tracking.notes?.trim() || "")
        : (action.tracking.notes?.trim() ?? control.poTracking?.notes ?? "");
      control.poTracking = {
        ...control.poTracking,
        supplier: action.tracking.supplier?.trim() ?? "",
        poNo: action.tracking.poNo?.trim() ?? "",
        poDate: action.tracking.poDate?.trim() ?? "",
        targetArrival: action.tracking.targetArrival?.trim() ?? "",
        actualArrivalDate: action.status === "Done"
          ? (action.tracking.actualArrivalDate || control.poTracking?.actualArrivalDate || new Date().toISOString().split("T")[0])
          : (action.status === "In Progress" || action.status === "Problem" ? undefined : (action.tracking.actualArrivalDate ?? control.poTracking?.actualArrivalDate)),
        notes: effectiveNotes,
      };

      if (action.tracking.targetArrival) {
        control.targetDate = action.tracking.targetArrival.trim();
        const arrivalCtrl = item.controls.find((c) => c.process === "Arrival");
        if (arrivalCtrl) {
          arrivalCtrl.targetDate = action.tracking.targetArrival.trim();
        }
      }

      if (action.qty !== undefined && action.qty > 0) {
        item.qty = action.qty;
      }

      const joRef = jo!;
      const rowLabel = poTrackingLabel(action.process);
      const statusText = action.status ? ` (Status: ${action.status})` : "";
      addActivity(
        joRef,
        `${item.description} → ${rowLabel} procurement updated${statusText}.`
      );
      return next;
    }

    case "BULK_UPDATE_TARGET_ARRIVAL": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;

      let count = 0;
      for (const cat of jo.categories) {
        for (const item of cat.items) {
          if (action.itemIds.includes(item.id)) {
            const ctrl = item.controls.find((c) => c.process === "Arrival" || c.process === "Material" || c.process === "PO");
            if (ctrl) {
              ctrl.targetDate = action.targetDate;
              count++;
            }
          }
        }
      }

      addActivity(jo, `Bulk set Target Arrival: ${action.targetDate} for ${count} parts.`);
      return next;
    }

    case "BULK_UPDATE_STATUS": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;

      const targetProcesses =
        action.processes && action.processes.length > 0
          ? action.processes
          : action.process
          ? [action.process]
          : [];

      if (targetProcesses.length === 0) return state;

      // Problem requires notes — guard like individual UPDATE_STATUS
      if (action.status === "Problem" && !(action.notes ?? "").trim()) {
        return state;
      }

      let count = 0;
      for (const cat of jo.categories) {
        for (const item of cat.items) {
          if (action.itemIds.includes(item.id)) {
            let itemUpdated = false;
            for (const proc of targetProcesses) {
              const ctrl = item.controls.find((c) => c.process === proc);
              if (ctrl) {
                ctrl.status = action.status;
                if (action.notes) ctrl.notes = action.notes;
                if (action.status === "In Progress" && ["PO", "Material", "Arrival"].includes(proc)) {
                  ctrl.inProgressAt = new Date().toISOString();
                }
                if (action.status === "In Progress SC") {
                  item.isSubcont = true;
                  item.subcontProcess = proc;
                  if (!item.subcontDispatchDate) item.subcontDispatchDate = new Date().toISOString();
                  if (!item.subcontStatus) item.subcontStatus = "In Progress";
                }
                itemUpdated = true;
              }
            }
            if (itemUpdated) count++;
          }
        }
      }

      addActivity(jo, `Bulk updated ${targetProcesses.join(", ")} → ${action.status} for ${count} parts.`);
      return next;
    }

    case "BULK_SEND_SUBCONT": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;

      let count = 0;
      for (const cat of jo.categories) {
        for (const item of cat.items) {
          if (action.itemIds.includes(item.id)) {
            if (isItemSubcontSent(item, action.process)) continue;
            item.isSubcont = true;
            item.subcontProcess = action.process;
            item.subcontStatus = "In Progress";
            if (action.supplier) item.subcontSupplier = action.supplier;
            if (action.arrivalTargetDate) item.arrivalTargetDate = action.arrivalTargetDate;
            if (!item.subcontDispatchDate) item.subcontDispatchDate = new Date().toISOString();

            const ctrl = item.controls.find((c) => c.process === action.process);
            if (ctrl) {
              ctrl.status = "In Progress SC";
            }
            count++;
          }
        }
      }

      addActivity(
        jo,
        `Bulk dispatched ${count} parts to Subcont (${action.process}${action.supplier ? ` - ${action.supplier}` : ""}).`
      );
      return next;
    }

    case "BULK_SEND_PO": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;

      let count = 0;
      for (const cat of jo.categories) {
        for (const item of cat.items) {
          if (action.itemIds.includes(item.id)) {
            if (isItemPoSent(item, cat.kind)) continue;
            const proc = cat.kind === "Part" ? "Material" : "PO";
            const ctrl = item.controls.find((c) => c.process === proc);
            if (ctrl) {
              ctrl.status = "Done";
              ctrl.inProgressAt = action.poDate
                ? new Date(action.poDate).toISOString()
                : new Date().toISOString();
              ctrl.poTracking = {
                ...ctrl.poTracking,
                supplier: action.supplier?.trim() ?? "",
                poNo: action.poNo?.trim() ?? "",
                poDate: action.poDate?.trim() ?? "",
                targetArrival: action.targetArrival?.trim() ?? "",
                notes: action.notes?.trim() ?? "",
              };
              if (action.targetArrival) {
                ctrl.targetDate = action.targetArrival.trim();
              }
            }
            const arrivalCtrl = item.controls.find((c) => c.process === "Arrival");
            if (arrivalCtrl) {
              arrivalCtrl.status = "In Progress";
              arrivalCtrl.inProgressAt = action.poDate
                ? new Date(action.poDate).toISOString()
                : new Date().toISOString();
              if (action.targetArrival) {
                arrivalCtrl.targetDate = action.targetArrival.trim();
              }
            }
            count++;
          }
        }
      }

      addActivity(
        jo,
        `Bulk sent PO (${action.poNo || "-"} ${action.supplier ? `- ${action.supplier}` : ""}) for ${count} parts.`
      );
      return next;
    }

    case "FINISH_JO": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;

      jo.finishDate = new Date().toISOString().split("T")[0];
      addActivity(jo, `JO finished on ${jo.finishDate}.`);
      return next;
    }

    case "RESTORE_JO": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;

      jo.finishDate = undefined;
      addActivity(jo, `JO restored to active from archive.`);
      return next;
    }

    case "UPDATE_ITEM_SUBCONT": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      const cat = jo?.categories.find((c) => c.id === action.categoryId);
      const item = cat?.items.find((i) => i.id === action.itemId);
      if (!item) return state;

      item.isSubcont = action.isSubcont;
      if (action.subcontNotes !== undefined) {
        item.subcontNotes = action.subcontNotes;
      }
      if (action.subcontSupplier !== undefined) {
        item.subcontSupplier = action.subcontSupplier;
      }
      if (action.subcontStatus !== undefined) {
        item.subcontStatus = action.subcontStatus;
        if (action.subcontStatus === "Done") {
          item.subcontDoneAt = new Date().toISOString();
          const targetProcess =
            item.subcontProcess ||
            item.controls.find((c) => c.status === "In Progress SC" || c.status === "In Progress")?.process;
          if (targetProcess) {
            const ctrl = item.controls.find((c) => c.process === targetProcess);
            if (ctrl) {
              ctrl.status = "Done";
            }
          }
        } else if (action.subcontStatus === "Problem") {
          item.subcontDoneAt = undefined;
          const targetProcess =
            item.subcontProcess ||
            item.controls.find((c) => c.status === "In Progress SC" || c.status === "In Progress" || c.status === "Problem")?.process;
          if (targetProcess) {
            const ctrl = item.controls.find((c) => c.process === targetProcess);
            if (ctrl) {
              ctrl.status = "Problem";
              if (action.subcontNotes) {
                ctrl.notes = action.subcontNotes;
              }
            }
          }
        } else {
          item.subcontDoneAt = undefined;
          const targetProcess = item.subcontProcess;
          if (targetProcess) {
            const ctrl = item.controls.find((c) => c.process === targetProcess);
            if (ctrl && ctrl.status === "Done") {
              ctrl.status = "In Progress SC";
            }
          }
        }
      }
      if (action.subcontProcess !== undefined) {
        item.subcontProcess = action.subcontProcess;
      }
      if (action.qty !== undefined) {
        item.qty = action.qty;
      }
      if (action.arrivalTargetDate !== undefined) {
        item.arrivalTargetDate = action.arrivalTargetDate;
      }

      // Only log meaningful changes
      if (action.isSubcont !== undefined) {
        addActivity(
          jo!,
          `${item.description} marked as ${action.isSubcont ? "Subcont" : "Internal"}.`
        );
      } else if (action.subcontStatus !== undefined) {
        addActivity(jo!, `${item.description} subcont status → ${action.subcontStatus}.`);
      } else if (action.subcontSupplier !== undefined) {
        addActivity(jo!, `${item.description} subcont supplier → ${action.subcontSupplier || '—'}.`);
      } else if (action.arrivalTargetDate !== undefined) {
        addActivity(jo!, `${item.description} subcont target arrival → ${action.arrivalTargetDate || '—'}.`);
      }
      return next;
    }

    case "ADD_PROCESS_PHOTO": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      const cat = jo?.categories.find((c) => c.id === action.categoryId);
      const item = cat?.items.find((i) => i.id === action.itemId);
      if (!item) return state;

      const control = item.controls.find((c) => c.process === action.process);
      if (!control) return state;

      if (!control.photos) {
        control.photos = [];
      }
      control.photos.push({
        ...action.photo,
        addedAt: new Date().toISOString(),
      });

      addActivity(
        jo!,
        `Photo "${action.photo.name}" added to ${item.description} → ${action.process}.`
      );
      return next;
    }

    case "REMOVE_PROCESS_PHOTO": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      const cat = jo?.categories.find((c) => c.id === action.categoryId);
      const item = cat?.items.find((i) => i.id === action.itemId);
      if (!item) return state;

      const control = item.controls.find((c) => c.process === action.process);
      if (!control || !control.photos) return state;

      control.photos = control.photos.filter((p) => p.id !== action.photoId);

      addActivity(
        jo!,
        `Photo removed from ${item.description} → ${action.process}.`
      );
      return next;
    }

    case "SYNC_PROCESS_PHOTO": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      const cat = jo?.categories.find((c) => c.id === action.categoryId);
      const item = cat?.items.find((i) => i.id === action.itemId);
      if (!item) return state;

      const control = item.controls.find((c) => c.process === action.process);
      if (!control || !control.photos) return state;

      const pIdx = control.photos.findIndex((p) => p.id === action.tempPhotoId);
      if (pIdx !== -1) {
        control.photos[pIdx] = action.photo;
      }
      return next;
    }

    // -----------------------------------------------------------------------
    // Trial report actions
    // -----------------------------------------------------------------------
    case "HYDRATE_TRIAL_STORAGE": {
      next.projects = hydrateTrialSessions(next.projects, action.stored);
      return next;
    }

    case "CREATE_TRIAL_SESSION": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      if (!jo.trialSessions) jo.trialSessions = [];
      jo.trialSessions.push(action.session);
      return next;
    }

    case "DUPLICATE_TRIAL_SESSION": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      if (!jo.trialSessions) jo.trialSessions = [];
      const sourceExists = jo.trialSessions.some(
        (s) => s.id === action.sourceSessionId
      );
      if (!sourceExists) return state;
      jo.trialSessions.push(action.session);
      return next;
    }

    case "UPDATE_TRIAL_SESSION": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      const sessions = jo.trialSessions ?? [];
      const session = sessions.find((s) => s.id === action.sessionId);
      if (!session) return state;
      Object.assign(session, action.updates);
      session.updatedAt = new Date().toISOString();
      return next;
    }

    case "PUBLISH_TRIAL_SESSION_TO_VIEWER": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      const sessions = jo.trialSessions ?? [];
      const session = sessions.find(
        (s) => s.id === action.sessionId || (s.name && s.name.trim().toLowerCase() === action.sessionId.trim().toLowerCase())
      );
      if (!session) return state;
      const now = new Date().toISOString();
      session.updateDate = now;
      session.updatedAt = now;
      session.publishedSnapshot = {
        id: session.id,
        joId: session.joId,
        name: session.name,
        trialDate: session.trialDate,
        updateDate: now,
        customer: session.customer,
        jobNo: session.jobNo,
        picName: session.picName,
        approvedByName: session.approvedByName,
        findings: JSON.parse(JSON.stringify(session.findings ?? [])),
        createdAt: session.createdAt,
        updatedAt: now,
      };
      session.lastPublishedAt = now;
      return next;
    }

    case "DELETE_TRIAL_SESSION": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      const sessions = jo.trialSessions ?? [];
      const idx = sessions.findIndex((s) => s.id === action.sessionId);
      if (idx === -1) return state;
      sessions.splice(idx, 1);
      jo.trialSessions = sessions;
      return next;
    }

    case "ADD_TRIAL_FINDING": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      if (!session.findings) session.findings = [];
      session.findings.push(action.finding);
      session.updatedAt = new Date().toISOString();
      return next;
    }

    case "DELETE_TRIAL_FINDING": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      if (!session.findings) session.findings = [];
      const fidx = session.findings.findIndex((f) => f.id === action.findingId);
      if (fidx === -1) return state;
      session.findings.splice(fidx, 1);
      // Re-sequence order values
      session.findings
        .sort((a, b) => a.order - b.order)
        .forEach((f, i) => {
          f.order = i + 1;
        });
      session.updatedAt = new Date().toISOString();
      return next;
    }

    case "REORDER_TRIAL_FINDING": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      if (!session.findings) session.findings = [];
      const sorted = [...session.findings].sort((a, b) => a.order - b.order);
      const idx = sorted.findIndex((f) => f.id === action.findingId);
      if (idx === -1) return state;
      const swapIdx = action.direction === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= sorted.length) return state;
      // Swap
      [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
      // Reassign sequential orders
      sorted.forEach((f, i) => {
        f.order = i + 1;
      });
      session.findings = sorted;
      session.updatedAt = new Date().toISOString();
      return next;
    }

    case "ADD_TRIAL_ENTRY": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      const finding = (session.findings ?? []).find((f) => f.id === action.findingId);
      if (!finding) return state;
      if (action.section === "correctiveActions") {
        if (!finding.correctiveActions) finding.correctiveActions = [];
        const maxOrder = finding.correctiveActions.reduce(
          (max, e) => Math.max(max, e.order),
          0
        );
        finding.correctiveActions.push({
          ...(action.entry as TrialCorrectiveActionEntry),
          order: action.entry.order || maxOrder + 1,
        });
      } else {
        if (!finding[action.section]) finding[action.section] = [];
        const list = finding[action.section];
        const maxOrder = list.reduce((max, e) => Math.max(max, e.order), 0);
        list.push({
          ...(action.entry as TrialTextEntry),
          order: action.entry.order || maxOrder + 1,
        });
      }
      finding.updatedAt = new Date().toISOString();
      session.updatedAt = new Date().toISOString();
      return next;
    }

    case "UPDATE_TRIAL_ENTRY": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      const finding = (session.findings ?? []).find((f) => f.id === action.findingId);
      if (!finding) return state;
      if (action.section === "correctiveActions") {
        const entry = (finding.correctiveActions ?? []).find(
          (e) => e.id === action.entryId
        );
        if (!entry) return state;
        Object.assign(entry, action.updates);
        entry.updatedAt = new Date().toISOString();
      } else {
        const entry = (finding[action.section] ?? []).find(
          (e) => e.id === action.entryId
        );
        if (!entry) return state;
        Object.assign(entry, action.updates);
        entry.updatedAt = new Date().toISOString();
      }
      finding.updatedAt = new Date().toISOString();
      session.updatedAt = new Date().toISOString();
      return next;
    }

    case "DELETE_TRIAL_ENTRY": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      const finding = (session.findings ?? []).find((f) => f.id === action.findingId);
      if (!finding) return state;
      if (action.section === "correctiveActions") {
        const list = finding.correctiveActions ?? [];
        const eIdx = list.findIndex((e) => e.id === action.entryId);
        if (eIdx === -1) return state;
        list.splice(eIdx, 1);
        list
          .sort((a, b) => a.order - b.order)
          .forEach((e, i) => {
            e.order = i + 1;
          });
      } else {
        const list = finding[action.section] ?? [];
        const eIdx = list.findIndex((e) => e.id === action.entryId);
        if (eIdx === -1) return state;
        list.splice(eIdx, 1);
        list
          .sort((a, b) => a.order - b.order)
          .forEach((e, i) => {
            e.order = i + 1;
          });
      }
      finding.updatedAt = new Date().toISOString();
      session.updatedAt = new Date().toISOString();
      return next;
    }

    case "REORDER_TRIAL_ENTRY": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      const finding = (session.findings ?? []).find((f) => f.id === action.findingId);
      if (!finding) return state;
      if (action.section === "correctiveActions") {
        const list = finding.correctiveActions ?? [];
        const sorted = [...list].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((e) => e.id === action.entryId);
        if (idx === -1) return state;
        const swapIdx = action.direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return state;
        [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
        sorted.forEach((e, i) => {
          e.order = i + 1;
        });
        finding.correctiveActions = sorted;
      } else {
        const list = finding[action.section] ?? [];
        const sorted = [...list].sort((a, b) => a.order - b.order);
        const idx = sorted.findIndex((e) => e.id === action.entryId);
        if (idx === -1) return state;
        const swapIdx = action.direction === "up" ? idx - 1 : idx + 1;
        if (swapIdx < 0 || swapIdx >= sorted.length) return state;
        [sorted[idx], sorted[swapIdx]] = [sorted[swapIdx], sorted[idx]];
        sorted.forEach((e, i) => {
          e.order = i + 1;
        });
        finding[action.section] = sorted;
      }
      finding.updatedAt = new Date().toISOString();
      session.updatedAt = new Date().toISOString();
      return next;
    }

    case "ADD_TRIAL_ENTRY_PHOTO": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      const finding = (session.findings ?? []).find((f) => f.id === action.findingId);
      if (!finding) return state;
      let targetEntry: TrialTextEntry | TrialCorrectiveActionEntry | undefined;
      if (action.section === "correctiveActions") {
        targetEntry = (finding.correctiveActions ?? []).find(
          (e) => e.id === action.entryId
        );
      } else {
        targetEntry = (finding[action.section] ?? []).find(
          (e) => e.id === action.entryId
        );
      }
      if (!targetEntry) return state;
      if (!targetEntry.photos) targetEntry.photos = [];
      targetEntry.photos.push({
        ...action.photo,
        addedAt: new Date().toISOString(),
      });
      targetEntry.updatedAt = new Date().toISOString();
      finding.updatedAt = new Date().toISOString();
      session.updatedAt = new Date().toISOString();
      return next;
    }

    case "REMOVE_TRIAL_ENTRY_PHOTO": {
      const { jo } = findProjectAndJo(next.projects, action.projectId, action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      const finding = (session.findings ?? []).find((f) => f.id === action.findingId);
      if (!finding) return state;
      let targetEntry: TrialTextEntry | TrialCorrectiveActionEntry | undefined;
      if (action.section === "correctiveActions") {
        targetEntry = (finding.correctiveActions ?? []).find(
          (e) => e.id === action.entryId
        );
      } else {
        targetEntry = (finding[action.section] ?? []).find(
          (e) => e.id === action.entryId
        );
      }
      if (!targetEntry || !targetEntry.photos) return state;
      targetEntry.photos = targetEntry.photos.filter(
        (p: TrialEntryPhoto) => p.id !== action.photoId
      );
      targetEntry.updatedAt = new Date().toISOString();
      finding.updatedAt = new Date().toISOString();
      session.updatedAt = new Date().toISOString();
      return next;
    }

    case "HYDRATE_TRIAL_STORAGE": {
      const stored = action.stored || loadTrialSessionsFromStorage();
      if (!stored || Object.keys(stored).length === 0) return state;
      next.projects = hydrateTrialSessions(next.projects, stored);
      return next;
    }

    default:
      return state;
  }
}

function reducer(state: AppState, action: AppAction): AppState {
  // Deep-clone to guarantee immutability without library overhead.
  const next = structuredClone(state);
  const result = executeReducer(next, state, action);
  if (action.type.includes("TRIAL") && result !== state) {
    saveTrialSessionsToStorage(result.projects);
  }
  if (typeof window !== "undefined" && result !== state) {
    try {
      localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(result.projects));
    } catch {}
  }
  return result;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const StateContext = createContext<AppState>(initialState);
const DispatchContext = createContext<Dispatch<AppAction>>(() => {});

const storeProviderInitialState: AppState = {
  projects: [],
  isHydrated: false,
};

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, storeProviderInitialState);
  const { token, isLoading: isAuthLoading } = useAuth();

  const isHydratedRef = React.useRef(false);

  // Synchronously hydrate cached projects from localStorage BEFORE browser paint
  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

  useIsomorphicLayoutEffect(() => {
    const cached = getCachedProjects();
    if (cached && cached.length > 0) {
      rawDispatch({ type: "HYDRATE_PROJECTS", projects: cached });
      isHydratedRef.current = true;
    }
    rawDispatch({ type: "HYDRATE_TRIAL_STORAGE" });
  }, []);


  // Save current projects to localStorage whenever state changes
  useEffect(() => {
    if (typeof window !== "undefined" && isHydratedRef.current && state.projects && state.projects.length > 0) {
      try {
        localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(state.projects));
      } catch {}
    }
  }, [state.projects]);

  // Hydrate trial sessions from localStorage & IndexedDB once mounted on client (avoids SSR hydration mismatch)
  useEffect(() => {
    // 1. Fast sync hydration from memoryCache or localStorage
    rawDispatch({ type: "HYDRATE_TRIAL_STORAGE" });

    // 2. Full IndexedDB hydration (handles large base64 photos without browser quota limits)
    loadTrialSessionsFromIndexedDB().then((stored) => {
      if (stored && Object.keys(stored).length > 0) {
        rawDispatch({ type: "HYDRATE_TRIAL_STORAGE", stored });
      }
    });

    // 3. Real-time cross-tab listener via BroadcastChannel
    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      channel = new BroadcastChannel("matrix_trial_sync_channel");
      channel.onmessage = async (e) => {
        if (e.data?.type === "TRIAL_STORAGE_UPDATED") {
          // Discard self-broadcast! This tab already has the newest state in memory
          if (e.data?.senderTabId === CLIENT_TAB_ID) {
            return;
          }
          const stored = await loadTrialSessionsFromIndexedDB();
          if (stored && Object.keys(stored).length > 0) {
            rawDispatch({ type: "HYDRATE_TRIAL_STORAGE", stored });
          }
        }
      };
    }

    return () => {
      channel?.close();
    };
  }, []);

  // Sync state from backend once we have a token (mount with a stored token, or right after login)
  useEffect(() => {
    if (isAuthLoading) return;

    if (!token) {
      rawDispatch({ type: "SET_HYDRATED", isHydrated: true });
      return;
    }

    let active = true;
    api
      .getProjects()
      .then((res) => {
        if (active) {
          rawDispatch({ type: "SET_PROJECTS", projects: res.data || [] });
          isHydratedRef.current = true;
          try {
            if (res.data && res.data.length > 0) {
              localStorage.setItem(PROJECTS_CACHE_KEY, JSON.stringify(res.data));
            }
          } catch {}
        }
      })
      .catch((err) => {
        if (active) {
          console.warn("Failed to fetch projects from backend:", err?.message || err);
          rawDispatch({ type: "SET_HYDRATED", isHydrated: true });
          isHydratedRef.current = true;
        }
      });

    return () => {
      active = false;
    };
  }, [token, isAuthLoading]);

  // Async API synchronization wrapper
  const dispatch: Dispatch<AppAction> = (action: AppAction) => {
    // 1. Optimistic instant local update
    rawDispatch(action);

    // 2. Background API persistence
    switch (action.type) {
      case "CREATE_PROJECT":
        api
          .createProject(action.name, action.customer, action.company, action.id)
          .then((res) => {
            if (res?.data) {
              rawDispatch({
                type: "SYNC_PROJECT",
                tempId: action.id,
                project: res.data,
              });
            }
          })
          .catch((err) => {
            // Keep silent or debug log
          });
        break;

      case "UPDATE_PROJECT":
        api
          .updateProject(action.projectId, {
            name: action.name,
            customer: action.customer,
            company: action.company,
          })
          .catch((err) => {
            console.warn("Failed to update project in database:", err?.message || err);
          });
        break;

      case "DELETE_PROJECT":
        api.deleteProject(action.projectId).catch(() => {});
        break;

      case "CREATE_JO": {
        const proj = state.projects.find((p) => p.id === action.projectId || (p as any).tempId === action.projectId);
        const resolvedProjectId = proj?.id || action.projectId;
        api
          .createJO(resolvedProjectId, {
            id: action.id,
            joNumber: action.joNumber,
            product: action.product,
            type: action.joType,
            targetDate: action.targetDate,
            categories: action.categories,
          })
          .then((res) => {
            if (res?.data) {
              rawDispatch({
                type: "SYNC_JO",
                projectId: resolvedProjectId,
                tempJoId: action.id,
                jo: res.data,
              });
            }
          })
          .catch((err) => {
            console.warn("Failed to persist JO to database:", err?.message || err);
          });
        break;
      }

      case "DELETE_JO":
        api.deleteJO(action.joId).catch(() => {});
        break;

      case "ADD_CATEGORY":
        api
          .addCategory(action.joId, {
            label: action.label,
            kind: action.kind,
            isCustom: action.isCustom,
          })
          .then((res) => {
            if (res?.data) {
              rawDispatch({
                type: "SYNC_CATEGORY",
                projectId: action.projectId,
                joId: action.joId,
                tempCategoryLabel: action.label,
                category: res.data,
              });
            }
          })
          .catch((err) => {
            console.warn("Failed to persist category to database:", err?.message || err);
          });
        break;

      case "UPDATE_CATEGORY":
        api
          .updateCategory(action.categoryId, {
            label: action.label,
          })
          .catch((err) => {
            console.warn("Failed to persist category update to database:", err?.message || err);
          });
        break;

      case "DELETE_CATEGORY":
        api
          .deleteCategory(action.categoryId)
          .catch((err) => {
            console.warn("Failed to delete category from database:", err?.message || err);
          });
        break;

      case "ADD_ITEM": {
        const tempItemId = action.itemId;
        api
          .addItem(action.categoryId, action.item)
          .then((res) => {
            if (res?.data) {
              rawDispatch({
                type: "SYNC_ITEM",
                projectId: action.projectId,
                joId: action.joId,
                categoryId: action.categoryId,
                tempItemId,
                item: res.data,
              });
            }
          })
          .catch((err) => {
            console.warn("Failed to persist item to database:", err?.message || err);
          });
        break;
      }

      case "INSERT_TRACKER_ITEM":
        break;

      case "ADD_ITEMS_BATCH": {
        const tempItemIds = action.items.map((i) => i.id).filter(Boolean) as string[];
        api
          .batchAddItems(action.categoryId, action.items)
          .then((res) => {
            if (res?.data) {
              rawDispatch({
                type: "SYNC_ITEMS_BATCH",
                projectId: action.projectId,
                joId: action.joId,
                categoryId: action.categoryId,
                items: res.data,
                tempItemIds: tempItemIds.length > 0 ? tempItemIds : undefined,
              });
            }
          })
          .catch((err) => {
            console.warn("Failed to persist batch items to database:", err?.message || err);
          });
        break;
      }

      case "UPDATE_ITEM":
        api
          .updateItem(action.itemId, action.data)
          .catch((err) => {
            console.warn("Failed to update item in database:", err?.message || err);
          });
        break;

      case "DELETE_ITEM":
        api
          .deleteItem(action.itemId)
          .catch((err) => {
            console.warn("Failed to delete item from database:", err?.message || err);
          });
        break;

      case "BATCH_DELETE_ITEMS":
        api
          .batchDeleteItems(action.itemIds)
          .catch((err) => {
            console.warn("Failed to batch delete items from database:", err?.message || err);
          });
        break;

      case "FINISH_JO":
        api.finishJO(action.joId).catch(() => {});
        break;

      case "RESTORE_JO":
        api.restoreJO(action.joId).catch(() => {});
        break;

      case "UPDATE_ITEM_SUBCONT": {
        let resolvedItemId = action.itemId;
        for (const p of state.projects) {
          for (const j of p.jos) {
            for (const cat of j.categories) {
              const it = cat.items.find((i) => i.id === action.itemId || (i as any).tempId === action.itemId);
              if (it) {
                resolvedItemId = it.id;
                break;
              }
            }
          }
        }
        api
          .updateItemSubcont(resolvedItemId, {
            isSubcont: action.isSubcont,
            subcontNotes: action.subcontNotes,
            subcontSupplier: action.subcontSupplier,
            subcontStatus: action.subcontStatus,
            subcontProcess: action.subcontProcess,
            qty: action.qty,
            arrivalTargetDate: action.arrivalTargetDate,
          })
          .catch((err) => {
            console.warn("Failed to update item subcont in database:", err?.message || err);
          });
        break;
      }

      case "BULK_SEND_PO": {
        const proj = state.projects.find((p) => p.id === action.projectId || (p as any).tempId === action.projectId);
        const j = proj?.jos.find((jo) => jo.id === action.joId || (jo as any).tempId === action.joId);
        const resolvedJoId = j?.id || action.joId;
        const resolvedItemIds = action.itemIds.map((id) => {
          for (const p of state.projects) {
            for (const jo of p.jos) {
              for (const cat of jo.categories) {
                const it = cat.items.find((i) => i.id === id || (i as any).tempId === id);
                if (it) return it.id;
              }
            }
          }
          return id;
        });
        const eligibleItemIds = resolvedItemIds.filter((id) => {
          for (const p of state.projects) {
            for (const jo of p.jos) {
              for (const cat of jo.categories) {
                const it = cat.items.find((i) => i.id === id);
                if (it) return !isItemPoSent(it, cat.kind);
              }
            }
          }
          return true;
        });
        if (eligibleItemIds.length === 0) break;
        api
          .bulkSendPo(resolvedJoId, {
            itemIds: eligibleItemIds,
            supplier: action.supplier,
            poNo: action.poNo,
            poDate: action.poDate,
            targetArrival: action.targetArrival,
            notes: action.notes,
          })
          .catch((err) => {
            console.warn("Failed to bulk send PO in database:", err?.message || err);
          });
        break;
      }

      case "UPDATE_STATUS": {
        const p = state.projects.find((pr) => pr.id === action.projectId || (pr as any).tempId === action.projectId);
        const j = p?.jos.find((jo) => jo.id === action.joId || (jo as any).tempId === action.joId);
        const cat = j?.categories.find((c) => c.id === action.categoryId || (c as any).tempId === action.categoryId);
        const it = cat?.items.find((i) => i.id === action.itemId || (i as any).tempId === action.itemId);
        const ctrl = it?.controls.find((c) => c.process === action.process);
        if (ctrl?.id) {
          api.updateControlStatus(ctrl.id, action.status, action.notes).catch((err) => {
            console.warn("Failed to update control status in database:", err?.message || err);
          });
        }
        if (action.status === "In Progress SC" && it?.id) {
          api.updateItemSubcont(it.id, {
            isSubcont: true,
            subcontProcess: action.process,
            subcontStatus: "In Progress",
          }).catch((err) => {
            console.warn("Failed to update item subcont in database:", err?.message || err);
          });
        }
        break;
      }

      case "UPDATE_PO_TRACKING": {
        const p = state.projects.find((pr) => pr.id === action.projectId || (pr as any).tempId === action.projectId);
        const j = p?.jos.find((jo) => jo.id === action.joId || (jo as any).tempId === action.joId);
        const cat = j?.categories.find((c) => c.id === action.categoryId || (c as any).tempId === action.categoryId);
        const it = cat?.items.find((i) => i.id === action.itemId || (i as any).tempId === action.itemId);
        const ctrl = it?.controls.find((c) => c.process === action.process);
        if (ctrl?.id) {
          const resolvedNotes =
            action.status === "Problem" && action.problemNotes?.trim()
              ? action.problemNotes.trim()
              : action.tracking.notes;
          api
            .updatePoTracking(ctrl.id, {
              status: action.status,
              problemNotes: action.problemNotes,
              supplier: action.tracking.supplier,
              poNo: action.tracking.poNo,
              poDate: action.tracking.poDate,
              targetArrival: action.tracking.targetArrival,
              notes: resolvedNotes,
              qty: action.qty,
            })
            .catch((err) => {
              console.warn("Failed to update PO tracking in database:", err?.message || err);
            });

          const arrivalCtrl = it?.controls.find((c) => c.process === "Arrival");
          if (arrivalCtrl?.id && action.status) {
            api.updateControlStatus(arrivalCtrl.id, action.status, action.problemNotes).catch(() => {});
          }
          if (arrivalCtrl?.id && action.tracking.targetArrival) {
            api.updateControlTargetDate(arrivalCtrl.id, action.tracking.targetArrival).catch(() => {});
          }
        }
        break;
      }

      case "UPDATE_CONTROL_TARGET_DATE": {
        const p = state.projects.find((pr) => pr.id === action.projectId || (pr as any).tempId === action.projectId);
        const j = p?.jos.find((jo) => jo.id === action.joId || (jo as any).tempId === action.joId);
        const cat = j?.categories.find((c) => c.id === action.categoryId || (c as any).tempId === action.categoryId);
        const it = cat?.items.find((i) => i.id === action.itemId || (i as any).tempId === action.itemId);
        const ctrl = it?.controls.find((c) => c.process === action.process);
        if (ctrl?.id) {
          api.updateControlTargetDate(ctrl.id, action.targetDate).catch((err) => {
            console.warn("Failed to update control target date in database:", err?.message || err);
          });
        }
        break;
      }

      case "BULK_UPDATE_STATUS": {
        const proj = state.projects.find((p) => p.id === action.projectId || (p as any).tempId === action.projectId);
        const j = proj?.jos.find((jo) => jo.id === action.joId || (jo as any).tempId === action.joId);
        const resolvedJoId = j?.id || action.joId;
        const resolvedItemIds = action.itemIds.map((id) => {
          for (const p of state.projects) {
            for (const jo of p.jos) {
              for (const cat of jo.categories) {
                const it = cat.items.find((i) => i.id === id || (i as any).tempId === id);
                if (it) return it.id;
              }
            }
          }
          return id;
        });
        api
          .bulkUpdateStatus(resolvedJoId, {
            itemIds: resolvedItemIds,
            processes: action.processes || (action.process ? [action.process] : []),
            status: action.status,
            notes: action.notes,
          })
          .catch((err) => {
            console.warn("Failed to bulk update status in database:", err?.message || err);
          });
        break;
      }

      case "BULK_SEND_SUBCONT": {
        const eligibleSubcontIds = action.itemIds.filter((id) => {
          for (const p of state.projects) {
            for (const jo of p.jos) {
              for (const cat of jo.categories) {
                const it = cat.items.find((i) => i.id === id);
                if (it) return !isItemSubcontSent(it, action.process);
              }
            }
          }
          return true;
        });
        if (eligibleSubcontIds.length === 0) break;
        api
          .bulkSendSubcont(action.joId, {
            itemIds: eligibleSubcontIds,
            process: action.process,
            supplier: action.supplier,
            arrivalTargetDate: action.arrivalTargetDate,
          })
          .catch(() => {});
        break;
      }

      case "BULK_UPDATE_TARGET_ARRIVAL":
        api
          .bulkTargetArrival(action.joId, {
            itemIds: action.itemIds,
            targetDate: action.targetDate,
          })
          .catch(() => {});
        break;

      case "CREATE_TRIAL_SESSION":
        api
          .createTrialSession(action.joId, {
            id: action.session.id,
            name: action.session.name,
            trialDate: action.session.trialDate,
            updateDate: action.session.updateDate,
            customer: action.session.customer,
            jobNo: action.session.jobNo,
            picName: action.session.picName,
            approvedByName: action.session.approvedByName,
          })
          .then((res) => {
            if (res.data?.id && res.data.id !== action.session.id) {
              const { jo } = findProjectAndJo(state.projects, action.projectId, action.joId);
              const s = (jo?.trialSessions ?? []).find(
                (sess) =>
                  sess.id === action.session.id ||
                  (sess.name && sess.name.trim().toLowerCase() === action.session.name.trim().toLowerCase())
              );
              if (s) {
                s.id = res.data.id;
              }
            }
          })
          .catch(() => {});
        break;

      case "DUPLICATE_TRIAL_SESSION":
        api
          .duplicateTrialSession(action.sourceSessionId, action.session.name)
          .catch(() => {});
        break;

      case "UPDATE_TRIAL_SESSION":
        api
          .updateTrialSession(action.sessionId, action.updates)
          .catch(async (err) => {
            if (err?.status === 404 || err?.statusCode === 404) {
              const { jo } = findProjectAndJo(state.projects, action.projectId, action.joId);
              const session = (jo?.trialSessions ?? []).find((s) => s.id === action.sessionId);
              if (session) {
                try {
                  const createRes = await api.createTrialSession(action.joId, {
                    id: session.id,
                    name: session.name,
                    trialDate: session.trialDate,
                    updateDate: session.updateDate,
                    customer: session.customer,
                    jobNo: session.jobNo,
                    picName: session.picName,
                    approvedByName: session.approvedByName,
                  });
                  const finalId = createRes.data?.id || session.id;
                  session.id = finalId;
                  await api.updateTrialSession(finalId, action.updates);
                } catch {
                  // Silent fallback
                }
              }
            }
          });
        break;

      case "PUBLISH_TRIAL_SESSION_TO_VIEWER": {
        const { jo } = findProjectAndJo(state.projects, action.projectId, action.joId);
        const session = (jo?.trialSessions ?? []).find(
          (s) => s.id === action.sessionId || (s.name && s.name.trim().toLowerCase() === action.sessionId.trim().toLowerCase())
        );
        if (session) {
          const isUuid = (id?: string) => Boolean(id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
          let targetSessionId = session.id;
          if (!isUuid(targetSessionId)) {
            const matchWithBackendId = (jo?.trialSessions ?? []).find(
              (s) => isUuid(s.id) && s.name.trim().toLowerCase() === session.name.trim().toLowerCase()
            );
            if (matchWithBackendId) {
              targetSessionId = matchWithBackendId.id;
              session.id = matchWithBackendId.id;
            } else {
              targetSessionId = uid();
              session.id = targetSessionId;
            }
          }
          const now = new Date().toISOString();
          const freshSnapshot: TrialSession = {
            id: targetSessionId,
            joId: session.joId,
            name: session.name,
            trialDate: session.trialDate,
            updateDate: now,
            customer: session.customer,
            jobNo: session.jobNo,
            picName: session.picName,
            approvedByName: session.approvedByName,
            findings: JSON.parse(JSON.stringify(session.findings ?? [])),
            createdAt: session.createdAt,
            updatedAt: now,
          };
          api.publishTrialSession(targetSessionId, freshSnapshot).catch(async (err) => {
            if (err?.status === 404 || err?.statusCode === 404) {
              try {
                const createRes = await api.createTrialSession(action.joId, {
                  id: targetSessionId,
                  name: session.name,
                  trialDate: session.trialDate,
                  updateDate: session.updateDate,
                  customer: session.customer,
                  jobNo: session.jobNo,
                  picName: session.picName,
                  approvedByName: session.approvedByName,
                });
                const finalId = createRes.data?.id || targetSessionId;
                session.id = finalId;
                freshSnapshot.id = finalId;
                await api.publishTrialSession(finalId, freshSnapshot);
              } catch {
                // Silent fallback
              }
            }
          });
        }
        break;
      }

      case "DELETE_TRIAL_SESSION":
        api.deleteTrialSession(action.sessionId).catch(() => {});
        break;

      case "DELETE_JO":
        // Handled above (lines 1373-1375)
        break;

      case "ADD_TRIAL_FINDING":
        api.addTrialFinding(action.sessionId, { id: action.finding.id }).catch(async (err) => {
          if (err?.status === 404 || err?.statusCode === 404) {
            const { jo } = findProjectAndJo(state.projects, action.projectId, action.joId);
            const session = (jo?.trialSessions ?? []).find((s) => s.id === action.sessionId);
            if (session) {
              try {
                const createRes = await api.createTrialSession(action.joId, {
                  id: session.id,
                  name: session.name,
                  trialDate: session.trialDate,
                  updateDate: session.updateDate,
                  customer: session.customer,
                  jobNo: session.jobNo,
                  picName: session.picName,
                  approvedByName: session.approvedByName,
                });
                const finalId = createRes.data?.id || session.id;
                session.id = finalId;
                await api.addTrialFinding(finalId, { id: action.finding.id });
              } catch {
                // Silent fallback
              }
            }
          }
        });
        break;

      case "DELETE_TRIAL_FINDING":
        api.deleteTrialFinding(action.findingId).catch(() => {});
        break;

      case "ADD_TRIAL_ENTRY":
        api
          .addTrialEntry(action.findingId, {
            id: (action.entry as any).id,
            section: action.section,
            text: (action.entry as any).text,
            targetDate: (action.entry as any).targetDate,
            pic: (action.entry as any).pic,
            status: (action.entry as any).status,
          })
          .catch(() => {});
        break;

      case "UPDATE_TRIAL_ENTRY":
        api
          .updateTrialEntry(action.entryId, {
            text: (action.updates as any).text,
            targetDate: (action.updates as any).targetDate,
            pic: (action.updates as any).pic,
            status: (action.updates as any).status,
          })
          .catch(() => {});
        break;

      case "DELETE_TRIAL_ENTRY":
        api.deleteTrialEntry(action.entryId).catch(() => {});
        break;

      case "ADD_TRIAL_ENTRY_PHOTO":
        if (action.file) {
          api.uploadTrialPhoto(action.entryId, action.file).catch(() => {});
        }
        break;

      case "REMOVE_TRIAL_ENTRY_PHOTO":
        api.deleteTrialPhoto(action.photoId).catch(() => {});
        break;

      case "ADD_PROCESS_PHOTO": {
        const p = state.projects.find((pr) => pr.id === action.projectId || (pr as any).tempId === action.projectId);
        const j = p?.jos.find((jo) => jo.id === action.joId || (jo as any).tempId === action.joId);
        const cat = j?.categories.find((c) => c.id === action.categoryId || (c as any).tempId === action.categoryId);
        const it = cat?.items.find((i) => i.id === action.itemId || (i as any).tempId === action.itemId);
        const ctrl = it?.controls.find((c) => c.process === action.process);
        if (ctrl?.id && action.file) {
          api
            .uploadControlPhoto(ctrl.id, action.file)
            .then((res) => {
              if (res?.data) {
                rawDispatch({
                  type: "SYNC_PROCESS_PHOTO",
                  projectId: action.projectId,
                  joId: action.joId,
                  categoryId: action.categoryId,
                  itemId: action.itemId,
                  process: action.process,
                  tempPhotoId: action.photo.id,
                  photo: res.data,
                });
              }
            })
            .catch((err) => {
              console.warn("Failed to upload process photo to database:", err?.message || err);
            });
        }
        break;
      }

      case "REMOVE_PROCESS_PHOTO": {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(action.photoId);
        if (isUuid) {
          api
            .deleteControlPhoto(action.photoId)
            .catch((err) => {
              console.warn("Failed to delete process photo from database:", err?.message || err);
            });
        }
        break;
      }

      default:
        break;
    }
  };

  return (
    <StateContext.Provider value={state}>
      <DispatchContext.Provider value={dispatch}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
}

export function useAppState(): AppState {
  return useContext(StateContext);
}

export function useAppDispatch(): Dispatch<AppAction> {
  return useContext(DispatchContext);
}

// Expose reducer for testing without React rendering.
export { reducer, initialState };
