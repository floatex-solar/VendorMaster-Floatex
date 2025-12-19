import express from "express";
import {
  createRfqController,
  previewRfqPdfController,
  getRfqsController,
} from "../controller/rfq.controller.js";

const router = express.Router();

router.get("/", getRfqsController);
router.post("/", createRfqController);
router.post("/preview-pdf", previewRfqPdfController);

export default router;
