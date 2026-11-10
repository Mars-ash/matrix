"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
  type Dispatch,
} from "react";
import type { Project } from "./types";
import { INITIAL_PROJECTS } from "./mock-data";
import { api } from "./api-client";
import { useAuth } from "./auth";
import { syncActionToBackend } from "./store-sync";

// Re-export store types
export type { AppState, AppAction, TrialEntrySection } from "./store-types";
import type { AppState, AppAction } from "./store-types";

// Re-export trial storage helpers
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
} from "./trial-storage";
import {
  saveTrialSessionsToStorage,
  loadTrialSessionsFromStorage,
  loadTrialSessionsFromIndexedDB,
  CLIENT_TAB_ID,
} from "./trial-storage";

// Domain reducers
import { reduceProjectsAndJos } from "./reducers/project-reducer";
import { reduceCategories } from "./reducers/category-reducer";
import { reduceItems } from "./reducers/item-reducer";
import { reduceControls } from "./reducers/control-reducer";
import { reduceBulk } from "./reducers/bulk-reducer";
import { reduceTrials } from "./reducers/trial-reducer";

// ---------------------------------------------------------------------------
// Cache Key & Initial State
// ---------------------------------------------------------------------------
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
// Composed Reducer
// ---------------------------------------------------------------------------
function executeReducer(next: AppState, state: AppState, action: AppAction): AppState {
  const p = reduceProjectsAndJos(next, state, action);
  if (p) return p;

  const c = reduceCategories(next, state, action);
  if (c) return c;

  const i = reduceItems(next, state, action);
  if (i) return i;

  const ctrl = reduceControls(next, state, action);
  if (ctrl) return ctrl;

  const b = reduceBulk(next, state, action);
  if (b) return b;

  const t = reduceTrials(next, state, action);
  if (t) return t;

  return state;
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
// React Context & Provider
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

  // Hydrate trial sessions from localStorage & IndexedDB once mounted on client
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
          // Discard self-broadcast
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

  // Sync state from backend once authenticated
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

  const stateRef = React.useRef(state);
  stateRef.current = state;

  // Async API synchronization wrapper
  const dispatch: Dispatch<AppAction> = (action: AppAction) => {
    // 1. Optimistic instant local update
    rawDispatch(action);

    // 2. Background API persistence
    syncActionToBackend(action, rawDispatch, () => stateRef.current);
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
