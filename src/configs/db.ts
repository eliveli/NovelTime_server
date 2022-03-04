import mariadb from "mariadb";
// 개발 환경에 따라 환경변수 설정
// : NODE_ENV 미리 설정(터미널 CMD에서 set NODE_ENV=development) : CMD (OK), bash or powershell (NO)
if (process.env.NODE_ENV === "production") {
  require("dotenv").config({
    path: ".env.prod",
  });
  console.log("mode : " + process.env.NODE_ENV);
} else {
  require("dotenv").config({
    path: ".env.dev",
  });
  console.log("mode : " + process.env.NODE_ENV);
}

// handle undefined env variable
let DB_PORT: string;
if (process.env.DB_PORT) {
  DB_PORT = process.env.DB_PORT;
} else {
  throw new Error("environment variable is not set");
}

const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  port: parseInt(DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PW,
  connectionLimit: 10,
  database: "novelTime",
});

export default pool;
