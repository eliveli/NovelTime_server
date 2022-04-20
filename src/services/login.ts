/* eslint-disable import/prefer-default-export */
import dotenv from "dotenv";
import fetch from "node-fetch";
import pool from "../configs/db";

dotenv.config();

async function getAccessToken(code: string) {
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

export async function oauthKakao(code: string) {
  return await getAccessToken(code);
}
