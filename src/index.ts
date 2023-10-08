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
import createMessage, { MessageWithSocket } from "./services/chat/createMessage";
import changeMessageRead from "./services/chat/changeMessageRead";
import getRooms from "./services/chat/getRooms";
import getMessages from "./services/chat/getMessages";

const app = express();

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

const server = http.createServer(app);

const io = new Server(server, { path: "/socket.io" });

io.on("connection", (socket) => {
  // { [userId: string] : socket.id } []
  const users: { [userId: string]: string }[] = [];

  socket.on("join a room", (roomId: string) => {
    socket.join(roomId);
    console.log("user joins the room:", roomId);
  });

  socket.on("join all rooms", async (userId: string) => {
    users.push({ [userId]: socket.id });

    const rooms = await getRooms(userId);

    rooms.forEach((room) => {
      socket.join(room.roomId);
      console.log("user joins the room:", room.roomId);
    });

    // send rooms to the user
    io.in(socket.id).emit("rooms", rooms);
  });

  socket.on("get messages", async ({ roomId, userId }: { roomId: string; userId: string }) => {
    try {
      const data = await getMessages(roomId, userId);

      io.in(socket.id).emit("messages in the room", { status: 200, data });

      console.log("data from an event get-messages:", data);
      //
    } catch (error: any) {
      console.log(error);

      if (error.message === "room doesn't exist" || error.message === "user is not in the room") {
        io.in(socket.id).emit("messages in the room", {
          status: 400,
          error: { message: error.message },
        });
      } else {
        io.in(socket.id).emit("messages in the room", {
          status: 500,
          error: { message: undefined },
        });
      }
    }
  });

  socket.on("send message", async (data: MessageWithSocket) => {
    const messageToUser = await createMessage({ ...data });

    io.to(data.roomId).emit("new message", messageToUser);

    console.log("message was sent to the room:", data.roomId);
  });

  socket.on("change message read", async (messageId: string) => {
    await changeMessageRead(messageId);

    console.log("change message read");
  });

  socket.on("disconnect", (reason) => {
    console.log("user disconnected");
  });

  console.log("socket connection fired");
});

const port = 8082;

server.listen(port, () => console.log(`server running on port ${port}`));
