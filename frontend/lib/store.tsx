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
import type {
  Project,
  JO,
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
} from "./types";
import { INITIAL_PROJECTS } from "./mock-data";
import { defaultControls } from "./category";
import { uid } from "./format";
import { isPoTrackingProcess, poTrackingLabel } from "./po-tracking";

export type TrialEntrySection = "problems" | "causes" | "correctiveActions";

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------
export interface AppState {
  projects: Project[];
}

const initialState: AppState = {
  projects: structuredClone(INITIAL_PROJECTS),
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
export type AppAction =
  | {
      type: "SET_PROJECTS";
      projects: Project[];
    }
  | {
      type: "CREATE_PROJECT";
      id: string;
      name: string;
      customer: string;
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
      type: "ADD_CATEGORY";
      projectId: string;
      joId: string;
      label: string;
      kind: CategoryKind;
      isCustom: boolean;
    }
  | {
      type: "ADD_ITEM";
      projectId: string;
      joId: string;
      categoryId: string;
      item: Omit<Item, "id" | "controls">;
      kind: CategoryKind;
    }
  | {
      type: "ADD_ITEMS_BATCH";
      projectId: string;
      joId: string;
      categoryId: string;
      items: Omit<Item, "id" | "controls">[];
      kind: CategoryKind;
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
      status: ControlStatus;
      problemNotes: string;
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
      type: "UPDATE_ITEM_SUBCONT";
      projectId: string;
      joId: string;
      categoryId: string;
      itemId: string;
      isSubcont: boolean;
      subcontNotes?: string;
      subcontSupplier?: string;
      subcontStatus?: "In Progress" | "Done";
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
    };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
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
function reducer(state: AppState, action: AppAction): AppState {
  // Deep-clone to guarantee immutability without library overhead.
  const next = structuredClone(state);

  switch (action.type) {
    case "SET_PROJECTS": {
      next.projects = action.projects.map((p) => ({
        ...p,
        jos: (p.jos || []).map((j) => ({
          ...j,
          activities: j.activities || [],
          categories: (j.categories || []).map((c) => ({
            ...c,
            items: (c.items || []).map((item) => ({
              ...item,
              controls: item.controls || [],
            })),
          })),
        })),
      }));
      return next;
    }

    case "CREATE_PROJECT": {
      const newProj: Project = {
        id: action.id,
        name: action.name,
        customer: action.customer,
        jos: [],
      };
      next.projects.push(newProj);
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

      jo.categories.push({
        id: uid(),
        label: action.label,
        kind: action.kind,
        isCustom: action.isCustom,
        items: [],
      });
      addActivity(jo, `Category "${action.label}" added.`);
      return next;
    }

    case "ADD_ITEM": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      const cat = jo?.categories.find((c) => c.id === action.categoryId);
      if (!cat) return state;

      const newItem: Item = {
        ...action.item,
        id: uid(),
        controls: defaultControls(action.kind),
      };
      cat.items.push(newItem);
      addActivity(jo!, `Item "${action.item.description}" added to ${cat.label}.`);
      return next;
    }

    case "ADD_ITEMS_BATCH": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      const cat = jo?.categories.find((c) => c.id === action.categoryId);
      if (!cat) return state;

      const newItems: Item[] = action.items.map((item) => {
        const newItem: Item = {
          ...item,
          id: uid(),
          controls: defaultControls(action.kind),
        };
        return newItem;
      });
      cat.items.push(...newItems);
      addActivity(
        jo!,
        `${action.items.length} items added to ${cat.label} via image conversion.`
      );
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

      if (action.status === "Problem" && !action.problemNotes.trim()) {
        return state;
      }

      const prevStatus = control.status;
      control.status = action.status;
      control.notes = action.status === "Problem" ? action.problemNotes.trim() : "";
      control.poTracking = {
        ...control.poTracking,
        supplier: action.tracking.supplier?.trim() ?? "",
        poNo: action.tracking.poNo?.trim() ?? "",
        poDate: action.tracking.poDate?.trim() ?? "",
        targetArrival: action.tracking.targetArrival?.trim() ?? "",
        notes: action.tracking.notes?.trim() ?? "",
      };

      if (action.tracking.targetArrival) {
        control.targetDate = action.tracking.targetArrival.trim();
        const arrivalCtrl = item.controls.find((c) => c.process === "Arrival");
        if (arrivalCtrl) {
          arrivalCtrl.targetDate = action.tracking.targetArrival.trim();
        }
      }

      if (action.status === "Done") {
        const arrivalCtrl = item.controls.find((c) => c.process === "Arrival");
        if (arrivalCtrl) {
          arrivalCtrl.status = "Done";
        }
      }

      if (action.status === "In Progress") {
        control.inProgressAt = action.tracking.poDate
          ? new Date(action.tracking.poDate).toISOString()
          : new Date().toISOString();
      }

      if (action.qty !== undefined && action.qty > 0) {
        item.qty = action.qty;
      }

      addActivity(
        jo!,
        `${item.description} → ${poTrackingLabel(action.process)}: ${prevStatus} → ${action.status}`
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
              arrivalCtrl.status = "Not Started";
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

      addActivity(
        jo!,
        `${item.description} ${action.isSubcont ? "marked as Subcont" : "unmarked as Subcont"}.`
      );
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

    // -----------------------------------------------------------------------
    // Trial report actions
    // -----------------------------------------------------------------------
    case "CREATE_TRIAL_SESSION": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;
      if (!jo.trialSessions) jo.trialSessions = [];
      jo.trialSessions.push(action.session);
      return next;
    }

    case "DUPLICATE_TRIAL_SESSION": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
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
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;
      const sessions = jo.trialSessions ?? [];
      const session = sessions.find((s) => s.id === action.sessionId);
      if (!session) return state;
      Object.assign(session, action.updates);
      session.updatedAt = new Date().toISOString();
      return next;
    }

    case "DELETE_TRIAL_SESSION": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;
      const sessions = jo.trialSessions ?? [];
      const idx = sessions.findIndex((s) => s.id === action.sessionId);
      if (idx === -1) return state;
      sessions.splice(idx, 1);
      jo.trialSessions = sessions;
      return next;
    }

    case "ADD_TRIAL_FINDING": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      session.findings.push(action.finding);
      session.updatedAt = new Date().toISOString();
      return next;
    }

    case "DELETE_TRIAL_FINDING": {
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
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
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
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
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      const finding = session.findings.find((f) => f.id === action.findingId);
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
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      const finding = session.findings.find((f) => f.id === action.findingId);
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
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      const finding = session.findings.find((f) => f.id === action.findingId);
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
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      const finding = session.findings.find((f) => f.id === action.findingId);
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
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      const finding = session.findings.find((f) => f.id === action.findingId);
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
      const project = next.projects.find((p) => p.id === action.projectId);
      const jo = project?.jos.find((j) => j.id === action.joId);
      if (!jo) return state;
      const session = (jo.trialSessions ?? []).find(
        (s) => s.id === action.sessionId
      );
      if (!session) return state;
      const finding = session.findings.find((f) => f.id === action.findingId);
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

    default:
      return state;
  }
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
const StateContext = createContext<AppState>(initialState);
const DispatchContext = createContext<Dispatch<AppAction>>(() => {});

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, rawDispatch] = useReducer(reducer, initialState);

  // Sync initial state from backend on mount
  useEffect(() => {
    let active = true;
    api
      .getProjects()
      .then((res) => {
        if (active && res.data && res.data.length > 0) {
          rawDispatch({ type: "SET_PROJECTS", projects: res.data });
        }
      })
      .catch(() => {
        // Keep initial mock projects if API is unreachable
      });

    return () => {
      active = false;
    };
  }, []);

  // Async API synchronization wrapper
  const dispatch: Dispatch<AppAction> = (action: AppAction) => {
    // 1. Optimistic instant local update
    rawDispatch(action);

    // 2. Background API persistence
    switch (action.type) {
      case "CREATE_PROJECT":
        api.createProject(action.name, action.customer).catch(() => {});
        break;

      case "CREATE_JO":
        api
          .createJO(action.projectId, {
            joNumber: action.joNumber,
            product: action.product,
            type: action.joType,
            targetDate: action.targetDate,
            categories: action.categories,
          })
          .catch(() => {});
        break;

      case "ADD_CATEGORY":
        api
          .addCategory(action.joId, {
            label: action.label,
            kind: action.kind,
            isCustom: action.isCustom,
          })
          .catch(() => {});
        break;

      case "ADD_ITEM":
        api.addItem(action.categoryId, action.item).catch(() => {});
        break;

      case "ADD_ITEMS_BATCH":
        api.batchAddItems(action.categoryId, action.items).catch(() => {});
        break;

      case "FINISH_JO":
        api.finishJO(action.joId).catch(() => {});
        break;

      case "UPDATE_ITEM_SUBCONT":
        api
          .updateItemSubcont(action.itemId, {
            isSubcont: action.isSubcont,
            subcontNotes: action.subcontNotes,
            subcontSupplier: action.subcontSupplier,
            subcontStatus: action.subcontStatus,
            subcontProcess: action.subcontProcess,
            qty: action.qty,
            arrivalTargetDate: action.arrivalTargetDate,
          })
          .catch(() => {});
        break;

      case "BULK_SEND_PO":
        api
          .bulkSendPo(action.joId, {
            itemIds: action.itemIds,
            supplier: action.supplier,
            poNo: action.poNo,
            poDate: action.poDate,
            targetArrival: action.targetArrival,
            notes: action.notes,
          })
          .catch(() => {});
        break;

      case "BULK_UPDATE_STATUS":
        api
          .bulkUpdateStatus(action.joId, {
            itemIds: action.itemIds,
            processes: action.processes || (action.process ? [action.process] : []),
            status: action.status,
            notes: action.notes,
          })
          .catch(() => {});
        break;

      case "BULK_SEND_SUBCONT":
        api
          .bulkSendSubcont(action.joId, {
            itemIds: action.itemIds,
            process: action.process,
            supplier: action.supplier,
            arrivalTargetDate: action.arrivalTargetDate,
          })
          .catch(() => {});
        break;

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
            name: action.session.name,
            trialDate: action.session.trialDate,
            updateDate: action.session.updateDate,
            customer: action.session.customer,
            jobNo: action.session.jobNo,
            picName: action.session.picName,
            approvedByName: action.session.approvedByName,
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
          .catch(() => {});
        break;

      case "DELETE_TRIAL_SESSION":
        api.deleteTrialSession(action.sessionId).catch(() => {});
        break;

      case "ADD_TRIAL_FINDING":
        api.addTrialFinding(action.sessionId).catch(() => {});
        break;

      case "DELETE_TRIAL_FINDING":
        api.deleteTrialFinding(action.findingId).catch(() => {});
        break;

      case "ADD_TRIAL_ENTRY":
        api
          .addTrialEntry(action.findingId, {
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

      case "REMOVE_TRIAL_ENTRY_PHOTO":
        api.deleteTrialPhoto(action.photoId).catch(() => {});
        break;

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
