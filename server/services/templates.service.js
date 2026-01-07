import { getValues, updateValues } from "../lib/google-sheets.js";

const SHEET_NAME = "Templates";
const RANGE = `${SHEET_NAME}!A1:B2`; // Row 1: Email, Row 2: WhatsApp

export const TemplateType = {
  EMAIL: "EMAIL",
  WHATSAPP: "WHATSAPP",
};

/**
 * Fetches templates from the sheet.
 * Expected format:
 * Row 1: [KEY, VALUE] -> ["EMAIL_TEMPLATE", "...html..."]
 * Row 2: [KEY, VALUE] -> ["WHATSAPP_TEMPLATE", "...markdown..."]
 */
export async function getTemplates() {
  try {
    const rows = await getValues(RANGE);
    const templates = {
      email: "",
      whatsapp: "",
    };

    rows.forEach(([key, value]) => {
      if (key === "EMAIL_TEMPLATE") templates.email = value;
      if (key === "WHATSAPP_TEMPLATE") templates.whatsapp = value;
    });

    return templates;
  } catch (error) {
    console.error("Error fetching templates:", error);
    // Return empty defaults if sheet/range missing, frontend will use its own defaults
    return { email: "", whatsapp: "" };
  }
}

/**
 * Saves a template to the sheet.
 * @param {string} type - 'EMAIL' or 'WHATSAPP'
 * @param {string} content - The template content
 */
export async function saveTemplate(type, content) {
  // We need to write to specific rows to ensure consistency
  // Row 1 is Email, Row 2 is WhatsApp.

  let range;
  let key;

  if (type === TemplateType.EMAIL) {
    range = `${SHEET_NAME}!A1:B1`;
    key = "EMAIL_TEMPLATE";
  } else if (type === TemplateType.WHATSAPP) {
    range = `${SHEET_NAME}!A2:B2`;
    key = "WHATSAPP_TEMPLATE";
  } else {
    throw new Error("Invalid template type");
  }

  // Write [Key, Value]
  await updateValues(range, [[key, content]]);
  return true;
}
