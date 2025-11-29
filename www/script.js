/* SUDORIS - FINAL GOLD MASTER (Strict Logic & Growth Algo) */

const levelConfig = [
    { level: 1, size: 4, hint: 8 }, // Easy start
    { level: 2, size: 5, hint: 15 },
    { level: 3, size: 5, hint: 10 },
    { level: 4, size: 6, hint: 20 },
    { level: 5, size: 6, hint: 18 },
    { level: 6, size: 6, hint: 10 },
    { level: 7, size: 7, hint: 10 },
    { level: 8, size: 8, hint: 12 },
    { level: 9, size: 9, hint: 15 },
    { level: 10, size: 9, hint: 10 }
];

let currentLevelIndex = 0;
let maxUnlockedLevel = 0;
let boardSize = 6;
let solutionGrid = []; // The absolute answer
let playerGrid = [];   // What player sees
let fixedMask = [];    // Fixed hints
let pieces = [];
let isDragging = false;

window.onload = function() {
    const savedLevel = localStorage.getItem('sudoris_progress');
    if (savedLevel) {
        maxUnlockedLevel = parseInt(savedLevel);
        currentLevelIndex = maxUnlockedLevel;
    }
    // Prevent layout shift
    document.body.style.height = window.innerHeight + 'px';
};

// --- NAVIGATION ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}
function goHome() { showScreen('welcome-screen'); }
function pauseAndGoHome() { goHome(); }
function resetCurrentLevel() { if(confirm('Restart Level?')) startLevel(); }

function goToGame(levelIndex = null) {
    if (levelIndex !== null) currentLevelIndex = levelIndex;
    else currentLevelIndex = maxUnlockedLevel;
    
    if(currentLevelIndex >= levelConfig.length) currentLevelIndex = levelConfig.length - 1;
    startLevel();
    showScreen('game-screen');
}

function goToMap() {
    const container = document.getElementById('level-map-container');
    container.innerHTML = '';
    levelConfig.forEach((cfg, index) => {
        const node = document.createElement('div');
        node.classList.add('level-node');
        node.innerText = cfg.level;
        if (index < maxUnlockedLevel) {
            node.classList.add('completed');
            node.onclick = () => goToGame(index);
        } else if (index === maxUnlockedLevel) {
            node.classList.add('current');
            node.onclick = () => goToGame(index);
        } else {
            node.classList.add('locked');
        }
        container.appendChild(node);
    });
    showScreen('map-screen');
}

// --- GAME CORE ---

function startLevel() {
    const config = levelConfig[currentLevelIndex];
    boardSize = config.size;
    
    document.getElementById('level-display').innerText = `Level ${config.level}`;
    
    // 1. Generate Valid Latin Square
    solutionGrid = generateLatinSquare(boardSize);
    
    // 2. Carve pieces using "Growth" algorithm (No holes)
    createPiecesAndBoard(solutionGrid, config.hint);
    
    renderBoard();
    renderPiecesInTray();
}

function generateLatinSquare(size) {
    let grid = Array.from({ length: size }, () => Array(size).fill(0));
    fillBoard(grid, 0, 0, size);
    return grid;
}

function fillBoard(grid, row, col, size) {
    if (row === size) return true;
    let nextRow = row, nextCol = col + 1;
    if (nextCol === size) { nextRow = row + 1; nextCol = 0; }
    
    let numbers = [];
    for(let i=1; i<=size; i++) numbers.push(i);
    numbers.sort(() => Math.random() - 0.5);

    for(let num of numbers) {
        if(isValid(grid, row, col, num, size)) {
            grid[row][col] = num;
            if(fillBoard(grid, nextRow, nextCol, size)) return true;
            grid[row][col] = 0;
        }
    }
    return false;
}

function isValid(grid, row, col, num, size) {
    for(let i=0; i<size; i++) {
        if(grid[row][i] === num || grid[i][col] === num) return false;
    }
    return true;
}

// --- NEW PIECE GENERATION (GROWTH) ---
function createPiecesAndBoard(fullGrid, hintCount) {
    fixedMask = Array.from({ length: boardSize }, () => Array(boardSize).fill(false));
    let visited = Array.from({ length: boardSize }, () => Array(boardSize).fill(false));
    
    // 1. Set Hints
    let hintsGiven = 0;
    while(hintsGiven < hintCount) {
        let r = Math.floor(Math.random()*boardSize);
        let c = Math.floor(Math.random()*boardSize);
        if(!fixedMask[r][c]) {
            fixedMask[r][c] = true;
            visited[r][c] = true; // Mark as visited so we don't make pieces here
            hintsGiven++;
        }
    }

    pieces = [];

    // 2. Grow pieces from remaining empty spots
    for(let r=0; r<boardSize; r++) {
        for(let c=0; c<boardSize; c++) {
            if(!visited[r][c]) {
                // Found an empty spot, grow a piece here
                let piece = growPiece(r, c, visited, fullGrid);
                pieces.push(piece);
            }
        }
    }
    
    // 3. Prepare Player Grid
    playerGrid = fullGrid.map((row, r) => row.map((val, c) => fixedMask[r][c] ? val : 0));
}

