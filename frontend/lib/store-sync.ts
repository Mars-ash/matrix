import type { Dispatch } from "react";
import type { AppAction, AppState } from "./store-types";
import type { Project, JO, Category, Item, TrialSession } from "./types";
import { api } from "./api-client";
import { defaultControls } from "./category";
import { isPoTrackingProcess, poTrackingLabel, isItemPoSent } from "./po-tracking";
import { isItemSubcontSent } from "./subcont-tracking";
import { findProjectAndJo } from "./reducers/reducer-utils";
import { uid } from "./format";

/**
 * Dispatches background asynchronous API calls to synchronize optimistic
 * client state mutations with the backend database.
 */
export function syncActionToBackend(
  action: AppAction,
  rawDispatch: Dispatch<AppAction>,
  getState: () => AppState
): void {
  const state = getState();
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
}
