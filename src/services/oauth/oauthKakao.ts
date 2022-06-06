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

dotenv.config();

async function getTokenKakao(code: string) {
  // 개발 환경에 따라 달라짐. NODE_ENV 환경변수 미리 설정
  const REDIRECT_URI =
    process.env.NODE_ENV === "production" ? "" : "http://domainfordev:3000/oauth/callback/kakao";

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
export async function loginKakao(code: string) {
  const tokenKakao = await getTokenKakao(code);
  const token = {
    accessToken: tokenKakao.access_token as string,
    // accessTokenExpireAt: expireAt(tokenKakao.expires_in as number),
    // refreshToken: tokenKakao.refresh_token as string,
    // refreshTokenExpireAt: expireAt(tokenKakao.refresh_token_expires_in as number),
  };

  const userInfoKakao = await getUserInfoKakao(token.accessToken);
  const userInfo = {
    userId: userInfoKakao.kakao_account.email as string,
    userName: userInfoKakao.properties.nickname as string,
    userImg: {
      src: userInfoKakao.properties.profile_image as string,
      position: "",
    },
    userBG: { src: "", position: "" },
  };

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
    // user who is in DB
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
    // new user
    setNewUserDB(userInfo);
    return userInfo;
  });
}
