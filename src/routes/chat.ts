import express from "express";
import { authenticateAccessTokenMiddleware } from "../controllers/user";
import { getMessagesController, getRoomIdController } from "../controllers/chat";

const router = express.Router();

router.get("/roomId/:otherUserName", authenticateAccessTokenMiddleware, getRoomIdController);

router.get("/messages/:roomId", authenticateAccessTokenMiddleware, getMessagesController);

export default router;
