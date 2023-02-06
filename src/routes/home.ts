import express from "express";

import {
  homeController,
  userNovelListController,
  weeklyNovelsController,
} from "../controllers/home";

const router = express.Router();

router.get("/", homeController);

router.get("/userNovelList", userNovelListController);

router.get("/weeklyNovels/:platform/:isAllNovels", weeklyNovelsController);

export default router;
