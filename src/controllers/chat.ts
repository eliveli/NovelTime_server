import { RequestHandler } from "express";
import dotenv from "dotenv";
import getRoomId from "../services/chat/getRoomId";
import getMessages from "../services/chat/getMessages";

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

export const getMessagesController: RequestHandler = (async (req, res) => {
  try {
    const { roomId } = req.params;

    const loginUserId = req.userId;

    if (!roomId || !loginUserId) throw Error("some value was not given");

    const data = await getMessages(roomId, loginUserId);

    res.json(data); // it can be empty array
    //
  } catch (error: any) {
    if (error.message === "room doesn't exist" || error.message === "user is not in the room") {
      res.status(400).json(error.message);
    }

    res.status(500).end();
  }
}) as RequestHandler;
