import pool from "../../../configs/db";

type DataType = {
  [key: string]: any;
};

it("test when trying to get data that is not in DB", async () => {
  const connection = await pool.getConnection();
  const data = (await connection.query(
    "SELECT novelId FROM writing where novelId='no novel id'",
    undefined,
  )) as DataType[];

  // console.log("data:", data); // including meta data

  // - data from DB : []
  // expect(data).toHaveLength(1); // fail
  // Expected length: 1
  // Received length: 0
  // Received array:  []

  // - when second arg of db function is "raw"
  // -> return []    as original data

  // - when second arg of db function is "all"
  // -> return []
  // expect(data.slice(0, data.length)).toHaveLength(1); // fail
  // Expected length: 1
  // Received length: 0
  // Received array:  []

  // - when second arg of db function is "first"
  // -> return undefined
  //   const [dataReturned] = data;
  //   console.log("dataReturned:", dataReturned); // undefined
});
