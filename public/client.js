const socket = io();

const SYMBOLS = ['Bell', 'Cherry', 'Bar', 'Horseshoe', 'Clover'];
const SYMBOL_MAP = { 'Bell': 0, 'Cherry': 1, 'Bar': 2, 'Horseshoe': 3, 'Clover': 4 };

// Grid Architecture: 12 rows x 5 columns split into 3 blocks
const TOTAL_ROWS = 12;
const TOTAL_COLS = 5;

let gridData = Array(TOTAL_ROWS).fill(null).map(() => Array(TOTAL_COLS).fill(null));
let currentDraw = null;
let role = 'player';
let isAutoDrawActive = false;

function join(selectedRole) {
    const username = document.getElementById('username-input').value.trim();
    if (!username.includes('.')) {
        alert("Enter login ID in format: firstname.lastname.ddmm");
        return;
    }

    role = selectedRole;
    socket.emit('joinGame', { username, role });

    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'block';

    if (role === 'admin') {
        document.getElementById('admin-panel').style.display = 'block';
    }

    renderGrid();
}

function renderGrid() {
    const gridContainer = document.getElementById('ticket-grid');
    gridContainer.innerHTML = '';

    for (let r = 0; r < TOTAL_ROWS; r++) {
        const rowDiv = document.createElement('div');
        rowDiv.classList.add('grid-row');

        // Add visual block divider every 4 rows
        if (r === 3 || r === 7) rowDiv.classList.add('block-divider');

        // Row Label[cite: 1]
        const labelDiv = document.createElement('div');
        labelDiv.classList.add('row-label');
        if (r === 0 || r === 11) labelDiv.innerText = 'ODD/EVEN';
        else if (r === 2 || r === 5 || r === 9) labelDiv.innerText = 'ASCENDING';
        rowDiv.appendChild(labelDiv);

        // 5 Interactive Column Cells
        for (let c = 0; c < TOTAL_COLS; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            if (gridData[r][c] !== null) {
                cell.innerText = gridData[r][c];
                cell.classList.add('filled');
            }
            cell.onclick = () => placeNumber(r, c);
            rowDiv.appendChild(cell);
        }

        // Block Badge Spanning 4 Rows[cite: 1]
        if (r % 4 === 0) {
            const blockBadge = document.createElement('div');
            blockBadge.classList.add('block-badge');
            blockBadge.innerText = `BLOCK ${Math.floor(r / 4) + 1}`;
            rowDiv.appendChild(blockBadge);
        }

        gridContainer.appendChild(rowDiv);
    }
}

function placeNumber(r, c) {
    if (!currentDraw) {
        alert("Wait for the draw!");
        return;
    }
    if (gridData[r][c] !== null) return; // Cell already occupied

    // Rule 1: Must match symbol column (unless WILD symbol)[cite: 1]
    if (currentDraw.symbol !== 'WILD' && SYMBOL_MAP[currentDraw.symbol] !== c) {
        alert(`Number must be placed in the ${currentDraw.symbol} column!`);
        return;
    }

    // Rule 2: Strict Ascending Order Check in Column[cite: 1]
    const val = currentDraw.number;

    // Check cells above
    for (let prevR = 0; prevR < r; prevR++) {
        if (gridData[prevR][c] !== null && gridData[prevR][c] >= val) {
            alert(`Ascending rule violated! Top numbers must be smaller than ${val}.`);
            return;
        }
    }
    // Check cells below
    for (let nextR = r + 1; nextR < TOTAL_ROWS; nextR++) {
        if (gridData[nextR][c] !== null && gridData[nextR][c] <= val) {
            alert(`Ascending rule violated! Bottom numbers must be larger than ${val}.`);
            return;
        }
    }

    // Valid placement
    gridData[r][c] = val;
    currentDraw = null;
    document.getElementById('draw-symbol').innerText = "PLACED";
    document.getElementById('draw-number').innerText = "--";

    renderGrid();
    calculateAndEmitScore();
}

