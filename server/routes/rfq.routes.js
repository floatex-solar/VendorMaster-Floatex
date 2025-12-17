import express from "express";
import { createRfqController } from "../controller/rfq.controller.js";

const router = express.Router();

router.post("/", createRfqController);

export default router;
