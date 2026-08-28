import { describe, it, expect, beforeEach } from "vitest";
import { reducer, initialState, type AppState } from "./store";
import { MOCK_PROJECT } from "./mock-data";

let state: AppState;
const projectId = MOCK_PROJECT.id;

beforeEach(() => {
  state = structuredClone(initialState);
});

describe("CREATE_JO", () => {
  it("adds a new JO with empty categories", () => {
    const next = reducer(state, {
      type: "CREATE_JO",
      id: "test-jo-1",
      projectId,
      joNumber: "126.200",
      product: "New Product",
      joType: "PROGRESSIVE",
      categories: [
        { label: "PART", kind: "Part", isCustom: false },
        { label: "COMPONENT", kind: "Component", isCustom: false },
      ],
    });

    const project = next.projects.find((p) => p.id === projectId)!;
    const newJo = project.jos.find((j) => j.joNumber === "126.200");
    expect(newJo).toBeDefined();
    expect(newJo!.type).toBe("PROGRESSIVE");
    expect(newJo!.categories).toHaveLength(2);
    expect(newJo!.categories[0].items).toHaveLength(0);
    expect(newJo!.categories[1].items).toHaveLength(0);
    expect(newJo!.activities).toHaveLength(1);
    expect(newJo!.activities[0].message).toContain("created");
  });

  it("allows saving JO with no categories", () => {
    const next = reducer(state, {
      type: "CREATE_JO",
      id: "test-jo-2",
      projectId,
      joNumber: "126.201",
      product: "Empty JO",
      joType: "JIG",
      categories: [],
    });

    const jo = next.projects
      .find((p) => p.id === projectId)!
      .jos.find((j) => j.joNumber === "126.201");
    expect(jo).toBeDefined();
    expect(jo!.categories).toHaveLength(0);
  });
});

describe("ADD_ITEM", () => {
  it("adds an item with default '-' controls to a Part category", () => {
    const jo = state.projects[0].jos[0]; // 126.110
    const cat = jo.categories[0]; // PART DIES OP 10

    const next = reducer(state, {
      type: "ADD_ITEM",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      item: {
        no: "99",
        description: "New Part",
        dimension: "100×50×20",
        material: "S50C",
        qty: 1,
        hrc: "",
      },
      kind: "Part",
    });

    const updatedCat = next.projects[0].jos[0].categories[0];
    const newItem = updatedCat.items.find((i) => i.description === "New Part");
    expect(newItem).toBeDefined();
    expect(newItem!.controls).toHaveLength(7); // Part = 7 processes
    expect(newItem!.controls.every((c) => c.status === "-")).toBe(true);
  });

  it("adds an item with 2 controls to a Component category", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[1]; // COMPONENT DIES OP 10

    const next = reducer(state, {
      type: "ADD_ITEM",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      item: {
        no: "99",
        description: "New Comp",
        dimension: "",
        material: "",
        qty: 1,
        hrc: "",
      },
      kind: "Component",
    });

    const newItem = next.projects[0].jos[0].categories[1].items.find(
      (i) => i.description === "New Comp"
    );
    expect(newItem).toBeDefined();
    expect(newItem!.controls).toHaveLength(2); // Component = PO + Arrival
    expect(newItem!.controls.every((c) => c.status === "-")).toBe(true);
  });

  it("preserves subcont metadata and arrival target date", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];

    const next = reducer(state, {
      type: "ADD_ITEM",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      item: {
        no: "SC1",
        description: "Subcont Part",
        dimension: "50×30",
        material: "S50C",
        qty: 1,
        hrc: "",
        isSubcont: true,
        subcontNotes: "Kirim ke vendor X",
        arrivalTargetDate: "2026-09-01",
      },
      kind: "Part",
    });

    const newItem = next.projects[0].jos[0].categories[0].items.find(
      (i) => i.description === "Subcont Part"
    );
    expect(newItem).toBeDefined();
    expect(newItem!.isSubcont).toBe(true);
    expect(newItem!.subcontNotes).toBe("Kirim ke vendor X");
    expect(newItem!.arrivalTargetDate).toBe("2026-09-01");
  });
});

