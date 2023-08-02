import express from "express";
import {
  rootCommentsController,
  reCommentsController,
  createRootCommentController,
  createReCommentController,
  editCommentController,
} from "../controllers/comment";
import { getUserIdByTokenMiddleware } from "../controllers/user";

const router = express.Router();

router.get("/:talkId/:commentSortType/:commentPageNo", rootCommentsController);

router.get("/:rootCommentId/:commentSortType", reCommentsController);

router.post("/rootComment", getUserIdByTokenMiddleware, createRootCommentController);

router.post("/reComment", getUserIdByTokenMiddleware, createReCommentController);

router.put("/comment", getUserIdByTokenMiddleware, editCommentController);

export default router;
