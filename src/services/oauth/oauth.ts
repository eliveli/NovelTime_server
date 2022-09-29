import dotenv from "dotenv";
import fetch from "node-fetch";
import { getTextLength, markDuplicates } from "./oauth.utils";
import findByUserName, { loopForCheckingUserName } from "../user/findByUserName";
import { UserInfo, UserInfoInDB } from "../utils/types";
import db from "../utils/db";

dotenv.config();

async function getTokenKakao(code: string) {
  const REDIRECT_URI =
    process.env.NODE_ENV === "production"
      ? "http://www.noveltime.shop/oauth/callback/kakao"
      : "http://domainfordev.com/oauth/callback/kakao";

  type BodyDataType = {
    grant_type: string;
    client_id: string;
    redirectUri: string;
    code: string;
  };
  const bodyData: BodyDataType = {
    grant_type: "authorization_code",
    client_id: process.env.KAKAO_CLIENT_ID as string,
    redirectUri: REDIRECT_URI,
    code,
  };
  const queryStringBody = Object.keys(bodyData)
    .map((k) => `${encodeURIComponent(k)}=${encodeURI(bodyData[k as keyof BodyDataType])}`)
    .join("&");

  return (await fetch("https://kauth.kakao.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body: queryStringBody, // only query string required for redirect uri
  })
    .then((res) => {
      console.log("token from server : ", res);
      return res.json();
    })
    .catch((err) => {
      console.log("in service, getTokenKakao error: ", err);
    })) as unknown;
}

async function getTokenNaver(code: string) {
  const BEFORE_ENCODED_URI_NAVER = process.env.NAVER_STATE as string;
  const NAVER_STATE = encodeURI(BEFORE_ENCODED_URI_NAVER);

  return (await fetch(
    `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${
      process.env.NAVER_CLIENT_ID as string
    }&client_secret=${process.env.NAVER_CLIENT_SECRET as string}&code=${code}&state=${NAVER_STATE}`,
  )
    .then((res) => {
      console.log("token info from server : ", res);
      return res.json();
    })
    .catch((err) => {
      console.log("in service, getTokenNaver error: ", err);
    })) as unknown;
}

