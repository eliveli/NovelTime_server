import pool from "../../configs/db";

const query = {
  checkForDuplicate: " SELECT * FROM user WHERE userName = (?) ",
};

export const checkUserName = (newUserName: string) =>
  new Promise(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.checkForDuplicate, newUserName)
          .then((data) => {
            resolve(data);
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
