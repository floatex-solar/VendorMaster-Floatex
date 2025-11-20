// services/uom.service.js
import { getValues, appendValues, updateValues } from "../lib/google-sheets.js";
import { nextIdFromRows, formatId } from "../utils/id-generator.js";

const SHEET_NAME = "UOMs";
const RANGE = `${SHEET_NAME}!A:D`;

/**
 * Generate next UOM ID using shared ID generator
 */
async function generateUomId() {
  const rows = await getValues(`${SHEET_NAME}!A:A`);
  const nextNumber = nextIdFromRows(rows, "UOM");
  return formatId("UOM", nextNumber);
}

/**
 * GET: All UOMs
 */
export async function getAllUoms() {
  const rows = await getValues(RANGE);

  return rows.slice(1).map((r) => ({
    uomId: r[0],
    name: r[1],
    description: r[2] || "",
    active: r[3] === "true",
  }));
}

/**
 * CREATE: New UOM
 */
export async function createUom({ name, description }) {
  const uomId = await generateUomId();

  const row = [[uomId, name, description || "", "true"]];

  await appendValues(RANGE, row);

  return { uomId, name, description, active: true };
}

/**
 * UPDATE: UOM by ID
 */
export async function updateUom(uomId, { name, description, active }) {
  const rows = await getValues(RANGE);
  const idx = rows.findIndex((r) => r[0] === uomId);

  if (idx === -1) throw new Error("UOM not found");

  const updated = [uomId, name, description || "", String(active ?? true)];

  await updateValues(`${SHEET_NAME}!A${idx + 1}:D${idx + 1}`, [updated]);

  return { success: true };
}

/**
 * DELETE: Clear row without shifting rows
 */
export async function deleteUom(uomId) {
  const rows = await getValues(RANGE);
  const rowIndex = rows.findIndex((r) => r[0] === uomId);

  if (rowIndex === -1) throw new Error("UOM not found");

  const sheetRow = rowIndex + 1; // convert to 1-based

  // Clear the row values but keep structure intact
  await updateValues(`${SHEET_NAME}!A${sheetRow}:D${sheetRow}`, [
    ["", "", "", ""],
  ]);

  return { success: true };
}
