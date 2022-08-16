import mariadb from "mariadb";
// NODE_ENV is set by scripts in package.json
// p.s. other way to set NODE_ENV
//  : using terminal CMD. never bash or powershell. just type: set NODE_ENV=development
if (process.env.NODE_ENV === "production") {
  require("dotenv").config({
    path: ".env.prod",
  });
  console.log(`mode : ${process.env.NODE_ENV}`);
} else {
  require("dotenv").config({
    path: ".env.dev",
  });
  console.log(`mode : ${process.env.NODE_ENV}`);
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
