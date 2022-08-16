/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable consistent-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable implicit-arrow-linebreak */
/* eslint-disable import/prefer-default-export */
import dotenv from "dotenv";
import fetch from "node-fetch";
import pool from "../../configs/db";
import { getTextLength, markDuplicates } from "./oauth.utils";
import findByUserName, { loopForCheckingUserName } from "../user/findByUserName";

dotenv.config();

async function getTokenKakao(code: string) {
  const REDIRECT_URI =
    process.env.NODE_ENV === "production"
      ? ""
      : "https://domainfordev.com:3000/oauth/callback/kakao";

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

  try {
    return await fetch("https://kauth.kakao.com/oauth/token", {
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
        console.log("in service : fail when getting token : ", err);
      });
  } catch (error) {
    console.log("in service, getAccessToken error: ", error);
  }
}

async function getTokenNaver(code: string) {
  const BEFORE_ENCODED_URI_NAVER = process.env.NAVER_STATE as string;
  const NAVER_STATE = encodeURI(BEFORE_ENCODED_URI_NAVER);

  try {
    return await fetch(
      `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${
        process.env.NAVER_CLIENT_ID as string
      }&client_secret=${
        process.env.NAVER_CLIENT_SECRET as string
      }&code=${code}&state=${NAVER_STATE}`,
    )
      .then((res) => {
        console.log("token info from server : ", res);
        return res.json();
      })
      .catch((err) => {
        console.log("in service : fail when getting token : ", err);
      });
  } catch (error) {
    console.log("in service, getToken error: ", error);
  }
}

async function getUserInfoKakao(accessToken: string) {
  try {
    return await fetch("https://kapi.kakao.com/v2/user/me", {
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
        console.log("in service : fail when getting user info : ", err);
      });
  } catch (error) {
    console.log("in service, getUserInfoKakao error: ", error);
  }
}

async function getUserInfoNaver(accessToken: string) {
  try {
    return await fetch("https://openapi.naver.com/v1/nid/me", {
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
        console.log("in service : fail when getting user info : ", err);
      });
  } catch (error) {
    console.log("in service, getUserInfoNaver error: ", error);
  }
}

async function getUserInfoGoogle(accessToken: string) {
  try {
    return await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
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
        console.log("in service : fail when getting user info : ", err);
      });
  } catch (error) {
    console.log("in service, getUserInfoGoogle error: ", error);
  }
}

type UserInfo = {
  userId: string;
  userName: string;
  userImg: {
    src: string;
    position: string;
  };
  userBG: {
    src: string;
    position: string;
  };
};
export const setNewUserDB = async (userInfo: UserInfo) => {
  await pool
    .getConnection()
    .then((connection) => {
      connection
        .query("INSERT INTO user values (?,?,?,?,?,?,?)", [
          userInfo.userId,
          userInfo.userName,
          userInfo.userImg.src,
          userInfo.userImg.position,
          userInfo.userBG.src,
          userInfo.userBG.position,
          "", // for refresh token
        ])
        .then(() => {
          // When done with the connection, release it.
          connection.release();
        })

        .catch((err) => {
          console.log(err);
          connection.release();
        });
    })
    .catch((err) => {
      console.log(`not connected due to error: ${err}`);
    });
};

