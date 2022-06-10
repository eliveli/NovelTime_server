import pool from "../../configs/db";

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
