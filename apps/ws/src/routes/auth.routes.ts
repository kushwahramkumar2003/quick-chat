import express from "express";
import {
  signup,
  login,
  logout,
  getCurrentUser,
} from "../controllers/auth.controller";
import { validate } from "../middleware/validation.middleware";
import { loginSchema, signupSchema } from "../validators/auth.validator";
import { protect } from "../middleware/auth.middleware";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/logout", protect, logout);
router.get("/me", protect, getCurrentUser);

export default router;
