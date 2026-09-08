import { describe, it, expect, beforeEach } from "vitest";
import {
  reducer,
  initialState,
  type AppState,
  saveTrialSessionsToStorage,
  loadTrialSessionsFromStorage,
  hydrateTrialSessions,
} from "./store";
import { MOCK_PROJECT } from "./mock-data";

let state: AppState;
const projectId = MOCK_PROJECT.id;

beforeEach(() => {
  state = structuredClone(initialState);
});

describe("CREATE_PROJECT", () => {
  it("adds a new project with BMI company", () => {
    const next = reducer(state, {
      type: "CREATE_PROJECT",
      id: "test-proj-bmi",
      name: "Project Alpha",
      customer: "Customer Alpha",
      company: "BMI",
    });

    const project = next.projects.find((p) => p.id === "test-proj-bmi");
    expect(project).toBeDefined();
    expect(project!.name).toBe("Project Alpha");
    expect(project!.customer).toBe("Customer Alpha");
    expect(project!.company).toBe("BMI");
    expect(project!.jos).toEqual([]);
  });

  it("adds a new project with BKP company", () => {
    const next = reducer(state, {
      type: "CREATE_PROJECT",
      id: "test-proj-bkp",
      name: "Project Beta",
      customer: "Customer Beta",
      company: "BKP",
    });

    const project = next.projects.find((p) => p.id === "test-proj-bkp");
    expect(project).toBeDefined();
    expect(project!.name).toBe("Project Beta");
    expect(project!.customer).toBe("Customer Beta");
    expect(project!.company).toBe("BKP");
  });
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

  it("supports creating a JO with SEMI PROGRESSIVE type", () => {
    const next = reducer(state, {
      type: "CREATE_JO",
      id: "test-jo-semi",
      projectId,
      joNumber: "126.202",
      product: "Semi Dies",
      joType: "SEMI PROGRESSIVE",
      categories: [],
    });

    const jo = next.projects
      .find((p) => p.id === projectId)!
      .jos.find((j) => j.joNumber === "126.202");
    expect(jo).toBeDefined();
    expect(jo!.type).toBe("SEMI PROGRESSIVE");
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
    const mtl = newItem!.controls.find((c) => c.process === "Material")!;
    const arr = newItem!.controls.find((c) => c.process === "Arrival")!;
    expect(mtl.status).toBe("Not Started");
    expect(arr.status).toBe("Not Started");
    const others = newItem!.controls.filter((c) => c.process !== "Material" && c.process !== "Arrival");
    expect(others.every((c) => c.status === "-")).toBe(true);
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
    expect(newItem!.controls.every((c) => c.status === "Not Started")).toBe(true);
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

describe("UPDATE_PO_TRACKING", () => {
  it("updates PO Mtl procurement fields and quantity", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];

    const next = reducer(state, {
      type: "UPDATE_PO_TRACKING",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Material",
      status: "In Progress",
      problemNotes: "",
      qty: 2,
      tracking: {
        supplier: "PT Baja Makmur",
        poNo: "PO-MTL-9001",
        poDate: "2026-09-01",
        targetArrival: "2026-09-05",
        notes: "Material cut to size",
      },
    });

    const updatedItem = next.projects[0].jos[0].categories[0].items[0];
    const materialControl = updatedItem.controls.find((c) => c.process === "Material")!;
    expect(updatedItem.qty).toBe(2);
    expect(materialControl.status).toBe("In Progress");
    expect(materialControl.poTracking).toEqual({
      supplier: "PT Baja Makmur",
      poNo: "PO-MTL-9001",
      poDate: "2026-09-01",
      targetArrival: "2026-09-05",
      notes: "Material cut to size",
    });
    expect(next.projects[0].jos[0].activities[0].message).toContain("PO Mtl");
  });

  it("updates Component PO procurement fields", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[1];
    const item = cat.items[0];

    const next = reducer(state, {
      type: "UPDATE_PO_TRACKING",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "PO",
      status: "Done",
      problemNotes: "",
      tracking: {
        supplier: "MISUMI",
        poNo: "PO-COMP-1002",
        poDate: "2026-08-30",
        targetArrival: "2026-09-02",
        notes: "",
      },
    });

    const updatedItem = next.projects[0].jos[0].categories[1].items[0];
    const poControl = updatedItem.controls.find((c) => c.process === "PO")!;
    const arrivalControl = updatedItem.controls.find((c) => c.process === "Arrival")!;
    expect(poControl.status).toBe("Done");
    expect(arrivalControl.status).toBe("Done");
    expect(poControl.poTracking?.supplier).toBe("MISUMI");
    expect(poControl.poTracking?.poNo).toBe("PO-COMP-1002");
    expect(next.projects[0].jos[0].activities[0].message).toContain("PO");
  });

  it("rejects Problem status without notes", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];
    const materialBefore = item.controls.find((c) => c.process === "Material")!;
    const beforeStatus = materialBefore.status;
    const beforePoNo = materialBefore.poTracking?.poNo;

    const next = reducer(state, {
      type: "UPDATE_PO_TRACKING",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Material",
      status: "Problem",
      problemNotes: "",
      tracking: {
        supplier: "PT Baja Makmur",
        poNo: "PO-MTL-9001",
        poDate: "2026-09-01",
        targetArrival: "2026-09-05",
        notes: "Missing notes should reject",
      },
    });

    const materialControl = next.projects[0].jos[0].categories[0].items[0].controls.find(
      (c) => c.process === "Material"
    )!;
    expect(materialControl.status).toBe(beforeStatus);
    expect(materialControl.poTracking?.poNo).toBe(beforePoNo);
  });

  it("syncs targetArrival to Arrival control targetDate", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const item = cat.items[0];

    const next = reducer(state, {
      type: "UPDATE_PO_TRACKING",
      projectId,
      joId: jo.id,
      categoryId: cat.id,
      itemId: item.id,
      process: "Material",
      status: "In Progress",
      problemNotes: "",
      tracking: {
        supplier: "PT Baja Makmur",
        poNo: "PO-MTL-9999",
        poDate: "2026-09-01",
        targetArrival: "2026-09-10",
        notes: "",
      },
    });

    const updatedItem = next.projects[0].jos[0].categories[0].items[0];
    const arrivalControl = updatedItem.controls.find((c) => c.process === "Arrival")!;
    expect(arrivalControl.targetDate).toBe("2026-09-10");
  });
});

