import express from "express"; // import를 써야 express의 콜백(app.get("/", (req, res) ...에서 req, res)의 타입을 읽을 수 있음(@types/express 설치 후)
import https from "https";
import fs from "fs";
import { Server } from "socket.io";
import cors from "cors";
import cookieParser from "cookie-parser";
import novels from "./routes/novels";
import user from "./routes/user";
import contents from "./routes/contents";

const app = express();

const sslOptionsForDev = {
  key: fs.readFileSync(require.resolve("../domainfordev.com-key.pem"), { encoding: "utf8" }),
  cert: fs.readFileSync(require.resolve("../domainfordev.com.pem"), { encoding: "utf8" }),
};

const server =
  process.env.NODE_ENV === "production"
    ? https.createServer(app)
    : https.createServer(sslOptionsForDev, app);
const corsOrigin =
  process.env.NODE_ENV === "production"
    ? "https://eliveli.github.io/NovelTime_client"
    : "https://domainfordev.com:3000";

const corsOptions = {
  origin: corsOrigin,
  allowedHeaders: ["Content-Type", "Authorization", "x-csrf-token"],
  exposedHeaders: ["*", "Authorization"],
  credentials: true,
};
// credentials 사용자 인증이 필요한 리소스 접근이 필요한 경우 true
app.use(cors(corsOptions));
app.use(cookieParser());

// Init Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.json({ code: "200", message: "success!" });
});

// use Routes
app.use("/novels", novels);
app.use("/user", user);
app.use("/contents", contents);

// socket io server // configure private message
// -- it is required
// -- configure from backend!! : variable isContinuous------------------
// when user send a message,
// get one just before the message from database
// if two are same in userName, createTime,
//
// look at the socket client event handler
// set isContinuous, isContinuousFirst, isContinuousLast of two messages
//
// and send the current message to user
// ------------------------------------------------------------------//

const io = new Server(server, {
  cors: {
    origin: corsOrigin,
    allowedHeaders: ["my-custom-header"],
    credentials: true,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  socket.on("join room", (roomId: string) => {
    socket.join(roomId);
  });

  socket.on("send message", (data) => {
    io.to(data.roomId).emit("new message", data.msg);
    console.log("inside end message");
  });

  socket.on("disconnect", (reason) => {
    console.log("user disconnected");
  });

  console.log("outside send message ");
});

const port = process.env.PORT || 8082;
// left || right  :  if left is "falsy value" then get right    //falsy value: null, undefined, 0, "", '', ``, false, NaN(Not a Number), etc
// left ?? right  :  if left is "null or undefined" then get right

server.listen(port, () => console.log(`server running on port ${port}`));
