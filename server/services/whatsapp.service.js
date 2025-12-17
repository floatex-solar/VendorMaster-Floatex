import axios from "axios";
import appConfig from "../config/app-config.js";

const { WHATSAPP_API_URL, WHATSAPP_API_KEY } = appConfig;

export async function sendWhatsAppMessage({
  receiverMobileNo,
  rfqNo,
  vendorName,
  pdfUrl,
}) {
  const payload = {
    receiverMobileNo,
    filePathUrl: [pdfUrl],
    message: [
      `Dear ${vendorName},`,
      `Please find RFQ ${rfqNo} attached.`,
      `Thank you.`,
    ],
  };

  const res = await axios.post(WHATSAPP_API_URL, payload, {
    headers: {
      accept: "application/json",
      "x-api-key": WHATSAPP_API_KEY,
      "Content-Type": "application/json",
    },
  });

  return res.data;
}