async function getUserInfoKakao(accessToken: string) {
  return (await fetch("https://kapi.kakao.com/v2/user/me", {
    method: "GET",
    headers: {
      "Content-type": "application/x-www-form-urlencoded;charset=utf-8",
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((res) => {
      console.log("user info : ", res);
      return res.json();
    })
    .catch((err) => {
      console.log("in service, getUserInfoKakao : ", err);
    })) as unknown;
}

async function getUserInfoNaver(accessToken: string) {
  return (await fetch("https://openapi.naver.com/v1/nid/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((res) => {
      console.log("user info : ", res);
      return res.json();
    })
    .catch((err) => {
      console.log("in service, getUserInfoNaver : ", err);
    })) as unknown;
}

async function getUserInfoGoogle(accessToken: string) {
  return (await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((res) => {
      console.log("user info by google: ", res);
      return res.json();
    })
    .catch((err) => {
      console.log("in service, getUserInfoGoogle : ", err);
    })) as unknown;
}

export async function setNewUserDB(userInfo: UserInfo) {
  await db("INSERT INTO user values (?,?,?,?,?,?,?)", [
    userInfo.userId,
    userInfo.userName,
    userInfo.userImg.src,
    userInfo.userImg.position,
    userInfo.userBG.src,
    userInfo.userBG.position,
    "", // for refresh token
  ]);
}

async function getUserInfoDB(userId: string) {
  return (await db(
    "SELECT userName, userImgSrc, userImgPosition, userBGSrc, userBGPosition FROM user WHERE userId = (?) ",
    userId,
    "first",
  )) as UserInfoInDB;
}

function getUserInfo({ userInfo }: { userInfo: UserInfo }) {
  // login user or signup user //
  // - if user exists in DB, set new refresh token
  //   (because user can login in other computer, refresh token must be reset in DB.
  //   - one situation. there is two computer A, B
  //     at first user loin in computer A, second login in computer B,
  //     last login in computer A again.
  //     there are access token and refresh token in computer A,
  //     but refresh token is different from one in DB,
  //     access token can't be reissue.
  //     in this case, user must login again and get new tokens.
  // - if user is new(signup user), set new user info in DB

  return getUserInfoDB(userInfo.userId).then((userInfoDB) => {
    // 1. user who is in DB //
    if (userInfoDB?.userName) {
      return {
        userId: userInfo.userId,
        userName: userInfoDB.userName,
        userImg: {
          src: userInfoDB.userImgSrc,
          position: userInfoDB.userImgPosition,
        },
        userBG: {
          src: userInfoDB.userBGSrc,
          position: userInfoDB.userBGPosition,
        },
      };
    }
    // 2. new user //
    const currentUserName = userInfo.userName;
    const userNameAsBytes = getTextLength(currentUserName);
    let newUserName = currentUserName;
    // - cut the user name : that is limited in 12 bytes
    if (userNameAsBytes[0] > 12) {
      newUserName = currentUserName.substring(0, userNameAsBytes[1] + 1);
    }

    return (
      // - check for duplicate username
      findByUserName(newUserName)
        .then((_userInfo) => {
          if (_userInfo) {
            // if the user name already exists in DB
            // : set the user name except its last character and check for duplicates
            newUserName = newUserName.substring(0, newUserName.length - 1);
            console.log("checkUsername - newUserName:", newUserName);
          }
          return newUserName;
        })
        .then((userName) => loopForCheckingUserName(userName))
        .then(async (changedUserName) => {
          const newUserInfo = { ...userInfo, userName: changedUserName };

          console.log("changedUserName:", changedUserName);
          console.log("newUserInfo:", newUserInfo);
          await setNewUserDB(newUserInfo);
          return newUserInfo;
        })

        .catch((err) => {
          console.log(err);
        })
    );
  });
}

export async function setRefreshTokenDB(userId: string, refreshToken: string) {
  await db("UPDATE user SET refreshToken = (?) WHERE userId = (?)", [refreshToken, userId]);
}

export async function deleteRefreshTokenDB(userId: string) {
  await db("UPDATE user SET refreshToken = (?) WHERE userId = (?)", ["", userId]);
}
export async function getRefreshTokenDB(userId: string) {
  return (await db("SELECT refreshToken FROM user WHERE userId = (?) ", userId, "first")) as {
    refreshToken: string;
  };
}
// expire seconds //
// function expireAt(expireIn: number) {
//   const timestampSecond = +new Date() / 1000; // current time stamp seconds
//   return timestampSecond + expireIn;
// }
type UserInfoKakao = {
  kakao_account: { email: string };
  properties: {
    nickname: string;
    profile_image: string;
  };
};
async function loginKakao(code: string) {
  const tokenKakao = (await getTokenKakao(code)) as { access_token: string };
  const token = {
    accessToken: tokenKakao.access_token,
    // accessTokenExpireAt: expireAt(tokenKakao.expires_in as number),
    // refreshToken: tokenKakao.refresh_token as string,
    // refreshTokenExpireAt: expireAt(tokenKakao.refresh_token_expires_in as number),
  };
  const userInfoKakao = (await getUserInfoKakao(token.accessToken)) as UserInfoKakao;
  const userInfo = {
    userId: `kakao ${userInfoKakao.kakao_account.email}`,
    userName: userInfoKakao.properties.nickname,
    userImg: {
      src: userInfoKakao.properties.profile_image,
      position: "",
    },
    userBG: { src: "", position: "" },
  };

  return getUserInfo({ userInfo });
}

type UserInfoNaver = {
  response: {
    email: string;
    nickname: string;
    profile_image: string;
  };
};
async function loginNaver(code: string) {
  const tokenNaver = (await getTokenNaver(code)) as { access_token: string };
  const userInfoNaver = (await getUserInfoNaver(tokenNaver.access_token)) as UserInfoNaver;
  const userInfo = {
    userId: `naver ${userInfoNaver.response.email}`,
    userName: userInfoNaver.response.nickname,
    userImg: {
      src: userInfoNaver.response.profile_image,
      position: "",
    },
    userBG: { src: "", position: "" },
  };

  return getUserInfo({ userInfo });
}

type UserInfoGoogle = {
  id: string;
  name: string;
  picture: string;
};
async function loginGoogle(accessToken: string) {
  const userInfoByGoogle = (await getUserInfoGoogle(accessToken)) as UserInfoGoogle;
  const userInfo = {
    userId: `google ${userInfoByGoogle.id}`,
    userName: userInfoByGoogle.name,
    userImg: {
      src: userInfoByGoogle.picture,
      position: "",
    },
    userBG: { src: "", position: "" },
  };

  return getUserInfo({ userInfo });
}

export async function loginOauthServer(oauthServer: string, oauthData: string) {
  if (oauthServer === "kakao") {
    return loginKakao(oauthData);
  }
  if (oauthServer === "naver") {
    return loginNaver(oauthData);
  }
  if (oauthServer === "google") {
    return loginGoogle(oauthData);
  }
}
