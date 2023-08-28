import express from "express";

import {
  searchForNovelController,
  getNovelListByCategory,
  addNovelWithURLController,
  getNovelDetailController,
  getWritingsOfTheNovelController,
  getNovelsForLoginUserController,
} from "../controllers/novels";
import { authenticateAccessTokenMiddleware } from "../controllers/user";

const router = express.Router();

router.get("/:searchType/:searchWord/:pageNo", searchForNovelController);

router.post("/addNovelWithURL", addNovelWithURLController);

router.get("/detail/:novelId", getNovelDetailController);

router.get("/detail/:novelId/:writingType/:pageNo", getWritingsOfTheNovelController);

router.get("/forLoginUser", authenticateAccessTokenMiddleware, getNovelsForLoginUserController);

router.get("/:category/:platform/:novelId", getNovelListByCategory);

export default router;
