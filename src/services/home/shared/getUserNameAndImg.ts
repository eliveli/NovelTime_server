import db from "../../utils/db";
import { UserImgAndNameInDB } from "../../utils/types";

async function getUserNameAndImgFromDB(userId: string) {
  return (await db(
    "SELECT userName, userImgSrc, userImgPosition FROM user WHERE userId = (?)",
    userId,
    "first",
  )) as UserImgAndNameInDB;
}
export default async function getUserNameAndImg(userId: string) {
  const { userName, userImgSrc, userImgPosition } = await getUserNameAndImgFromDB(userId);
  const userImg = { src: userImgSrc, position: userImgPosition };
  return { userName, userImg };
}
