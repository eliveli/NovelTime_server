import pool from "../../configs/db";

const query = {
  checkForDuplicate: " SELECT * FROM user WHERE userName = (?) ",
};

// eslint-disable-next-line import/prefer-default-export
export const checkUserName = (newUserName: string) =>
  // default return type is unknown. it makes error so I changed it as any
  new Promise<any>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.checkForDuplicate, [newUserName])
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
