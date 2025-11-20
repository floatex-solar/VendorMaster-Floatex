// server/utils/idGenerator.js
export function formatId(prefix, number, pad = 4) {
  return `${prefix}-${String(number).padStart(pad, "0")}`;
}

// get next id by scanning the sheet column where IDs are stored
export function nextIdFromRows(rows, prefix) {
  // rows is array of rows, where first column is ID
  // find max numeric suffix for prefix
  let max = 0;
  rows.forEach((r) => {
    const id = (r[0] || "").toString();
    if (id.startsWith(prefix + "-")) {
      const num = parseInt(id.split("-")[1], 10);
      if (!isNaN(num) && num > max) max = num;
    }
  });
  return max + 1;
}
