import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

const privateKey = process.env.JWT_PRIVATE_KEY;

export function generateAccessToken(userId: string) {
  const jwtExpirySeconds = 1800; // 30 min
  const accessToken = jwt.sign({ userId }, privateKey as string, {
    algorithm: "HS256",
    expiresIn: jwtExpirySeconds,
  });
  console.log("access token: ", accessToken);
  return accessToken;
}
export function generateRefreshToken(userId: string) {
  const jwtExpirySeconds = 5184000; // 2 months
  const refreshToken = jwt.sign({ userId }, privateKey as string, {
    algorithm: "HS256",
    expiresIn: jwtExpirySeconds,
  });
  console.log("refresh token: ", refreshToken);
  return refreshToken;
}
export function generateToken(userId: string) {
  const accessToken = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  return { accessToken, refreshToken };
}
