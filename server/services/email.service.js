import nodemailer from "nodemailer";
import appConfig from "../config/app-config.js";

const { GMAIL_USER, GMAIL_APP_PASSWORD } = appConfig;

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465
  auth: {
    user: GMAIL_USER,
    pass: GMAIL_APP_PASSWORD, // App Password (NOT normal password)
  },
});

export async function sendRfqEmail({
  to,
  vendorName,
  rfqNo,
  pdfBuffer,
  additionalAttachments = [],
  htmlBody,
}) {
  const defaultHtml = `
      <p>Dear ${vendorName},</p>
      <p>Please find attached the RFQ.</p>
      <p>Regards,<br/>Procurement Team</p>
    `;

  const mailOptions = {
    from: `"RFQ System" <${GMAIL_USER}>`,
    to,
    subject: `RFQ ${rfqNo}`,
    html: htmlBody || defaultHtml,
    attachments: [
      {
        filename: `${rfqNo}.pdf`,
        content: pdfBuffer, // ✅ CORRECT
        contentType: "application/pdf",
      },
      ...additionalAttachments,
    ],
  };

  await transporter.sendMail(mailOptions);
}