describe("ADD_ITEMS_BATCH", () => {
  it("adds multiple items at once", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const before = cat.items.length;

    const next = reducer(state, {
      type: "ADD_ITEMS_BATCH",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      items: [
        { no: "A", description: "Batch 1", dimension: "", material: "", qty: 1, hrc: "" },
        { no: "B", description: "Batch 2", dimension: "", material: "", qty: 2, hrc: "" },
      ],
      kind: "Part",
    });

    expect(next.projects[0].jos[0].categories[0].items).toHaveLength(before + 2);
  });
});

describe("UPDATE_STATUS", () => {
  it("updates a status and records activity", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0]; // Upper Die Shoe

    const next = reducer(state, {
      type: "UPDATE_STATUS",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Assembly",
      status: "In Progress",
      notes: "",
    });

    const updatedItem = next.projects[0].jos[0].categories[0].items[0];
    const asmCtrl = updatedItem.controls.find((c) => c.process === "Assembly")!;
    expect(asmCtrl.status).toBe("In Progress");

    const lastAct = next.projects[0].jos[0].activities[0];
    expect(lastAct.message).toContain("Assembly");
    expect(lastAct.message).toContain("In Progress");
  });

  it("rejects Problem without notes", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];

    const next = reducer(state, {
      type: "UPDATE_STATUS",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Machining",
      status: "Problem",
      notes: "", // empty → reject
    });

    // State should be unchanged
    const ctrl = next.projects[0].jos[0].categories[0].items[0].controls.find(
      (c) => c.process === "Machining"
    )!;
    expect(ctrl.status).not.toBe("Problem");
  });

  it("accepts Problem with notes", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];

    const next = reducer(state, {
      type: "UPDATE_STATUS",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Machining",
      status: "Problem",
      notes: "Tool broke during operation.",
    });

    const ctrl = next.projects[0].jos[0].categories[0].items[0].controls.find(
      (c) => c.process === "Machining"
    )!;
    expect(ctrl.status).toBe("Problem");
    expect(ctrl.notes).toBe("Tool broke during operation.");
  });

  it("captures inProgressAt date for PO, Material, and Arrival", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];

    const next = reducer(state, {
      type: "UPDATE_STATUS",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Material",
      status: "In Progress",
      notes: "",
    });

    const ctrl = next.projects[0].jos[0].categories[0].items[0].controls.find(
      (c) => c.process === "Material"
    )!;
    expect(ctrl.status).toBe("In Progress");
    expect(ctrl.inProgressAt).toBeDefined();
  });
});

