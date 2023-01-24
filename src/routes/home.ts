import express from "express";

import { homeController, userNovelListController } from "../controllers/home";

const router = express.Router();

router.get("/", homeController);

router.get("/userNovelList", userNovelListController);

export default router;
