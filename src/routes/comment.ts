import express from "express";
import {
  rootCommentsController,
  reCommentsController,
  createRootCommentController,
  createReCommentController,
  editCommentController,
  deleteCommentController,
} from "../controllers/comment";
import { getUserIdByTokenMiddleware } from "../controllers/user";

const router = express.Router();

router.get("/:talkId/:commentSortType/:commentPageNo", rootCommentsController);

router.get("/:rootCommentId/:commentSortType", reCommentsController);

router.post("/rootComment", getUserIdByTokenMiddleware, createRootCommentController);

router.post("/reComment", getUserIdByTokenMiddleware, createReCommentController);

router.put("/comment", getUserIdByTokenMiddleware, editCommentController);

router.delete("/comment", getUserIdByTokenMiddleware, deleteCommentController);

export default router;
