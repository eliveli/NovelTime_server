import express from "express";

import {
  userPageHomeController,
  userPageMyWritingController,
  userPageOthersWritingController,
} from "../controllers/contents";

const router = express.Router();

router.get("/userPageHome/:userName", userPageHomeController);

router.get("/userPageMyWriting/:userName/:contentsType/:order", userPageMyWritingController);

router.get(
  "/userPageOthersWriting/:userName/:contentsType/:order",
  userPageOthersWritingController,
);

export default router;
