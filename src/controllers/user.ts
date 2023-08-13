import { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import {
  setRefreshTokenDB,
  getRefreshTokenDB,
  deleteRefreshTokenDB,
  loginOauthServer,
} from "../services/oauth/oauth";
import { generateToken, generateAccessToken } from "../services/auth/generateToken";
import findByUserName from "../services/user/findByUserName";
import { UserImg } from "../services/utils/types";
import db from "../services/utils/db";

dotenv.config();

const privateKey = process.env.JWT_PRIVATE_KEY as string;

// note : don't make controller async
//  just use promise then/catch in controller instead of using async/await to controller itself
//  to avoid the following eslint error
//  "Promise-returning function provided to variable where a void return was expected"

export const loginController: RequestHandler = (req, res) => {
  loginOauthServer(req.params.oauthServer, req.query.data as string)
    .then(async (userInfo) => {
      if (!userInfo) throw new Error("no oauth server");

      const { accessToken, refreshToken } = generateToken({ userInfo });

      await setRefreshTokenDB(userInfo.userId, refreshToken);

      res.cookie("refreshToken", refreshToken, {
        path: "/api/user/refreshToken",
        expires: new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000), // 2 months
        httpOnly: true, // You can't access these tokens in the client's javascript
        secure: process.env.NODE_ENV === "production", // Forces to use https in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // set to none for cross-request
        // to set "sameSite:none", "secure:true" must be set
      });

      return res.json({ accessToken, userInfo });
    })
    .catch((err) => {
      if (err instanceof jwt.JsonWebTokenError) {
        console.log("failed to generate token, jsonWebtokenError : ", err);
      }
      console.log("error occurred in loginController: ", err);
    });
};

type ChangedUserInfo = {
  userId: string;
  userName: string;
  userImgSrc: string;
  userImgPosition: string;
  userBGSrc: string;
  userBGPosition: string;
};

// it only accepts the case when the user logged in and the token was validated
export const authenticateAccessTokenMiddleware: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    console.log("wrong token format or token was not sended");
    return res.status(400);
  }
  try {
    const payload = jwt.verify(token, privateKey) as ChangedUserInfo;

    req.userId = payload.userId;

    next();
  } catch (error) {
    console.log(error);
    return res.status(403);
  }
};

// it's okay for the user not to log in. then the userId below would be undefined
export const getUserIdByTokenMiddleware: RequestHandler = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];
    if (token) {
      const payload = jwt.verify(token, privateKey) as ChangedUserInfo;
      req.userId = payload.userId;
    }
    // for user novel list page - my list page or other's list page
    // I can't get the login user id by request parameter because of security issue
    next();
  } catch (error) {
    console.log(error);
  }
};

export const logoutController: RequestHandler = (req, res) => {
  const { userId } = req;
  console.log("userId:", userId);
  if (!userId) {
    console.log("user id was not set in header");
    return res.status(400).end();
  }

  deleteRefreshTokenDB(userId)
    .then(() => {
      res.clearCookie("refreshToken", { path: "/api/user/refreshToken" });
      res.removeHeader("authorization");

      console.log("로그아웃 완료");
      res.json("로그아웃 완료");
      // 리프레시 토큰 디비에서 지우기
      // 리프레시 토큰 쿠키 지우기
      // 헤더 액세스 토큰 지우기
      // 프론트에서 로그인 유저 정보 지우기
    })
    .catch((error) => {
      console.log(error);
    });
};

