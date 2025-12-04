import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import pLimit from "p-limit"; // npm install p-limit
import appConfig from "../config/app-config.js";

const {
  GOOGLE_SHEET_ID,
  GOOGLE_SERVICE_ACCOUNT1_BASE64,
  GOOGLE_SERVICE_ACCOUNT2_BASE64,
  GOOGLE_SERVICE_ACCOUNT3_BASE64,
  GOOGLE_SERVICE_ACCOUNT4_BASE64,
  GOOGLE_SERVICE_ACCOUNT5_BASE64,
} = appConfig;

/**
 * Decodes base64 credentials string into a JSON object.
 * @param {string} base64String
 * @returns {object} credentials
 */
function decodeCredentials(base64String) {
  if (!base64String) {
    throw new Error("Service account base64 string is missing.");
  }
  const jsonString = Buffer.from(base64String, "base64").toString("utf8");
  const credentials = JSON.parse(jsonString);

  if (!credentials.client_email || !credentials.private_key) {
    throw new Error("Invalid decoded credentials for service account.");
  }
  return credentials;
}

/**
 * Manages a pool of Google Auth instances and switches between them on quota errors.
 */
class AuthManager {
  constructor(accountBase64Strings) {
    // Decode all provided accounts into credentials
    this.accounts = accountBase64Strings.map(decodeCredentials);
    // Create an array of ready-to-use Auth clients
    this.authClients = this.accounts.map(
      (creds) =>
        new GoogleAuth({
          credentials: creds,
          scopes: ["https://www.googleapis.com/auth/spreadsheets"],
        })
    );
    // Index of the currently active client
    this.currentClientIndex = 0;
    console.log(
      `AuthManager initialized with ${this.authClients.length} accounts.`
    );
  }

  /**
   * Get the current active Google Auth client.
   */
  getCurrentAuth() {
    if (this.authClients.length === 0) {
      throw new Error("No service accounts available in AuthManager.");
    }
    return this.authClients[this.currentClientIndex];
  }

  /**
   * Switch to the next available client if the current one is rate-limited.
   */
  switchToNextClient() {
    if (this.authClients.length <= 1) {
      console.error("Only one account available. Cannot switch.");
      return false; // Cannot switch
    }
    const previousIndex = this.currentClientIndex;
    this.currentClientIndex =
      (this.currentClientIndex + 1) % this.authClients.length;
    console.warn(
      `Switched Google Auth client from index ${previousIndex} to ${this.currentClientIndex} due to quota error.`
    );
    return true; // Switched successfully
  }
}

// Initialize the AuthManager with all available accounts
const authManager = new AuthManager([
  GOOGLE_SERVICE_ACCOUNT1_BASE64,
  GOOGLE_SERVICE_ACCOUNT2_BASE64,
  GOOGLE_SERVICE_ACCOUNT3_BASE64,
  GOOGLE_SERVICE_ACCOUNT4_BASE64,
  GOOGLE_SERVICE_ACCOUNT5_BASE64,
]);

// Initialize the sheets client using the AuthManager's current auth instance
// We use a getter function to ensure the sheets client always uses the *current* auth instance.
const getSheetsClient = () => {
  return google.sheets({
    version: "v4",
    auth: authManager.getCurrentAuth(),
  });
};

/**
 * Helper function to wrap API calls with retry logic and account switching.
 * @param {Function} apiCallFn The function that makes the actual googleapis call.
 */
async function callApiWithFailover(apiCallFn) {
  const maxRetries = authManager.authClients.length;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Call the API function using the current sheets client
      return await apiCallFn(getSheetsClient());
    } catch (error) {
      // Check for Google API quota errors (429 or RESOURCE_EXHAUSTED)
      if (
        error.code === 429 ||
        (error.response && error.response.status === 429) ||
        (error.errors && error.errors[0].reason === "rateLimitExceeded")
      ) {
        console.warn(
          `Quota error encountered on attempt ${
            attempt + 1
          }. Attempting to switch accounts...`
        );

        // If we can switch accounts and haven't run out of accounts to try
        if (authManager.switchToNextClient()) {
          // Continue loop to retry with the new account
          continue;
        } else {
          // If we ran out of unique accounts to try, re-throw the final error
          throw new Error(
            "All service accounts have been rate-limited. Operation failed."
          );
        }
      } else {
        // If it's a different kind of error (auth failure, bad range, etc.), just throw it immediately
        throw error;
      }
    }
  }
}

// --- EXPORTED HELPER FUNCTIONS (NOW USING THE WRAPPER) ---

// helper: get values
export async function getValues(range) {
  return callApiWithFailover(async (sheetsClient) => {
    const resp = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range,
    });
    return resp.data.values || [];
  });
}

