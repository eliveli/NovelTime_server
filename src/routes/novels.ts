import express from "express";

import {
  searchForNovelController,
  addNovelWithURLController,
  getNovelDetailController,
  getWritingsOfTheNovelController,
  getNovelsForLoginUserController,
  userNovelListAtRandomController,
  getWeeklyNovelsController,
  getPopularNovelsInNovelTimeController,
  userNovelListPeopleLikeController,
} from "../controllers/novels";
import { authenticateAccessTokenMiddleware } from "../controllers/user";

const router = express.Router();

router.get("/:searchType/:searchWord/:pageNo", searchForNovelController);

router.post("/addNovelWithURL", addNovelWithURLController);

router.get("/detail/:novelId", getNovelDetailController);

router.get("/detail/:novelId/:writingType/:pageNo", getWritingsOfTheNovelController);

router.get("/popularNovelsInNovelTime/:limitedNo", getPopularNovelsInNovelTimeController);

router.get("/userNovelList/liked/:limitedNo", userNovelListPeopleLikeController);

router.get("/userNovelList/random/:limitedNo", userNovelListAtRandomController); // * use for home and novel list

router.get("/weeklyNovels/:platform/:limitedNo", getWeeklyNovelsController); // * use for home and novel list

router.get("/forLoginUser", authenticateAccessTokenMiddleware, getNovelsForLoginUserController);

export default router;
