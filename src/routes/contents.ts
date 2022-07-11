import express from "express";

import {
  userPageHomeController,
  userPageMyWritingController,
  userPageOthersWritingController,
  userPageMyListController,
  userPageOthersListController,
} from "../controllers/contents";
import { getLoginUserIdByTokenForUserNovelListPage } from "../controllers/user";

const router = express.Router();

router.get("/userPageHome/:userName", userPageHomeController);

router.get("/userPageMyWriting/:userName/:contentsType/:order", userPageMyWritingController);

router.get(
  "/userPageOthersWriting/:userName/:contentsType/:order",
  userPageOthersWritingController,
);

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

export default router;
