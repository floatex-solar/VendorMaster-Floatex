import { google } from "googleapis";
import { Readable } from "stream";
import appConfig from "../config/app-config.js";
import { authManager } from "../utils/google-auth-manager.js";

export async function uploadPdfToDrive({ pdfBuffer, fileName }) {
  const drive = google.drive({
    version: "v3",
    auth: authManager.getAuth(),
  });

  const stream = Readable.from(pdfBuffer);

  const res = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: fileName,
      parents: [appConfig.RFQ_DRIVE_FOLDER_ID],
      mimeType: "application/pdf",
    },
    media: {
      mimeType: "application/pdf",
      body: stream,
    },
  });

  return {
    fileId: res.data.id,
    viewUrl: `https://drive.google.com/file/d/${res.data.id}/view`,
  };
}

// import { google } from "googleapis";
// import { Readable } from "stream";
// import { authManager } from "../utils/google-auth-manager.js";
// import appConfig from "../config/app-config.js";

// export async function uploadPdfToDrive({ pdfBuffer, fileName }) {
//   const drive = google.drive({
//     version: "v3",
//     auth: authManager.getAuth(),
//   });

//   const { RFQ_DRIVE_FOLDER_ID } = appConfig;
//   const stream = Readable.from(pdfBuffer);

//   // 1. Upload file
//   const res = await drive.files.create({
//     supportsAllDrives: true,
//     requestBody: {
//       name: fileName,
//       parents: [RFQ_DRIVE_FOLDER_ID],
//       mimeType: "application/pdf",
//     },
//     media: {
//       mimeType: "application/pdf",
//       body: stream,
//     },
//   });

//   // 2. Make it public (anyone with link)
//   await drive.permissions.create({
//     supportsAllDrives: true,
//     fileId: res.data.id,
//     requestBody: {
//       role: "reader",
//       type: "anyone",
//     },
//   });

//   return `https://drive.google.com/file/d/${res.data.id}/view`;
// }
