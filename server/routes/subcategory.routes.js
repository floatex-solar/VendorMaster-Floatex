import express from "express";
import * as subCtrl from "../controller/subcategory.controller.js";

const router = express.Router();

router.get("/", subCtrl.list);
router.post("/", subCtrl.create);
router.put("/:id", subCtrl.update);
router.delete("/:id", subCtrl.remove);

export default router;
