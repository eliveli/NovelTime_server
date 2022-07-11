import pool from "../../configs/db";
import { query } from "./contents.utils";

export default function getUserId(userName: string) {
  return new Promise<string>(async (resolve) => {
    await pool
      .getConnection()
      .then((connection) => {
        connection
          .query(query.getUserId, userName)
          .then((data) => {
            const { userId } = data[0];
            resolve(userId as string);

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
