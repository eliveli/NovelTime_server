/* eslint-disable import/prefer-default-export */
import dotenv from "dotenv";
import fetch from "node-fetch";
import pool from "../../configs/db";

dotenv.config();

async function getKakaoToken(code: string) {
  // 개발 환경에 따라 달라짐. NODE_ENV 환경변수 미리 설정
  const REDIRECT_URI =
    process.env.NODE_ENV === "production" ? "" : "http://localhost:3000/oauth/callback/kakao";

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

async function getKakaoUserInfo(accessToken: string) {
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
    console.log("in service, getUserInfo error: ", error);
  }
}

export async function loginKakao(code: string) {
  const token = await getKakaoToken(code);
  return await getKakaoUserInfo(token.access_token);
}
