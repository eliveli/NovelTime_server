import express from "express";

import { loginKakaoController } from "../controllers/user";

const router = express.Router();

router.get("/login/kakao", loginKakaoController);

export default router;
