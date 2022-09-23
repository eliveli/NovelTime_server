import express from "express";

import {
  userPageHomeController,
  userPageMyWritingController,
  userPageOthersWritingController,
  userPageMyListController,
  userPageOthersListController,
  userPageNovelListTitlesController,
  toggleLikeController,
} from "../controllers/content";
import {
  authenticateAccessTokenMiddleware,
  getLoginUserIdByTokenForUserNovelListPage,
} from "../controllers/user";

const router = express.Router();

router.get("/userPageHome/:userName", userPageHomeController);

router.get("/userPageMyWriting/:userName/:contentType/:order", userPageMyWritingController);

router.get("/userPageOthersWriting/:userName/:contentType/:order", userPageOthersWritingController);

router.get(
  "/userPageMyList/:userNameInUserPage/:listId/:order",
  getLoginUserIdByTokenForUserNovelListPage,
  userPageMyListController,
);

router.get(
  "/userPageOthersList/:userNameInUserPage/:listId/:order",
  getLoginUserIdByTokenForUserNovelListPage,
  userPageOthersListController,
);

router.get(
  "/userPageNovelListTitles/:userNameInUserPage/:isMyList",
  userPageNovelListTitlesController,
);

router.put(
  "/toggleLike/:contentType/:contentId",
  authenticateAccessTokenMiddleware,
  toggleLikeController,
);

export default router;