describe("BULK_SEND_PO", () => {
  it("bulk dispatches PO for selected items and updates status to Done, Arrival to Not Started, poTracking, and Arrival targetDate", () => {
    const jo = state.projects[0].jos[0];
    const cat = jo.categories[0];
    const itemIds = [cat.items[0].id, cat.items[1].id];

    const next = reducer(state, {
      type: "BULK_SEND_PO",
      projectId,
      joId: jo.id,
      itemIds,
      supplier: "PT Baja Makmur",
      poNo: "PO-BULK-001",
      poDate: "2026-09-01",
      targetArrival: "2026-09-08",
      notes: "Bulk raw material order",
    });

    const item1 = next.projects[0].jos[0].categories[0].items[0];
    const item2 = next.projects[0].jos[0].categories[0].items[1];

    const mtl1 = item1.controls.find((c) => c.process === "Material")!;
    const arr1 = item1.controls.find((c) => c.process === "Arrival")!;
    const mtl2 = item2.controls.find((c) => c.process === "Material")!;
    const arr2 = item2.controls.find((c) => c.process === "Arrival")!;

    expect(mtl1.status).toBe("Done");
    expect(arr1.status).toBe("Not Started");
    expect(mtl1.poTracking?.poNo).toBe("PO-BULK-001");
    expect(mtl1.poTracking?.supplier).toBe("PT Baja Makmur");
    expect(mtl1.poTracking?.targetArrival).toBe("2026-09-08");
    expect(arr1.targetDate).toBe("2026-09-08");

    expect(mtl2.status).toBe("Done");
    expect(arr2.status).toBe("Not Started");
    expect(mtl2.poTracking?.poNo).toBe("PO-BULK-001");
    expect(arr2.targetDate).toBe("2026-09-08");

    expect(next.projects[0].jos[0].activities[0].message).toContain("Bulk sent PO");
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
import type {
  TrialSession,
  TrialFinding,
  TrialTextEntry,
  TrialCorrectiveActionEntry,
} from "./types";

const joId = MOCK_PROJECT.jos[0].id;

function makeTrialTextEntry(
  overrides: Partial<TrialTextEntry> = {}
): TrialTextEntry {
  return {
    id: `te-${Math.random().toString(36).slice(2)}`,
    order: 1,
    text: "Sample problem or cause",
    photos: [],
    createdAt: "2026-08-27T00:00:00Z",
    updatedAt: "2026-08-27T00:00:00Z",
    ...overrides,
  };
}

function makeTrialCorrectiveActionEntry(
  overrides: Partial<TrialCorrectiveActionEntry> = {}
): TrialCorrectiveActionEntry {
  return {
    id: `ca-${Math.random().toString(36).slice(2)}`,
    order: 1,
    text: "Sample corrective action",
    targetDate: "2026-09-01",
    pic: "Budi",
    status: "On Process",
    photos: [],
    createdAt: "2026-08-27T00:00:00Z",
    updatedAt: "2026-08-27T00:00:00Z",
    ...overrides,
  };
}

function makeTrialFinding(overrides: Partial<TrialFinding> = {}): TrialFinding {
  return {
    id: `tf-${Math.random().toString(36).slice(2)}`,
    order: 1,
    problems: [makeTrialTextEntry({ text: "Crack on surface" })],
    causes: [makeTrialTextEntry({ text: "Material defect" })],
    correctiveActions: [
      makeTrialCorrectiveActionEntry({
        text: "Ganti material",
        targetDate: "2026-09-01",
        pic: "Budi",
        status: "On Process",
      }),
    ],
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
  it("duplicates a session when source exists and preserves nested structure without photos", () => {
    const source = makeTrialSession({
      id: "ts-src",
      findings: [
        makeTrialFinding({
          problems: [
            makeTrialTextEntry({
              text: "Problem 1",
              photos: [{ id: "p-ph", name: "p.jpg", previewUrl: "/p.svg", addedAt: "2026-08-27T00:00:00Z" }],
            }),
          ],
          causes: [makeTrialTextEntry({ text: "Cause 1" })],
          correctiveActions: [
            makeTrialCorrectiveActionEntry({
              text: "Action 1",
              targetDate: "2026-09-01",
              pic: "Budi",
              status: "Close",
            }),
          ],
        }),
      ],
    });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session: source,
    });
    const duplicate = makeTrialSession({
      id: "ts-dup",
      findings: [
        makeTrialFinding({
          problems: [makeTrialTextEntry({ text: "Problem 1", photos: [] })],
          causes: [makeTrialTextEntry({ text: "Cause 1" })],
          correctiveActions: [
            makeTrialCorrectiveActionEntry({
              text: "Action 1",
              targetDate: "2026-09-01",
              pic: "Budi",
              status: "Close",
              photos: [],
            }),
          ],
        }),
      ],
    });
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
    const dupSession = jo.trialSessions!.find((s) => s.id === "ts-dup")!;
    expect(dupSession.findings[0].problems[0].photos).toEqual([]);
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

describe("PUBLISH_TRIAL_SESSION_TO_VIEWER", () => {
  it("creates a publishedSnapshot and updates lastPublishedAt timestamp", () => {
    const session = makeTrialSession({
      id: "ts-pub",
      name: "Trial 1 Initial",
      findings: [makeTrialFinding({ order: 1 })],
    });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    expect(next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-pub")?.publishedSnapshot).toBeUndefined();

    next = reducer(next, {
      type: "PUBLISH_TRIAL_SESSION_TO_VIEWER",
      projectId,
      joId,
      sessionId: "ts-pub",
    });

    const publishedSession = next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-pub")!;
    expect(publishedSession.publishedSnapshot).toBeDefined();
    expect(publishedSession.publishedSnapshot?.name).toBe("Trial 1 Initial");
    expect(publishedSession.publishedSnapshot?.findings).toHaveLength(1);
    expect(publishedSession.lastPublishedAt).toBeDefined();
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
    const f1 = makeTrialFinding({ id: "tf-r1", order: 1 });
    const f2 = makeTrialFinding({ id: "tf-r2", order: 2 });
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
    expect(sorted[0].id).toBe("tf-r2");
    expect(sorted[1].id).toBe("tf-r1");
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

describe("ADD_TRIAL_ENTRY", () => {
  it("adds a problem entry to a finding and sequences order", () => {
    const finding = makeTrialFinding({ id: "tf-e1", problems: [] });
    const session = makeTrialSession({ id: "ts-e1", findings: [finding] });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    const newProblem = makeTrialTextEntry({ id: "p-1", text: "Problem A" });
    next = reducer(next, {
      type: "ADD_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId: "ts-e1",
      findingId: "tf-e1",
      section: "problems",
      entry: newProblem,
    });
    const s = next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-e1")!;
    const f = s.findings.find((f) => f.id === "tf-e1")!;
    expect(f.problems).toHaveLength(1);
    expect(f.problems[0].id).toBe("p-1");
    expect(f.problems[0].order).toBe(1);
  });

  it("adds a cause entry to a finding", () => {
    const finding = makeTrialFinding({ id: "tf-e2", causes: [] });
    const session = makeTrialSession({ id: "ts-e2", findings: [finding] });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    const newCause = makeTrialTextEntry({ id: "c-1", text: "Cause A" });
    next = reducer(next, {
      type: "ADD_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId: "ts-e2",
      findingId: "tf-e2",
      section: "causes",
      entry: newCause,
    });
    const s = next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-e2")!;
    const f = s.findings.find((f) => f.id === "tf-e2")!;
    expect(f.causes).toHaveLength(1);
    expect(f.causes[0].id).toBe("c-1");
  });

  it("adds a corrective action entry with target, pic, and status", () => {
    const finding = makeTrialFinding({ id: "tf-e3", correctiveActions: [] });
    const session = makeTrialSession({ id: "ts-e3", findings: [finding] });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    const newAction = makeTrialCorrectiveActionEntry({
      id: "a-1",
      text: "Action A",
      targetDate: "2026-09-10",
      pic: "Doni",
      status: "Close",
    });
    next = reducer(next, {
      type: "ADD_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId: "ts-e3",
      findingId: "tf-e3",
      section: "correctiveActions",
      entry: newAction,
    });
    const s = next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-e3")!;
    const f = s.findings.find((f) => f.id === "tf-e3")!;
    expect(f.correctiveActions).toHaveLength(1);
    expect(f.correctiveActions[0].pic).toBe("Doni");
    expect(f.correctiveActions[0].status).toBe("Close");
  });
});

describe("UPDATE_TRIAL_ENTRY", () => {
  it("updates only the targeted problem entry", () => {
    const p1 = makeTrialTextEntry({ id: "p-1", text: "Old Problem 1" });
    const p2 = makeTrialTextEntry({ id: "p-2", text: "Old Problem 2" });
    const finding = makeTrialFinding({ id: "tf-u1", problems: [p1, p2] });
    const session = makeTrialSession({ id: "ts-u1", findings: [finding] });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    next = reducer(next, {
      type: "UPDATE_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId: "ts-u1",
      findingId: "tf-u1",
      section: "problems",
      entryId: "p-1",
      updates: { text: "Updated Problem 1" },
    });
    const s = next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-u1")!;
    const f = s.findings.find((f) => f.id === "tf-u1")!;
    expect(f.problems[0].text).toBe("Updated Problem 1");
    expect(f.problems[1].text).toBe("Old Problem 2");
  });

  it("updates corrective action fields (targetDate, pic, status)", () => {
    const a1 = makeTrialCorrectiveActionEntry({
      id: "a-1",
      text: "Old Action",
      pic: "Andi",
      status: "On Process",
    });
    const finding = makeTrialFinding({ id: "tf-u2", correctiveActions: [a1] });
    const session = makeTrialSession({ id: "ts-u2", findings: [finding] });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    next = reducer(next, {
      type: "UPDATE_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId: "ts-u2",
      findingId: "tf-u2",
      section: "correctiveActions",
      entryId: "a-1",
      updates: { pic: "Joko", status: "Close", targetDate: "2026-09-15" },
    });
    const s = next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-u2")!;
    const f = s.findings.find((f) => f.id === "tf-u2")!;
    expect(f.correctiveActions[0].pic).toBe("Joko");
    expect(f.correctiveActions[0].status).toBe("Close");
    expect(f.correctiveActions[0].targetDate).toBe("2026-09-15");
  });
});

describe("DELETE_TRIAL_ENTRY", () => {
  it("deletes targeted entry and re-sequences only that section", () => {
    const p1 = makeTrialTextEntry({ id: "p-1", order: 1, text: "P1" });
    const p2 = makeTrialTextEntry({ id: "p-2", order: 2, text: "P2" });
    const p3 = makeTrialTextEntry({ id: "p-3", order: 3, text: "P3" });
    const c1 = makeTrialTextEntry({ id: "c-1", order: 1, text: "C1" });
    const finding = makeTrialFinding({ id: "tf-del1", problems: [p1, p2, p3], causes: [c1] });
    const session = makeTrialSession({ id: "ts-del1", findings: [finding] });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    next = reducer(next, {
      type: "DELETE_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId: "ts-del1",
      findingId: "tf-del1",
      section: "problems",
      entryId: "p-2",
    });
    const s = next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-del1")!;
    const f = s.findings.find((f) => f.id === "tf-del1")!;
    expect(f.problems).toHaveLength(2);
    expect(f.problems[0].id).toBe("p-1");
    expect(f.problems[0].order).toBe(1);
    expect(f.problems[1].id).toBe("p-3");
    expect(f.problems[1].order).toBe(2);
    expect(f.causes).toHaveLength(1);
    expect(f.causes[0].order).toBe(1);
  });
});

describe("REORDER_TRIAL_ENTRY", () => {
  it("reorders entries within targeted section only without affecting others", () => {
    const p1 = makeTrialTextEntry({ id: "p-1", order: 1, text: "P1" });
    const p2 = makeTrialTextEntry({ id: "p-2", order: 2, text: "P2" });
    const c1 = makeTrialTextEntry({ id: "c-1", order: 1, text: "C1" });
    const c2 = makeTrialTextEntry({ id: "c-2", order: 2, text: "C2" });
    const finding = makeTrialFinding({ id: "tf-re1", problems: [p1, p2], causes: [c1, c2] });
    const session = makeTrialSession({ id: "ts-re1", findings: [finding] });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    next = reducer(next, {
      type: "REORDER_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId: "ts-re1",
      findingId: "tf-re1",
      section: "problems",
      entryId: "p-2",
      direction: "up",
    });
    const s = next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-re1")!;
    const f = s.findings.find((f) => f.id === "tf-re1")!;
    expect(f.problems[0].id).toBe("p-2");
    expect(f.problems[0].order).toBe(1);
    expect(f.problems[1].id).toBe("p-1");
    expect(f.problems[1].order).toBe(2);
    // Causes should not be modified
    expect(f.causes[0].id).toBe("c-1");
    expect(f.causes[1].id).toBe("c-2");
  });

  it("returns original state at boundaries", () => {
    const p1 = makeTrialTextEntry({ id: "p-1", order: 1 });
    const finding = makeTrialFinding({ id: "tf-re2", problems: [p1] });
    const session = makeTrialSession({ id: "ts-re2", findings: [finding] });
    const next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });
    const resUp = reducer(next, {
      type: "REORDER_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId: "ts-re2",
      findingId: "tf-re2",
      section: "problems",
      entryId: "p-1",
      direction: "up",
    });
    expect(resUp).toBe(next);

    const resDown = reducer(next, {
      type: "REORDER_TRIAL_ENTRY",
      projectId,
      joId,
      sessionId: "ts-re2",
      findingId: "tf-re2",
      section: "problems",
      entryId: "p-1",
      direction: "down",
    });
    expect(resDown).toBe(next);
  });
});

describe("ADD_TRIAL_ENTRY_PHOTO / REMOVE_TRIAL_ENTRY_PHOTO", () => {
  it("adds and removes photo on a specific problem entry", () => {
    const p1 = makeTrialTextEntry({ id: "p-1", photos: [] });
    const p2 = makeTrialTextEntry({ id: "p-2", photos: [] });
    const finding = makeTrialFinding({ id: "tf-ph1", problems: [p1, p2] });
    const session = makeTrialSession({ id: "ts-ph1", findings: [finding] });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });

    next = reducer(next, {
      type: "ADD_TRIAL_ENTRY_PHOTO",
      projectId,
      joId,
      sessionId: "ts-ph1",
      findingId: "tf-ph1",
      section: "problems",
      entryId: "p-1",
      photo: { id: "ph-1", name: "problem1.jpg", previewUrl: "/p1.svg" },
    });
    let s = next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-ph1")!;
    let f = s.findings.find((f) => f.id === "tf-ph1")!;
    expect(f.problems[0].photos).toHaveLength(1);
    expect(f.problems[0].photos[0].id).toBe("ph-1");
    expect(f.problems[1].photos).toHaveLength(0);

    next = reducer(next, {
      type: "REMOVE_TRIAL_ENTRY_PHOTO",
      projectId,
      joId,
      sessionId: "ts-ph1",
      findingId: "tf-ph1",
      section: "problems",
      entryId: "p-1",
      photoId: "ph-1",
    });
    s = next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-ph1")!;
    f = s.findings.find((f) => f.id === "tf-ph1")!;
    expect(f.problems[0].photos).toHaveLength(0);
  });

  it("adds and removes photo on cause and corrective action entries", () => {
    const c1 = makeTrialTextEntry({ id: "c-1", photos: [] });
    const a1 = makeTrialCorrectiveActionEntry({ id: "a-1", photos: [] });
    const finding = makeTrialFinding({ id: "tf-ph2", causes: [c1], correctiveActions: [a1] });
    const session = makeTrialSession({ id: "ts-ph2", findings: [finding] });
    let next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });

    next = reducer(next, {
      type: "ADD_TRIAL_ENTRY_PHOTO",
      projectId,
      joId,
      sessionId: "ts-ph2",
      findingId: "tf-ph2",
      section: "causes",
      entryId: "c-1",
      photo: { id: "ph-c", name: "cause.jpg", previewUrl: "/c.svg" },
    });
    next = reducer(next, {
      type: "ADD_TRIAL_ENTRY_PHOTO",
      projectId,
      joId,
      sessionId: "ts-ph2",
      findingId: "tf-ph2",
      section: "correctiveActions",
      entryId: "a-1",
      photo: { id: "ph-a", name: "action.jpg", previewUrl: "/a.svg" },
    });
    let s = next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-ph2")!;
    let f = s.findings.find((f) => f.id === "tf-ph2")!;
    expect(f.causes[0].photos).toHaveLength(1);
    expect(f.correctiveActions[0].photos).toHaveLength(1);

    next = reducer(next, {
      type: "REMOVE_TRIAL_ENTRY_PHOTO",
      projectId,
      joId,
      sessionId: "ts-ph2",
      findingId: "tf-ph2",
      section: "correctiveActions",
      entryId: "a-1",
      photoId: "ph-a",
    });
    s = next.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-ph2")!;
    f = s.findings.find((f) => f.id === "tf-ph2")!;
    expect(f.causes[0].photos).toHaveLength(1);
    expect(f.correctiveActions[0].photos).toHaveLength(0);
  });
});

describe("Missing ID guard", () => {
  it("returns original state for missing IDs", () => {
    const actions = [
      { type: "UPDATE_TRIAL_SESSION" as const, projectId, joId, sessionId: "x", updates: {} },
      { type: "DELETE_TRIAL_SESSION" as const, projectId, joId, sessionId: "x" },
      { type: "ADD_TRIAL_FINDING" as const, projectId, joId, sessionId: "x", finding: makeTrialFinding() },
      { type: "DELETE_TRIAL_FINDING" as const, projectId, joId, sessionId: "x", findingId: "y" },
      { type: "REORDER_TRIAL_FINDING" as const, projectId, joId, sessionId: "x", findingId: "y", direction: "up" as const },
      { type: "ADD_TRIAL_ENTRY" as const, projectId, joId, sessionId: "x", findingId: "y", section: "problems" as const, entry: makeTrialTextEntry() },
      { type: "UPDATE_TRIAL_ENTRY" as const, projectId, joId, sessionId: "x", findingId: "y", section: "problems" as const, entryId: "z", updates: {} },
      { type: "DELETE_TRIAL_ENTRY" as const, projectId, joId, sessionId: "x", findingId: "y", section: "problems" as const, entryId: "z" },
      { type: "REORDER_TRIAL_ENTRY" as const, projectId, joId, sessionId: "x", findingId: "y", section: "problems" as const, entryId: "z", direction: "up" as const },
      { type: "ADD_TRIAL_ENTRY_PHOTO" as const, projectId, joId, sessionId: "x", findingId: "y", section: "problems" as const, entryId: "z", photo: { id: "p", name: "n", previewUrl: "u" } },
      { type: "REMOVE_TRIAL_ENTRY_PHOTO" as const, projectId, joId, sessionId: "x", findingId: "y", section: "problems" as const, entryId: "z", photoId: "p" },
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

describe("Trial sessions storage persistence and hydration", () => {
  it("persists trial sessions to localStorage and re-hydrates them", () => {
    const session = makeTrialSession({
      name: "Persisted Session",
      findings: [makeTrialFinding()],
    });

    const next = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });

    const loaded = loadTrialSessionsFromStorage();
    expect(loaded[joId]).toBeDefined();
    expect(loaded[joId].some((s) => s.name === "Persisted Session")).toBe(true);

    // Test hydration into fresh projects
    const freshProjects = structuredClone(initialState.projects);
    const hydrated = hydrateTrialSessions(freshProjects);
    const targetJo = hydrated.find((p) => p.id === projectId)?.jos.find((j) => j.id === joId);
    expect(targetJo?.trialSessions?.some((s) => s.name === "Persisted Session")).toBe(true);
  });

  it("persists entry photo and re-hydrates it across fresh state and SET_PROJECTS", () => {
    const session = makeTrialSession({
      id: "ts-photo-test",
      name: "Photo Session",
      findings: [
        makeTrialFinding({
          id: "tf-photo-test",
          problems: [
            {
              id: "prob-1",
              order: 1,
              text: "Flange wave issue",
              photos: [],
              createdAt: "2026-08-25T00:00:00Z",
              updatedAt: "2026-08-25T00:00:00Z",
            },
          ],
        }),
      ],
    });

    // 1. Create session
    let cur = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });

    // 2. Add photo to problem
    cur = reducer(cur, {
      type: "ADD_TRIAL_ENTRY_PHOTO",
      projectId,
      joId,
      sessionId: "ts-photo-test",
      findingId: "tf-photo-test",
      section: "problems",
      entryId: "prob-1",
      photo: {
        id: "photo-flange-1",
        name: "flange-defect.jpg",
        previewUrl: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD...",
      },
    });

    // Verify storage has the photo
    const loaded = loadTrialSessionsFromStorage();
    const storedSession = loaded[joId]?.find((s) => s.id === "ts-photo-test");
    expect(storedSession).toBeDefined();
    const storedProb = storedSession?.findings[0].problems[0];
    expect(storedProb?.photos).toHaveLength(1);
    expect(storedProb?.photos[0].id).toBe("photo-flange-1");

    // 3. Simulate page refresh: Fresh initial projects, then SET_PROJECTS from backend
    const freshProjects = structuredClone(initialState.projects);
    const hydrated = hydrateTrialSessions(freshProjects);
    const targetJo = hydrated.find((p) => p.id === projectId)?.jos.find((j) => j.id === joId);
    const hydratedProb = targetJo?.trialSessions?.find((s) => s.id === "ts-photo-test")?.findings[0].problems[0];
    expect(hydratedProb?.photos).toHaveLength(1);
    expect(hydratedProb?.photos[0].name).toBe("flange-defect.jpg");

    // 4. Test SET_PROJECTS preserving stored trial sessions
    const nextState = reducer({ projects: freshProjects }, {
      type: "SET_PROJECTS",
      projects: structuredClone(initialState.projects),
    });
    const setProjectJo = nextState.projects.find((p) => p.id === projectId)?.jos.find((j) => j.id === joId);
    const setProb = setProjectJo?.trialSessions?.find((s) => s.id === "ts-photo-test")?.findings[0].problems[0];
    expect(setProb?.photos).toHaveLength(1);
    expect(setProb?.photos[0].id).toBe("photo-flange-1");
  });

  it("deletes photo, adds new photo, and does not revert on subsequent SET_PROJECTS or HYDRATE_TRIAL_STORAGE", () => {
    // 1. Setup session with an initial photo (e.g. placeholder photo A)
    const p1 = makeTrialTextEntry({
      id: "prob-1",
      photos: [{ id: "photo-old", name: "old-placeholder.svg", previewUrl: "/report-placeholder-1.svg", addedAt: "2026-08-15T10:00:00.000Z" }],
    });
    const finding = makeTrialFinding({ id: "f-1", problems: [p1] });
    const session = makeTrialSession({ id: "ts-swap-test", findings: [finding] });

    let appState = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId,
      session,
    });

    // Verify initial photo is present
    let curSession = appState.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-swap-test")!;
    expect(curSession.findings[0].problems[0].photos).toHaveLength(1);
    expect(curSession.findings[0].problems[0].photos[0].id).toBe("photo-old");

    // 2. User deletes old photo
    appState = reducer(appState, {
      type: "REMOVE_TRIAL_ENTRY_PHOTO",
      projectId,
      joId,
      sessionId: "ts-swap-test",
      findingId: "f-1",
      section: "problems",
      entryId: "prob-1",
      photoId: "photo-old",
    });

    curSession = appState.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-swap-test")!;
    expect(curSession.findings[0].problems[0].photos).toHaveLength(0);

    // 3. User adds new photo
    appState = reducer(appState, {
      type: "ADD_TRIAL_ENTRY_PHOTO",
      projectId,
      joId,
      sessionId: "ts-swap-test",
      findingId: "f-1",
      section: "problems",
      entryId: "prob-1",
      photo: {
        id: "photo-new-user",
        name: "my-screenshot.png",
        previewUrl: "data:image/png;base64,iVBORw0KGgo...",
      },
    });

    curSession = appState.projects[0].jos[0].trialSessions!.find((s) => s.id === "ts-swap-test")!;
    expect(curSession.findings[0].problems[0].photos).toHaveLength(1);
    expect(curSession.findings[0].problems[0].photos[0].id).toBe("photo-new-user");

    // 4. Background API returns after 3 seconds with SET_PROJECTS
    appState = reducer(appState, {
      type: "SET_PROJECTS",
      projects: structuredClone(initialState.projects),
    });

    // The user's active session must NOT have reverted!
    curSession = appState.projects.find((p) => p.id === projectId)!.jos.find((j) => j.id === joId)!.trialSessions!.find((s) => s.id === "ts-swap-test")!;
    expect(curSession.findings[0].problems[0].photos).toHaveLength(1);
    expect(curSession.findings[0].problems[0].photos[0].id).toBe("photo-new-user");
    expect(curSession.findings[0].problems[0].photos.some((p) => p.id === "photo-old")).toBe(false);

    // 5. HYDRATE_TRIAL_STORAGE with older storage snapshot must NOT overwrite newer in-memory state
    const olderSnapshot: Record<string, typeof session[]> = {
      [joId]: [
        {
          ...session,
          updatedAt: "2020-01-01T00:00:00.000Z", // old timestamp
          findings: [
            {
              ...finding,
              problems: [
                {
                  ...p1,
                  photos: [{ id: "photo-old", name: "old-placeholder.svg", previewUrl: "/report-placeholder-1.svg", addedAt: "2020-01-01T00:00:00.000Z" }],
                },
              ],
            },
          ],
        },
      ],
    };

    appState = reducer(appState, {
      type: "HYDRATE_TRIAL_STORAGE",
      stored: olderSnapshot,
    });

    curSession = appState.projects.find((p) => p.id === projectId)!.jos.find((j) => j.id === joId)!.trialSessions!.find((s) => s.id === "ts-swap-test")!;
    expect(curSession.findings[0].problems[0].photos).toHaveLength(1);
    expect(curSession.findings[0].problems[0].photos[0].id).toBe("photo-new-user");
    expect(curSession.findings[0].problems[0].photos.some((p) => p.id === "photo-old")).toBe(false);
  });

  it("deduplicates trial sessions by normalized name and adopts backend database ULID", () => {
    const backendULID = "01a06a2b-3584-719b-b481-a89e79edb95a";
    const jo = state.projects[0].jos[0];

    // Backend sends a session with 1 finding and a database ULID
    const backendSession = makeTrialSession({
      id: backendULID,
      name: "Lower 140826",
      findings: [makeTrialFinding({ id: "bf-1" })],
    });

    // In-memory has mock session with 3 findings and client ID
    const localSession = makeTrialSession({
      id: "ts-mock-client-1",
      name: "Lower 140826",
      findings: [
        makeTrialFinding({ id: "lf-1" }),
        makeTrialFinding({ id: "lf-2" }),
        makeTrialFinding({ id: "lf-3" }),
      ],
    });

    let appState = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId: jo.id,
      session: localSession,
    });

    // SET_PROJECTS brings in backendSession
    const projectsWithBackend = structuredClone(appState.projects);
    const targetJo = projectsWithBackend[0].jos.find((j) => j.id === jo.id)!;
    targetJo.trialSessions = [backendSession];

    appState = reducer(appState, {
      type: "SET_PROJECTS",
      projects: projectsWithBackend,
    });

    const activeSessions = appState.projects[0].jos.find((j) => j.id === jo.id)!.trialSessions!;
    const lowerSessions = activeSessions.filter((s) => s.name.toLowerCase() === "lower 140826");

    // Exactly 1 deduplicated session
    expect(lowerSessions).toHaveLength(1);
    const merged = lowerSessions[0];
    // Must adopt database ULID
    expect(merged.id).toBe(backendULID);
    // Must keep 3 findings from local/storage
    expect(merged.findings).toHaveLength(3);
  });

  it("PUBLISH_TRIAL_SESSION_TO_VIEWER updates updatedAt and synchronizes publishedSnapshot containing uploaded photos", () => {
    const jo = state.projects[0].jos[0];
    const session = makeTrialSession({
      id: "ts-publish-photo-test",
      name: "Lower 140826",
      findings: [
        makeTrialFinding({
          id: "f-photo",
          problems: [
            makeTrialTextEntry({
              id: "prob-photo",
              text: "Hasil stamping bagian flange tidak rata",
              photos: [
                {
                  id: "ph-uploaded",
                  name: "my-trial-photo.png",
                  previewUrl: "data:image/png;base64,iVBORw0KGgo...",
                  addedAt: "2026-09-07T15:21:00.000Z",
                },
              ],
            }),
          ],
        }),
      ],
    });

    let appState = reducer(state, {
      type: "CREATE_TRIAL_SESSION",
      projectId,
      joId: jo.id,
      session,
    });

    // Staff clicks "Update ke Viewer"
    appState = reducer(appState, {
      type: "PUBLISH_TRIAL_SESSION_TO_VIEWER",
      projectId,
      joId: jo.id,
      sessionId: "ts-publish-photo-test",
    });

    const curSession = appState.projects[0].jos.find((j) => j.id === jo.id)!.trialSessions!.find((s) => s.id === "ts-publish-photo-test")!;
    expect(curSession.publishedSnapshot).toBeDefined();
    expect(curSession.lastPublishedAt).toBeDefined();
    expect(curSession.updatedAt).toBe(curSession.lastPublishedAt);

    // Published snapshot must have the uploaded photo
    const publishedProb = curSession.publishedSnapshot!.findings[0].problems[0];
    expect(publishedProb.photos).toHaveLength(1);
    expect(publishedProb.photos[0].id).toBe("ph-uploaded");
    expect(publishedProb.photos[0].name).toBe("my-trial-photo.png");
  });

  describe("DELETE_PROJECT and DELETE_JO", () => {
    it("deletes a project by id", () => {
      const p1 = state.projects[0];
      const initialCount = state.projects.length;

      const next = reducer(state, {
        type: "DELETE_PROJECT",
        projectId: p1.id,
      });

      expect(next.projects).toHaveLength(initialCount - 1);
      expect(next.projects.find((p) => p.id === p1.id)).toBeUndefined();
    });

    it("deletes a JO by id from a project", () => {
      const p = state.projects[0];
      const joToDelete = p.jos[0];
      const initialJoCount = p.jos.length;

      const next = reducer(state, {
        type: "DELETE_JO",
        projectId: p.id,
        joId: joToDelete.id,
      });

      const updatedProject = next.projects.find((proj) => proj.id === p.id)!;
      expect(updatedProject.jos).toHaveLength(initialJoCount - 1);
      expect(updatedProject.jos.find((j) => j.id === joToDelete.id)).toBeUndefined();
    });
  });
});
