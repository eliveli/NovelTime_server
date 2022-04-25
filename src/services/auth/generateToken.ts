import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const privateKey = process.env.JWT_PRIVATE_KEY;

interface UserInfo {
  userInfo: { userId: string; userName: string; userImg: string };
}
export function generateAccessToken({ userInfo }: UserInfo) {
  const jwtExpirySeconds = 1800; // 30 min
  const accessToken = jwt.sign(userInfo, privateKey as string, {
    algorithm: "HS256",
    expiresIn: jwtExpirySeconds,
  });
  console.log("access token: ", accessToken);
  return accessToken;
}
export function generateRefreshToken({ userInfo }: UserInfo) {
  const jwtExpirySeconds = 5184000; // 2 months
  const refreshToken = jwt.sign(userInfo, privateKey as string, {
    algorithm: "HS256",
    expiresIn: jwtExpirySeconds,
  });
  console.log("refresh token: ", refreshToken);
  return refreshToken;
}
export function generateToken({ userInfo }: UserInfo) {
  const accessToken = generateAccessToken({ userInfo });
  const refreshToken = generateRefreshToken({ userInfo });

  return { accessToken, refreshToken };
}
