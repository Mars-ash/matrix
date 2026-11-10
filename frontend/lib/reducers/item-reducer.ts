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


export function reduceItems(next: AppState, state: AppState, action: AppAction): AppState | null {
  switch (action.type) {
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
        createdAt: (action.item as any).createdAt || new Date().toISOString(),
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

      const newItems: Item[] = action.items.map((item, index) => {
        const newItem: Item = {
          ...item,
          id: item.id || uid(),
          createdAt: (item as any).createdAt || new Date(Date.now() + index * 100).toISOString(),
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
      item.updatedAt = new Date().toISOString();

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

      item.updatedAt = new Date().toISOString();

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

    default:
      return null;
  }
}
