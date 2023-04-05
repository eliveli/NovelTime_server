import { RequestHandler } from "express";
import dotenv from "dotenv";
import getRootComments from "../services/comment/getRootComments";
import getReComments from "../services/comment/getReComments";

dotenv.config();

export const rootCommentsController: RequestHandler = (async (req, res) => {
  try {
    const { talkId, commentSortType, commentPageNo } = req.params;

    const commentPageNoAsNumber = Number(commentPageNo);

    if (!["new", "old"].includes(commentSortType)) throw Error("sort type is wrong");

    if (typeof commentPageNoAsNumber !== "number") throw Error("comment page no is wrong");

    const data = await getRootComments(
      talkId,
      commentSortType as "new" | "old",
      commentPageNoAsNumber,
    );

    if (data === undefined) {
      res.json(undefined);
      return;
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).end();
  }
}) as RequestHandler;

export const reCommentsController: RequestHandler = (async (req, res) => {
  try {
    const { rootCommentId, commentSortType } = req.params;

    if (!["new", "old"].includes(commentSortType)) throw Error("sort type is wrong");

    const data = await getReComments(rootCommentId, commentSortType as "new" | "old");

    if (data === undefined) {
      res.json(undefined);
      return;
    }

    res.json(data);
  } catch (error: any) {
    res.status(500).end();
  }
}) as RequestHandler;
