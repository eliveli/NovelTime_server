import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const privateKey = process.env.JWT_PRIVATE_KEY;

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
type ChangedUserInfo = {
  userId: string;
  userName: string;
  userImgSrc: string;
  userImgPosition: string;
  userBGSrc: string;
  userBGPosition: string;
};
export function generateAccessToken(changedUserInfo: ChangedUserInfo) {
  const jwtExpirySeconds = 1800; // 30 min

  const accessToken = jwt.sign(changedUserInfo, privateKey as string, {
    algorithm: "HS256",
    expiresIn: jwtExpirySeconds,
  });
  console.log("access token: ", accessToken);
  console.log("changedUserInfo: ", changedUserInfo);
  return accessToken;
}
export function generateRefreshToken(changedUserInfo: ChangedUserInfo) {
  const jwtExpirySeconds = 5184000; // 2 months
  const refreshToken = jwt.sign(changedUserInfo, privateKey as string, {
    algorithm: "HS256",
    expiresIn: jwtExpirySeconds,
  });
  console.log("refresh token: ", refreshToken);
  return refreshToken;
}
export function generateToken({ userInfo }: { userInfo: UserInfo }) {
  const changedUserInfo = {
    userId: userInfo.userId,
    userName: userInfo.userName,
    userImgSrc: userInfo.userImg.src,
    userImgPosition: userInfo.userImg.position,
    userBGSrc: userInfo.userBG.src,
    userBGPosition: userInfo.userBG.position,
  };
  console.log("in generateToken function : userInfo:", userInfo);
  console.log("in generateToken function : changedUserInfo:", changedUserInfo);
  const accessToken = generateAccessToken(changedUserInfo);
  const refreshToken = generateRefreshToken(changedUserInfo);

  return { accessToken, refreshToken };
}
