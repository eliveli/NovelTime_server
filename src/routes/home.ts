import express from "express";

import { homeController } from "../controllers/home";

const router = express.Router();

router.get("/", homeController);

export default router;
