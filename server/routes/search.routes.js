import express from "express";
import * as searchCtrl from "../controller/search.controller.js";

const router = express.Router();

router.get("/items", searchCtrl.search);

export default router;
