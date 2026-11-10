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


export function reduceCategories(next: AppState, state: AppState, action: AppAction): AppState | null {
  switch (action.type) {
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

    default:
      return null;
  }
}
