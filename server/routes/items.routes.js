import express from "express";
import * as itemCtrl from "../controller/items.controller.js";

const router = express.Router();

router.get("/", itemCtrl.list);
router.post("/", itemCtrl.create);
router.post("/bulk", itemCtrl.bulkCreate);
router.put("/:id", itemCtrl.update);
router.delete("/bulk", itemCtrl.bulkRemove); // New bulk delete route
router.delete("/:id", itemCtrl.remove);

export default router;
