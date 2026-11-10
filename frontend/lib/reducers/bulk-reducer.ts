import type { AppState, AppAction } from "../store-types";
import type { Project, JO, Category, Item, Control, ProcessPhoto, TrialSession, TrialFinding } from "../types";
import { findProjectAndJo, findCategoryContext, addActivity } from "./reducer-utils";
import { uid } from "../format";
import { defaultControls } from "../category";
import { isPoTrackingProcess, poTrackingLabel, isItemPoSent } from "../po-tracking";
import { isItemSubcontSent } from "../subcont-tracking";
import {
  loadTrialSessionsFromStorage,
  hydrateTrialSessions,
  canonicalMergeTrialSessions,
} from "../trial-storage";


export function reduceBulk(next: AppState, state: AppState, action: AppAction): AppState | null {
  switch (action.type) {
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
              item.updatedAt = new Date().toISOString();
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
            if (itemUpdated) {
              item.updatedAt = new Date().toISOString();
              count++;
            }
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
            item.updatedAt = new Date().toISOString();

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
            item.updatedAt = new Date().toISOString();
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

    default:
      return null;
  }
}
