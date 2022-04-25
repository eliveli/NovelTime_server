/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { loginKakao } from "../services/oauth/oauthKakao";
import { generateToken, generateAccessToken } from "../services/auth/generateToken";

dotenv.config();

const privateKey = process.env.JWT_PRIVATE_KEY;

export const loginKakaoController: RequestHandler = (req, res, next) => {
  loginKakao(req.query.code as string)
    .then((userInfo) => {
      console.log(userInfo);

      try {
        const { accessToken, refreshToken } = generateToken({ userInfo });

        res.cookie("refreshToken", refreshToken, {
          // path: "/refreshToken",
          expires: new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000), // 2 months
          httpOnly: true, // You can't access these tokens in the client's javascript
          secure: process.env.NODE_ENV === "production", // Forces to use https in production
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // set to none for cross-request
          // to set "sameSite:none", "secure:true" must be set
        });

        return res.json({ accessToken, userInfo });
      } catch (e) {
        if (e instanceof jwt.JsonWebTokenError) {
          console.log("failed to generate token, jsonWebtokenError : ", e);
        }
        console.log("failed to generate token or set cookie : ", e);
      }
    })
    .catch((err) => console.log("in controller : ", err));
};

interface UserInfo {
  userId: string;
  userName: string;
  userImg: string;
}
// 1. 리프레시 토큰 검증 2. 액세스 토큰 발급
export const refreshTokenController: RequestHandler = (req, res, next) => {
  const { refreshToken } = req.cookies;

  console.log("refresh token : ", refreshToken);
  // if the cookie is not set, return an unauthorized error
  if (!refreshToken) return res.sendStatus(401);

  let payload: UserInfo;
  try {
    // Parse the JWT string and store the result in `payload`.
    // Note that we are passing the key in this method as well. This method will throw an error
    // if the token is invalid (if it has expired according to the expiry time we set on sign in),
    // or if the signature does not match
    payload = jwt.verify(refreshToken as string, privateKey as string) as UserInfo;
    console.log("payload refresh token info: ", payload);
  } catch (e) {
    if (e instanceof jwt.JsonWebTokenError) {
      console.log("payload refresh catch : ", e);

      // if the error thrown is because the JWT is unauthorized, return a 401 error
      return res.status(401).end();
    }
    // otherwise, return a bad request error
    return res.status(400).end();
  }

  const accessToken = generateAccessToken({
    userInfo: { userId: payload.userId, userImg: payload.userImg, userName: payload.userName },
  });

  console.log("new access token: ", accessToken);
  return res.json({ accessToken, userInfo: payload });
};