describe("UPDATE_ITEM_SUBCONT", () => {
  it("marks an existing item as subcont", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0]; // Upper Die Shoe

    const next = reducer(state, {
      type: "UPDATE_ITEM_SUBCONT",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      isSubcont: true,
      subcontNotes: "Vendor ABC",
    });

    const updated = next.projects[0].jos[0].categories[0].items[0];
    expect(updated.isSubcont).toBe(true);
    expect(updated.subcontNotes).toBe("Vendor ABC");
  });

  it("unmarking subcont keeps notes but sets isSubcont false", () => {
    // First mark as subcont
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];

    let next = reducer(state, {
      type: "UPDATE_ITEM_SUBCONT",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      isSubcont: true,
    });

    // Then unmark
    next = reducer(next, {
      type: "UPDATE_ITEM_SUBCONT",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      isSubcont: false,
    });

    const updated = next.projects[0].jos[0].categories[0].items[0];
    expect(updated.isSubcont).toBe(false);
  });

  it("setting subcontStatus to Done marks subcontDoneAt and syncs process control to Done", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];

    // First set machining process to In Progress SC
    let next = reducer(state, {
      type: "UPDATE_STATUS",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Machining",
      status: "In Progress SC",
      notes: "",
    });

    let updatedItem = next.projects[0].jos[0].categories[0].items[0];
    expect(updatedItem.isSubcont).toBe(true);
    expect(updatedItem.subcontProcess).toBe("Machining");

    // Now mark subcontStatus as Done from subcont page
    next = reducer(next, {
      type: "UPDATE_ITEM_SUBCONT",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      isSubcont: true,
      subcontStatus: "Done",
    });

    updatedItem = next.projects[0].jos[0].categories[0].items[0];
    expect(updatedItem.subcontStatus).toBe("Done");
    expect(updatedItem.subcontDoneAt).toBeDefined();

    // Verify the Machining process control on the JO page is also automatically set to Done
    const machiningCtrl = updatedItem.controls.find((c) => c.process === "Machining");
    expect(machiningCtrl?.status).toBe("Done");
  });

  it("records activity for subcont toggle", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];
    const actCountBefore = jo.activities.length;

    const next = reducer(state, {
      type: "UPDATE_ITEM_SUBCONT",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      isSubcont: true,
    });

    const updatedJo = next.projects[0].jos[0];
    expect(updatedJo.activities.length).toBe(actCountBefore + 1);
    expect(updatedJo.activities[0].message).toContain("marked as Subcont");
  });
});



describe("ADD_PROCESS_PHOTO", () => {
  it("adds a photo to a process control", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];

    const next = reducer(state, {
      type: "ADD_PROCESS_PHOTO",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Machining",
      photo: { id: "photo-1", name: "machining-01.jpg", previewUrl: "blob:http://test/1" },
    });

    const ctrl = next.projects[0].jos[0].categories[0].items[0].controls.find(
      (c) => c.process === "Machining"
    )!;
    expect(ctrl.photos).toHaveLength(1);
    expect(ctrl.photos![0].id).toBe("photo-1");
    expect(ctrl.photos![0].name).toBe("machining-01.jpg");
    expect(ctrl.photos![0].addedAt).toBeTruthy();
  });

  it("adds multiple photos to the same process", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];

    let next = reducer(state, {
      type: "ADD_PROCESS_PHOTO",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Machining",
      photo: { id: "photo-1", name: "img1.jpg", previewUrl: "blob:1" },
    });

    next = reducer(next, {
      type: "ADD_PROCESS_PHOTO",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Machining",
      photo: { id: "photo-2", name: "img2.jpg", previewUrl: "blob:2" },
    });

    const ctrl = next.projects[0].jos[0].categories[0].items[0].controls.find(
      (c) => c.process === "Machining"
    )!;
    expect(ctrl.photos).toHaveLength(2);
  });

  it("records activity for photo add", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];

    const next = reducer(state, {
      type: "ADD_PROCESS_PHOTO",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Machining",
      photo: { id: "photo-1", name: "evidence.jpg", previewUrl: "blob:1" },
    });

    expect(next.projects[0].jos[0].activities[0].message).toContain("evidence.jpg");
    expect(next.projects[0].jos[0].activities[0].message).toContain("Machining");
  });
});

describe("REMOVE_PROCESS_PHOTO", () => {
  it("removes a specific photo from a process control", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];

    // Add two photos
    let next = reducer(state, {
      type: "ADD_PROCESS_PHOTO",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Machining",
      photo: { id: "photo-1", name: "img1.jpg", previewUrl: "blob:1" },
    });
    next = reducer(next, {
      type: "ADD_PROCESS_PHOTO",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Machining",
      photo: { id: "photo-2", name: "img2.jpg", previewUrl: "blob:2" },
    });

    // Remove first
    next = reducer(next, {
      type: "REMOVE_PROCESS_PHOTO",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Machining",
      photoId: "photo-1",
    });

    const ctrl = next.projects[0].jos[0].categories[0].items[0].controls.find(
      (c) => c.process === "Machining"
    )!;
    expect(ctrl.photos).toHaveLength(1);
    expect(ctrl.photos![0].id).toBe("photo-2");
  });
});

