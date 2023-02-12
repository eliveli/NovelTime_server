import express from "express";
import writingController from "../controllers/writing";

const router = express.Router();

router.get("/:listType/:novelGenre/:searchType/:searchWord/:sortBy/:pageNo", writingController);

// router.get("/:writingType/:writingId", writingController);

export default router;
