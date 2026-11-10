import type { AppState, AppAction } from "../store-types";
import type {
  Project,
  JO,
  Category,
  Item,
  Control,
  ProcessPhoto,
  TrialSession,
  TrialFinding,
  TrialCorrectiveActionEntry,
  TrialTextEntry,
  TrialEntryPhoto,
} from "../types";
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


export function reduceTrials(next: AppState, state: AppState, action: AppAction): AppState | null {
  switch (action.type) {
    case "HYDRATE_TRIAL_STORAGE": {
      next.projects = hydrateTrialSessions(next.projects, action.stored);
      return next;
    }

    case "HYDRATE_TRIAL_STORAGE": {
      const stored = action.stored || loadTrialSessionsFromStorage();
      if (!stored || Object.keys(stored).length === 0) return state;
      next.projects = hydrateTrialSessions(next.projects, stored);
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

    default:
      return null;
  }
}