describe("BULK OPERATIONS", () => {
  it("BULK_UPDATE_TARGET_ARRIVAL updates arrival target date for multiple items", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item1 = cat.items[0];
    const item2 = cat.items[1];

    const next = reducer(state, {
      type: "BULK_UPDATE_TARGET_ARRIVAL",
      projectId,
      joId: jo.id,
      itemIds: [item1.id, item2.id],
      targetDate: "2026-09-15",
    });

    const updatedCat = next.projects[0].jos[0].categories[0];
    const uItem1 = updatedCat.items.find((i) => i.id === item1.id)!;
    const uItem2 = updatedCat.items.find((i) => i.id === item2.id)!;

    const ctrl1 = uItem1.controls.find((c) => c.process === "Arrival" || c.process === "Material")!;
    const ctrl2 = uItem2.controls.find((c) => c.process === "Arrival" || c.process === "Material")!;

    expect(ctrl1.targetDate).toBe("2026-09-15");
    expect(ctrl2.targetDate).toBe("2026-09-15");
    expect(next.projects[0].jos[0].activities[0].message).toContain("Bulk set Target Arrival");
  });

  it("BULK_UPDATE_STATUS updates process status across multiple items", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item1 = cat.items[0];
    const item2 = cat.items[1];

    const next = reducer(state, {
      type: "BULK_UPDATE_STATUS",
      projectId,
      joId: jo.id,
      itemIds: [item1.id, item2.id],
      process: "Machining",
      status: "Done",
    });

    const updatedCat = next.projects[0].jos[0].categories[0];
    const ctrl1 = updatedCat.items.find((i) => i.id === item1.id)!.controls.find((c) => c.process === "Machining")!;
    const ctrl2 = updatedCat.items.find((i) => i.id === item2.id)!.controls.find((c) => c.process === "Machining")!;

    expect(ctrl1.status).toBe("Done");
    expect(ctrl2.status).toBe("Done");
    expect(next.projects[0].jos[0].activities[0].message).toContain("Bulk updated Machining");
  });

  it("BULK_UPDATE_STATUS updates multiple processes across multiple items at once", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item1 = cat.items[0];
    const item2 = cat.items[1];

    const next = reducer(state, {
      type: "BULK_UPDATE_STATUS",
      projectId,
      joId: jo.id,
      itemIds: [item1.id, item2.id],
      processes: ["Machining", "Grinding", "Wirecut"],
      status: "In Progress",
    });

    const updatedCat = next.projects[0].jos[0].categories[0];
    const uItem1 = updatedCat.items.find((i) => i.id === item1.id)!;
    const uItem2 = updatedCat.items.find((i) => i.id === item2.id)!;

    for (const proc of ["Machining", "Grinding", "Wirecut"]) {
      expect(uItem1.controls.find((c) => c.process === proc)!.status).toBe("In Progress");
      expect(uItem2.controls.find((c) => c.process === proc)!.status).toBe("In Progress");
    }

    expect(next.projects[0].jos[0].activities[0].message).toContain("Bulk updated Machining, Grinding, Wirecut → In Progress");
  });

  it("BULK_SEND_SUBCONT dispatches multiple items to subcont tracker", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item1 = cat.items[0];
    const item2 = cat.items[1];

    const next = reducer(state, {
      type: "BULK_SEND_SUBCONT",
      projectId,
      joId: jo.id,
      itemIds: [item1.id, item2.id],
      process: "Hardening",
      supplier: "CHIYODA",
      arrivalTargetDate: "2026-09-10",
    });

    const updatedCat = next.projects[0].jos[0].categories[0];
    const uItem1 = updatedCat.items.find((i) => i.id === item1.id)!;
    const uItem2 = updatedCat.items.find((i) => i.id === item2.id)!;

    expect(uItem1.isSubcont).toBe(true);
    expect(uItem1.subcontProcess).toBe("Hardening");
    expect(uItem1.subcontSupplier).toBe("CHIYODA");
    expect(uItem1.arrivalTargetDate).toBe("2026-09-10");
    expect(uItem1.subcontStatus).toBe("In Progress");

    const ctrl1 = uItem1.controls.find((c) => c.process === "Hardening")!;
    expect(ctrl1.status).toBe("In Progress SC");

    expect(uItem2.isSubcont).toBe(true);
    expect(uItem2.subcontSupplier).toBe("CHIYODA");
    expect(next.projects[0].jos[0].activities[0].message).toContain("Bulk dispatched 2 parts to Subcont");
  });
});