// Full Score Calculation Engine[cite: 1]
function calculateAndEmitScore() {
    let baseScore = 0;
    let columnBonus = 0;
    let blockBonus = 0;
    let oddEvenBonus = 0;
    let ascendingRowBonus = 0;

    // 1. 10 Points per placed number[cite: 1]
    for (let r = 0; r < TOTAL_ROWS; r++) {
        for (let c = 0; c < TOTAL_COLS; c++) {
            if (gridData[r][c] !== null) baseScore += 10;
        }
    }

    // 2. 150 Points per complete column (12 cells filled)[cite: 1]
    for (let c = 0; c < TOTAL_COLS; c++) {
        let complete = true;
        for (let r = 0; r < TOTAL_ROWS; r++) {
            if (gridData[r][c] === null) complete = false;
        }
        if (complete) columnBonus += 150;
    }

    // 3. 200 Points per complete block (20 cells filled in 4x5 block)[cite: 1]
    for (let b = 0; b < 3; b++) {
        let blockComplete = true;
        for (let r = b * 4; r < (b + 1) * 4; r++) {
            for (let c = 0; c < TOTAL_COLS; c++) {
                if (gridData[r][c] === null) blockComplete = false;
            }
        }
        if (blockComplete) blockBonus += 200;
    }

    // 4. 150 Points for Row 0 and Row 11 if ALL odd or ALL even[cite: 1]
    [0, 11].forEach(r => {
        const rowVals = gridData[r];
        if (rowVals.every(v => v !== null)) {
            const allOdd = rowVals.every(v => v % 2 !== 0);
            const allEven = rowVals.every(v => v % 2 === 0);
            if (allOdd || allEven) oddEvenBonus += 150;
        }
    });

    // 5. 250 Points per ASCENDING row (Rows 2, 5, 9) if left-to-right is strictly ascending[cite: 1]
    [2, 5, 9].forEach(r => {
        const rowVals = gridData[r];
        if (rowVals.every(v => v !== null)) {
            let isAscending = true;
            for (let c = 0; c < TOTAL_COLS - 1; c++) {
                if (rowVals[c] >= rowVals[c + 1]) isAscending = false;
            }
            if (isAscending) ascendingRowBonus += 250;
        }
    });

    const totalScore = baseScore + columnBonus + blockBonus + oddEvenBonus + ascendingRowBonus;

    document.getElementById('player-score').innerText = totalScore;
    document.getElementById('score-breakdown').innerHTML = `
        Placements: +${baseScore}<br>
        Columns: +${columnBonus}<br>
        Blocks: +${blockBonus}<br>
        Odd/Even Rows: +${oddEvenBonus}<br>
        Ascending Rows: +${ascendingRowBonus}
    `;

    socket.emit('updateScore', totalScore);
}

// Socket Event Handlers
socket.on('newDraw', (data) => {
    currentDraw = data.currentDraw;
    document.getElementById('draw-symbol').innerText = currentDraw.symbol;
    document.getElementById('draw-number').innerText = currentDraw.number;
    document.getElementById('drawn-count').innerText = data.drawnCount;
});

socket.on('timerTick', (sec) => {
    document.getElementById('timer-display').innerText = sec;
});

socket.on('leaderboardUpdate', (leaderboard) => {
    const list = document.getElementById('leaderboard-list');
    list.innerHTML = '';
    leaderboard.forEach(p => {
        const li = document.createElement('li');
        li.innerText = `${p.username}: ${p.score} pts`;
        list.appendChild(li);
    });
});

socket.on('gameReset', () => {
    gridData = Array(TOTAL_ROWS).fill(null).map(() => Array(TOTAL_COLS).fill(null));
    currentDraw = null;
    document.getElementById('draw-symbol').innerText = "---";
    document.getElementById('draw-number').innerText = "--";
    renderGrid();
    calculateAndEmitScore();
});

function adminDraw() { socket.emit('adminDraw'); }
function toggleAutoDraw() {
    isAutoDrawActive = !isAutoDrawActive;
    socket.emit('toggleAutoDraw', isAutoDrawActive);
}
function resetGame() { socket.emit('resetGame'); }