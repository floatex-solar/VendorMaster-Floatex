import { getValues, appendValues } from "../lib/google-sheets.js";
import { getFinancialYear, getNextRfqSequence } from "../utils/rfq-number.js";
import { generateRfqPdfBuffer } from "./rfqPdf.service.js";
import { uploadFileToDrive as uploadPdfToDrive } from "./drive.service.js";
import { sendRfqEmail } from "./email.service.js";
import { sendWhatsAppMessage } from "./whatsapp.service.js";
import { updateValues } from "../lib/google-sheets.js";

const RFQ_SHEET = "RFQs!A:J";
function now() {
  return new Date().toISOString().replace("T", " ").split(".")[0];
}

export async function getRfqs() {
  const rows = await getValues(RFQ_SHEET);

  const [, ...data] = rows; // skip header

  return data.map((r) => ({
    createdAt: r[0],
    rfqNo: r[1],
    date: r[2],
    vendorId: r[3],
    vendorName: r[4],
    email: r[5],
    phone: r[6],
    emailStatus: r[7],
    whatsappStatus: r[8],
    pdfUrl: r[9],
  }));
}

export async function createRfq({
  vendor,
  items,
  sendEmail,
  sendWhatsApp,
  files = [],
}) {
  // 1. Generate RFQ number
  const rows = await getValues("RFQs!A:B");
  const seq = getNextRfqSequence(rows);
  const fy = getFinancialYear();
  const rfqNo = `RFQ/${fy}/${String(seq).padStart(4, "0")}`;

  // 2. Generate PDF buffer
  const pdfBuffer = await generateRfqPdfBuffer({
    rfqNo,
    vendor,
    items,
  });

  // 3. Upload PDF buffer to Drive
  const pdfUrl = await uploadPdfToDrive({
    fileBuffer: pdfBuffer,
    fileName: `${rfqNo}.pdf`,
    mimeType: "application/pdf",
  });

  // --- Handle Item Attachments ---
  const itemAttachments = [];
  const itemLinks = [];

  // Parallel uploads could be faster but serial is safer for rate limits
  for (const item of items) {
    // Frontend sends files with fieldname "file_<itemId>"
    // Multer.any() puts them all in `files`. We filter by fieldname.
    const itemFiles = files.filter(
      (f) => f.fieldname === `file_${item.itemId}`
    );

    if (itemFiles.length > 0) {
      const itemLinksParts = [];

      for (const file of itemFiles) {
        try {
          const fileUrl = await uploadPdfToDrive({
            fileBuffer: file.buffer,
            fileName: `${rfqNo}_${item.itemId}_${file.originalname}`,
            mimeType: file.mimetype,
          });

          itemAttachments.push({
            filename: file.originalname,
            content: file.buffer,
            contentType: file.mimetype,
          });

          itemLinksParts.push(`- ${file.originalname}: ${fileUrl}`);
        } catch (err) {
          console.error(
            `Failed to upload spec ${file.originalname} for item ${item.itemId}:`,
            err.message
          );
        }
      }

      if (itemLinksParts.length > 0) {
        itemLinks.push(
          `Spec for ${item.description}:\n${itemLinksParts.join("\n")}`
        );
      }
    }
  }

  let emailStatus = "NOT SENT";
  let whatsappStatus = "NOT SENT";

  // 4. Send Email
  if (sendEmail && vendor.email) {
    try {
      await sendRfqEmail({
        to: vendor.email,
        vendorName: vendor.name,
        rfqNo,
        pdfUrl,
        pdfBuffer,
        additionalAttachments: itemAttachments,
      });
      emailStatus = "SENT";
    } catch (err) {
      emailStatus = "FAILED";
      console.error("Email failed:", err.message);
    }
  }

  // // 5. Send WhatsApp
  if (sendWhatsApp && vendor.phone) {
    try {
      let messageBody = `Dear ${vendor.name},\n\nPlease find RFQ ${rfqNo} at the link below.\n\n${pdfUrl}`;

      if (itemLinks.length > 0) {
        messageBody += `\n\nItem Specifications:\n${itemLinks.join("\n")}`;
      }

      messageBody += `\n\nThank you`;

      const res = await sendWhatsAppMessage({
        receiverMobileNo: vendor.phone,
        filePathUrl: "",
        message: messageBody,
      });
      if (res.success) whatsappStatus = "SENT";
      else whatsappStatus = "FAILED";
    } catch (err) {
      whatsappStatus = "FAILED";
      console.error("WhatsApp failed:", err.message);
    }
  }

  // 6. Save to Sheet

  await appendValues(RFQ_SHEET, [
    [
      now(),
      rfqNo,
      now(),
      vendor.vendorId,
      vendor.name,
      sendEmail ? vendor.email : "",
      sendWhatsApp ? vendor.phone : "",
      emailStatus,
      whatsappStatus,
      pdfUrl,
    ],
  ]);

  return { rfqNo, pdfUrl, emailStatus, whatsappStatus };
}
