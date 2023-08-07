import express from "express";
import { writingDetailController, writingListController } from "../controllers/writing";
import { getUserIdByTokenMiddleware } from "../controllers/user";

const router = express.Router();

router.get(
  "/:writingType/:novelGenre/:searchType/:searchWord/:sortBy/:pageNo",
  writingListController,
);

router.get("/:writingType/:writingId", getUserIdByTokenMiddleware, writingDetailController);

export default router;
