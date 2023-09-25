import { RequestHandler } from "express";
import dotenv from "dotenv";
import getRoomId from "../services/chat/getRoomId";

dotenv.config();

export const getRoomIdController: RequestHandler = (async (req, res) => {
  try {
    const { otherUserName } = req.params;

    const loginUserId = req.userId;

    if (!otherUserName || !loginUserId) throw Error("some value was not given");

    const roomId = await getRoomId(otherUserName, loginUserId);

    if (roomId === undefined) {
      res.json(undefined);
      return;
    }

    res.json(roomId);
  } catch (error: any) {
    res.status(500).end();
  }
}) as RequestHandler;
