import express from "express"; // import를 써야 express의 콜백(app.get("/", (req, res) ...에서 req, res)의 타입을 읽을 수 있음(@types/express 설치 후)
import http from "http";
import { Server } from "socket.io";
import cookieParser from "cookie-parser";
import home from "./routes/home";
import writing from "./routes/writing";
import comment from "./routes/comment";
import novels from "./routes/novels";
import user from "./routes/user";
import userContent from "./routes/userContent";
import chat from "./routes/chat";

const app = express();

const server = http.createServer(app);
app.use(cookieParser());

// Init Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// use Routes
app.use("/api/home", home);
app.use("/api/writing", writing);
app.use("/api/comment", comment);
app.use("/api/novels", novels);
app.use("/api/user", user);
app.use("/api/userContent", userContent);
app.use("/api/chat", chat);

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

const io = new Server(server, { path: "/socket.io" });

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

const port = 8082;

server.listen(port, () => console.log(`server running on port ${port}`));
