import express from "express";
import { writingDetailController, writingListController } from "../controllers/writing";

const router = express.Router();

router.get(
  "/:writingType/:novelGenre/:searchType/:searchWord/:sortBy/:pageNo",
  writingListController,
);

router.get("/:writingType/:writingId", writingDetailController);

export default router;
