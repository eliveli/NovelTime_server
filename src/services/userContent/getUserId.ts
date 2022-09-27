import db from "../utils/db";
import { query } from "../utils/query";

// type UserId = { userId: string };
export default async function getUserId(userName: string) {
  const data = await db(query.getUserId, userName);

  if (data && Object.keys(data)[0] === "userId") {
    const { userId } = data;
    return userId as string;
  }
}
