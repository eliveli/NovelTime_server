import express from "express";
import {
  rootCommentsController,
  reCommentsController,
  createRootCommentController,
  createReCommentController,
  editCommentController,
  deleteCommentController,
} from "../controllers/comment";
import { authenticateAccessTokenMiddleware } from "../controllers/user";

const router = express.Router();

router.get("/:talkId/:commentSortType/:commentPageNo", rootCommentsController);

router.get("/:rootCommentId/:commentSortType", reCommentsController);

router.post("/rootComment", authenticateAccessTokenMiddleware, createRootCommentController);

router.post("/reComment", authenticateAccessTokenMiddleware, createReCommentController);

router.put("/comment", authenticateAccessTokenMiddleware, editCommentController);

router.delete("/comment", authenticateAccessTokenMiddleware, deleteCommentController);

export default router;
