/* eslint-disable @typescript-eslint/no-misused-promises */
import pool from "../../configs/db";

export default function db(dbQuery: string, args: any) {
  return new Promise<any>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(dbQuery, args)
          .then(async (data) => {
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
