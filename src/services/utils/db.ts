import pool from "../../configs/db";

export default async function db(dbQuery: string, args: any, isRaw?: true) {
  let dataReturned: any; // avoid ts error following returning undefined
  try {
    const connection = await pool.getConnection();

    try {
      const data = (await connection.query(dbQuery, args)) as { [key: string]: any }[];
      if (isRaw) {
        dataReturned = data;
      } else if (data.length > 1) {
        dataReturned = data.slice(0, data.length);
      } else {
        [dataReturned] = data; // array destructuring // dataReturned = data[0]
      }

      // When done with the connection, release it.
      await connection.release();
    } catch (err) {
      console.log("error: ", err);
      await connection.release();
    }
  } catch (err) {
    console.log("not connected due to error: ", err);
  }
  return dataReturned;
}
