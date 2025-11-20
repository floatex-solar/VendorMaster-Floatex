import express from "express";
import { authMiddleware } from "../middlewares/auth.middleware.js";
import * as userService from "../services/user.service.js";

const router = express.Router();

router.use(authMiddleware);

router.put("/", async (req, res) => {
  try {
    await userService.updateUser(req.user.userId, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
