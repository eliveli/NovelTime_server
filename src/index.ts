import express from "express"; // import를 써야 express의 콜백(app.get("/", (req, res) ...에서 req, res)의 타입을 읽을 수 있음(@types/express 설치 후)
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import home from "./routes/home";
import novels from "./routes/novels";
import user from "./routes/user";
import contents from "./routes/contents";

const app = express();

const server = http.createServer(app);
app.use(cookieParser());

// Init Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// use Routes
app.use("/api", home);
app.use("/api/novels", novels);
app.use("/api/user", user);
app.use("/api/contents", contents);

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

const io = new Server(server);

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
