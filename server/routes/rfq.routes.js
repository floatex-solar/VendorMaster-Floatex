import express from "express";
import multer from "multer";
import {
  createRfqController,
  previewRfqPdfController,
  getRfqsController,
} from "../controller/rfq.controller.js";

const router = express.Router();
const upload = multer();

router.get("/", getRfqsController);
router.post("/", upload.any(), createRfqController);
router.post("/preview-pdf", previewRfqPdfController);

export default router;
