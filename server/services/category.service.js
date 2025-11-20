import { getValues, appendValues, updateValues } from "../lib/google-sheets.js";
import { nextIdFromRows, formatId } from "../utils/id-generator.js";

const RANGE = "Categories!A:E";

function now() {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

export async function listCategories() {
  const rows = await getValues(RANGE);
  return rows.slice(1).map((r) => ({
    categoryId: r[0],
    name: r[1],
    createdAt: r[2],
    updatedAt: r[3],
    active: r[4] === "true",
  }));
}

export async function createCategory(name) {
  const rows = await getValues("Categories!A:A");
  const next = nextIdFromRows(rows, "CAT");
  const id = formatId("CAT", next);

  const timestamp = now();
  await appendValues(RANGE, [[id, name, timestamp, timestamp, "true"]]);

  return { categoryId: id, name };
}

export async function updateCategory(id, name, active) {
  const rows = await getValues(RANGE);
  const header = rows[0];
  const data = rows.slice(1);

  const index = data.findIndex((r) => r[0] === id);
  if (index === -1) throw new Error("Category not found");

  const row = data[index];
  const updatedRow = [
    id,
    name ?? row[1],
    row[2],
    now(),
    active !== undefined ? String(active) : row[4],
  ];

  const newValues = [
    header,
    ...data.map((r, i) => (i === index ? updatedRow : r)),
  ];
  await updateValues(RANGE, newValues);

  return true;
}

export async function deleteCategory(id) {
  const rows = await getValues(RANGE);
  const header = rows[0];
  const data = rows.slice(1).filter((r) => r[0] !== id);

  await updateValues(RANGE, [header, ...data]);
  return true;
}
