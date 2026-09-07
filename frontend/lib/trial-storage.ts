import type { Project, TrialSession } from "./types";

const DB_NAME = "matrix_trial_db_v1";
const DB_VERSION = 1;
const STORE_NAME = "trial_sessions";
export const TRIAL_STORAGE_KEY = "matrix_trial_sessions_v1";

// In-memory cache for synchronous instant access
let memoryCache: Record<string, TrialSession[]> = {};

// Unique ID for the current browser tab context to ignore self-broadcast echoes
export const CLIENT_TAB_ID =
  typeof window !== "undefined"
    ? (() => {
        try {
          let id = window.sessionStorage.getItem("matrix_tab_id");
          if (!id) {
            id = "tab_" + Math.random().toString(36).slice(2) + "_" + Date.now();
            window.sessionStorage.setItem("matrix_tab_id", id);
          }
          return id;
        } catch {
          return "tab_" + Math.random().toString(36).slice(2) + "_" + Date.now();
        }
      })()
    : "ssr";

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function hasIndexedDB(): boolean {
  return isBrowser() && typeof window.indexedDB !== "undefined";
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDB()) {
      return reject(new Error("IndexedDB is not supported in this environment"));
    }
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Synchronously update the in-memory cache so subsequent reads within the same tick
 * immediately see the latest state without waiting for async IndexedDB/localStorage writes.
 */
export function updateTrialMemoryCache(projects: Project[]): void {
  const data: Record<string, TrialSession[]> = {};
  for (const p of projects) {
    for (const j of p.jos || []) {
      if (j.trialSessions && j.trialSessions.length > 0) {
        data[j.id] = structuredClone(j.trialSessions);
        if (j.joNumber) {
          data[j.joNumber] = structuredClone(j.trialSessions);
        }
      }
    }
  }
  memoryCache = { ...memoryCache, ...data };
}

let saveQueue: Promise<void> = Promise.resolve();

/**
 * Save all trial sessions from projects into both IndexedDB and localStorage (fallback).
 * IndexedDB has virtually unlimited quota (~hundreds of MBs/GBs) allowing large photos
 * to persist seamlessly without QuotaExceededError.
 */
export async function saveTrialSessionsAsync(projects: Project[]): Promise<void> {
  if (!isBrowser()) return;

  const data: Record<string, TrialSession[]> = {};
  for (const p of projects) {
    for (const j of p.jos || []) {
      if (j.trialSessions && j.trialSessions.length > 0) {
        data[j.id] = structuredClone(j.trialSessions);
        if (j.joNumber) {
          data[j.joNumber] = structuredClone(j.trialSessions);
        }
      }
    }
  }

  // Update memory cache immediately
  memoryCache = { ...memoryCache, ...data };

  // Write to localStorage (fallback). If quota exceeded due to photos, strip large base64
  // previews so metadata persists without leaving stale data in localStorage.
  try {
    localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    try {
      const strippedData: Record<string, TrialSession[]> = {};
      for (const [k, sessions] of Object.entries(data)) {
        strippedData[k] = sessions.map((s) => ({
          ...s,
          findings: s.findings.map((f) => ({
            ...f,
            problems: (f.problems || []).map((p) => ({
              ...p,
              photos: (p.photos || []).map((ph) => ({
                ...ph,
                previewUrl: ph.previewUrl.startsWith("data:") ? "" : ph.previewUrl,
              })),
            })),
            causes: (f.causes || []).map((c) => ({
              ...c,
              photos: (c.photos || []).map((ph) => ({
                ...ph,
                previewUrl: ph.previewUrl.startsWith("data:") ? "" : ph.previewUrl,
              })),
            })),
            correctiveActions: (f.correctiveActions || []).map((a) => ({
              ...a,
              photos: (a.photos || []).map((ph) => ({
                ...ph,
                previewUrl: ph.previewUrl.startsWith("data:") ? "" : ph.previewUrl,
              })),
            })),
          })),
          publishedSnapshot: s.publishedSnapshot
            ? {
                ...s.publishedSnapshot,
                findings: (s.publishedSnapshot.findings || []).map((f) => ({
                  ...f,
                  problems: (f.problems || []).map((p) => ({
                    ...p,
                    photos: (p.photos || []).map((ph) => ({
                      ...ph,
                      previewUrl: ph.previewUrl.startsWith("data:") ? "" : ph.previewUrl,
                    })),
                  })),
                  causes: (f.causes || []).map((c) => ({
                    ...c,
                    photos: (c.photos || []).map((ph) => ({
                      ...ph,
                      previewUrl: ph.previewUrl.startsWith("data:") ? "" : ph.previewUrl,
                    })),
                  })),
                  correctiveActions: (f.correctiveActions || []).map((a) => ({
                    ...a,
                    photos: (a.photos || []).map((ph) => ({
                      ...ph,
                      previewUrl: ph.previewUrl.startsWith("data:") ? "" : ph.previewUrl,
                    })),
                  })),
                })),
              }
            : undefined,
        }));
      }
      localStorage.setItem(TRIAL_STORAGE_KEY, JSON.stringify(strippedData));
    } catch {
      // If even stripped data fails, clear the key so stale deleted photos don't persist
      try {
        localStorage.removeItem(TRIAL_STORAGE_KEY);
      } catch {}
    }
  }

  // Write to IndexedDB
  if (hasIndexedDB()) {
    try {
      const db = await openDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readwrite");
        const store = tx.objectStore(STORE_NAME);

        for (const [key, sessions] of Object.entries(data)) {
          store.put({ key, sessions });
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      });
    } catch {
      // Ignore IndexedDB write failure if any
    }
  }

  // Notify other tabs in the same browser session in real-time (includes senderTabId)
  if (isBrowser() && "BroadcastChannel" in window) {
    try {
      const ch = new BroadcastChannel("matrix_trial_sync_channel");
      ch.postMessage({
        type: "TRIAL_STORAGE_UPDATED",
        senderTabId: CLIENT_TAB_ID,
        timestamp: Date.now(),
      });
      ch.close();
    } catch {
      // Ignore broadcast errors
    }
  }
}

