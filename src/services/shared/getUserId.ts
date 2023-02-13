import db from "../utils/db";

type UserId = { userId: string };
export async function getUserIdBySimilarUserName(userName: string) {
  const userIdArray = (await db(
    "SELECT userId FROM user WHERE userName LIKE (?)",
    [`%${userName}%`],
    "all",
  )) as UserId[];

  if (userIdArray.length === 0) return;

  const userIDs = [];
  for (const { userId } of userIdArray) {
    userIDs.push(userId);
  }
  return userIDs;
}

export default async function getUserIdByExactUserName(userName: string) {
  const data = (await db(
    "SELECT userId FROM user WHERE userName = (?)",
    userName,
    "first",
  )) as UserId;

  if (data && Object.keys(data)[0] === "userId") {
    const { userId } = data;
    return userId;
  }
}
