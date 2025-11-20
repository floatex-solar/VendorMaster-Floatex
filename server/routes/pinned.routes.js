// server/routes/pinned.routes.js
import express from "express";
import * as pinnedCtrl from "../controller/pinned.controller.js";

const router = express.Router();

router.get("/", pinnedCtrl.listPins);
router.post("/", pinnedCtrl.createPin);
router.delete("/:id", pinnedCtrl.deletePin);

export default router;