/**
 * Synchronous save trigger called from store reducer.
 * Immediately updates in-memory cache and sequences async persistence.
 */
export function saveTrialSessionsToStorage(projects: Project[]): void {
  updateTrialMemoryCache(projects);
  saveQueue = saveQueue.then(() => saveTrialSessionsAsync(projects)).catch(() => {});
}

/**
 * Load trial sessions from IndexedDB.
 */
export async function loadTrialSessionsFromIndexedDB(): Promise<Record<string, TrialSession[]>> {
  if (!hasIndexedDB()) {
    return loadTrialSessionsFromStorage();
  }

  try {
    const db = await openDB();
    const records = await new Promise<Array<{ key: string; sessions: TrialSession[] }>>(
      (resolve, reject) => {
        const tx = db.transaction(STORE_NAME, "readonly");
        const store = tx.objectStore(STORE_NAME);
        const req = store.getAll();

        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => reject(req.error);
      }
    );

    const result: Record<string, TrialSession[]> = {};
    for (const item of records) {
      if (item.key && item.sessions) {
        result[item.key] = item.sessions;
      }
    }

    if (Object.keys(result).length > 0) {
      memoryCache = { ...memoryCache, ...result };
      return result;
    }
  } catch {
    // Fall back to localStorage if IndexedDB read fails
  }

  return loadTrialSessionsFromStorage();
}

export function clearTrialStorageCache(): void {
  memoryCache = {};
}

/**
 * Synchronous load from memoryCache or localStorage.
 */
export function loadTrialSessionsFromStorage(): Record<string, TrialSession[]> {
  if (!isBrowser()) return memoryCache;

  let fromStorage: Record<string, TrialSession[]> = {};
  try {
    const raw = localStorage.getItem(TRIAL_STORAGE_KEY);
    if (raw) {
      fromStorage = JSON.parse(raw);
    }
  } catch {
    // Ignore parse error
  }

  // Merge so memoryCache (which has full base64 images and instant local edits) takes precedence
  const merged = { ...fromStorage, ...memoryCache };
  return merged;
}

/**
 * Canonical deduplication and merging of trial sessions for a JO.
 * Strictly deduplicates sessions by normalized name: candidate.name.trim().toLowerCase().
 * - Always adopts the database ULID (length >= 26 with hyphens) for winner.id.
 * - Always adopts the newest publishedSnapshot based on lastPublishedAt.
 * - Chooses the version with more findings, or newer updatedAt if findings count is equal.
 */
export function canonicalMergeTrialSessions(candidates: TrialSession[]): TrialSession[] {
  const isBackendId = (id?: string) => Boolean(id && id.length >= 26 && id.includes("-"));
  const sessionByName = new Map<string, TrialSession>();

  for (const candidate of candidates) {
    if (!candidate || !candidate.name) continue;
    const normName = candidate.name.trim().toLowerCase();
    const existing = sessionByName.get(normName);

    if (!existing) {
      sessionByName.set(normName, structuredClone(candidate));
      continue;
    }

    const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
    const candTime = new Date(candidate.updatedAt || candidate.createdAt || 0).getTime();
    const candFindingsCount = (candidate.findings || []).length;
    const existingFindingsCount = (existing.findings || []).length;

    // Prefer candidate if it has more findings or a newer updatedAt
    const preferCandidate =
      candFindingsCount > existingFindingsCount ||
      (candFindingsCount === existingFindingsCount && candTime > existingTime);

    const winner = preferCandidate ? structuredClone(candidate) : existing;
    const loser = preferCandidate ? existing : candidate;

    // Always adopt backend database ULID for session ID if either has one
    if (!isBackendId(winner.id) && isBackendId(loser.id)) {
      winner.id = loser.id;
    }

    // Always preserve the newest publishedSnapshot
    const winnerPubTime = winner.lastPublishedAt ? new Date(winner.lastPublishedAt).getTime() : 0;
    const loserPubTime = loser.lastPublishedAt ? new Date(loser.lastPublishedAt).getTime() : 0;
    if (loserPubTime > winnerPubTime || (loser.publishedSnapshot && !winner.publishedSnapshot)) {
      winner.publishedSnapshot = loser.publishedSnapshot;
      winner.lastPublishedAt = loser.lastPublishedAt;
    }

    sessionByName.set(normName, winner);
  }

  return Array.from(sessionByName.values());
}

/**
 * Hydrate projects with stored trial sessions.
 * Deduplicates sessions strictly by normalized name and updates publishedSnapshot when newer.
 */
export function hydrateTrialSessions(
  projects: Project[],
  customStored?: Record<string, TrialSession[]>
): Project[] {
  const stored = customStored || loadTrialSessionsFromStorage();
  if (Object.keys(stored).length === 0) return projects;

  return projects.map((p) => ({
    ...p,
    jos: (p.jos || []).map((j) => {
      const storedSessions = stored[j.id] || (j.joNumber ? stored[j.joNumber] : undefined) || [];
      const currentSessions = j.trialSessions || [];

      if (storedSessions.length === 0 && currentSessions.length === 0) {
        return j;
      }

      return {
        ...j,
        trialSessions: canonicalMergeTrialSessions([...currentSessions, ...storedSessions]),
      };
    }),
  }));
}
