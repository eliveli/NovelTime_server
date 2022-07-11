import express from "express";

import {
  userPageHomeController,
  userPageMyWritingController,
  userPageOthersWritingController,
  userPageMyListController,
  userPageOthersListController,
} from "../controllers/contents";

const router = express.Router();

router.get("/userPageHome/:userName", userPageHomeController);

router.get("/userPageMyWriting/:userName/:contentsType/:order", userPageMyWritingController);

router.get(
  "/userPageOthersWriting/:userName/:contentsType/:order",
  userPageOthersWritingController,
);

router.get(
  "/userPageMyList/:userNameInUserPage/:listId/:order/:loginUserId",
  userPageMyListController,
);

router.get(
  "/userPageOthersList/:userNameInUserPage/:listId/:order/:loginUserId",
  userPageOthersListController,
);

export default router;
