// const express = require("express");
import express from "express"; // require() 사용 시 설치한 모듈의 type을 읽을 수 없음(@types/express)

// const connectDB = require("./db");

const cors = require("cors");

const app = express();

const corsOptions = { origin: "http://localhost:3000", credentials: false };
// credentials 사용자 인증이 필요한 리소스 접근이 필요한 경우 true

app.use(cors(corsOptions));

app.get("/", (req, res) => {
  res.json({ code: "200", message: "success!" });
});

const port = process.env.PORT || 8082;
app.listen(port, () => console.log(`server running on port ${port}`));