function growPiece(startR, startC, visited, grid) {
    let cells = [{r: startR, c: startC, val: grid[startR][startC]}];
    visited[startR][startC] = true;
    
    let queue = [{r: startR, c: startC}];
    
    // Random target size between 2 and 4 (Tetris-like)
    // Small boards need smaller pieces
    let targetSize = Math.floor(Math.random() * 3) + 2; 
    if(boardSize < 5) targetSize = 2;

    while(cells.length < targetSize && queue.length > 0) {
        // Pick a random cell from our growing piece to expand from
        let qIdx = Math.floor(Math.random() * queue.length);
        let curr = queue[qIdx];
        
        // Check neighbors
        let neighbors = [
            {r: curr.r-1, c: curr.c}, {r: curr.r+1, c: curr.c},
            {r: curr.r, c: curr.c-1}, {r: curr.r, c: curr.c+1}
        ];
        
        // Filter valid unvisited neighbors
        let validNeighbors = neighbors.filter(n => 
            n.r >= 0 && n.r < boardSize && n.c >= 0 && n.c < boardSize && !visited[n.r][n.c]
        );
        
        if(validNeighbors.length > 0) {
            let next = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
            visited[next.r][next.c] = true;
            cells.push({r: next.r, c: next.c, val: grid[next.r][next.c]});
            queue.push(next);
        } else {
            // This node is dead end, remove from queue
            queue.splice(qIdx, 1);
        }
    }
    
    // Normalize coordinates (make them relative to 0,0)
    let minR = Math.min(...cells.map(c => c.r));
    let minC = Math.min(...cells.map(c => c.c));
    
    let normalizedCells = cells.map(c => ({
        r: c.r - minR,
        c: c.c - minC,
        val: c.val
    }));
    
    // Calculate shape dimensions for rendering
    let maxR = Math.max(...normalizedCells.map(c => c.r));
    let maxC = Math.max(...normalizedCells.map(c => c.c));
    
    // Create shape matrix (visual helper)
    let shape = [];
    for(let c of normalizedCells) {
        shape.push([c.r, c.c]);
    }

    return { 
        id: Date.now() + Math.random(), 
        cells: normalizedCells, 
        shape: shape,
        placed: false 
    };
}

// --- RENDERING ---

function renderBoard() {
    const boardDiv = document.getElementById('game-board');
    boardDiv.innerHTML = '';
    
    // Board takes up roughly 85% of width, max 400px
    const containerWidth = Math.min(window.innerWidth * 0.90, 380); 
    const cellSize = (containerWidth - (boardSize * 2)) / boardSize;
    
    boardDiv.style.gridTemplateColumns = `repeat(${boardSize}, ${cellSize}px)`;
    boardDiv.style.gridTemplateRows = `repeat(${boardSize}, ${cellSize}px)`;
    
    for(let r=0; r<boardSize; r++) {
        for(let c=0; c<boardSize; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.style.width = `${cellSize}px`;
            cell.style.height = `${cellSize}px`;
            cell.dataset.r = r;
            cell.dataset.c = c;
            
            const val = playerGrid[r][c];
            if(val !== 0) {
                cell.innerText = val;
                if (fixedMask[r][c]) cell.classList.add('fixed');
                else cell.classList.add('placed-piece');
            } else {
                // cell.classList.add('empty-slot'); // CSS does this by default
            }
            boardDiv.appendChild(cell);
        }
    }
}

function renderPiecesInTray() {
    const tray = document.getElementById('pieces-container');
    tray.innerHTML = '';
    
    pieces.forEach(piece => {
        if(piece.placed) return;
        
        const pDiv = document.createElement('div');
        pDiv.classList.add('draggable-piece');
        
        const maxR = Math.max(...piece.cells.map(c => c.r));
        const maxC = Math.max(...piece.cells.map(c => c.c));
        
        // Tray cells slightly larger for touch
        pDiv.style.gridTemplateRows = `repeat(${maxR+1}, 40px)`;
        pDiv.style.gridTemplateColumns = `repeat(${maxC+1}, 40px)`;
        
        piece.cells.forEach((cell, index) => {
            const cDiv = document.createElement('div');
            cDiv.classList.add('piece-cell');
            cDiv.innerText = cell.val;
            cDiv.style.gridRow = cell.r + 1;
            cDiv.style.gridColumn = cell.c + 1;
            cDiv.dataset.cellIndex = index;
            pDiv.appendChild(cDiv);
        });
        
        addDragLogic(pDiv, piece);
        tray.appendChild(pDiv);
    });
}

// --- DRAG AND DROP (STRICT MODE) ---

