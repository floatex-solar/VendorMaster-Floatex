// server/services/pinned.service.js
import { getValues, appendValues, updateValues } from "../lib/google-sheets.js";
import { nextIdFromRows, formatId } from "../utils/id-generator.js";

const SHEET_NAME = "PinnedItems";
const RANGE = `${SHEET_NAME}!A:E`;

/**
 * getAllPins - returns all pins (non-empty rows)
 */
export async function getAllPins() {
  const rows = await getValues(RANGE);
  // slice(1) to skip header
  return (rows.slice(1) || [])
    .map((r) => ({
      pinId: r[0],
      itemId: r[1],
      itemDescription: r[2],
      searchTerm: r[3],
      createdAt: r[4],
    }))
    .filter((r) => r.pinId && r.itemId);
}

/**
 * createPin - store a pin row
 * payload: { itemId, itemDescription, searchTerm }
 */
export async function createPin({ itemId, itemDescription, searchTerm }) {
  // generate next id using utils
  const idRows = await getValues(`${SHEET_NAME}!A:A`);
  const next = nextIdFromRows(idRows, "PIN");
  const pinId = formatId("PIN", next);

  const createdAt = new Date().toISOString();
  const row = [
    [pinId, itemId, itemDescription || "", searchTerm || "", createdAt],
  ];

  await appendValues(RANGE, row);

  return { pinId, itemId, itemDescription, searchTerm, createdAt };
}

/**
 * deletePin - clear the row for a given pinId (do not shift)
 */
export async function deletePin(pinId) {
  const rows = await getValues(RANGE);
  const idx = rows.findIndex((r) => r[0] === pinId);
  if (idx === -1) throw new Error("Pin not found");

  const sheetRow = idx + 1; // rows array is 0-based; header is row 1
  await updateValues(`${SHEET_NAME}!A${sheetRow}:E${sheetRow}`, [
    ["", "", "", "", ""],
  ]);
  return { success: true };
}
