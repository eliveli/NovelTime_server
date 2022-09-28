import db from "../utils/db";

type UserId = { userId: string };
export default async function getUserId(userName: string) {
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
