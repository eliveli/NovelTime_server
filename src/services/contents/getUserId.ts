import pool from "../../configs/db";
import { query } from "./contents.utils";

type UserId = { userId: string };
export default async function getUserId(userName: string) {
  let userIdFromDB = ""; // to avoid undefined return error of es-lint
  try {
    const connection = await pool.getConnection();

    try {
      const data = (await connection.query(query.getUserId, userName)) as UserId[];

      if (!data) {
        throw new Error("user does not exist in DB");
      }
      const { userId } = data[0];

      // When done with the connection, release it.
      await connection.release();

      userIdFromDB = userId;
    } catch (err) {
      console.log("error: ", err);
      await connection.release();
    }
  } catch (err) {
    console.log("not connected due to error: ", err);
  }
  return userIdFromDB;
}
