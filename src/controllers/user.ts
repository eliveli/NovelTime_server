/* eslint-disable import/prefer-default-export */
import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  loginKakao,
  setRefreshTokenDB,
  getRefreshTokenDB,
  deleteRefreshTokenDB,
} from "../services/oauth/oauthKakao";
import { generateToken, generateAccessToken } from "../services/auth/generateToken";

dotenv.config();

const privateKey = process.env.JWT_PRIVATE_KEY;

export const loginKakaoController: RequestHandler = (req, res) => {
  loginKakao(req.query.code as string)
    .then(async (userInfo) => {
      console.log(userInfo);

      try {
        const { accessToken, refreshToken } = generateToken({ userInfo });

        await setRefreshTokenDB(userInfo.userId, refreshToken);

        res.cookie("refreshToken", refreshToken, {
          path: "/user/refreshToken",
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

// access token의 유효성 검사
export const authenticateAccessTokenMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  console.log("authHeader: ", authHeader);
  console.log("token:", token);
  if (!token) {
    console.log("wrong token format or token is not sended");
    return res.status(400);
  }
  try {
    const payload = jwt.verify(token, privateKey as string) as UserInfo;

    req.userId = payload.userId;

    next();
  } catch (error) {
    console.log(error);
    return res.status(403);
  }
};

export const logoutController: RequestHandler = (req, res) => {
  const { userId } = req;
  console.log("userId:", userId);
  if (!userId) {
    console.log("user id was not set in header");
    return res.status(400).end();
  }
  try {
    deleteRefreshTokenDB(userId);
    res.clearCookie("refreshToken", { path: "/user/refreshToken" });
    res.removeHeader("authorization");

    console.log("로그아웃 완료");
    res.json("로그아웃 완료");
    // 리프레시 토큰 디비에서 지우기
    // 리프레시 토큰 쿠키 지우기
    // 헤더 액세스 토큰 지우기
    // 프론트에서 로그인 유저 정보 지우기
  } catch (error) {
    console.log(error);
  }
};

// 1. 리프레시 토큰 검증 2. 액세스 토큰 발급
export const refreshTokenController: RequestHandler = (req, res) => {
  const { refreshToken } = req.cookies;

  console.log("refresh token : ", refreshToken);
  // if the cookie is not set, return an unauthorized error
  // user didn't login before
  if (!refreshToken) return res.status(401).end();

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

  // Make sure that refresh token is the one in DB
  getRefreshTokenDB(payload.userId)
    .then((data) => {
      console.log("data:", data);

      if (!data[0]) {
        throw new Error("user id might be not correct");
      }
      const isUsersToken = refreshToken === data[0].refreshToken;

      if (!isUsersToken) {
        throw new Error("access token is different from one in DB");
      }
      const accessToken = generateAccessToken({
        userInfo: { userId: payload.userId, userImg: payload.userImg, userName: payload.userName },
      });

      console.log("new access token: ", accessToken);
      return res.json({ accessToken, userInfo: payload });
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(400)
        .json("refresh token is different from one in DB or failed to make new access token");
    });
};
