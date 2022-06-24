import express from "express";

import {
  logoutController,
  refreshTokenController,
  authenticateAccessTokenMiddleware,
  checkUserNameController,
  saveChangedInfoController,
  loginController,
} from "../controllers/user";

const router = express.Router();

router.get("/login/:oauthServer", loginController);

router.get("/logout", authenticateAccessTokenMiddleware, logoutController);

router.get("/refreshToken", refreshTokenController);

router.post("/checkUserName", authenticateAccessTokenMiddleware, checkUserNameController);

router.post("/saveChangedInfo", authenticateAccessTokenMiddleware, saveChangedInfoController);

export default router;