// ---------------------------------------------------------------------------
// Trial report reducer tests
// ---------------------------------------------------------------------------
import { joProgress } from "./progress";
import type { TrialSession, TrialFinding } from "./types";

const joId = MOCK_PROJECT.jos[0].id;

function makeTrialFinding(overrides: Partial<TrialFinding> = {}): TrialFinding {
  return {
    id: `tf-${Math.random().toString(36).slice(2)}`,
    order: 1,
    problem: "Crack on surface",
    cause: "Material defect",
    correctiveAction: "Ganti material",
    targetDate: "2026-09-01",
    pic: "Budi",
    status: "On Process",
    photos: [],
    createdAt: "2026-08-27T00:00:00Z",
    updatedAt: "2026-08-27T00:00:00Z",
    ...overrides,
  };
}

function makeTrialSession(overrides: Partial<TrialSession> = {}): TrialSession {
  return {
    id: `ts-${Math.random().toString(36).slice(2)}`,
    joId,
    name: "Trial Test 270826",
    trialDate: "2026-08-27",
    updateDate: "2026-08-27",
    customer: "PT. Mercedes",
    jobNo: "126.110",
    picName: "Budi",
    approvedByName: "Pak Hendra",
    findings: [],
    createdAt: "2026-08-27T00:00:00Z",
    updatedAt: "2026-08-27T00:00:00Z",
    ...overrides,
  };
}

describe("CREATE_TRIAL_SESSION", () => {
  it("adds a session to the JO", () => {
    const session = makeTrialSession({ id: "ts-create-1" });
    const next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    const jo = next.projects[0].jos[0];
    expect(jo.trialSessions).toBeDefined();
    expect(jo.trialSessions!.find((s) => s.id === "ts-create-1")).toBeDefined();
  });

  it("returns original state for invalid JO", () => {
    const result = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId: "nonexistent",
      session: makeTrialSession(),
    });
    expect(result).toBe(state);
  });
});

describe("DUPLICATE_TRIAL_SESSION", () => {
  it("duplicates a session when source exists", () => {
    const source = makeTrialSession({ id: "ts-src" });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session: source,
    });
    const duplicate = makeTrialSession({ id: "ts-dup" });
    next = reducer(next, {
      type: "DUPLICATE_TRIAL_SESSION",
      projectId,
      joId,
      sourceSessionId: "ts-src",
      session: duplicate,
    });
    const jo = next.projects[0].jos[0];
    const mockCount = (state.projects[0].jos[0].trialSessions ?? []).length;
    expect(jo.trialSessions).toHaveLength(mockCount + 2);
  });

  it("returns original state when source does not exist", () => {
    const result = reducer(state, {
      type: "DUPLICATE_TRIAL_SESSION",
      projectId,
      joId,
      sourceSessionId: "nonexistent",
      session: makeTrialSession(),
    });
    expect(result).toBe(state);
  });
});

describe("UPDATE_TRIAL_SESSION", () => {
  it("updates session header fields", () => {
    const session = makeTrialSession({ id: "ts-upd" });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    next = reducer(next, {
      type: "UPDATE_TRIAL_SESSION",
      projectId,
      joId,
      sessionId: "ts-upd",
      updates: { picName: "Andi", customer: "PT. Toyota" },
    });
    const updated = next.projects[0].jos[0].trialSessions!.find(
      (s) => s.id === "ts-upd"
    )!;
    expect(updated.picName).toBe("Andi");
    expect(updated.customer).toBe("PT. Toyota");
  });
});

