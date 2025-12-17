import { createRfq } from "../services/rfq.service.js";

export async function createRfqController(req, res) {
  try {
    const { vendor, items, sendEmail, sendWhatsApp } = req.body;

    const result = await createRfq({
      vendor,
      items,
      sendEmail,
      sendWhatsApp,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("RFQ Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}
