import db from "../../utils/db";
import { UserImgAndNameInDB } from "../../utils/types";

export async function getUserNameAndImgFromDB(userId: string) {
  return (await db(
    "SELECT userName, userImgSrc, userImgPosition FROM user WHERE userId = (?)",
    userId,
    "first",
  )) as UserImgAndNameInDB;
}
export default async function getUserNameAndImg(userId: string) {
  const user = await getUserNameAndImgFromDB(userId);

  if (!user) return;

  return {
    userName: user.userName,
    userImg: { src: user.userImgSrc, position: user.userImgPosition },
  };
}
