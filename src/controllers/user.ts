/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";
import { loginKakao } from "../services/user/login";

export const loginKakaoController: RequestHandler = (req, res, next) => {
  loginKakao(req.query.code as string)
    .then((data) => {
      console.log(data);
      res.cookie("accessToken", data.token.accessToken, {
        expires: new Date(data.token.accessTokenExpireAt * 1000), // timestamp-seconds to date
        // httpOnly: true, // You can't access these tokens in the client's javascript
        secure: process.env.NODE_ENV === "production", // Forces to use https in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // set to none for cross-request
        // to set "sameSite:none" "secure:true" must be set
      });
      res.cookie("refreshToken", data.token.refreshToken, {
        expires: new Date(data.token.refreshTokenExpireAt * 1000), // timestamp-seconds to date
        // httpOnly: true, // You can't access these tokens in the client's javascript
        secure: process.env.NODE_ENV === "production", // Forces to use https in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // set to none for cross-request
        // to set "sameSite:none" "secure:true" must be set
      });
      return res.json(data); // send with token
    })
    .catch((err) => console.log("in controller : ", err));
};