// helper: append rows (values: array of arrays)
export async function appendValues(range, values) {
  return callApiWithFailover(async (sheetsClient) => {
    const [sheetName, a1range] = range.split("!");

    // Determine starting column, default = A
    let startCol = "A";
    if (a1range) {
      startCol = a1range.split(":")[0].replace(/[0-9]/g, "") || "A";
    }

    /* ---------------------------------------------
       1. Find the next empty row in the anchor column
    --------------------------------------------- */
    const anchorRange = `${sheetName}!${startCol}:${startCol}`;

    const resp = await sheetsClient.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: anchorRange,
    });

    const existing = resp.data.values || [];
    const nextRowIndex = existing.length + 1;

    /* ---------------------------------------------
       2. Check sheet metadata (grid limits)
    --------------------------------------------- */
    const meta = await sheetsClient.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEET_ID,
    });

    const sheet = meta.data.sheets.find(
      (s) => s.properties.title === sheetName
    );
    if (!sheet) throw new Error(`Sheet '${sheetName}' not found`);

    const sheetId = sheet.properties.sheetId;
    const currentRowCount = sheet.properties.gridProperties.rowCount;

    /* ---------------------------------------------
       3. Compute required rows for write
          - values.length may be > 1 (bulk insert)
    --------------------------------------------- */
    const rowsNeeded = values.length;
    const requiredRows = nextRowIndex + rowsNeeded - 1;

    /* ---------------------------------------------
       4. Expand the sheet ONLY if required
    --------------------------------------------- */
    if (requiredRows > currentRowCount) {
      await sheetsClient.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_SHEET_ID,
        requestBody: {
          requests: [
            {
              updateSheetProperties: {
                properties: {
                  sheetId,
                  gridProperties: {
                    rowCount: requiredRows,
                  },
                },
                fields: "gridProperties.rowCount",
              },
            },
          ],
        },
      });

      console.log(
        `Expanded sheet '${sheetName}' → Rows: ${currentRowCount} → ${requiredRows}`
      );
    }

    /* ---------------------------------------------
       5. Write the values precisely at A{nextRow}
    --------------------------------------------- */
    const writeRange = `${sheetName}!${startCol}${nextRowIndex}`;

    return sheetsClient.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: writeRange,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  });
}

// export async function appendValues(range, values) {
//   return callApiWithFailover(async (sheetsClient) => {
//     return sheetsClient.spreadsheets.values.append({
//       spreadsheetId: GOOGLE_SHEET_ID,
//       range,
//       valueInputOption: "RAW",
//       requestBody: { values },
//     });
//   });
// }

// helper: clear + update (overwrite)
export async function updateValues(range, values) {
  return callApiWithFailover(async (sheetsClient) => {
    return sheetsClient.spreadsheets.values.update({
      spreadsheetId: GOOGLE_SHEET_ID,
      range,
      valueInputOption: "RAW",
      requestBody: { values },
    });
  });
}

// The getSheetId function doesn't make a standard value get/update call,
// but should still be wrapped for robustness.
async function getSheetId(sheetName) {
  return callApiWithFailover(async (sheetsClient) => {
    const metadata = await sheetsClient.spreadsheets.get({
      spreadsheetId: GOOGLE_SHEET_ID,
    });

    const sheet = metadata.data.sheets.find(
      (s) => s.properties.title === sheetName
    );

    if (!sheet) {
      throw new Error(`Sheet "${sheetName}" not found`);
    }

    return sheet.properties.sheetId;
  });
}

// The clearRowsSmartButParallel function now needs to pass the
// sheetsClient context into the parallel tasks.
export async function clearRowsSmartButParallel(
  sheetName,
  rowNumbers = [],
  { chunkSize = 50, parallelLimit = 5 } = {}
) {
  if (!Array.isArray(rowNumbers) || rowNumbers.length === 0) {
    throw new Error("rowNumbers must be a non-empty array");
  }

  // This top-level call is wrapped, but the internal parallel calls need careful handling.
  // We handle the failover strategy within the parallel execution loop itself.

  const sheetId = await getSheetId(sheetName);

  const sorted = [...rowNumbers].sort((a, b) => a - b);

  // ... (Ranges and Chunks logic remains the same)
  const ranges = [];
  let rangeStart = sorted[0];
  let prev = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === prev + 1) {
      prev = current;
    } else {
      ranges.push([rangeStart, prev]);
      rangeStart = current;
      prev = current;
    }
  }
  ranges.push([rangeStart, prev]);
  const chunks = [];
  for (let i = 0; i < ranges.length; i += chunkSize) {
    chunks.push(ranges.slice(i, i + chunkSize));
  }
  console.log(`Total ranges: ${ranges.length}, Chunks: ${chunks.length}`);

  const limit = pLimit(parallelLimit);

  // Use the failover wrapper for each parallel task
  const tasks = chunks.map((chunk) =>
    limit(() =>
      callApiWithFailover(async (sheetsClient) => {
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

        return sheetsClient.spreadsheets.batchUpdate({
          spreadsheetId: GOOGLE_SHEET_ID,
          resource: { requests },
        });
      })
    )
  );

  return Promise.all(tasks);
}

