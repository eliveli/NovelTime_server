import express from "express";
import {
  createWritingController,
  writingDetailController,
  writingListController,
} from "../controllers/writing";
import { authenticateAccessTokenMiddleware, getUserIdByTokenMiddleware } from "../controllers/user";
import { toggleLikeController } from "../controllers/userContent";

const router = express.Router();

router.get(
  "/:writingType/:novelGenre/:searchType/:searchWord/:sortBy/:pageNo",
  writingListController,
);

router.get("/:writingType/:writingId", getUserIdByTokenMiddleware, writingDetailController);

router.post("/", getUserIdByTokenMiddleware, createWritingController);

router.put(
  "/toggleLike/:contentType/:contentId",
  authenticateAccessTokenMiddleware,
  toggleLikeController,
);

export default router;
