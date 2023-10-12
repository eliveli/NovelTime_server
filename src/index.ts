import express from "express"; // import를 써야 express의 콜백(app.get("/", (req, res) ...에서 req, res)의 타입을 읽을 수 있음(@types/express 설치 후)
import http from "http";
import cookieParser from "cookie-parser";
import home from "./routes/home";
import writing from "./routes/writing";
import comment from "./routes/comment";
import novels from "./routes/novels";
import user from "./routes/user";
import userContent from "./routes/userContent";
import socketIO from "./socket";

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

socketIO(server);

const port = 8082;

server.listen(port, () => console.log(`server running on port ${port}`));
