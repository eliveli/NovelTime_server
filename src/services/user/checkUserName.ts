import pool from "../../configs/db";
import { markDuplicates } from "../oauth/oauth.utils";

const query = {
  checkForDuplicate: " SELECT * FROM user WHERE userName = (?) ",
};

export default function checkUserName(newUserName: string) {
  // default return type is unknown. it makes error so I changed it as any
  return new Promise<any>((resolve) => {
    pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.checkForDuplicate, [newUserName])
          .then((data) => {
            resolve(data);
            console.log("checkUserName data[0]:", data[0]);
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
export function loopForCheckingUserName(userName: string) {
  // default return type is unknown. it makes error so I changed it as any
  // return new Promise<string>((resolve) => {
  let newUserName = userName;
  let breakLoop = false;
  for (let i = 0; i < markDuplicates.length; i += 1) {
    console.log("loopForCheckingUserName - i:", i, " markDuplicates[i]:", markDuplicates[i]);

    checkUserName(newUserName).then((data2) => {
      // if the user name already exists in DB
      // 즁복 방지를 위해 직전 회차에 넣었던 마지막 문자 제거
      if (data2[0] && i > 0) {
        newUserName = newUserName.substring(0, newUserName.length - 1);
        // console.log("if (data2[0] && i > 0): checkUsername again - newUserName:", newUserName);
      }
      // add an character into the user name to avoid duplicates
      if (data2[0]) {
        newUserName += markDuplicates[i];
        // console.log("if (data2[0]) : checkUsername again - newUserName:", newUserName);
      }
      // break loop to get the user name
      else {
        breakLoop = true;
      }
    });
    if (breakLoop) break;
  }
  return newUserName;
  // });
}
