import express from "express";

import {
  searchForNovelController,
  getNovelListByCategory,
  addNovelWithURLController,
  getNovelDetailController,
} from "../controllers/novels";

const router = express.Router();

router.get("/:searchType/:searchWord/:pageNo", searchForNovelController);

router.post("/addNovelWithURL", addNovelWithURLController);

router.get("/detail/:novelId", getNovelDetailController);

router.get("/:category/:platform/:novelId", getNovelListByCategory);

export default router;
