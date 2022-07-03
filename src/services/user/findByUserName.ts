import pool from "../../configs/db";
import { markDuplicates } from "../oauth/oauth.utils";

const query = {
  checkForDuplicate: " SELECT * FROM user WHERE userName = (?) ",
};

export default function findByUserName(newUserName: string) {
  // default return type is unknown. it makes error so I changed it as any
  return new Promise<any>((resolve) => {
    pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.checkForDuplicate, [newUserName])
          .then((data) => {
            resolve(data);
            console.log("findByUserName data[0]:", data[0]);
            // When done with the connection, release it.
            connection.release();
          })

          .catch((err) => {
            console.log(err);
            connection.release();
          });
      })
      .catch((err) => {
        console.log(`not connected due to error: ${err}`);
      });
  });
}
export async function loopForCheckingUserName(userName: string) {
  let newUserName = userName;
  let breakLoop = false;

  for (const mark of markDuplicates) {
    console.log("loopForCheckingUserName - mark:", mark);
    console.log("newUserName:", newUserName);

    await findByUserName(newUserName).then((data2) => {
      // if the user name already exists in DB
      // 즁복 방지를 위해 직전 회차에 넣었던 마지막 문자 제거
      if (data2[0] && mark !== "0") {
        newUserName = newUserName.substring(0, newUserName.length - 1);
      }
      // add an character into the user name to avoid duplicates
      if (data2[0]) {
        newUserName += mark;
      }
      // break loop to get the user name that doesn't exist in DB
      else {
        breakLoop = true;
      }
    });
    if (breakLoop) break;
  }

  return newUserName;
}
