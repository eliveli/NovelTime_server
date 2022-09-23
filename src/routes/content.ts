import express from "express";

import {
  userPageController,
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

router.get("/userPage/:userName", userPageController);

router.get("/userPage/myWriting/:userName/:contentType/:order", userPageMyWritingController);

router.get(
  "/userPage/othersWriting/:userName/:contentType/:order",
  userPageOthersWritingController,
);

router.get(
  "/userPage/myList/:userNameInUserPage/:listId/:order",
  getLoginUserIdByTokenForUserNovelListPage,
  userPageMyListController,
);

router.get(
  "/userPage/othersList/:userNameInUserPage/:listId/:order",
  getLoginUserIdByTokenForUserNovelListPage,
  userPageOthersListController,
);

router.get(
  "/userPage/novelListTitles/:userNameInUserPage/:isMyList",
  userPageNovelListTitlesController,
);

router.put(
  "/toggleLike/:contentType/:contentId",
  authenticateAccessTokenMiddleware,
  toggleLikeController,
);

export default router;
