import pool from "../../configs/db";

type DataType = {
  [key: string]: any;
};
//
// raw : original data (including meta data),
// all : all elements of data list,
// first : first element of data list
type ElementReturned = "raw" | "all" | "first" | undefined;

export default async function db(dbQuery: string, args: any, elementReturned?: ElementReturned) {
  // avoid ts error following returning undefined
  // needed to set exact type after returning value
  let dataReturned: unknown;
  try {
    const connection = await pool.getConnection();

    try {
      const data = (await connection.query(dbQuery, args)) as DataType[];

      switch (elementReturned) {
        case "raw":
          dataReturned = data; // return original array
          break;
        case "all":
          dataReturned = data.slice(0, data.length); // return array
          break;
        case "first":
          [dataReturned] = data;
          // array destructuring. same as >> dataReturned = data[0] // return dict
          break;
        // don't return any specific data
        case undefined:
          break;
        default:
          break;
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
