import express from "express";
import { authenticateAccessTokenMiddleware } from "../controllers/user";
import { getRoomIdController } from "../controllers/chat";

const router = express.Router();

router.get("/roomId/:otherUserName", authenticateAccessTokenMiddleware, getRoomIdController);

export default router;
