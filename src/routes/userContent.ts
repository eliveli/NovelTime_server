import express from "express";

import {
  userHomeController,
  userMyWritingController,
  userOthersWritingController,
  userMyListController,
  userOthersListController,
  userNovelListTitlesController,
  toggleLikeController,
} from "../controllers/userContent";
import { authenticateAccessTokenMiddleware, getUserIdByTokenMiddleware } from "../controllers/user";

const router = express.Router();

router.get("/:userName", userHomeController);

router.get("/myWriting/:userName/:contentType/:order", userMyWritingController);

router.get("/othersWriting/:userName/:contentType/:order", userOthersWritingController);

router.get(
  "/myList/:userNameInUserPage/:listId/:order",
  getUserIdByTokenMiddleware,
  userMyListController,
);

router.get(
  "/othersList/:userNameInUserPage/:listId/:order",
  getUserIdByTokenMiddleware,
  userOthersListController,
);

router.get("/novelListTitles/:userNameInUserPage/:isMyList", userNovelListTitlesController);

router.put(
  "/toggleLike/:contentType/:contentId",
  authenticateAccessTokenMiddleware,
  toggleLikeController,
);

export default router;