// import { google } from "googleapis";
// import { GoogleAuth } from "google-auth-library";
// import appConfig from "../config/app-config.js";
// import pLimit from "p-limit"; // npm install p-limit

// const {
//   GOOGLE_SHEET_ID,
//   GOOGLE_SERVICE_ACCOUNT1_BASE64,
//   GOOGLE_SERVICE_ACCOUNT2_BASE64,
// } = appConfig;

// const jsonString = Buffer.from(
//   GOOGLE_SERVICE_ACCOUNT_BASE64,
//   "base64"
// ).toString("utf8");

// const credentials = JSON.parse(jsonString);

// // Validate that keys are loaded
// if (!credentials.client_email || !credentials.private_key) {
//   throw new Error("Invalid decoded credentials");
// }
// // Use GoogleAuth with credentials - this is the recommended approach
// const auth = new GoogleAuth({
//   credentials,
//   scopes: ["https://www.googleapis.com/auth/spreadsheets"],
// });

// // Create the sheets client - it will use the auth instance automatically
// export const sheets = google.sheets({ version: "v4", auth });

// // helper: get values
// export async function getValues(range) {
//   const resp = await sheets.spreadsheets.values.get({
//     spreadsheetId: GOOGLE_SHEET_ID,
//     range,
//   });
//   return resp.data.values || [];
// }

// // helper: append rows (values: array of arrays)
// export async function appendValues(range, values) {
//   return sheets.spreadsheets.values.append({
//     spreadsheetId: GOOGLE_SHEET_ID,
//     range,
//     valueInputOption: "RAW",
//     requestBody: { values },
//   });
// }

// // helper: clear + update (overwrite)
// export async function updateValues(range, values) {
//   return sheets.spreadsheets.values.update({
//     spreadsheetId: GOOGLE_SHEET_ID,
//     range,
//     valueInputOption: "RAW",
//     requestBody: { values },
//   });
// }

// async function getSheetId(sheetName) {
//   const metadata = await sheets.spreadsheets.get({
//     spreadsheetId: GOOGLE_SHEET_ID,
//   });

//   const sheet = metadata.data.sheets.find(
//     (s) => s.properties.title === sheetName
//   );

//   if (!sheet) {
//     throw new Error(`Sheet "${sheetName}" not found`);
//   }

//   return sheet.properties.sheetId;
// }

// export async function clearRowsSmartButParallel(
//   sheetName,
//   rowNumbers = [],
//   { chunkSize = 50, parallelLimit = 5 } = {}
// ) {
//   if (!Array.isArray(rowNumbers) || rowNumbers.length === 0) {
//     throw new Error("rowNumbers must be a non-empty array");
//   }

//   const sheetId = await getSheetId(sheetName);

//   // 1. Sort rows
//   const sorted = [...rowNumbers].sort((a, b) => a - b);

//   // 2. Build contiguous ranges
//   const ranges = [];
//   let rangeStart = sorted[0];
//   let prev = sorted[0];

//   for (let i = 1; i < sorted.length; i++) {
//     const current = sorted[i];

//     if (current === prev + 1) {
//       prev = current; // still contiguous
//     } else {
//       ranges.push([rangeStart, prev]);
//       rangeStart = current;
//       prev = current;
//     }
//   }
//   ranges.push([rangeStart, prev]);

//   // 3. Split ranges into chunks
//   const chunks = [];
//   for (let i = 0; i < ranges.length; i += chunkSize) {
//     chunks.push(ranges.slice(i, i + chunkSize));
//   }

//   console.log(`Total ranges: ${ranges.length}`);
//   console.log(`Chunks: ${chunks.length}`);

//   // 4. Parallel limiter
//   const limit = pLimit(parallelLimit);

//   const tasks = chunks.map((chunk) =>
//     limit(async () => {
//       const requests = chunk.map(([start, end]) => ({
//         updateCells: {
//           range: {
//             sheetId,
//             startRowIndex: start - 1, // 0-based
//             endRowIndex: end, // non-inclusive
//           },
//           fields: "*",
//         },
//       }));

//       return sheets.spreadsheets.batchUpdate({
//         spreadsheetId: GOOGLE_SHEET_ID,
//         resource: { requests },
//       });
//     })
//   );

//   // 5. Run all parallel tasks
//   return Promise.all(tasks);
// }