describe("DELETE_TRIAL_SESSION", () => {
  it("removes the session", () => {
    const session = makeTrialSession({ id: "ts-del" });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    next = reducer(next, {
      type: "DELETE_TRIAL_SESSION",
      projectId,
      joId,
      sessionId: "ts-del",
    });
    const jo = next.projects[0].jos[0];
    expect(
      (jo.trialSessions ?? []).find((s) => s.id === "ts-del")
    ).toBeUndefined();
  });
});

describe("ADD_TRIAL_FINDING", () => {
  it("adds a finding to the session", () => {
    const session = makeTrialSession({ id: "ts-af" });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    const finding = makeTrialFinding({ id: "tf-1" });
    next = reducer(next, {
      type: "ADD_TRIAL_FINDING",
      projectId,
      joId,
      sessionId: "ts-af",
      finding,
    });
    const s = next.projects[0].jos[0].trialSessions!.find(
      (s) => s.id === "ts-af"
    )!;
    expect(s.findings).toHaveLength(1);
    expect(s.findings[0].id).toBe("tf-1");
  });
});

describe("UPDATE_TRIAL_FINDING", () => {
  it("updates finding fields", () => {
    const finding = makeTrialFinding({ id: "tf-uf" });
    const session = makeTrialSession({ id: "ts-uf", findings: [finding] });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    next = reducer(next, {
      type: "UPDATE_TRIAL_FINDING",
      projectId,
      joId,
      sessionId: "ts-uf",
      findingId: "tf-uf",
      updates: { problem: "New problem text", status: "Close" },
    });
    const f = next.projects[0].jos[0].trialSessions!
      .find((s) => s.id === "ts-uf")!
      .findings.find((f) => f.id === "tf-uf")!;
    expect(f.problem).toBe("New problem text");
    expect(f.status).toBe("Close");
  });
});

describe("DELETE_TRIAL_FINDING", () => {
  it("removes a finding and re-sequences order", () => {
    const f1 = makeTrialFinding({ id: "tf-d1", order: 1 });
    const f2 = makeTrialFinding({ id: "tf-d2", order: 2 });
    const f3 = makeTrialFinding({ id: "tf-d3", order: 3 });
    const session = makeTrialSession({
      id: "ts-df",
      findings: [f1, f2, f3],
    });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    next = reducer(next, {
      type: "DELETE_TRIAL_FINDING",
      projectId,
      joId,
      sessionId: "ts-df",
      findingId: "tf-d2",
    });
    const s = next.projects[0].jos[0].trialSessions!.find(
      (s) => s.id === "ts-df"
    )!;
    expect(s.findings).toHaveLength(2);
    expect(s.findings.map((f) => f.order)).toEqual([1, 2]);
  });
});

describe("REORDER_TRIAL_FINDING", () => {
  it("moves a finding up", () => {
    const f1 = makeTrialFinding({ id: "tf-r1", order: 1, problem: "first" });
    const f2 = makeTrialFinding({ id: "tf-r2", order: 2, problem: "second" });
    const session = makeTrialSession({
      id: "ts-ro",
      findings: [f1, f2],
    });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    next = reducer(next, {
      type: "REORDER_TRIAL_FINDING",
      projectId,
      joId,
      sessionId: "ts-ro",
      findingId: "tf-r2",
      direction: "up",
    });
    const s = next.projects[0].jos[0].trialSessions!.find(
      (s) => s.id === "ts-ro"
    )!;
    const sorted = [...s.findings].sort((a, b) => a.order - b.order);
    expect(sorted[0].problem).toBe("second");
    expect(sorted[1].problem).toBe("first");
  });

  it("boundary: moving first finding up is a no-op (returns original state)", () => {
    const f1 = makeTrialFinding({ id: "tf-b1", order: 1 });
    const session = makeTrialSession({ id: "ts-b", findings: [f1] });
    const next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    const result = reducer(next, {
      type: "REORDER_TRIAL_FINDING",
      projectId,
      joId,
      sessionId: "ts-b",
      findingId: "tf-b1",
      direction: "up",
    });
    // Should return original state object reference
    expect(result).toBe(next);
  });

  it("boundary: moving last finding down is a no-op", () => {
    const f1 = makeTrialFinding({ id: "tf-bl1", order: 1 });
    const f2 = makeTrialFinding({ id: "tf-bl2", order: 2 });
    const session = makeTrialSession({ id: "ts-bl", findings: [f1, f2] });
    const next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    const result = reducer(next, {
      type: "REORDER_TRIAL_FINDING",
      projectId,
      joId,
      sessionId: "ts-bl",
      findingId: "tf-bl2",
      direction: "down",
    });
    expect(result).toBe(next);
  });
});

