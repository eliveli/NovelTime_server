import pool from "../../configs/db";
import { UserImg } from "../utils/types";

export default async function saveUserInfo(
  userId: string,
  changedUserName: string,
  changedUserImg: UserImg,
  changedUserBG: UserImg,
) {
  await pool
    .getConnection()
    .then((connection) => {
      connection
        .query(
          `UPDATE user SET userName = (?), userImgSrc = (?), userImgPosition = (?), userBGSrc = (?),  userBGPosition = (?)
       WHERE userId = (?)`,
          [
            changedUserName,
            changedUserImg.src,
            changedUserImg.position,
            changedUserBG.src,
            changedUserBG.position,
            userId,
          ],
        )
        .then(() => {
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
}
