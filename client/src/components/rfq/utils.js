export function normalizeValue(val) {
  if (!val) return "";
  if (typeof val !== "string") return val;

  const v = val.trim();
  if (v === "-" || v === "—") return "";
  return v;
}

export function isVendorValid(v, sendEmail, sendWhatsApp) {
  if (sendEmail && (!v.email || !isValidEmail(v.email))) return false;
  if (sendWhatsApp && (!v.phone || !isValidPhone(v.phone))) return false;
  return true;
}

export function getVendorError(v, sendEmail, sendWhatsApp) {
  if (sendEmail && sendWhatsApp && !v.email && !v.phone)
    return "Email and Phone are required";
  if (sendEmail && !v.email) return "Email is required";
  if (sendWhatsApp && !v.phone) return "Phone is required";
  return "";
}

/* ---------- Email Validation ---------- */
export function isValidEmail(email) {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------- Phone Validation ---------- */
export function isValidPhone(phone) {
  if (!phone) return false;

  // remove spaces, dashes, parentheses
  const cleaned = phone.replace(/[^\d+]/g, "");

  // allow + at start, then 10–15 digits
  return /^\+?\d{10,15}$/.test(cleaned);
}
