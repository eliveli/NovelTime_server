import express from "express";
import { rootCommentsController, reCommentsController } from "../controllers/comment";

const router = express.Router();

router.get("/:talkId/:commentSortType/:commentPageNo", rootCommentsController);

router.get("/:rootCommentId/:commentSortType", reCommentsController);

export default router;
