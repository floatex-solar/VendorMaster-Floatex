import {
  getValues,
  appendValues,
  updateValues,
  clearRowsSmartButParallel,
} from "../lib/google-sheets.js";
import { formatId, nextIdFromRows } from "../utils/id-generator.js";

const VENDOR_RANGE = "Vendors!A:L";
const CONTACT_RANGE = "VendorContacts!A:H";
const MAPPING_RANGE = "VendorItemsMapping!A:H";

function now() {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

/* ===========================================
   VENDOR CRUD
=========================================== */

export async function listVendors() {
  const rows = await getValues(VENDOR_RANGE);
  return rows.slice(1).map((r) => ({
    vendorId: r[0],
    name: r[1],
    address: r[2],
    state: r[3],
    city: r[4],
    pinCode: r[5],
    gst: r[6],
    phone: r[7],
    email: r[8],
    createdAt: r[9],
    updatedAt: r[10],
    active: r[11] === "true",
  }));
}

export async function getVendor(vendorId) {
  const rows = await getValues(VENDOR_RANGE);
  const row = rows.slice(1).find((r) => r[0] === vendorId);
  if (!row) return null;
  return {
    vendorId: row[0],
    name: row[1],
    address: row[2],
    state: row[3],
    city: row[4],
    pinCode: row[5],
    gst: row[6],
    phone: row[7],
    email: row[8],
    active: row[11] === "true",
  };
}

export async function createVendor(vendorData) {
  const rows = await getValues("Vendors!A:A");
  const next = nextIdFromRows(rows, "VND");
  const vendorId = formatId("VND", next);
  const timestamp = now();

  await appendValues(VENDOR_RANGE, [
    [
      vendorId,
      vendorData.name,
      vendorData.address || "-",
      vendorData.state || "-",
      vendorData.city || "-",
      vendorData.pinCode || "-",
      vendorData.gst || "-",
      vendorData.phone || "-",
      vendorData.email || "-",
      timestamp,
      timestamp,
      "true",
    ],
  ]);

  return vendorId;
}

export async function updateVendor(vendorId, updates) {
  const rows = await getValues(VENDOR_RANGE);
  const header = rows[0];
  const data = rows.slice(1);

  const idx = data.findIndex((r) => r[0] === vendorId);
  if (idx === -1) throw new Error("Vendor not found");

  const row = data[idx];
  const updated = [
    vendorId,
    updates.name ?? row[1],
    updates.address ?? row[2],
    updates.state ?? row[3],
    updates.city ?? row[4],
    updates.pinCode ?? row[5],
    updates.gst ?? row[6],
    updates.phone ?? row[7],
    updates.email ?? row[8],
    row[9],
    now(),
    updates.active !== undefined ? String(updates.active) : row[11],
  ];

  const newValues = [header, ...data.map((r, i) => (i === idx ? updated : r))];
  await updateValues(VENDOR_RANGE, newValues);
}

export async function deleteVendor(vendorId) {
  const rows = await getValues(VENDOR_RANGE);
  const data = rows.slice(1);

  const idStr = String(vendorId).trim();

  const matchedRows = [];

  data.forEach((r, idx) => {
    const cell = r[0] ? String(r[0]).trim() : "";
    if (cell === idStr) {
      matchedRows.push(idx + 2); // sheet row index
    }
  });

  if (matchedRows.length === 0) {
    throw new Error("Vendor not found");
  }

  await clearRowsSmartButParallel("Vendors", matchedRows, {
    chunkSize: 50,
    parallelLimit: 5,
  });

  return true;
}

/* ===========================================
   CONTACT PERSONS (Add / Update / Delete)
=========================================== */

export async function listContacts(vendorId) {
  const rows = await getValues(CONTACT_RANGE);
  return rows
    .slice(1)
    .filter((r) => r[1] === vendorId && r[7] !== "false")
    .map((r) => ({
      contactId: r[0],
      vendorId: r[1],
      name: r[2],
      designation: r[3],
      phone: r[4],
      email: r[5],
      info: r[6],
      active: r[7] === "true",
    }));
}

export async function addContact(vendorId, contact) {
  const rows = await getValues("VendorContacts!A:A");
  const next = nextIdFromRows(rows, "C");
  const contactId = formatId("C", next);

  await appendValues(CONTACT_RANGE, [
    [
      contactId,
      vendorId,
      contact.name,
      contact.designation ?? "-",
      contact.phone ?? "-",
      contact.email ?? "-",
      contact.info ?? "-",
      "true",
    ],
  ]);

  return contactId;
}

export async function addContacts(vendorId, contacts) {
  if (!contacts || contacts.length === 0) return [];

  const rows = await getValues("VendorContacts!A:A");
  let next = nextIdFromRows(rows, "C");

  const rowsToAdd = contacts.map((contact) => {
    const contactId = formatId("C", next++);
    return [
      contactId,
      vendorId,
      contact.name,
      contact.designation || "-",
      contact.phone || "-",
      contact.email || "-",
      contact.info ?? "",
      "true",
    ];
  });

  await appendValues(CONTACT_RANGE, rowsToAdd);

  // Return the generated IDs (assuming we want them back)
  return rowsToAdd.map((row) => row[0]);
}

export async function updateContact(contactId, updates) {
  const rows = await getValues(CONTACT_RANGE);
  const header = rows[0];
  const data = rows.slice(1);

  const idx = data.findIndex((r) => r[0] === contactId);
  if (idx === -1) throw new Error("Contact not found");

  const row = data[idx];
  const updated = [
    contactId,
    row[1],
    updates.name ?? row[2],
    updates.designation ?? row[3],
    updates.phone ?? row[4],
    updates.email ?? row[5],
    updates.info ?? row[6],
    updates.active !== undefined ? String(updates.active) : row[7],
  ];

  const newValues = [header, ...data.map((r, i) => (i === idx ? updated : r))];
  await updateValues(CONTACT_RANGE, newValues);
}

export async function deleteContact(contactId) {
  const rows = await getValues(CONTACT_RANGE);
  const data = rows.slice(1);

  const idStr = String(contactId).trim();

  const matchedRows = [];

  data.forEach((r, idx) => {
    const cell = r[0] ? String(r[0]).trim() : "";
    if (cell === idStr) {
      matchedRows.push(idx + 2);
    }
  });

  if (matchedRows.length === 0) {
    throw new Error("Contact not found");
  }

  await clearRowsSmartButParallel("VendorContacts", matchedRows, {
    chunkSize: 50,
    parallelLimit: 5,
  });

  return true;
}

/* ===========================================
   ITEM MAPPINGS (Add / Update / Delete)
=========================================== */

export async function listMappings(vendorId) {
  const rows = await getValues(MAPPING_RANGE);
  return rows
    .slice(1)
    .filter((r) => r[1] === vendorId && r[7] !== "false")
    .map((r) => ({
      mappingId: r[0],
      vendorId: r[1],
      itemId: r[2],
      price: r[3],
      uom: r[4],
      leadTimeDays: r[5],
      notes: r[6],
      active: r[7] === "true",
    }));
}

export async function addMapping(vendorId, map) {
  const rows = await getValues("VendorItemsMapping!A:A");
  const next = nextIdFromRows(rows, "M");
  const id = formatId("M", next);

  await appendValues(MAPPING_RANGE, [
    [
      id,
      vendorId,
      map.itemId,
      map.price ?? "",
      map.uom ?? "",
      map.leadTimeDays ?? "",
      map.notes ?? "",
      "true",
    ],
  ]);

  return id;
}

export async function addMappings(vendorId, mappings) {
  if (!mappings || mappings.length === 0) return [];

  const rows = await getValues("VendorItemsMapping!A:A");
  let next = nextIdFromRows(rows, "M");

  const rowsToAdd = mappings.map((map) => {
    const id = formatId("M", next++);
    return [
      id,
      vendorId,
      map.itemId,
      map.price ?? "",
      map.uom ?? "",
      map.leadTimeDays ?? "",
      map.notes ?? "",
      "true",
    ];
  });

  await appendValues(MAPPING_RANGE, rowsToAdd);

  // Return the generated IDs (assuming we want them back)
  return rowsToAdd.map((row) => row[0]);
}

export async function updateMapping(mappingId, updates) {
  const rows = await getValues(MAPPING_RANGE);
  const header = rows[0];
  const data = rows.slice(1);

  const idx = data.findIndex((r) => r[0] === mappingId);
  if (idx === -1) throw new Error("Mapping not found");

  const row = data[idx];
  const updated = [
    mappingId,
    row[1],
    updates.itemId ?? row[2],
    updates.price ?? row[3],
    updates.uom ?? row[4],
    updates.leadTimeDays ?? row[5],
    updates.notes ?? row[6],
    updates.active !== undefined ? String(updates.active) : row[7],
  ];

  const newValues = [header, ...data.map((r, i) => (i === idx ? updated : r))];
  await updateValues(MAPPING_RANGE, newValues);
}

export async function deleteMapping(mappingId) {
  const rows = await getValues(MAPPING_RANGE);
  const data = rows.slice(1);

  const idStr = String(mappingId).trim();

  const matchedRows = [];

  data.forEach((r, idx) => {
    const cell = r[0] ? String(r[0]).trim() : "";
    if (cell === idStr) {
      matchedRows.push(idx + 2);
    }
  });

  if (matchedRows.length === 0) {
    throw new Error("Mapping not found");
  }

  await clearRowsSmartButParallel("VendorItemsMapping", matchedRows, {
    chunkSize: 50,
    parallelLimit: 5,
  });

  return true;
}
