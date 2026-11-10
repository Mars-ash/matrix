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


export function reduceProjectsAndJos(next: AppState, state: AppState, action: AppAction): AppState | null {
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

    default:
      return null;
  }
}
