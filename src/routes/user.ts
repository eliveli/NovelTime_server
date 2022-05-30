import express from "express";

import {
  loginKakaoController,
  logoutController,
  refreshTokenController,
  authenticateAccessTokenMiddleware,
  checkUserNameController,
} from "../controllers/user";

const router = express.Router();

router.get("/login/kakao", loginKakaoController);

router.get("/logout", authenticateAccessTokenMiddleware, logoutController);

router.get("/refreshToken", refreshTokenController);

router.post("/checkUserName", authenticateAccessTokenMiddleware, checkUserNameController);

export default router;
