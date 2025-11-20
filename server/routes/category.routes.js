import express from "express";
import * as categoryCtrl from "../controller/category.controller.js";

const router = express.Router();

router.get("/", categoryCtrl.list);
router.post("/", categoryCtrl.create);
router.put("/:id", categoryCtrl.update);
router.delete("/:id", categoryCtrl.remove);

export default router;