function getUserInfoDB(userId: string): Promise<any> {
  return new Promise(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(
            "SELECT userName, userImgSrc, userImgPosition, userBGSrc, userBGPosition FROM user WHERE userId = (?) ",
            userId,
          )
          .then((data) => {
            connection.release();
            resolve(data);
          })
          .catch((err) => {
            console.log(err);
            connection.release();
          });
      })
      .catch((err) => {
        console.log(`not connected due to error: ${err}`);
      });
  });
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

  return getUserInfoDB(userInfo.userId).then((data) => {
    // 1. user who is in DB //
    if (data[0]?.userName) {
      return {
        userId: userInfo.userId,
        userName: data[0].userName,
        userImg: {
          src: data[0].userImgSrc,
          position: data[0].userImgPosition,
        },
        userBG: {
          src: data[0].userBGSrc,
          position: data[0].userBGPosition,
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
        .then((data1) => {
          if (data1[0]) {
            // if the user name already exists in DB
            // : set the user name except its last character and check for duplicates
            newUserName = newUserName.substring(0, newUserName.length - 1);
            console.log("checkUsername - newUserName:", newUserName);
          }
          return newUserName;
        })
        .then((userName) => loopForCheckingUserName(userName))
        .then((changedUserName) => {
          const newUserInfo = { ...userInfo, userName: changedUserName };

          console.log("changedUserName:", changedUserName);
          console.log("newUserInfo:", newUserInfo);
          setNewUserDB(newUserInfo);
          return newUserInfo;
        })

        .catch((err) => {
          console.log(err);
        })
    );
  });
}

export const setRefreshTokenDB = async (userId: string, refreshToken: string) =>
  pool
    .getConnection()
    .then((connection) => {
      connection
        .query("UPDATE user SET refreshToken = (?) WHERE userId = (?)", [refreshToken, userId])
        .then(() => {
          // When done with the connection, release it.
          connection.release();
        })

        .catch((err) => {
          console.log(err);
          connection.release();
        });
    })
    .catch((err) => {
      console.log(`not connected due to error: ${err}`);
    });

export function deleteRefreshTokenDB(userId: string) {
  pool
    .getConnection()
    .then((connection) => {
      connection
        .query("UPDATE user SET refreshToken = (?) WHERE userId = (?)", ["", userId])
        .then(() => {
          connection.release();
        })
        .catch((err) => {
          console.log(err);
          connection.release();
        });
    })
    .catch((err) => {
      console.log(`not connected due to error: ${err}`);
    });
}
export async function getRefreshTokenDB(userId: string): Promise<any> {
  return new Promise(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query("SELECT refreshToken FROM user WHERE userId = (?) ", userId)
          .then((data) => {
            connection.release();
            resolve(data);
          })
          .catch((err) => {
            console.log(err);
            connection.release();
          });
      })
      .catch((err) => {
        console.log(`not connected due to error: ${err}`);
      });
  });
}
// expire seconds //
// function expireAt(expireIn: number) {
//   const timestampSecond = +new Date() / 1000; // current time stamp seconds
//   return timestampSecond + expireIn;
// }

async function loginKakao(code: string) {
  const tokenKakao = await getTokenKakao(code);
  const token = {
    accessToken: tokenKakao.access_token as string,
    // accessTokenExpireAt: expireAt(tokenKakao.expires_in as number),
    // refreshToken: tokenKakao.refresh_token as string,
    // refreshTokenExpireAt: expireAt(tokenKakao.refresh_token_expires_in as number),
  };

  const userInfoKakao = await getUserInfoKakao(token.accessToken);
  const userInfo = {
    userId: `kakao ${userInfoKakao.kakao_account.email as string}`,
    userName: userInfoKakao.properties.nickname as string,
    userImg: {
      src: userInfoKakao.properties.profile_image as string,
      position: "",
    },
    userBG: { src: "", position: "" },
  };

  return getUserInfo({ userInfo });
}

async function loginNaver(code: string) {
  const tokenNaver = await getTokenNaver(code);

  const userInfoNaver = await getUserInfoNaver(tokenNaver.access_token as string);
  console.log("userInfoNaver:", userInfoNaver);
  const userInfo = {
    userId: `naver ${userInfoNaver.response.email as string}`,
    userName: userInfoNaver.response.nickname as string,
    userImg: {
      src: userInfoNaver.response.profile_image as string,
      position: "",
    },
    userBG: { src: "", position: "" },
  };

  return getUserInfo({ userInfo });
}

async function loginGoogle(accessToken: string) {
  const userInfoByGoogle = await getUserInfoGoogle(accessToken);

  const userInfo = {
    userId: `google ${userInfoByGoogle.id as string}`,
    userName: userInfoByGoogle.name as string,
    userImg: {
      src: userInfoByGoogle.picture as string,
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
