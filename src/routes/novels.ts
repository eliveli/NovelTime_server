import express from "express";

import {
  searchByTitle,
  searchForNovelController,
  getNovelById,
  getNovelListByCategory,
  addNovelWithURLController,
} from "../controllers/novels";

const router = express.Router();

router.get("/search/:title", searchByTitle);

router.get("/:searchType/:searchWord/:pageNo", searchForNovelController);

router.post("/addNovelWithURL", addNovelWithURLController);

// router.get("/category/:category", searchByTitle);

router.get("/detail/:novelId", getNovelById);

router.get("/:category/:platform/:novelId", getNovelListByCategory);

export default router;
