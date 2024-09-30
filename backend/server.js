const dotenv = require("dotenv");
dotenv.config({ path: "./config/config.env" });
const http = require("http");
const { Server } = require("socket.io");
const app = require("./app");

const dbConnect = require("./config/dataBaseConnect");
dbConnect();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
  },
});

io.on("connection", (socket) => {
  socket.on("notify-waiting-room", (visit) => {
    io.emit("update-waiting-room", visit);
  });
  // Listen for the removeVisit event
  socket.on("removeVisit", (data) => {
    io.emit("removeVisit", data); // Notify other clients about the removal
  });
  socket.on("disconnect", () => {
    console.log("Client disconnected");
  });
});
const PORT = 3000;

server.listen(process.env.PORT || PORT, () => {
  console.log(`the server is listening on port ${process.env.PORT}`);
});
