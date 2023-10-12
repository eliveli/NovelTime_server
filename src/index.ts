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
import createMessage, { MessageWithSocket } from "./services/chat/createMessage";
import changeMessageRead from "./services/chat/changeMessageRead";
import getRooms from "./services/chat/getRooms";
import getMessages from "./services/chat/getMessages";
import createRoom from "./services/chat/createRoom";

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

const server = http.createServer(app);

const io = new Server(server, { path: "/socket.io" });

// { [userId: string] : socket.id } []
const users: { [userId: string]: string } = {};

io.on("connection", (socket) => {
  socket.on("join all rooms", async (userId: string) => {
    users[userId] = socket.id;

    const rooms = await getRooms(userId);

    rooms.forEach((room) => {
      socket.join(room.roomId);
      console.log("user joins the room:", room.roomId);
    });

    // send rooms to the user
    io.in(socket.id).emit("rooms", rooms);
  });

  socket.on("create a room", async (loginUserId: string, partnerUserName: string) => {
    try {
      const { room, partnerUserId, type } = await createRoom(partnerUserName, loginUserId);

      // join the room if the room was created just before
      if (type === "new") {
        socket.join(room.roomId);

        if (users[partnerUserId]) {
          // make the partner join if he/she logged in
          io.in(users[partnerUserId]).socketsJoin(room.roomId);
        }
      }

      // send new room to login user
      io.in(socket.id).emit("newRoom", { status: 200, data: room });
      // - partner user can know that he/she was invited to the room
      //    when the login user sends a message in the room

      console.log("new room is:", room);
      //
    } catch (error: any) {
      console.log(error);

      if (error.message === "user doesn't exist") {
        io.in(socket.id).emit("newRoom", {
          status: 400,
          error: { message: error.message },
        });
      } else {
        io.in(socket.id).emit("newRoom", {
          status: 500,
          error: { message: undefined },
        });
      }
    }
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

  socket.on("logout", async (userId: string) => {
    // leave all the room he/she joined
    io.in(socket.id).socketsLeave([...socket.rooms]); // socket.rooms holds socket id as a room

    // remove the user
    delete users[userId];

    console.log("user disconnected");
  });

  // when the page is refreshed or the user leaves the website
  // - user automatically leaves all the room he/she joined
  socket.on("disconnect", async (reason) => {
    // remove the user
    const [currentUser] = Object.entries(users).filter(
      ([userId, socketId]) => socketId === socket.id,
    );
    if (currentUser) {
      delete users[currentUser[0]];
    }

    console.log("user disconnected, reason:", reason);
  });

  console.log("socket connection fired");
});

const port = 8082;

server.listen(port, () => console.log(`server running on port ${port}`));
