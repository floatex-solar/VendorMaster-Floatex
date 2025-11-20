import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import appConfig from "../config/app-config.js";
import pLimit from "p-limit"; // npm install p-limit

const { GOOGLE_SHEET_ID, GOOGLE_SERVICE_ACCOUNT_BASE64 } = appConfig;

const jsonString = Buffer.from(
  GOOGLE_SERVICE_ACCOUNT_BASE64,
  "base64"
).toString("utf8");

const credentials = JSON.parse(jsonString);

// Validate that keys are loaded
if (!credentials.client_email || !credentials.private_key) {
  throw new Error("Invalid decoded credentials");
}
// Use GoogleAuth with credentials - this is the recommended approach
const auth = new GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

// Create the sheets client - it will use the auth instance automatically
export const sheets = google.sheets({ version: "v4", auth });

// helper: get values
export async function getValues(range) {
  const resp = await sheets.spreadsheets.values.get({
    spreadsheetId: GOOGLE_SHEET_ID,
    range,
  });
  return resp.data.values || [];
}

// helper: append rows (values: array of arrays)
export async function appendValues(range, values) {
  return sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

// helper: clear + update (overwrite)
export async function updateValues(range, values) {
  return sheets.spreadsheets.values.update({
    spreadsheetId: GOOGLE_SHEET_ID,
    range,
    valueInputOption: "RAW",
    requestBody: { values },
  });
}

async function getSheetId(sheetName) {
  const metadata = await sheets.spreadsheets.get({
    spreadsheetId: GOOGLE_SHEET_ID,
  });

  const sheet = metadata.data.sheets.find(
    (s) => s.properties.title === sheetName
  );

  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found`);
  }

  return sheet.properties.sheetId;
}

export async function clearRowsSmartButParallel(
  sheetName,
  rowNumbers = [],
  { chunkSize = 50, parallelLimit = 5 } = {}
) {
  if (!Array.isArray(rowNumbers) || rowNumbers.length === 0) {
    throw new Error("rowNumbers must be a non-empty array");
  }

  const sheetId = await getSheetId(sheetName);

  // 1. Sort rows
  const sorted = [...rowNumbers].sort((a, b) => a - b);

  // 2. Build contiguous ranges
  const ranges = [];
  let rangeStart = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];

    if (current === prev + 1) {
      prev = current; // still contiguous
    } else {
      ranges.push([rangeStart, prev]);
      rangeStart = current;
      prev = current;
    }
  }
  ranges.push([rangeStart, prev]);

  // 3. Split ranges into chunks
  const chunks = [];
  for (let i = 0; i < ranges.length; i += chunkSize) {
    chunks.push(ranges.slice(i, i + chunkSize));
  }

  console.log(`Total ranges: ${ranges.length}`);
  console.log(`Chunks: ${chunks.length}`);

  // 4. Parallel limiter
  const limit = pLimit(parallelLimit);

  const tasks = chunks.map((chunk) =>
    limit(async () => {
      const requests = chunk.map(([start, end]) => ({
        updateCells: {
          range: {
            sheetId,
            startRowIndex: start - 1, // 0-based
            endRowIndex: end, // non-inclusive
          },
          fields: "*",
        },
      }));

      return sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_SHEET_ID,
        resource: { requests },
      });
    })
  );

  // 5. Run all parallel tasks
  return Promise.all(tasks);
}
