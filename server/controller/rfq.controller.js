import { createRfq, getRfqs } from "../services/rfq.service.js";
import { getTemplates, saveTemplate } from "../services/templates.service.js";
import { generateRfqPdfBuffer } from "../services/rfqPdf.service.js";

export async function getRfqsController(req, res) {
  try {
    const rfqs = await getRfqs();
    res.json(rfqs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

export async function createRfqController(req, res) {
  try {
    let body = req.body;
    if (body.data) {
      try {
        body = JSON.parse(body.data);
      } catch (e) {
        // ignore if not valid json, assume individual fields
      }
    }

    const {
      vendor,
      items,
      sendEmail,
      sendWhatsApp,
      emailTemplate,
      whatsappTemplate,
      cc,
      bcc,
    } = body;
    const files = req.files || [];

    const result = await createRfq({
      vendor,
      items,
      sendEmail,
      sendWhatsApp,
      emailTemplate,
      whatsappTemplate,
      cc,
      bcc,
      files,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    console.error("RFQ Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
}

export async function previewRfqPdfController(req, res) {
  try {
    const { vendor, items } = req.body;

    const pdfBuffer = await generateRfqPdfBuffer({
      rfqNo: "RFQ-PREVIEW",
      vendor,
      items,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline");

    res.send(pdfBuffer);
  } catch (err) {
    console.error("Preview PDF error:", err);
    res.status(500).json({ message: err.message });
  }
}

export async function getTemplatesController(req, res) {
  try {
    const templates = await getTemplates();
    res.json(templates);
  } catch (err) {
    console.error("Error getting templates:", err);
    res.status(500).json({ message: "Failed to fetch templates" });
  }
}

export async function saveTemplateController(req, res) {
  try {
    const { type, content } = req.body;
    if (!type || content === undefined) {
      return res.status(400).json({ message: "Type and content are required" });
    }
    await saveTemplate(type, content);
    res.json({ success: true });
  } catch (err) {
    console.error("Error saving template:", err);
    res.status(500).json({ message: "Failed to save template" });
  }
}
