import express from "express";

import { loginKakao } from "../controllers/login";

const router = express.Router();

router.get("/kakao", loginKakao);

export default router;
