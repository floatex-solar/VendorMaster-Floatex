// Backend: src/services/items.service.js (updated)
import {
  getValues,
  appendValues,
  updateValues,
  clearRowsSmartButParallel,
} from "../lib/google-sheets.js";
import { formatId, nextIdFromRows } from "../utils/id-generator.js";

const RANGE = "Items!A:H";

function now() {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

export async function listItems() {
  const rows = await getValues(RANGE);
  if (!rows || rows.length === 0) return [];
  const header = rows[0];
  return rows
    .slice(1)
    .filter(
      (item) =>
        Array.isArray(item) &&
        item[0] &&
        typeof item[0] === "string" &&
        item[0].trim() !== ""
    )
    .map((r) => ({
      itemId: r[0] ?? "",
      categoryId: r[1] ?? "",
      subCategoryId: r[2] ?? "",
      description: r[3] ?? "",
      uomId: r[4] ?? "",
      createdAt: r[5] ?? "",
      updatedAt: r[6] ?? "",
      active: (r[7] ?? "").toString().toLowerCase() === "true",
    }));
}

export async function createItem(item) {
  const rows = await getValues("Items!A:A");
  const next = nextIdFromRows(rows, "ITM");
  const id = formatId("ITM", next);
  const t = now();

  const newRow = [
    id,
    item.categoryId,
    item.subCategoryId,
    item.description,
    item.uomId,
    t,
    t,
    "true",
  ];

  await appendValues(RANGE, [newRow]);
  return { itemId: id };
}

export async function bulkCreate(items) {
  const rows = await getValues("Items!A:A");
  let next = nextIdFromRows(rows, "ITM");
  const t = now();

  const arr = items.map((i) => {
    const id = formatId("ITM", next++);
    return [
      id,
      i.categoryId,
      i.subCategoryId,
      i.description,
      i.uomId,
      t,
      t,
      "true",
    ];
  });

  await appendValues(RANGE, arr);
  return true;
}

export async function updateItem(id, updates) {
  const rows = await getValues(RANGE);
  const header = rows[0];
  const data = rows.slice(1);

  const index = data.findIndex((r) => r[0] === id);
  if (index === -1) throw new Error("Item not found");

  const row = data[index];

  const updated = [
    id,
    updates.categoryId ?? row[1],
    updates.subCategoryId ?? row[2],
    updates.description ?? row[3],
    updates.uomId ?? row[4],
    row[5],
    now(),
    updates.active !== undefined ? String(updates.active) : row[7],
  ];

  const newValues = [
    header,
    ...data.map((r, i) => (i === index ? updated : r)),
  ];
  await updateValues(RANGE, newValues);

  return true;
}

/**
 * Clear (do not delete) the row for a single itemId.
 * This keeps other row indices stable (no shifting).
 */
export async function deleteItem(id) {
  const idStr = String(id).trim();
  const rows = await getValues(RANGE);
  const header = rows[0];
  const data = rows.slice(1);

  // find matching indices (there should typically be one)
  const matchedRowNumbers = [];
  data.forEach((row, idx) => {
    const cellId = row[0] ? String(row[0]).trim() : "";
    if (cellId === idStr) {
      // sheet row number = data index + 2 (1-based + header)
      matchedRowNumbers.push(idx + 2);
    }
  });

  if (matchedRowNumbers.length === 0) {
    throw new Error("Item not found");
  }

  // Use smart parallel clear to clear the matched rows in-place (no shifting)
  // Provide reasonable defaults for chunkSize/parallelLimit if desired
  await clearRowsSmartButParallel("Items", matchedRowNumbers, {
    chunkSize: 50,
    parallelLimit: 5,
  });

  return true;
}

/**
 * Clear (do not delete) rows for multiple item IDs.
 * Accepts an array of ids (strings or numbers).
 */
export async function bulkDelete(ids) {
  if (!Array.isArray(ids) || ids.length === 0) {
    throw new Error("No IDs provided");
  }

  const idSet = new Set(ids.map((x) => String(x).trim()));
  const rows = await getValues(RANGE);
  const header = rows[0];
  const data = rows.slice(1);

  // collect all matching sheet row numbers
  const matchedRowNumbers = [];
  data.forEach((row, idx) => {
    const cellId = row[0] ? String(row[0]).trim() : "";
    if (idSet.has(cellId)) {
      matchedRowNumbers.push(idx + 2);
    }
  });

  if (matchedRowNumbers.length === 0) {
    throw new Error("No matching items found for provided IDs");
  }

  // Clear rows smartly (group contiguous rows into single requests, and run in parallel)
  await clearRowsSmartButParallel("Items", matchedRowNumbers, {
    chunkSize: 50,
    parallelLimit: 5,
  });

  return true;
}