describe("ADD_TRIAL_FINDING_PHOTO / REMOVE_TRIAL_FINDING_PHOTO", () => {
  it("adds and removes a photo from a finding", () => {
    const finding = makeTrialFinding({ id: "tf-ph" });
    const session = makeTrialSession({ id: "ts-ph", findings: [finding] });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });

    // Add
    next = reducer(next, {
      type: "ADD_TRIAL_FINDING_PHOTO",
      projectId,
      joId,
      sessionId: "ts-ph",
      findingId: "tf-ph",
      photo: { id: "photo-1", name: "test.jpg", previewUrl: "blob:test" },
    });
    let f = next.projects[0].jos[0].trialSessions!
      .find((s) => s.id === "ts-ph")!
      .findings.find((f) => f.id === "tf-ph")!;
    expect(f.photos).toHaveLength(1);
    expect(f.photos[0].id).toBe("photo-1");

    // Remove
    next = reducer(next, {
      type: "REMOVE_TRIAL_FINDING_PHOTO",
      projectId,
      joId,
      sessionId: "ts-ph",
      findingId: "tf-ph",
      photoId: "photo-1",
    });
    f = next.projects[0].jos[0].trialSessions!
      .find((s) => s.id === "ts-ph")!
      .findings.find((f) => f.id === "tf-ph")!;
    expect(f.photos).toHaveLength(0);
  });
});

describe("Missing ID guard", () => {
  it("returns original state for missing IDs", () => {
    const actions = [
      { type: "UPDATE_TRIAL_SESSION" as const, projectId, joId, sessionId: "x", updates: {} },
      { type: "DELETE_TRIAL_SESSION" as const, projectId, joId, sessionId: "x" },
      { type: "ADD_TRIAL_FINDING" as const, projectId, joId, sessionId: "x", finding: makeTrialFinding() },
      { type: "UPDATE_TRIAL_FINDING" as const, projectId, joId, sessionId: "x", findingId: "y", updates: {} },
      { type: "DELETE_TRIAL_FINDING" as const, projectId, joId, sessionId: "x", findingId: "y" },
      { type: "REORDER_TRIAL_FINDING" as const, projectId, joId, sessionId: "x", findingId: "y", direction: "up" as const },
      { type: "ADD_TRIAL_FINDING_PHOTO" as const, projectId, joId, sessionId: "x", findingId: "y", photo: { id: "z", name: "n", previewUrl: "u" } },
      { type: "REMOVE_TRIAL_FINDING_PHOTO" as const, projectId, joId, sessionId: "x", findingId: "y", photoId: "z" },
    ];
    for (const action of actions) {
      expect(reducer(state, action)).toBe(state);
    }
  });
});

describe("Progress regression", () => {
  it("trialSessions do not affect JO progress", () => {
    const progressBefore = joProgress(state.projects[0].jos[0]);
    const session = makeTrialSession({ findings: [makeTrialFinding()] });
    const next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    const progressAfter = joProgress(next.projects[0].jos[0]);
    expect(progressAfter).toBe(progressBefore);
  });
});
