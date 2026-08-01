const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const SYMBOLS = ['Bell', 'Cherry', 'Bar', 'Horseshoe', 'Clover'];
let drawnNumbers = [];
let currentDraw = null;
let players = {}; // { socketId: { username, score, role } }
let timerInterval = null;
let timerSeconds = 10;
let isAutoDraw = false;

function generateDraw() {
    if (drawnNumbers.length >= 90) {
        clearInterval(timerInterval);
        io.emit('gameOver');
        return;
    }

    let nextNum;
    do {
        nextNum = Math.floor(Math.random() * 90) + 1;
    } while (drawnNumbers.includes(nextNum));

    drawnNumbers.push(nextNum);

    // 10% chance to draw a WILD card symbol
    const isWild = Math.random() < 0.10;
    const symbol = isWild ? 'WILD' : SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];

    currentDraw = { number: nextNum, symbol: symbol };
    timerSeconds = 10;

    io.emit('newDraw', { currentDraw, drawnCount: drawnNumbers.length });
    io.emit('leaderboardUpdate', getLeaderboard());
}

function getLeaderboard() {
    return Object.values(players)
        .filter(p => p.role === 'player')
        .sort((a, b) => b.score - a.score);
}

io.on('connection', (socket) => {
    socket.on('joinGame', ({ username, role }) => {
        players[socket.id] = { username, role, score: 0 };
        socket.emit('initGameState', { currentDraw, drawnCount: drawnNumbers.length });
        io.emit('leaderboardUpdate', getLeaderboard());
    });

    socket.on('adminDraw', () => {
        generateDraw();
    });

    socket.on('toggleAutoDraw', (auto) => {
        isAutoDraw = auto;
        if (isAutoDraw) {
            if (timerInterval) clearInterval(timerInterval);
            generateDraw();
            timerInterval = setInterval(() => {
                timerSeconds--;
                io.emit('timerTick', timerSeconds);
                if (timerSeconds <= 0) {
                    generateDraw();
                }
            }, 1000);
        } else {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        io.emit('autoDrawStatus', isAutoDraw);
    });

    socket.on('updateScore', (score) => {
        if (players[socket.id]) {
            players[socket.id].score = score;
            io.emit('leaderboardUpdate', getLeaderboard());
        }
    });

    socket.on('resetGame', () => {
        drawnNumbers = [];
        currentDraw = null;
        if (timerInterval) clearInterval(timerInterval);
        isAutoDraw = false;
        Object.keys(players).forEach(id => players[id].score = 0);
        io.emit('gameReset');
        io.emit('leaderboardUpdate', getLeaderboard());
    });

    socket.on('disconnect', () => {
        delete players[socket.id];
        io.emit('leaderboardUpdate', getLeaderboard());
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));