function addDragLogic(element, pieceData) {
    let clone = null;
    let touchOffsetX = 0;
    let touchOffsetY = 0;
    
    const getBoardCellSize = () => {
        const cell = document.querySelector('.cell');
        return cell ? cell.offsetWidth : 40;
    };

    element.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        const rect = element.getBoundingClientRect();

        touchOffsetX = touch.clientX - rect.left;
        touchOffsetY = touch.clientY - rect.top;
        
        clone = element.cloneNode(true);
        clone.classList.add('dragging');
        
        const scale = getBoardCellSize() / 40; 
        clone.style.transform = `scale(${scale})`;
        
        document.body.appendChild(clone);
        updateClonePos(touch.clientX, touch.clientY);
        
        element.style.opacity = '0.3';
    }, {passive: false});

    element.addEventListener('touchmove', (e) => {
        if(!isDragging) return;
        e.preventDefault();
        const touch = e.touches[0];
        updateClonePos(touch.clientX, touch.clientY);
        highlightHover(touch.clientX, touch.clientY);
    }, {passive: false});

    element.addEventListener('touchend', (e) => {
        isDragging = false;
        const touch = e.changedTouches[0];
        
        document.querySelectorAll('.cell.highlight').forEach(el => el.classList.remove('highlight'));
        
        const target = calculateGridTarget(touch.clientX, touch.clientY);
        
        if (target) {
            // STRICT CHECK: Try to place piece
            if (tryPlacePiece(pieceData, target.r, target.c)) {
                checkWin();
            } else {
                // Fail
                element.style.opacity = '1';
                // Optional: Shake effect or red flash could go here
            }
        } else {
            element.style.opacity = '1';
        }
        
        if(clone) clone.remove();
        clone = null;
    });

    function updateClonePos(x, y) {
        if(clone) {
            // Offset logic + Lift up by 70px
            clone.style.left = (x - touchOffsetX) + 'px';
            clone.style.top = (y - touchOffsetY - 70) + 'px';
        }
    }
    
    function calculateGridTarget(x, y) {
        // We use the "visual" position of the clone to determine drop target
        const visualX = x - touchOffsetX;
        const visualY = y - touchOffsetY - 70;
        
        const board = document.getElementById('game-board');
        const boardRect = board.getBoundingClientRect();
        const cellSize = getBoardCellSize();
        
        // Check if roughly inside board
        if (visualX > boardRect.right || visualX + element.offsetWidth < boardRect.left ||
            visualY > boardRect.bottom || visualY + element.offsetHeight < boardRect.top) {
            return null;
        }

        const relX = visualX - boardRect.left;
        const relY = visualY - boardRect.top;
        
        const col = Math.round(relX / cellSize);
        const row = Math.round(relY / cellSize);
        
        return { r: row, c: col };
    }

    function highlightHover(x, y) {
        document.querySelectorAll('.cell.highlight').forEach(el => el.classList.remove('highlight'));
        
        const target = calculateGridTarget(x, y);
        if (!target) return;
        
        pieceData.cells.forEach(cell => {
            const r = target.r + cell.r;
            const c = target.c + cell.c;
            
            if (r >= 0 && r < boardSize && c >= 0 && c < boardSize) {
                 const cellDiv = document.querySelector(`.cell[data-r='${r}'][data-c='${c}']`);
                 // Only highlight if it's a valid empty spot
                 if (cellDiv && playerGrid[r][c] === 0) {
                     cellDiv.classList.add('highlight');
                 }
            }
        });
    }
}

function tryPlacePiece(piece, startR, startC) {
    // 1. Boundary Check
    for(let cell of piece.cells) {
        const r = startR + cell.r;
        const c = startC + cell.c;
        if(r < 0 || r >= boardSize || c < 0 || c >= boardSize) return false;
        if(playerGrid[r][c] !== 0) return false; // Already occupied
    }
    
    // 2. STRICT SOLUTION CHECK (The Fix)
    // Instead of checking Sudoku rules locally, we check against the Global Solution.
    for(let cell of piece.cells) {
        const r = startR + cell.r;
        const c = startC + cell.c;
        
        // If the number on the piece does not match the solution grid exactly -> REJECT
        if (cell.val !== solutionGrid[r][c]) {
            return false;
        }
    }
    
    // Place it
    for(let cell of piece.cells) {
        playerGrid[startR + cell.r][startC + cell.c] = cell.val;
    }
    piece.placed = true;
    renderBoard();
    renderPiecesInTray();
    return true;
}

function checkWin() {
    for(let r=0; r<boardSize; r++) {
        for(let c=0; c<boardSize; c++) {
            if(playerGrid[r][c] === 0) return;
        }
    }
    setTimeout(() => {
        alert("Level Completed!");
        if (currentLevelIndex === maxUnlockedLevel) {
            maxUnlockedLevel++;
            localStorage.setItem('sudoris_progress', maxUnlockedLevel);
        }
        goToMap();
    }, 300);
}