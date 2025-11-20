import { getValues, appendValues, updateValues } from "../lib/google-sheets.js";
import { nextIdFromRows, formatId } from "../utils/id-generator.js";

const RANGE = "SubCategories!A:F";

function now() {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

export async function listSubCategories() {
  const rows = await getValues(RANGE);
  return rows.slice(1).map((r) => ({
    subCategoryId: r[0],
    categoryId: r[1],
    name: r[2],
    createdAt: r[3],
    updatedAt: r[4],
    active: r[5] === "true",
  }));
}

export async function createSubCategory(categoryId, name) {
  const rows = await getValues("SubCategories!A:A");
  const next = nextIdFromRows(rows, "SUB");
  const id = formatId("SUB", next);

  const timestamp = now();
  await appendValues(RANGE, [
    [id, categoryId, name, timestamp, timestamp, "true"],
  ]);

  return { subCategoryId: id, categoryId, name };
}

export async function updateSubCategory(id, name, categoryId, active) {
  const rows = await getValues(RANGE);
  const header = rows[0];
  const data = rows.slice(1);

  const index = data.findIndex((r) => r[0] === id);
  if (index === -1) throw new Error("Sub Category not found");

  const row = data[index];
  const updatedRow = [
    id,
    categoryId ?? row[1],
    name ?? row[2],
    row[3],
    now(),
    active !== undefined ? String(active) : row[5],
  ];

  const newValues = [
    header,
    ...data.map((r, i) => (i === index ? updatedRow : r)),
  ];
  await updateValues(RANGE, newValues);

  return true;
}

export async function deleteSubCategory(id) {
  const rows = await getValues(RANGE);
  const header = rows[0];
  const data = rows.slice(1).filter((r) => r[0] !== id);

  await updateValues(RANGE, [header, ...data]);
  return true;
}
