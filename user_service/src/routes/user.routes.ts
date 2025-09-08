import { Router } from "express";
import { createUser, updateUser, deleteUser } from "@/controllers/user.controller";
import { authenticate } from "@/middleware/auth.middleware";

const router = Router();

router.post("/", createUser);
router.put("/:id", authenticate, updateUser);
router.delete("/:id", authenticate, deleteUser);

export default router;
