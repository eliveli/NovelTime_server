import express from "express";
import { rootCommentsController } from "../controllers/comment";

const router = express.Router();

router.get("/:talkId/:commentSortType/:commentPageNo", rootCommentsController);

export default router;
