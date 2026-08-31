// ---------------------------------------------------------------------------
// Domain types for the Project Controlling prototype.
// These mirror the approved design spec; no backend dependency.
// ---------------------------------------------------------------------------

/** The six allowed control statuses. */
export const STATUSES = ["-", "Not Started", "In Progress", "In Progress SC", "Done", "Problem"] as const;
export type ControlStatus = (typeof STATUSES)[number];

/** JO types — single-select per JO. */
export const JO_TYPES = [
  "PROGRESSIVE",
  "TANDEM",
  "JIG",
  "WIRECUT SERVICE",
  "MACHINING SERVICE",
] as const;
export type JoType = (typeof JO_TYPES)[number];

/** Known subcont suppliers. */
export const SUBCONT_SUPPLIERS = [
  "CHIYODA",
  "PRO-TECH",
  "GEMA",
  "PUTRA",
  "NCI",
  "KANETSU",
] as const;
export type SubcontSupplier = (typeof SUBCONT_SUPPLIERS)[number];

/** Standard Part category keys. */
export const PART_CATEGORIES = [
  "PART",
  "PART DIES OP 10",
  "PART DIES OP 20",
  "PART DIES OP 30",
  "PART DIES OP 40",
  "PART DIES OP 50",
  "PART RH",
  "PART LH",
  "PART JIG",
  "PART DIES",
] as const;

/** Standard Component category keys. */
export const COMPONENT_CATEGORIES = [
  "COMPONENT",
  "COMPONENT RH",
  "COMPONENT LH",
  "COMPONENT JIG",
  "COMPONENT DIES",
  "COMPONENT DIES OP 10",
  "COMPONENT DIES OP 20",
  "COMPONENT DIES OP 30",
  "COMPONENT DIES OP 40",
  "COMPONENT DIES OP 50",
] as const;

export type PartCategoryKey = (typeof PART_CATEGORIES)[number];
export type ComponentCategoryKey = (typeof COMPONENT_CATEGORIES)[number];
export type StandardCategoryKey = PartCategoryKey | ComponentCategoryKey;

/** The kind determines which process columns are shown. */
export type CategoryKind = "Part" | "Component";

/** Process names for Part categories. */
export const PART_PROCESSES = [
  "Material",
  "Arrival",
  "Machining",
  "Hardening",
  "Grinding",
  "Wirecut",
  "Assembly",
] as const;
export type PartProcess = (typeof PART_PROCESSES)[number];

/** Process names for Component categories. */
export const COMPONENT_PROCESSES = ["PO", "Arrival"] as const;
export type ComponentProcess = (typeof COMPONENT_PROCESSES)[number];

export type ProcessName = PartProcess | ComponentProcess;

// ---------------------------------------------------------------------------
// Domain entities
// ---------------------------------------------------------------------------

/** A photo attached to a process-control cell (prototype: local blob only). */
export interface ProcessPhoto {
  id: string;
  name: string;
  previewUrl: string;
  addedAt: string; // ISO-8601
}

/** A single process-control cell. */
export interface Control {
  process: ProcessName;
  status: ControlStatus;
  notes: string;
  photos?: ProcessPhoto[];
  inProgressAt?: string; // Date string when marked "In Progress"
  targetDate?: string; // YYYY-MM-DD
}

/** An item (part or component row) within a category. */
export interface Item {
  id: string;
  no: string;
  description: string;
  dimension: string;
  material: string;
  qty: number;
  hrc: string;
  controls: Control[];
  isSubcont?: boolean;
  subcontNotes?: string;
  subcontSupplier?: string;
  subcontStatus?: "In Progress" | "Done";
  subcontProcess?: string;
  subcontDispatchDate?: string; // ISO-8601 when marked In Progress SC
  subcontDoneAt?: string; // ISO-8601 timestamp when marked Done
  arrivalTargetDate?: string; // YYYY-MM-DD
}

/** A category section within a JO. */
export interface Category {
  id: string;
  /** Display label — equals the standard key or the user-supplied custom name. */
  label: string;
  kind: CategoryKind;
  /** True when this is a CUSTOM category. */
  isCustom: boolean;
  items: Item[];
}

/** Activity history entry. */
export interface ActivityEntry {
  id: string;
  timestamp: string; // ISO-8601
  message: string;
}

// ---------------------------------------------------------------------------
// Trial report types
// ---------------------------------------------------------------------------

/** Trial finding status values. */
export const TRIAL_FINDING_STATUSES = ["On Process", "Close"] as const;
export type TrialFindingStatus = (typeof TRIAL_FINDING_STATUSES)[number];

/** A photo attached to a trial finding entry. */
export interface TrialEntryPhoto {
  id: string;
  name: string;
  previewUrl: string;
  addedAt: string; // ISO-8601
}

/** Backward compatibility alias. */
export type TrialFindingPhoto = TrialEntryPhoto;

/** A text entry (Problem or Cause) within a trial finding. */
export interface TrialTextEntry {
  id: string;
  order: number;
  text: string;
  photos: TrialEntryPhoto[];
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

/** A corrective action entry within a trial finding. */
export interface TrialCorrectiveActionEntry {
  id: string;
  order: number;
  text: string;
  targetDate: string; // YYYY-MM-DD
  pic: string;
  status: TrialFindingStatus;
  photos: TrialEntryPhoto[];
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

/** A single finding (container for problems, causes, corrective actions) within a trial session. */
export interface TrialFinding {
  id: string;
  order: number;
  problems: TrialTextEntry[];
  causes: TrialTextEntry[];
  correctiveActions: TrialCorrectiveActionEntry[];
  createdAt: string; // ISO-8601
  updatedAt: string; // ISO-8601
}

/** A trial session belonging to a JO. */
export interface TrialSession {
  id: string;
  joId: string;
  name: string;
  trialDate: string;
  updateDate: string;
  customer: string;
  jobNo: string;
  picName: string;
  approvedByName: string;
  findings: TrialFinding[];
  createdAt: string;
  updatedAt: string;
}

/** A Job Order (JO). */
export interface JO {
  id: string;
  joNumber: string;
  product: string;
  type: JoType;
  targetDate?: string;
  finishDate?: string;
  categories: Category[];
  activities: ActivityEntry[];
  trialSessions?: TrialSession[];
}

/** A Project. */
export interface Project {
  id: string;
  name: string;
  customer: string;
  jos: JO[];
}
