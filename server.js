const express = require("express");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static("public"));
const PORT = process.env.PORT || 3000;

let queue = [];
let players = {};

io.on("connection", (socket) => {
  console.log("Connected:", socket.id);
  let nickname = "ผู้ใช้";

  socket.on("setNickname", ({ nickname: nick }) => {
    nickname = nick;
  });

  socket.on("joinQueue", ({ nickname: nick }) => {
    nickname = nick;
    if (queue.length > 0) {
      const opponent = queue.shift();
      const room = `${opponent.id}#${socket.id}`;

      socket.join(room);
      opponent.join(room);

      players[room] = {
        users: {
          [socket.id]: { nickname, move: null },
          [opponent.id]: { nickname: opponent.nickname, move: null }
        }
      };

      socket.emit("matchFound", { room });
      opponent.emit("matchFound", { room });
    } else {
      socket.nickname = nickname;
      queue.push(socket);
    }
  });

  socket.on("chat", ({ room, message }) => {
    const opponentId = Object.keys(players[room].users).find(id => id !== socket.id);
    io.to(room).emit("chat", {
      sender: players[room].users[socket.id].nickname,
      message
    });
  });

  socket.on("playMove", ({ room, move }) => {
    const playerData = players[room]?.users[socket.id];
    if (!playerData) return;

    playerData.move = move;

    const ids = Object.keys(players[room].users);
    const [p1, p2] = ids;

    const m1 = players[room].users[p1].move;
    const m2 = players[room].users[p2].move;

    if (m1 && m2) {
      let result = "เสมอ!";
      if (
        (m1 === "rock" && m2 === "scissors") ||
        (m1 === "scissors" && m2 === "paper") ||
        (m1 === "paper" && m2 === "rock")
      ) {
        result = `${players[room].users[p1].nickname} ชนะ!`;
      } else if (m1 !== m2) {
        result = `${players[room].users[p2].nickname} ชนะ!`;
      }

      io.to(room).emit("gameResult", result);

      // Reset moves
      players[room].users[p1].move = null;
      players[room].users[p2].move = null;
    }
  });

  socket.on("disconnect", () => {
    queue = queue.filter(s => s.id !== socket.id);
    Object.keys(players).forEach(room => {
      if (players[room].users[socket.id]) {
        delete players[room];
        io.to(room).emit("chat", { sender: "ระบบ", message: "คู่สนทนาออกจากห้อง" });
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
