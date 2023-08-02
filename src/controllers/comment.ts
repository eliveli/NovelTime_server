import { RequestHandler } from "express";
import dotenv from "dotenv";
import getRootComments from "../services/comment/getRootComments";
import getReComments from "../services/comment/getReComments";
import createRootComment from "../services/comment/createRootComment";
import createReComment from "../services/comment/createReComment";
import editComment from "../services/comment/editRootComment";
import deleteComment from "../services/comment/deleteComment";

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

    res.json(data);
  } catch (error: any) {
    res.status(500).end();
  }
}) as RequestHandler;

export const createRootCommentController: RequestHandler = (async (req, res) => {
  try {
    const { talkId, novelTitle, commentContent } = req.body;

    const loginUserId = req.userId;

    if (!loginUserId) throw Error("user id is empty");

    if (!talkId || !novelTitle || !commentContent) throw Error("some property is empty");

    await createRootComment(
      talkId as string,
      novelTitle as string,
      commentContent as string,
      loginUserId,
    );

    res.json("new root comment was added");
  } catch (error: any) {
    res.status(500).json("failed to add a root comment");
  }
}) as RequestHandler;

export const createReCommentController: RequestHandler = (async (req, res) => {
  try {
    const { talkId, novelTitle, commentContent, parentCommentId } = req.body;

    const loginUserId = req.userId;

    if (!loginUserId) throw Error("user id is empty");

    if (!talkId || !novelTitle || !commentContent || !parentCommentId) {
      throw Error("some property is empty");
    }

    await createReComment(
      talkId as string,
      novelTitle as string,
      commentContent as string,
      loginUserId,
      parentCommentId as string,
    );

    res.json("new reComment was added");
  } catch (error: any) {
    res.status(500).json("failed to add a reComment");
  }
}) as RequestHandler;

export const editCommentController: RequestHandler = (async (req, res) => {
  try {
    const { commentId, commentContent } = req.body;

    if (!commentId || !commentContent) {
      throw Error("some property is empty");
    }

    await editComment(commentId as string, commentContent as string);

    res.json("a comment was edited");
  } catch (error: any) {
    res.status(500).json("failed to edit a comment");
  }
}) as RequestHandler;

export const deleteCommentController: RequestHandler = (async (req, res) => {
  try {
    const { commentId } = req.body;

    if (!commentId) {
      throw Error("commentId is empty");
    }

    await deleteComment(commentId as string);

    res.json("a comment was deleted");
  } catch (error: any) {
    res.status(500).json("failed to delete a comment");
  }
}) as RequestHandler;
