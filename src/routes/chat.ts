import express from "express";
import { authenticateAccessTokenMiddleware } from "../controllers/user";
import {
  getMessagesController,
  getRoomIdController,
  getRoomsController,
} from "../controllers/chat";

const router = express.Router();

router.get("/roomId/:partnerUserName", authenticateAccessTokenMiddleware, getRoomIdController);

router.get("/rooms", authenticateAccessTokenMiddleware, getRoomsController);

router.get("/messages/:roomId", authenticateAccessTokenMiddleware, getMessagesController);

export default router;
