/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";
import { loginKakao } from "../services/oauth/oauthKakao";
import { generateToken } from "../services/auth/generateToken";

export const loginKakaoController: RequestHandler = (req, res, next) => {
  loginKakao(req.query.code as string)
    .then((userInfo) => {
      console.log(userInfo);

      const { accessToken, refreshToken } = generateToken(userInfo.userId);

      res.cookie("refreshToken", refreshToken, {
        path: "/refreshToken",
        expires: new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000), // 2 months
        httpOnly: true, // You can't access these tokens in the client's javascript
        secure: process.env.NODE_ENV === "production", // Forces to use https in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // set to none for cross-request
        // to set "sameSite:none" "secure:true" must be set
      });

      return res.json({ accessToken, userInfo });
    })
    .catch((err) => console.log("in controller : ", err));
};
