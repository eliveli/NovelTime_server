import express from "express";

import { loginKakaoController, refreshTokenController } from "../controllers/user";

const router = express.Router();

router.get("/login/kakao", loginKakaoController);

router.get("/refreshToken", refreshTokenController);

export default router;
