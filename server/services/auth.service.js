import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { getValues } from "../lib/google-sheets.js";
import * as userService from "./user.service.js";

const JWT_SECRET = process.env.JWT_SECRET;

export async function login(emailOrUsername, password) {
  const rows = await getValues("Users!A:L");
  const data = rows.slice(1);

  const user = data.find(
    (r) =>
      r[3] === emailOrUsername.toLowerCase() ||
      r[2] === emailOrUsername.toLowerCase()
  );
  if (!user) throw new Error("User not found");

  const hash = user[7];
  const ok = await bcrypt.compare(password, hash);
  if (!ok) throw new Error("Invalid password");

  const token = jwt.sign(
    { userId: user[0], email: user[3], role: user[5] },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  return {
    token,
    user: {
      userId: user[0],
      name: user[1],
      userName: user[2],
      email: user[3],
      role: user[5],
    },
  };
}

export async function forgotPassword(email) {
  const token = crypto.randomUUID();
  const expiry = Date.now() + 1000 * 60 * 10; // 10 min

  await userService.setResetToken(email, token, expiry);
  return { token };
}

export async function resetPassword(token, newPassword) {
  await userService.resetPassword(token, newPassword);
  return true;
}
