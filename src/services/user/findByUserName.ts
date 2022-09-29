import { markDuplicates } from "../oauth/oauth.utils";
import db from "../utils/db";
import { UserInfoInDB } from "../utils/types";

export default async function findByUserName(newUserName: string) {
  return (await db(
    "SELECT * FROM user WHERE userName = (?)",
    [newUserName],
    "first",
  )) as UserInfoInDB;
}
export async function loopForCheckingUserName(userName: string) {
  let newUserName = userName;
  let breakLoop = false;

  for (const mark of markDuplicates) {
    console.log("loopForCheckingUserName - mark:", mark);
    console.log("newUserName:", newUserName);

    const userInfo = await findByUserName(newUserName);
    // if the user name already exists in DB
    // 즁복 방지를 위해 직전 회차에 넣었던 마지막 문자 제거
    if (userInfo && mark !== "0") {
      newUserName = newUserName.substring(0, newUserName.length - 1);
    }
    if (userInfo) {
      // add an character into the user name to avoid duplicates
      newUserName += mark;
    } else {
      // break loop to get the user name that doesn't exist in DB
      breakLoop = true;
    }

    if (breakLoop) break;
  }

  return newUserName;
}
