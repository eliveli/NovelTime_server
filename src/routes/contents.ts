import express from "express";

import { userPageHomeController, userPageMyWritingController } from "../controllers/contents";

const router = express.Router();

router.get("/userPageHome/:userName", userPageHomeController);

router.get("/userPageMyWriting/:userName/:contentsType/:order", userPageMyWritingController);

export default router;
