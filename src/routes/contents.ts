import express from "express";

import {
  userPageHomeController,
  userPageMyWritingController,
  userPageOthersWritingController,
  userPageMyListController,
} from "../controllers/contents";

const router = express.Router();

router.get("/userPageHome/:userName", userPageHomeController);

router.get("/userPageMyWriting/:userName/:contentsType/:order", userPageMyWritingController);

router.get(
  "/userPageOthersWriting/:userName/:contentsType/:order",
  userPageOthersWritingController,
);

router.get("/userPageMyList/:userName/:listId/:order", userPageMyListController);

export default router;
