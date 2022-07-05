import express from "express";

import { userPageHomeController } from "../controllers/contents";

const router = express.Router();

router.get("/userPageHome/:userName", userPageHomeController);

export default router;
