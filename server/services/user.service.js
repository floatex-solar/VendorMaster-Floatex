import bcrypt from "bcrypt";
import { getValues, appendValues, updateValues } from "../lib/google-sheets.js";
import { nextIdFromRows, formatId } from "../utils/id-generator.js";

const RANGE = "Users!A:L";
// A:UserID, B:Name, C:UserName, D:Email, E:Mobile, F:Role, G:Active, H:PasswordHash, I:ResetToken, J:ResetTokenExpiry, K:CreatedAt, L:UpdatedAt

function now() {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

export async function listUsers() {
  const rows = await getValues(RANGE);
  const header = rows[0];
  const users = rows.slice(1).map((r) => ({
    userId: r[0],
    name: r[1],
    userName: r[2],
    email: r[3],
    mobile: r[4],
    role: r[5],
    active: r[6] === "true",
    createdAt: r[10],
    updatedAt: r[11],
  }));
  return users;
}

export async function getUser(userId) {
  const rows = await getValues(RANGE);
  const row = rows.slice(1).find((r) => r[0] === userId);
  if (!row) return null;

  return {
    userId: row[0],
    name: row[1],
    userName: row[2],
    email: row[3],
    mobile: row[4],
    role: row[5],
    active: row[6] === "true",
  };
}

export async function createUser({
  name,
  userName,
  email,
  mobile,
  role,
  active,
  password,
}) {
  const rows = await getValues("Users!A:A");
  const next = nextIdFromRows(rows, "USR");
  const userId = formatId("USR", next);

  const passwordHash = await bcrypt.hash(password, 10);
  const timestamp = now();

  const newRow = [
    userId,
    name || "-",
    userName || "-",
    email.toLowerCase(),
    mobile || "-",
    role || "user",
    active ? "true" : "false",
    passwordHash,
    "",
    "",
    timestamp,
    timestamp,
  ];

  await appendValues(RANGE, [newRow]);
  return { userId, name, email };
}

export async function updateUser(userId, updates) {
  const rows = await getValues(RANGE);
  const header = rows[0];
  const data = rows.slice(1);

  const idx = data.findIndex((r) => r[0] === userId);
  if (idx === -1) throw new Error("User not found");

  const row = data[idx];

  const updatedRow = [
    userId,
    updates.name ?? row[1],
    updates.userName ?? row[2],
    updates.email ? updates.email.toLowerCase() : row[3],
    updates.mobile ?? row[4],
    updates.role ?? row[5],
    updates.active !== undefined ? String(updates.active) : row[6],
    row[7], // passwordHash
    row[8],
    row[9],
    row[10], // createdAt
    now(),
  ];

  const newValues = [
    header,
    ...data.map((r, i) => (i === idx ? updatedRow : r)),
  ];
  await updateValues(RANGE, newValues);

  return true;
}

export async function deleteUser(userId) {
  const rows = await getValues(RANGE);
  const header = rows[0];
  const data = rows.slice(1).filter((r) => r[0] !== userId);

  await updateValues(RANGE, [header, ...data]);
  return true;
}

export async function setResetToken(email, token, expiry) {
  const rows = await getValues(RANGE);
  const header = rows[0];
  const data = rows.slice(1);

  const idx = data.findIndex((r) => r[3] === email.toLowerCase());
  if (idx === -1) throw new Error("Email not found");

  const row = data[idx];

  const updatedRow = [...row];
  updatedRow[8] = token;
  updatedRow[9] = expiry;

  const newValues = [
    header,
    ...data.map((r, i) => (i === idx ? updatedRow : r)),
  ];
  await updateValues(RANGE, newValues);
}

export async function resetPassword(token, newPassword) {
  const rows = await getValues(RANGE);
  const header = rows[0];
  const data = rows.slice(1);

  const nowTime = Date.now();
  const idx = data.findIndex((r) => r[8] === token && Number(r[9]) > nowTime);
  if (idx === -1) throw new Error("Invalid or expired token");

  const row = data[idx];
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const updatedRow = [...row];
  updatedRow[7] = passwordHash;
  updatedRow[8] = "";
  updatedRow[9] = "";

  const newValues = [
    header,
    ...data.map((r, i) => (i === idx ? updatedRow : r)),
  ];
  await updateValues(RANGE, newValues);
}
