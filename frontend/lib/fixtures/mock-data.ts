/**
 * Test fixtures and prototype fallback data.
 * Used primarily for unit tests, offline development, and initial store hydration.
 */
import type {
  Project,
  JO,
  Item,
  Control,
  ControlStatus,
  TrialSession,
  TrialFinding,
} from "../types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let _id = 0;
function id(prefix = "mock"): string {
  return `${prefix}-${++_id}`;
}

function relativeDate(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split("T")[0];
}

function relativeIso(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function partCtrl(
  material: ControlStatus,
  arrival: ControlStatus,
  machining: ControlStatus,
  hardening: ControlStatus,
  grinding: ControlStatus,
  wirecut: ControlStatus,
  assembly: ControlStatus
): Control[] {
  return [
    { process: "Material", status: material, notes: "" },
    { process: "Arrival", status: arrival, notes: "" },
    { process: "Machining", status: machining, notes: "" },
    { process: "Hardening", status: hardening, notes: "" },
    { process: "Grinding", status: grinding, notes: "" },
    { process: "Wirecut", status: wirecut, notes: "" },
    { process: "Assembly", status: assembly, notes: "" },
  ];
}

function compCtrl(po: ControlStatus, arrival: ControlStatus): Control[] {
  return [
    { process: "PO", status: po, notes: "" },
    { process: "Arrival", status: arrival, notes: "" },
  ];
}

function partItem(
  no: string,
  desc: string,
  dim: string,
  mat: string,
  qty: number,
  hrc: string,
  controls: Control[],
  subcontOpts?: {
    isSubcont?: boolean;
    subcontSupplier?: string;
    subcontProcess?: string;
    subcontStatus?: "In Progress" | "Done";
    subcontDispatchDate?: string;
    subcontDoneAt?: string;
    arrivalTargetDate?: string;
    subcontNotes?: string;
  }
): Item {
  return {
    id: id("pi"),
    no,
    description: desc,
    dimension: dim,
    material: mat,
    qty,
    hrc,
    controls,
    ...subcontOpts,
  };
}

function compItem(
  no: string,
  desc: string,
  dim: string,
  mat: string,
  qty: number,
  hrc: string,
  controls: Control[]
): Item {
  return {
    id: id("ci"),
    no,
    description: desc,
    dimension: dim,
    material: mat,
    qty,
    hrc,
    controls,
  };
}

// ---------------------------------------------------------------------------
// JO 126.110 — derived from workbook 126.115 data
// Mapping: O → Done, V → In Progress, X / blank → Not Started, - → -, 12 → Problem
// ---------------------------------------------------------------------------

const parts110: Item[] = [
  partItem("1", "Upper Die Shoe", "600×500×60", "S50C", 1, "",
    partCtrl("Done", "Done", "In Progress", "-", "Not Started", "-", "Not Started")),
  partItem("2", "Lower Die Shoe", "600×500×50", "S50C", 1, "",
    partCtrl("Done", "Done", "In Progress", "-", "Not Started", "-", "Not Started")),
  partItem("3", "Guide Post", "Ø38×200", "SK3", 4, "58-60",
    partCtrl("Done", "Done", "Done", "Done", "Done", "-", "Not Started")),
  partItem("4", "Guide Bush", "Ø38×50", "SK3", 4, "58-60",
    partCtrl("Done", "Done", "Done", "Done", "Done", "-", "Not Started")),
  partItem("5", "Punch Holder", "400×300×35", "S50C", 1, "",
    partCtrl("Done", "Done", "In Progress", "-", "Not Started", "-", "Not Started")),
  partItem("6", "Die Plate", "400×300×30", "SKD11", 1, "58-60",
    partCtrl("Done", "Done", "Done", "In Progress SC", "Not Started", "Not Started", "Not Started"),
    {
      isSubcont: true,
      subcontSupplier: "CHIYODA",
      subcontProcess: "Hardening",
      subcontStatus: "In Progress",
      subcontDispatchDate: relativeIso(-4),
      arrivalTargetDate: relativeDate(2),
      subcontNotes: "Vacuum hardening 58-60 HRC",
    }),
  partItem("7", "Stripper Plate", "400×300×22", "S50C", 1, "",
    partCtrl("Done", "Done", "Not Started", "-", "Not Started", "-", "Not Started")),
  partItem("8", "Backing Plate", "400×300×16", "S50C", 1, "",
    partCtrl("Done", "Done", "Not Started", "-", "-", "-", "Not Started")),
  partItem("9", "Piercing Punch A", "Ø12×70", "SKD11", 4, "58-60",
    partCtrl("Done", "Done", "Done", "Done", "Done", "-", "Not Started"),
    {
      isSubcont: true,
      subcontSupplier: "PUTRA",
      subcontProcess: "Grinding",
      subcontStatus: "Done",
      subcontDispatchDate: relativeIso(-8),
      subcontDoneAt: relativeIso(0),
      arrivalTargetDate: relativeDate(-2),
      subcontNotes: "Cylindrical grinding Ø12 h6",
    }),
  partItem("10", "Piercing Punch B", "□10×70", "SKD11", 2, "58-60",
    partCtrl("Done", "Done", "Done", "Done", "Done", "Not Started", "Not Started")),
  partItem("11", "Pilot Pin", "Ø6×60", "SKD11", 4, "58-60",
    partCtrl("Done", "Done", "Done", "Done", "Done", "-", "Not Started")),
  partItem("12", "Dowel Pin", "Ø10×40", "SUJ2", 8, "",
    partCtrl("Done", "Done", "-", "-", "-", "-", "Not Started")),
  partItem("13", "Stopper", "20×20×25", "S45C", 2, "",
    partCtrl("Done", "Done", "Not Started", "-", "-", "-", "Not Started")),
  partItem("14", "Stripper Bolt", "M10×65", "SCM435", 6, "",
    partCtrl("Done", "Done", "-", "-", "-", "-", "Not Started")),
  partItem("15", "Spring", "TF30×60", "SWP-A", 6, "",
    partCtrl("Done", "Done", "-", "-", "-", "-", "Not Started")),
  partItem("16", "Blanking Punch", "special", "SKD11", 1, "58-60",
    partCtrl("Done", "Done", "Done", "Done", "Done", "In Progress SC", "Not Started"),
    {
      isSubcont: true,
      subcontSupplier: "PRO-TECH",
      subcontProcess: "Wirecut",
      subcontStatus: "In Progress",
      subcontDispatchDate: relativeIso(-6),
      arrivalTargetDate: relativeDate(-1),
      subcontNotes: "Wirecut profile clearance 0.02mm",
    }),
  partItem("17", "Forming Punch", "special", "SKD11", 1, "58-60",
    partCtrl("Done", "Done", "In Progress SC", "Not Started", "Not Started", "Not Started", "Not Started"),
    {
      isSubcont: true,
      subcontSupplier: "GEMA",
      subcontProcess: "Machining",
      subcontStatus: "In Progress",
      subcontDispatchDate: relativeIso(-2),
      arrivalTargetDate: relativeDate(0),
      subcontNotes: "CNC 3D profiling",
    }),
  partItem("18", "Bending Punch", "special", "SKD11", 1, "58-60",
    partCtrl("Done", "In Progress", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started")),
  partItem("19", "Cam Driver", "80×50×100", "S50C", 1, "",
    partCtrl("Done", "In Progress", "Not Started", "-", "Not Started", "-", "Not Started")),
  partItem("20", "Cam Slide", "60×50×40", "SKD11", 1, "58-60",
    partCtrl("Done", "In Progress", "Not Started", "Not Started", "Not Started", "Not Started", "Not Started")),
  partItem("21", "Lifter", "30×80×50", "SKD11", 2, "58-60",
    partCtrl("In Progress", "Not Started", "Not Started", "Not Started", "Not Started", "-", "Not Started")),
  partItem("22", "Lifter Guide", "30×20×40", "S50C", 2, "",
    // The workbook had anomalous value 12 on Arrival → Problem with note
    partCtrl("In Progress", "Problem", "Not Started", "-", "-", "-", "Not Started")),
];
// Set the Problem note for item 22 Arrival
parts110[parts110.length - 1].controls[1].notes =
  "Anomalous source value (12) — requires verification.";

parts110[20].controls[0].poTracking = {
  supplier: "PT Baja Makmur",
  poNo: "PO-MTL-126110-021",
  poDate: relativeDate(-2),
  targetArrival: relativeDate(2),
  notes: "SKD11 rough size requested.",
};
parts110[21].controls[0].poTracking = {
  supplier: "PT Sinar Steel",
  poNo: "PO-MTL-126110-022",
  poDate: relativeDate(-4),
  targetArrival: relativeDate(-1),
  notes: "Waiting supplier confirmation.",
};
parts110[0].controls[0].poTracking = {
  supplier: "PT Baja Makmur",
  poNo: "PO-MTL-126110-001",
  poDate: relativeDate(-12),
  targetArrival: relativeDate(-8),
  actualArrivalDate: relativeDate(-7),
  notes: "Material received.",
};

const components110: Item[] = [
  compItem("1", "Coil Spring", "TF25×40", "SWP-A", 4, "", compCtrl("Done", "Done")),
  compItem("2", "Socket Head Cap Screw", "M10×35", "SCM435", 12, "", compCtrl("Done", "Done")),
  compItem("3", "Socket Head Cap Screw", "M8×30", "SCM435", 8, "", compCtrl("Done", "Done")),
  compItem("4", "Socket Head Cap Screw", "M6×25", "SCM435", 16, "", compCtrl("Done", "In Progress")),
  compItem("5", "Dowel Pin", "Ø8×30", "SUJ2", 8, "", compCtrl("Done", "Done")),
  compItem("6", "Dowel Pin", "Ø6×25", "SUJ2", 6, "", compCtrl("Done", "Done")),
  compItem("7", "Shim Plate", "400×300×1.0", "SUS304", 2, "", compCtrl("Done", "Not Started")),
  compItem("8", "Urethane Pad", "25×25×20", "Hardness 90", 4, "", compCtrl("In Progress", "Not Started")),
  compItem("9", "Misumi Spring", "SWF20-50", "SWP", 4, "", compCtrl("In Progress", "Not Started")),
  compItem("10", "Ball Lock Punch", "SPAL-C Ø12", "HAP40", 4, "62-64", compCtrl("Not Started", "Not Started")),
  compItem("11", "Ball Lock Punch", "SPAL-C Ø8", "HAP40", 2, "62-64", compCtrl("Not Started", "Not Started")),
  compItem("12", "Guide Bushing", "MYKP 38-50", "Brass", 4, "", compCtrl("Done", "Done")),
  compItem("13", "Shank", "Ø40", "S45C", 1, "", compCtrl("Done", "In Progress")),
];

components110[7].controls[0].poTracking = {
  supplier: "MISUMI",
  poNo: "PO-COMP-126110-008",
  poDate: relativeDate(-1),
  targetArrival: relativeDate(3),
  notes: "Check stock before confirm.",
};
components110[8].controls[0].poTracking = {
  supplier: "LOCAL SPRING",
  poNo: "PO-COMP-126110-009",
  poDate: relativeDate(-3),
  targetArrival: relativeDate(0),
  notes: "Urgent for assembly preparation.",
};
components110[9].controls[0].poTracking = {
  supplier: "",
  poNo: "",
  poDate: "",
  targetArrival: relativeDate(5),
  notes: "Need supplier selection.",
};
components110[0].controls[0].poTracking = {
  supplier: "MISUMI",
  poNo: "PO-COMP-126110-001",
  poDate: relativeDate(-10),
  targetArrival: relativeDate(-6),
  actualArrivalDate: relativeDate(-5),
  notes: "Received in good condition.",
};
components110[1].controls[0].poTracking = {
  supplier: "CV Sansei Engineering",
  poNo: "PO-COMP-126110-002",
  poDate: relativeDate(-9),
  targetArrival: relativeDate(-5),
  actualArrivalDate: relativeDate(-5),
  notes: "Batch screws arrived.",
};

// ---------------------------------------------------------------------------
// Mock trial sessions for JO 126.110
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Mock trial sessions for JO 126.110
// ---------------------------------------------------------------------------
const trialSession1Findings: TrialFinding[] = [
  {
    id: id("tf"),
    order: 1,
    problems: [
      {
        id: id("te"),
        order: 1,
        text: "Hasil stamping bagian flange tidak rata, terdapat gelombang pada permukaan.",
        photos: [
          {
            id: id("tph"),
            name: "flange-issue.svg",
            previewUrl: "/report-placeholder-1.svg",
            addedAt: "2026-08-15T10:00:00+07:00",
          },
        ],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-20T16:00:00+07:00",
      },
      {
        id: id("te"),
        order: 2,
        text: "Terjadi burr tipis di radius sudut flange.",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-20T16:00:00+07:00",
      },
    ],
    causes: [
      {
        id: id("te"),
        order: 1,
        text: "Clearance antara punch dan die terlalu besar pada area flange.",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-20T16:00:00+07:00",
      },
    ],
    correctiveActions: [
      {
        id: id("ca"),
        order: 1,
        text: "Adjustment clearance die plate area flange, tambah shim 0.05mm.",
        targetDate: "2026-08-18",
        pic: "Andi",
        status: "Close",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-18T14:00:00+07:00",
      },
      {
        id: id("ca"),
        order: 2,
        text: "Poles radius punch dan die menggunakan diamond paste.",
        targetDate: "2026-08-20",
        pic: "Budi",
        status: "Close",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-20T11:00:00+07:00",
      },
      {
        id: id("ca"),
        order: 3,
        text: "Trial ulang 50 stroke untuk verifikasi konsistensi kerataan flange.",
        targetDate: "2026-08-20",
        pic: "Andi",
        status: "Close",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-20T16:00:00+07:00",
      },
    ],
    createdAt: "2026-08-14T09:00:00+07:00",
    updatedAt: "2026-08-20T16:00:00+07:00",
  },
  {
    id: id("tf"),
    order: 2,
    problems: [
      {
        id: id("te"),
        order: 1,
        text: "Burr berlebih pada lubang piercing Ø12mm.",
        photos: [
          {
            id: id("tph"),
            name: "burr-detail.svg",
            previewUrl: "/report-placeholder-2.svg",
            addedAt: "2026-08-15T10:30:00+07:00",
          },
        ],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-22T14:00:00+07:00",
      },
    ],
    causes: [
      {
        id: id("te"),
        order: 1,
        text: "Punch aus, sudah melewati batas pemakaian.",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-22T14:00:00+07:00",
      },
    ],
    correctiveActions: [
      {
        id: id("ca"),
        order: 1,
        text: "Ganti piercing punch Ø12mm baru, lakukan sharpening pada punch cadangan.",
        targetDate: "2026-08-22",
        pic: "Budi",
        status: "Close",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-22T14:00:00+07:00",
      },
    ],
    createdAt: "2026-08-14T09:00:00+07:00",
    updatedAt: "2026-08-22T14:00:00+07:00",
  },
  {
    id: id("tf"),
    order: 3,
    problems: [
      {
        id: id("te"),
        order: 1,
        text: "Dimensi bending angle tidak sesuai spesifikasi (target 90° ± 0.5°, aktual 88.2°).",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-25T10:00:00+07:00",
      },
    ],
    causes: [
      {
        id: id("te"),
        order: 1,
        text: "Spring back material lebih besar dari perhitungan awal.",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-25T10:00:00+07:00",
      },
      {
        id: id("te"),
        order: 2,
        text: "Variasi ketebalan lembaran plat material SPCEN dari supplier.",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-25T10:00:00+07:00",
      },
      {
        id: id("te"),
        order: 3,
        text: "Tekanan cushion pin gas spring kurang stabil.",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-25T10:00:00+07:00",
      },
    ],
    correctiveActions: [
      {
        id: id("ca"),
        order: 1,
        text: "Over-bend kompensasi 2° pada bending punch, trial ulang untuk verifikasi.",
        targetDate: "2026-09-01",
        pic: "Andi",
        status: "On Process",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-25T10:00:00+07:00",
      },
      {
        id: id("ca"),
        order: 2,
        text: "Kalibrasi tekanan nitrogen gas spring pada cushion unit.",
        targetDate: "2026-09-01",
        pic: "Rudi",
        status: "On Process",
        photos: [],
        createdAt: "2026-08-14T09:00:00+07:00",
        updatedAt: "2026-08-25T10:00:00+07:00",
      },
    ],
    createdAt: "2026-08-14T09:00:00+07:00",
    updatedAt: "2026-08-25T10:00:00+07:00",
  },
];

const trialSession2Findings: TrialFinding[] = [
  {
    id: id("tf"),
    order: 1,
    problems: [
      {
        id: id("te"),
        order: 1,
        text: "Hasil stamping bagian flange masih ada sedikit gelombang setelah adjustment.",
        photos: [
          {
            id: id("tph"),
            name: "flange-retry.svg",
            previewUrl: "/report-placeholder-3.svg",
            addedAt: "2026-08-26T09:00:00+07:00",
          },
        ],
        createdAt: "2026-08-25T14:00:00+07:00",
        updatedAt: "2026-08-26T09:00:00+07:00",
      },
    ],
    causes: [
      {
        id: id("te"),
        order: 1,
        text: "Shim 0.05mm kurang, perlu tambahan adjustment.",
        photos: [],
        createdAt: "2026-08-25T14:00:00+07:00",
        updatedAt: "2026-08-26T09:00:00+07:00",
      },
    ],
    correctiveActions: [
      {
        id: id("ca"),
        order: 1,
        text: "Tambah shim menjadi 0.08mm total, poles permukaan die plate.",
        targetDate: "2026-09-05",
        pic: "Andi",
        status: "On Process",
        photos: [],
        createdAt: "2026-08-25T14:00:00+07:00",
        updatedAt: "2026-08-26T09:00:00+07:00",
      },
    ],
    createdAt: "2026-08-25T14:00:00+07:00",
    updatedAt: "2026-08-26T09:00:00+07:00",
  },
  {
    id: id("tf"),
    order: 2,
    problems: [
      {
        id: id("te"),
        order: 1,
        text: "Strip layout pilot pin tidak center, material geser 0.3mm.",
        photos: [],
        createdAt: "2026-08-25T14:00:00+07:00",
        updatedAt: "2026-08-25T14:00:00+07:00",
      },
    ],
    causes: [
      {
        id: id("te"),
        order: 1,
        text: "Pilot pin aus dan longgar pada holder.",
        photos: [],
        createdAt: "2026-08-25T14:00:00+07:00",
        updatedAt: "2026-08-25T14:00:00+07:00",
      },
    ],
    correctiveActions: [
      {
        id: id("ca"),
        order: 1,
        text: "Ganti pilot pin baru dan periksa keausan holder, adjustment posisi strip guide.",
        targetDate: "2026-09-05",
        pic: "Rudi",
        status: "On Process",
        photos: [],
        createdAt: "2026-08-25T14:00:00+07:00",
        updatedAt: "2026-08-25T14:00:00+07:00",
      },
    ],
    createdAt: "2026-08-25T14:00:00+07:00",
    updatedAt: "2026-08-25T14:00:00+07:00",
  },
];

const jo110TrialSessions: TrialSession[] = [
  {
    id: id("ts"),
    joId: "", // patched after jo110 is created
    name: "Lower 140826",
    trialDate: "2026-08-14",
    updateDate: "2026-08-25",
    customer: "PT. Mercedes",
    jobNo: "126.110",
    picName: "Andi Prasetyo",
    approvedByName: "Pak Hendra",
    findings: trialSession1Findings,
    createdAt: "2026-08-14T08:00:00+07:00",
    updatedAt: "2026-08-25T10:00:00+07:00",
    publishedSnapshot: {
      id: "",
      joId: "",
      name: "Lower 140826",
      trialDate: "2026-08-14",
      updateDate: "2026-08-25",
      customer: "PT. Mercedes",
      jobNo: "126.110",
      picName: "Andi Prasetyo",
      approvedByName: "Pak Hendra",
      findings: trialSession1Findings,
      createdAt: "2026-08-14T08:00:00+07:00",
      updatedAt: "2026-08-25T10:00:00+07:00",
    },
    lastPublishedAt: "2026-08-25T10:00:00+07:00",
  },
  {
    id: id("ts"),
    joId: "", // patched after jo110 is created
    name: "Upper 250826",
    trialDate: "2026-08-25",
    updateDate: "2026-08-26",
    customer: "PT. Mercedes",
    jobNo: "126.110",
    picName: "Andi Prasetyo",
    approvedByName: "Pak Hendra",
    findings: trialSession2Findings,
    createdAt: "2026-08-25T14:00:00+07:00",
    updatedAt: "2026-08-26T09:00:00+07:00",
    publishedSnapshot: {
      id: "",
      joId: "",
      name: "Upper 250826",
      trialDate: "2026-08-25",
      updateDate: "2026-08-26",
      customer: "PT. Mercedes",
      jobNo: "126.110",
      picName: "Andi Prasetyo",
      approvedByName: "Pak Hendra",
      findings: trialSession2Findings,
      createdAt: "2026-08-25T14:00:00+07:00",
      updatedAt: "2026-08-26T09:00:00+07:00",
    },
    lastPublishedAt: "2026-08-26T09:00:00+07:00",
  },
];

const jo110: JO = {
  id: id("jo"),
  joNumber: "126.110",
  product: "Upper Die Assembly",
  type: "PROGRESSIVE",
  targetDate: "2026-10-15",
  categories: [
    {
      id: id("cat"),
      label: "PART DIES OP 10",
      kind: "Part",
      isCustom: false,
      items: parts110,
    },
    {
      id: id("cat"),
      label: "COMPONENT DIES OP 10",
      kind: "Component",
      isCustom: false,
      items: components110,
    },
  ],
  activities: [
    {
      id: id("act"),
      timestamp: "2026-08-12T15:30:00+07:00",
      message: "Status changed: Lifter Guide → Arrival → Problem. Note: Anomalous source value (12).",
    },
    {
      id: id("act"),
      timestamp: "2026-08-12T14:00:00+07:00",
      message: "5 component items updated: PO status changed to Done.",
    },
    {
      id: id("act"),
      timestamp: "2026-08-11T09:00:00+07:00",
      message: "JO 126.110 created with categories PART DIES OP 10 and COMPONENT DIES OP 10.",
    },
  ],
  trialSessions: jo110TrialSessions,
};

// Patch trial session joIds
for (const ts of jo110TrialSessions) {
  ts.joId = jo110.id;
  if (ts.publishedSnapshot) {
    ts.publishedSnapshot.id = ts.id;
    ts.publishedSnapshot.joId = jo110.id;
  }
}

// ---------------------------------------------------------------------------
// JO 126.111 — Bracket Forming Die (in-progress, no Problem)
// ---------------------------------------------------------------------------
const jo111: JO = {
  id: id("jo"),
  joNumber: "126.111",
  product: "Bracket Forming Die",
  type: "TANDEM",
  targetDate: "2026-11-01",
  categories: [
    {
      id: id("cat"),
      label: "PART DIES OP 20",
      kind: "Part",
      isCustom: false,
      items: [
        partItem("1", "Upper Plate", "500×400×55", "S50C", 1, "",
          partCtrl("Done", "Done", "In Progress", "-", "Not Started", "-", "Not Started")),
        partItem("2", "Lower Plate", "500×400×50", "S50C", 1, "",
          partCtrl("Done", "Done", "In Progress", "-", "Not Started", "-", "Not Started")),
        partItem("3", "Forming Insert", "80×60×40", "SKD11", 2, "58-60",
          partCtrl("Done", "Done", "Done", "In Progress SC", "Not Started", "Not Started", "Not Started"),
          {
            isSubcont: true,
            subcontSupplier: "KANETSU",
            subcontProcess: "Hardening",
            subcontStatus: "In Progress",
            subcontDispatchDate: relativeIso(-3),
            arrivalTargetDate: relativeDate(5),
            subcontNotes: "Heat treatment + subzero",
          }),
        partItem("4", "Guide Post", "Ø32×180", "SK3", 4, "58-60",
          partCtrl("Done", "Done", "Done", "Done", "Done", "-", "Not Started")),
      ],
    },
    {
      id: id("cat"),
      label: "COMPONENT",
      kind: "Component",
      isCustom: false,
      items: [
        compItem("1", "Socket Head Cap Screw", "M10×40", "SCM435", 8, "", compCtrl("Done", "Done")),
        compItem("2", "Dowel Pin", "Ø10×35", "SUJ2", 4, "", compCtrl("Done", "In Progress")),
      ],
    },
  ],
  activities: [
    {
      id: id("act"),
      timestamp: "2026-08-12T11:00:00+07:00",
      message: "Forming Insert → Hardening → In Progress SC (KANETSU).",
    },
  ],
};

// ---------------------------------------------------------------------------
// JO 126.112 — Locator Jig (early stage)
// ---------------------------------------------------------------------------
const jo112: JO = {
  id: id("jo"),
  joNumber: "126.112",
  product: "Locator Jig",
  type: "JIG",
  targetDate: "2026-09-20",
  categories: [
    {
      id: id("cat"),
      label: "PART JIG",
      kind: "Part",
      isCustom: false,
      items: [
        partItem("1", "Base Plate", "300×200×25", "S50C", 1, "",
          partCtrl("Done", "In Progress", "Not Started", "-", "-", "-", "Not Started")),
        partItem("2", "Locator Block", "50×30×40", "S45C", 4, "",
          partCtrl("Done", "Done", "In Progress SC", "-", "-", "-", "Not Started"),
          {
            isSubcont: true,
            subcontSupplier: "NCI",
            subcontProcess: "Machining",
            subcontStatus: "In Progress",
            subcontDispatchDate: relativeIso(-5),
            arrivalTargetDate: relativeDate(-3),
            subcontNotes: "Machining slot 10mm H7",
          }),
      ],
    },
  ],
  activities: [
    {
      id: id("act"),
      timestamp: "2026-08-13T08:00:00+07:00",
      message: "JO 126.112 created.",
    },
  ],
};

// ---------------------------------------------------------------------------
// JO 126.113 — Wirecut Service Set (service-only, compact)
// ---------------------------------------------------------------------------
const jo113: JO = {
  id: id("jo"),
  joNumber: "126.113",
  product: "Wirecut Service Set",
  type: "WIRECUT SERVICE",
  targetDate: "2026-08-30",
  categories: [
    {
      id: id("cat"),
      label: "PART",
      kind: "Part",
      isCustom: false,
      items: [
        partItem("1", "Die Insert A", "60×40×25", "SKD11", 1, "58-60",
          partCtrl("-", "-", "-", "-", "-", "Done", "-")),
        partItem("2", "Die Insert B", "60×40×25", "SKD11", 1, "58-60",
          partCtrl("-", "-", "-", "-", "-", "In Progress", "-")),
      ],
    },
  ],
  activities: [],
};

// ---------------------------------------------------------------------------
// JO 126.114 — Machining Service Set (has a Problem)
// ---------------------------------------------------------------------------
const jo114: JO = {
  id: id("jo"),
  joNumber: "126.114",
  product: "Machining Service Set",
  type: "MACHINING SERVICE",
  categories: [
    {
      id: id("cat"),
      label: "PART",
      kind: "Part",
      isCustom: false,
      items: [
        partItem("1", "Bracket A", "150×80×20", "S45C", 2, "",
          partCtrl("-", "-", "Done", "-", "-", "-", "-")),
        partItem("2", "Bracket B", "150×80×20", "S45C", 2, "",
          partCtrl("-", "-", "Problem", "-", "-", "-", "-")),
      ],
    },
  ],
  activities: [
    {
      id: id("act"),
      timestamp: "2026-08-13T10:00:00+07:00",
      message: "Bracket B → Machining → Problem. Note: Material defect found during setup.",
    },
  ],
};
// Set Problem note
jo114.categories[0].items[1].controls[2].notes = "Material defect found during setup.";

// ---------------------------------------------------------------------------
// Projects (aligned with database DemoSeeder)
// ---------------------------------------------------------------------------
export const MOCK_PROJECT: Project = {
  id: "proj-1",
  name: "HB24",
  customer: "PT Astra Daihatsu Motor",
  company: "BMI",
  jos: [jo110, jo111, jo112, jo113, jo114],
};

export const MOCK_PROJECT_2: Project = {
  id: "proj-2",
  name: "K2SA",
  customer: "PT Yamaha Indonesia Motor",
  company: "BKP",
  jos: [
    {
      id: "jo-127001",
      joNumber: "127.001",
      product: "Main Pipe Bracket",
      type: "PROGRESSIVE",
      targetDate: relativeDate(30),
      categories: [],
      activities: [],
    },
    {
      id: "jo-127002",
      joNumber: "127.002",
      product: "Welding Fixture Sub-Assy",
      type: "JIG",
      targetDate: relativeDate(14),
      categories: [],
      activities: [],
    },
  ],
};

export const MOCK_PROJECT_3: Project = {
  id: "proj-3",
  name: "737D",
  customer: "PT Panasonic Manufacturing",
  company: "BMI",
  jos: [
    {
      id: "jo-128010",
      joNumber: "128.010",
      product: "Air Conditioner Base Pan",
      type: "PROGRESSIVE",
      targetDate: relativeDate(60),
      categories: [],
      activities: [],
    },
  ],
};

/** Convenience: initial state for the store. */
export const INITIAL_PROJECTS: Project[] = [MOCK_PROJECT, MOCK_PROJECT_2, MOCK_PROJECT_3];
