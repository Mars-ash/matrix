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


export function reduceControls(next: AppState, state: AppState, action: AppAction): AppState | null {
  switch (action.type) {
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

      item.updatedAt = new Date().toISOString();

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
      item.updatedAt = new Date().toISOString();
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

      item.updatedAt = new Date().toISOString();

      const joRef = jo!;
      const rowLabel = poTrackingLabel(action.process);
      const statusText = action.status ? ` (Status: ${action.status})` : "";
      addActivity(
        joRef,
        `${item.description} → ${rowLabel} procurement updated${statusText}.`
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
      item.updatedAt = new Date().toISOString();

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
    default:
      return null;
  }
}
