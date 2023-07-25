import express from "express";
import {
  rootCommentsController,
  reCommentsController,
  createRootCommentController,
} from "../controllers/comment";
import { getUserIdByTokenMiddleware } from "../controllers/user";

const router = express.Router();

router.get("/:talkId/:commentSortType/:commentPageNo", rootCommentsController);

router.get("/:rootCommentId/:commentSortType", reCommentsController);

router.post("/rootComment", getUserIdByTokenMiddleware, createRootCommentController);

export default router;
