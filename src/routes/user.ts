import express from "express";

import {
  loginKakaoController,
  logoutController,
  refreshTokenController,
  authenticateAccessTokenMiddleware,
} from "../controllers/user";

const router = express.Router();

router.get("/login/kakao", loginKakaoController);

router.get("/logout", authenticateAccessTokenMiddleware, logoutController);

router.get("/refreshToken", refreshTokenController);

export default router;
