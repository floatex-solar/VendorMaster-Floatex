import express from "express";
import multer from "multer";
import {
  createRfqController,
  previewRfqPdfController,
  getRfqsController,
  getTemplatesController,
  saveTemplateController,
} from "../controller/rfq.controller.js";

const router = express.Router();
const upload = multer();

router.get("/", getRfqsController);
router.post("/", upload.any(), createRfqController);
router.post("/preview-pdf", previewRfqPdfController);

// Template Routes
router.get("/templates", getTemplatesController);
router.post("/templates", saveTemplateController);

export default router;
