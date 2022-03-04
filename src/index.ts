import express from "express"; // import를 써야 express의 콜백(app.get("/", (req, res) ...에서 req, res)의 타입을 읽을 수 있음(@types/express 설치 후)

// routes
import novels from "./routes/novels";

const cors = require("cors");

const app = express();

const corsOptions = { origin: "http://localhost:3000", credentials: true };
// credentials 사용자 인증이 필요한 리소스 접근이 필요한 경우 true
app.use(cors(corsOptions));

// Init Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.json({ code: "200", message: "success!" });
});

// use Routes
app.use("/novels", novels);

const port = process.env.PORT || 8082;
// left || right  :  if left is "falsy value" then get right    //falsy value: null, undefined, 0, "", '', ``, false, NaN(Not a Number), etc
// left ?? right  :  if left is "null or undefined" then get right

app.listen(port, () => console.log(`server running on port ${port}`));
