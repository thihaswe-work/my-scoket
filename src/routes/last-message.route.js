import { Router } from "express";
import { getAllLastSeenMessagesByUserId } from "../controllers/last-message.controller.js";

const router = Router();

router.get("/:userId", getAllLastSeenMessagesByUserId);

export default router;
