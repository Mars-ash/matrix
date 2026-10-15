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
  "SEMI PROGRESSIVE",
  "TANDEM",
  "JIG",
  "WIRECUT SERVICE",
  "MACHINING SERVICE",
] as const;
export type JoType = (typeof JO_TYPES)[number];

/** Known subcont suppliers. */
export const SUBCONT_SUPPLIERS = [
  "CHIYODA",
  "GEMA",
  "IDM COATING",
  "KANETSU",
  "NCI",
  "OERLICON",
  "PRO-TECH",
  "PUTRA",
] as const;
export type SubcontSupplier = (typeof SUBCONT_SUPPLIERS)[number];

/** Known PO suppliers. */
export const PO_SUPPLIERS = [
  "CV Sansei Engineering",
  "CV Three Jaya",
  "PT Astra Daido",
  "PT Fujimaki",
  "PT Misumi",
  "PT Precision Special Steel",
  "PT Rukun Sejahtera Teknik",
] as const;
export type PoSupplier = (typeof PO_SUPPLIERS)[number];

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

/** Procurement details for Material/PO tracking cells. */
export interface PoTracking {
  supplier?: string;
  poNo?: string;
  poDate?: string; // YYYY-MM-DD
  targetArrival?: string; // YYYY-MM-DD
  actualArrivalDate?: string; // YYYY-MM-DD or ISO-8601
  notes?: string;
}

/** A single process-control cell. */
export interface Control {
  id?: string;
  process: ProcessName;
  status: ControlStatus;
  notes: string;
  photos?: ProcessPhoto[];
  inProgressAt?: string; // Date string when marked "In Progress"
  targetDate?: string; // YYYY-MM-DD
  doneAt?: string; // Date string when marked "Done"
  poTracking?: PoTracking;
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
  subcontStatus?: "In Progress" | "Done" | "Problem";
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

/** A snapshot of a trial session published for the viewer role. */
export type TrialSessionSnapshot = Omit<
  TrialSession,
  "publishedSnapshot" | "lastPublishedAt"
>;

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
  publishedSnapshot?: TrialSessionSnapshot;
  lastPublishedAt?: string;
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

/** Internal company entities (BKP or BMI). */
export const COMPANIES = ["BKP", "BMI"] as const;
export type CompanyEntity = (typeof COMPANIES)[number];

/** Known / standard customer companies (sorted alphabetically). */
export const DEFAULT_CUSTOMERS = [
  "CV BETA FOAM INDUSTRIAL",
  "CV GLOBALINDO PERKASA ENGINERING",
  "KK-Brothers",
  "PT A&P INDUSTRY INDONESIA",
  "PT ANEKA KOMKAR UTAMA",
  "PT APM Hyundai Transys",
  "PT ARGATAMA MULTI AGUNG",
  "PT ASAHI SANGYO INDONESIA",
  "PT ATMI SOLO",
  "PT BROCO AERATED CONCRETE INDUSTRY",
  "PT CAKRAWALA",
  "PT Cahaya Global Infinity Pratama",
  "PT Caturindo Agungjaya Rubber",
  "PT Chiyoda Industri",
  "PT CIPTAJAYA KREASINDO UTAMA",
  "PT CITRA GALVALINDO",
  "PT CITRA SEHATI MANDIRI",
  "PT DASA WINDU AGUNG",
  "PT DAYA PRESINDO UTAMA",
  "PT DEWA PUTRA MANUFACTURING",
  "PT DHARMA POLIPLAST",
  "PT Duta Rantai Mas",
  "PT.EPW BAJA LESTARI",
  "PT ERAN TEKNIKATAMA",
  "PT Fress Motorindo",
  "PT FUJI SEAT INDONESIA",
  "PT Fukoku Tokai Rubber Indonesia",
  "PT Fukuda",
  "PT Gerindo Jaya",
  "PT HUTOMO BERKAH RIDHO",
  "PT IEC Indonesia",
  "PT INDOTAMA BALADEWA KURNIA",
  "PT INDTA PRATAMAJAYA",
  "PT INGRESS MALINDO VENTURES",
  "PT INOMEC JAYA",
  "PT Inovasi Teknologi Engineering",
  "PT INTI KARYA",
  "PT INTRA PRESISI INDONESIA",
  "PT IRC INOAC INDONESIA",
  "PT KAWASHIMA ENGINEERING PLASTIC INDONESIA",
  "PT KBC INTERNATIONAL",
  "PT KMIL",
  "PT Laksana",
  "PT MADA WIKRI TUNGGAL",
  "PT MATRA RODA PIRANTI",
  "PT MEKAR INDO BERKAH",
  "PT MENARA TERUS MAKMUR",
  "PT Menara Unggul Sejahtera",
  "PT METINDO ERA SAKTI",
  "PT MIRINDA CIPTA PLASTISINDO",
  "PT MITRAMETAL PERKASA",
  "PT Moreen Indonesia",
  "PT NAGA MAS INTIPRATAMA",
  "PT NANDYA KARYA PERKASA",
  "PT NITIGURA INDONESIA",
  "PT NOBI",
  "PT PACIFIC RUBBER WORKS",
  "PT PADMA SOODE INDONESIA",
  "PT PANASONIC MANUFACTURING INDONESIA (FAN)",
  "PT Pandawa Manunggal Jaya",
  "PT PREFAB CIPTA LAKSANA",
  "PT REKADAYA MULTI ADIPRIMA",
  "PT SAKURA MOTORINDO",
  "PT SARANA UNGGUL PRATAMA",
  "PT SIIX EMS INDONESIA",
  "PT SINAR KENCANA SEJATI",
  "PT Surya Gesima Sejahtera",
  "PT TANAJAWA MASAGI INDONESIA",
  "PT TOYOTA BOSHOKU INDONESIA",
  "PT Tri Centrum Fortuna",
  "PT TRIM RUBBER",
  "PT TRIMAS EKATAMA NUSANTARA",
  "PT TRISAUDARA SENTOSA INDUSTRI",
  "PT USRA TAMPI INDONESIA",
  "PT Velasto Indonesia",
  "PT Welindo Mathotech Sukses",
  "PT Yogya Presisi Tehnikatama Industri",
  "PT YUTAKA MANUFACTURING INDONESIA",
] as const;

export type DefaultCustomer = (typeof DEFAULT_CUSTOMERS)[number];

/** A Project. */
export interface Project {
  id: string;
  name: string;
  customer: string;
  company?: CompanyEntity;
  isSystem?: boolean;
  jos: JO[];
}

/** User roles supported by MATRIX. */
export type UserRole = "controller" | "viewer";

/** Authenticated user profile. */
export interface AuthUser {
  id: number;
  name: string;
  username?: string;
  email: string;
  role: UserRole;
}

/** Partner types supported by Customer & Supplier Management. */
export type PartnerType = "customer" | "supplier_po" | "supplier_subcont";

/** Partner statuses. */
export type PartnerStatus = "active" | "discontinued";

/** Customer or Supplier Partner master record. */
export interface Partner {
  id: string;
  name: string;
  type: PartnerType;
  status: PartnerStatus;
  createdAt?: string;
  updatedAt?: string;
}

