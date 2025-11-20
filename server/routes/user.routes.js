import express from "express";
import * as userController from "../controller/user.controller.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Protect these routes
router.use(authMiddleware);

router.get("/", userController.listUsers);
router.get("/:id", userController.getUser);
router.post("/", userController.createUser);
router.put("/:id", userController.updateUser);
router.delete("/:id", userController.deleteUser);

export default router;
