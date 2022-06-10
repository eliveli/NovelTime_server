import express from "express";

import {
  loginKakaoController,
  logoutController,
  refreshTokenController,
  authenticateAccessTokenMiddleware,
  checkUserNameController,
  saveChangedInfoController,
} from "../controllers/user";

const router = express.Router();

router.get("/login/kakao", loginKakaoController);

router.get("/logout", authenticateAccessTokenMiddleware, logoutController);

router.get("/refreshToken", refreshTokenController);

router.post("/checkUserName", authenticateAccessTokenMiddleware, checkUserNameController);

router.post("/saveChangedInfo", authenticateAccessTokenMiddleware, saveChangedInfoController);

export default router;
