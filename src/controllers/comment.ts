import { RequestHandler } from "express";
import dotenv from "dotenv";
import getComments from "../services/comment/getComment";

dotenv.config();

export const commentsInTalkDetailController: RequestHandler = (async (req, res) => {
  try {
    const { talkId, sortType } = req.params;

    if (!["new", "old"].includes(sortType)) throw Error("sort type is wrong");

    const data = await getComments(talkId, sortType as "new" | "old");

    if (data === undefined) {
      res.json(undefined);
      return;
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).end();
  }
}) as RequestHandler;