// 1. 리프레시 토큰 검증 2. 액세스 토큰 발급
export const refreshTokenController: RequestHandler = (req, res) => {
  const { refreshToken } = req.cookies;

  console.log("refresh token : ", refreshToken);
  // if the cookie was not set, return an unauthorized error
  // user didn't login before
  if (!refreshToken) return res.status(401).json({ message: "non login user" });

  let payload: ChangedUserInfo;
  try {
    // Parse the JWT string and store the result in `payload`.
    // Note that we are passing the key in this method as well. This method will throw an error
    // if the token is invalid (if it has expired according to the expiry time we set on sign in),
    // or if the signature does not match
    payload = jwt.verify(refreshToken as string, privateKey) as ChangedUserInfo;
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
      if (!data) {
        throw new Error("user id might be not correct");
      }
      const isUsersToken = refreshToken === data.refreshToken;

      if (!isUsersToken) {
        throw new Error("access token is different from one in DB");
      }

      const userInfoToClient = {
        userId: payload.userId,
        userName: payload.userName,
        userImg: {
          src: payload.userImgSrc,
          position: payload.userImgPosition,
        },
        userBG: {
          src: payload.userBGSrc,
          position: payload.userBGPosition,
        },
      };
      const userInfoParams = {
        userId: payload.userId,
        userName: payload.userName,
        userImgSrc: payload.userImgSrc,
        userImgPosition: payload.userImgPosition,
        userBGSrc: payload.userBGSrc,
        userBGPosition: payload.userBGPosition,
      };

      const accessToken = generateAccessToken(userInfoParams);

      console.log("new access token: ", accessToken);
      return res.json({ accessToken, userInfo: userInfoToClient });
    })
    .catch((err) => {
      console.log(err);
      return res
        .status(400)
        .json("refresh token is different from one in DB or failed to make new access token");
    });
};

export const checkUserNameController: RequestHandler = (req, res) => {
  const { newUserName } = req.body;
  // check for duplicate username
  findByUserName(newUserName as string)
    .then((userInfo) => {
      // if the user name exists or not
      if (!userInfo) {
        return res.json("you can use this name");
      }
      return res.json("you can't use this name");
    })
    .catch((err) => {
      console.log(err);
    });
};

async function saveUserInfo(
  userId: string,
  changedUserName: string,
  changedUserImg: UserImg,
  changedUserBG: UserImg,
) {
  await db(
    `UPDATE user SET userName = (?), userImgSrc = (?), userImgPosition = (?), userBGSrc = (?),  userBGPosition = (?)
 WHERE userId = (?)`,
    [
      changedUserName,
      changedUserImg.src,
      changedUserImg.position,
      changedUserBG.src,
      changedUserBG.position,
      userId,
    ],
  );
}

export const saveChangedInfoController: RequestHandler = (req, res) => {
  const {
    changedUserInfo: { changedUserName, changedUserImg, changedUserBG },
  } = req.body;

  const userInfo = {
    userId: req.userId as string,
    userName: changedUserName as string,
    userImg: changedUserImg as UserImg,
    userBG: changedUserBG as UserImg,
  };

  // save changed user info in DB
  saveUserInfo(
    req.userId as string,
    changedUserName as string,
    changedUserImg as UserImg,
    changedUserBG as UserImg,
  )
    .then(async () => {
      const { accessToken, refreshToken } = generateToken({ userInfo });

      await setRefreshTokenDB(userInfo.userId, refreshToken);

      res.cookie("refreshToken", refreshToken, {
        path: "/api/user/refreshToken",
        expires: new Date(Date.now() + 2 * 30 * 24 * 60 * 60 * 1000), // 2 months
        httpOnly: true, // You can't access these tokens in the client's javascript
        secure: process.env.NODE_ENV === "production", // Forces to use https in production
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax", // set to none for cross-request
        // to set "sameSite:none", "secure:true" must be set
      });

      return res.json({ accessToken, userInfo });
    })
    .catch((e) => {
      if (e instanceof jwt.JsonWebTokenError) {
        console.log("failed to generate token, jsonWebtokenError : ", e);
      }
      console.log("error : ", e);
      return res.status(500).json("failed to save user info");
    });

  // .then(
  // () => res.json("succeed to changing user info"),
  // when I didn't return any data to front end process was waiting on and never finished.
  // so I return this and process works well in front end
  // though the response data type I put in front code is undefined
  // )
};
export const getUserInfoController: RequestHandler = (req, res) => {
  const { userName } = req.params;
  // get user info from DB
  findByUserName(userName)
    .then((_userInfo) => {
      if (_userInfo) {
        const userInfo = {
          userName,
          userImg: { src: _userInfo.userImgSrc, position: _userInfo.userImgPosition },
          userBG: { src: _userInfo.userBGSrc, position: _userInfo.userBGPosition },
        };
        return res.json(userInfo);
      }
      return res.status(400).json("this user doesn't exist in DB");
    })
    .catch((e) => {
      console.log("error : ", e);
      return res.status(500).json("failed to get user info");
    });
};
