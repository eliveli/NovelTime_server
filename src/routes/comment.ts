import express from "express";
import { commentsInTalkDetailController } from "../controllers/comment";

const router = express.Router();

router.get("/:talkId/:sortType", commentsInTalkDetailController);

export default router;
