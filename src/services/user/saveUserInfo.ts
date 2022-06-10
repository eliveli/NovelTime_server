import pool from "../../configs/db";

const query = {
  saveUserInfoInDB: `UPDATE user SET userName = (?), userImgSrc = (?),
     userImgPosition = (?), userBGSrc = (?),  userBGPosition = (?)
    WHERE userId = (?)`,
};

type ChangedImg = {
  src: string;
  position: string;
};

export default async function saveUserInfo(
  userId: string,
  changedUserName: string,
  changedUserImg: ChangedImg,
  changedUserBG: ChangedImg,
) {
  await pool
    .getConnection()
    .then((connection) => {
      connection
        .query(query.saveUserInfoInDB, [
          changedUserName,
          changedUserImg.src,
          changedUserImg.position,
          changedUserBG.src,
          changedUserBG.position,
          userId,
        ])
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
