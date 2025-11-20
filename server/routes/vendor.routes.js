import express from "express";
import * as vendorCtrl from "../controller/vendor.controller.js";

const router = express.Router();

router.get("/", vendorCtrl.list);
router.post("/", vendorCtrl.create);
router.get("/:id", vendorCtrl.get);
router.put("/:id", vendorCtrl.update);
router.delete("/:id", vendorCtrl.remove);

export default router;
