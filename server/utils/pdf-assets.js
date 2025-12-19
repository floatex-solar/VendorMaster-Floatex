import fs from "fs";
import path from "path";

export function getBase64Image(relativePath) {
  const absPath = path.resolve(relativePath);
  const file = fs.readFileSync(absPath);
  return "data:image/png;base64," + file.toString("base64");
}
