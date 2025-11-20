import express from "express";
import authRoutes from "./auth.routes.js";
import userRoutes from "./user.routes.js";
import profileRoutes from "./profile.routes.js";
import categoryRoutes from "./category.routes.js";
import subCategoryRoutes from "./subcategory.routes.js";
import itemRoutes from "./items.routes.js";
import uomRoutes from "./uom.routes.js";
import vendorRoutes from "./vendor.routes.js";
import searchRoutes from "./search.routes.js";
import pinnedRoutes from "./pinned.routes.js";
import { authMiddleware } from "../middlewares/auth.middleware.js";

const router = express.Router();

// User Routes
router.use("/auth", authRoutes);

router.use(authMiddleware);

router.use("/users", userRoutes);
router.use("/profile", profileRoutes);

// Item Routes
router.use("/categories", categoryRoutes);
router.use("/subcategories", subCategoryRoutes);
router.use("/items", itemRoutes);
router.use("/uoms", uomRoutes);

// Vendor Routes
router.use("/vendors", vendorRoutes);

// Search Route
router.use("/search", searchRoutes);

// Pinned Route
router.use("/pinned", pinnedRoutes);

export default router;
