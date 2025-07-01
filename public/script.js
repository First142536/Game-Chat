// public/script.js
const socket = io();

const startBtn = document.getElementById("startBtn");
if (startBtn) {
  startBtn.addEventListener("click", () => {
    const nickname = document.getElementById("nickname").value.trim();
    if (!nickname) return alert("กรุณาใส่ชื่อเล่น");

    localStorage.setItem("nickname", nickname);
    startBtn.disabled = true;
    socket.emit("joinQueue", { nickname });
  });
}

socket.on("matchFound", ({ room }) => {
  window.location.href = `/game.html?room=${room}`;
});
