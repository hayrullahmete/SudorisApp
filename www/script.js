/* SUDORIS - FINAL GOLD MASTER (Strict Logic & Growth Algo) */

const chapterPlans = [
    { chapter: 1, firstLevel: 1, lastLevel: 4, size: 4, firstHint: 12, lastHint: 9, maxPieceSize: 2 },
    { chapter: 1, firstLevel: 5, lastLevel: 10, size: 5, firstHint: 19, lastHint: 14, maxPieceSize: 2 },
    { chapter: 2, firstLevel: 11, lastLevel: 15, size: 5, firstHint: 13, lastHint: 9, maxPieceSize: 3 },
    { chapter: 2, firstLevel: 16, lastLevel: 20, size: 6, firstHint: 20, lastHint: 16, maxPieceSize: 3 },
    { chapter: 3, firstLevel: 21, lastLevel: 25, size: 6, firstHint: 15, lastHint: 11, maxPieceSize: 3 },
    { chapter: 3, firstLevel: 26, lastLevel: 30, size: 7, firstHint: 24, lastHint: 16, maxPieceSize: 3 },
    { chapter: 4, firstLevel: 31, lastLevel: 35, size: 8, firstHint: 31, lastHint: 24, maxPieceSize: 4 },
    { chapter: 4, firstLevel: 36, lastLevel: 40, size: 9, firstHint: 41, lastHint: 34, maxPieceSize: 4 }
];

const levelConfig = chapterPlans.flatMap(plan => {
    const span = plan.lastLevel - plan.firstLevel;
    return Array.from({ length: span + 1 }, (_, offset) => {
        const progress = span === 0 ? 0 : offset / span;
        return {
            level: plan.firstLevel + offset,
            chapter: plan.chapter,
            size: plan.size,
            hint: Math.round(plan.firstHint + (plan.lastHint - plan.firstHint) * progress),
            maxPieceSize: plan.maxPieceSize
        };
    });
});

let currentLevelIndex = 0;
let maxUnlockedLevel = 0;
let completedLevels = new Set();
let boardSize = 6;
let solutionGrid = []; // The absolute answer
let playerGrid = [];   // What player sees
let fixedMask = [];    // Fixed hints
let pieces = [];
let isDragging = false;
let progressionContinueAction = null;

window.onload = function() {
    loadProgress();
    currentLevelIndex = Math.min(maxUnlockedLevel, levelConfig.length - 1);
    // Prevent layout shift
    document.body.style.height = window.innerHeight + 'px';
    updateProgressLabels();
};

function loadProgress() {
    let loadedNewFormat = false;
    const savedLevels = localStorage.getItem('sudoris_completed_levels');
    if (savedLevels !== null) {
        try {
            const parsedLevels = JSON.parse(savedLevels);
            if (Array.isArray(parsedLevels)) {
                completedLevels = new Set(parsedLevels
                    .map(level => Number(level))
                    .filter(level => Number.isInteger(level) && level >= 0 && level < levelConfig.length));
                loadedNewFormat = true;
            }
        } catch (error) {
            console.warn('Could not read saved level completion data.', error);
        }
    }

    if (!loadedNewFormat) {
        const legacyProgress = Number.parseInt(localStorage.getItem('sudoris_progress'), 10);
        const completedCount = Number.isFinite(legacyProgress)
            ? Math.max(0, Math.min(legacyProgress, levelConfig.length))
            : 0;
        completedLevels = new Set(Array.from({ length: completedCount }, (_, index) => index));
    }

    recalculateProgress();
    saveProgress();
}

function recalculateProgress() {
    maxUnlockedLevel = 0;
    while (completedLevels.has(maxUnlockedLevel)) maxUnlockedLevel++;
}

function saveProgress() {
    const sortedLevels = [...completedLevels].sort((a, b) => a - b);
    localStorage.setItem('sudoris_completed_levels', JSON.stringify(sortedLevels));
}

function updateProgressLabels() {
    const nextLevel = Math.min(maxUnlockedLevel + 1, levelConfig.length);
    const homeLabel = document.getElementById('home-progress-label');
    const mapCount = document.getElementById('map-progress-count');
    if (homeLabel) homeLabel.innerText = maxUnlockedLevel >= levelConfig.length
        ? t('home.progressComplete')
        : t('home.progressNext', { level: nextLevel });
    if (mapCount) mapCount.innerText = `${completedLevels.size}/${levelConfig.length}`;
}

function refreshLocalizedGameUI() {
    updateProgressLabels();
    const levelDisplay = document.getElementById('level-display');
    const activeLevel = levelConfig[Math.min(Math.max(currentLevelIndex, 0), levelConfig.length - 1)];
    if (levelDisplay) levelDisplay.innerText = t('game.level', { level: activeLevel.level });
    if (document.getElementById('map-screen').classList.contains('active')) renderLevelMap();
    updateMapChapterSummary();
}

// --- NAVIGATION ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}
function goHome() { showScreen('welcome-screen'); }
function pauseAndGoHome() { goHome(); }
function resetCurrentLevel() { if(confirm(t('game.restartConfirm'))) startLevel(); }

function showProgressionModal(title, message, buttonText, onContinue) {
    const modal = document.getElementById('progression-modal');
    document.getElementById('progression-title').innerText = title;
    document.getElementById('progression-message').innerText = message;
    const continueButton = document.getElementById('progression-continue');
    continueButton.innerText = buttonText;
    progressionContinueAction = onContinue;
    modal.hidden = false;
    continueButton.focus();
}

function continueAfterProgression() {
    const action = progressionContinueAction;
    progressionContinueAction = null;
    document.getElementById('progression-modal').hidden = true;
    if (action) action();
}

function goToGame(levelIndex = null) {
    if (levelIndex !== null) currentLevelIndex = levelIndex;
    else currentLevelIndex = maxUnlockedLevel;
    
    if(currentLevelIndex >= levelConfig.length) currentLevelIndex = levelConfig.length - 1;
    startLevel();
    showScreen('game-screen');
}

function renderLevelMap() {
    const container = document.getElementById('level-map-container');
    const resetMapButton = document.getElementById('reset-level-map-button');
    if (resetMapButton) resetMapButton.disabled = completedLevels.size === 0;
    container.innerHTML = '';
    let previousChapter = 0;
    let chapterLevels = null;
    levelConfig.forEach((cfg, index) => {
        if (cfg.chapter !== previousChapter) {
            const group = document.createElement('section');
            group.className = 'map-chapter-group';
            group.id = `map-chapter-group-${cfg.chapter}`;
            const divider = document.createElement('div');
            divider.className = 'map-chapter-divider';
            divider.innerHTML = `<span>${t('map.chapter', { chapter: String(cfg.chapter).padStart(2, '0') })}</span><strong>${t(`map.chapterTitle.${cfg.chapter}`)}</strong>`;
            if (levelConfig.some((level, levelIndex) => level.chapter === cfg.chapter && completedLevels.has(levelIndex))) {
                const resetButton = document.createElement('button');
                resetButton.className = 'map-chapter-reset';
                resetButton.innerText = t('reset.chapterButton');
                resetButton.onclick = event => {
                    event.stopPropagation();
                    resetChapter(cfg.chapter);
                };
                divider.appendChild(resetButton);
            }
            chapterLevels = document.createElement('div');
            chapterLevels.className = 'map-chapter-levels';
            group.append(divider, chapterLevels);
            container.appendChild(group);
            previousChapter = cfg.chapter;
        }

        const node = document.createElement('div');
        node.classList.add('level-node');
        node.innerHTML = `<span class="node-kicker">${t('map.chapter', { chapter: String(cfg.chapter).padStart(2, '0') })}</span><strong class="node-number">${String(cfg.level).padStart(2, '0')}</strong><span class="node-state" aria-hidden="true"></span>`;
        if (completedLevels.has(index)) {
            node.classList.add('completed');
            node.querySelector('.node-state').innerText = t('map.levelCompleted');
            node.onclick = () => goToGame(index);
        } else if (index === maxUnlockedLevel) {
            node.classList.add('current');
            node.querySelector('.node-state').innerText = t('map.levelCurrent');
            node.onclick = () => goToGame(index);
        } else {
            node.classList.add('locked');
            node.querySelector('.node-state').innerText = t('map.levelLocked');
        }
        chapterLevels.appendChild(node);
    });
    updateProgressLabels();
    updateMapChapterSummary();
    if (document.getElementById('map-screen').classList.contains('active')) focusProgressChapter();
}

function focusProgressChapter() {
    const chapterIndex = Math.min(maxUnlockedLevel, levelConfig.length - 1);
    const chapter = levelConfig[chapterIndex]?.chapter ?? 1;
    const container = document.getElementById('level-map-container');
    const target = document.getElementById(`map-chapter-group-${chapter}`);
    if (!container || !target) return;

    requestAnimationFrame(() => {
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const top = container.scrollTop + targetRect.top - containerRect.top;
        container.scrollTo({ top: Math.max(0, top - 4), behavior: 'smooth' });
    });
}

function resetLevelMap() {
    if (completedLevels.size === 0) return;
    if (!confirm(t('reset.mapConfirm'))) return;

    completedLevels.clear();
    recalculateProgress();
    saveProgress();
    currentLevelIndex = 0;
    renderLevelMap();
}

function resetChapter(chapter) {
    const chapterLevels = levelConfig
        .map((level, index) => ({ level, index }))
        .filter(entry => entry.level.chapter === chapter);
    const completedInChapter = chapterLevels.filter(entry => completedLevels.has(entry.index));
    if (completedInChapter.length === 0) return;

    const chapterTitle = t(`map.chapterTitle.${chapter}`);
    if (!confirm(t('reset.chapterConfirm', { chapter: chapterTitle }))) return;

    completedInChapter.forEach(entry => completedLevels.delete(entry.index));
    recalculateProgress();
    saveProgress();
    currentLevelIndex = maxUnlockedLevel;
    renderLevelMap();
}

function updateMapChapterSummary() {
    const chapterIndex = Math.min(maxUnlockedLevel, levelConfig.length - 1);
    const chapter = levelConfig[chapterIndex]?.chapter ?? 1;
    const chapterLabel = document.getElementById('map-chapter-label');
    const chapterTitle = document.getElementById('map-chapter-title');
    const chapterDescription = document.getElementById('map-chapter-description');
    if (chapterLabel) chapterLabel.innerText = t('map.chapter', { chapter: String(chapter).padStart(2, '0') });
    if (chapterTitle) chapterTitle.innerText = t(`map.chapterTitle.${chapter}`);
    if (chapterDescription) chapterDescription.innerText = t(`map.chapterDescription.${chapter}`);
}

function goToMap() {
    renderLevelMap();
    showScreen('map-screen');
    focusProgressChapter();
}

function goToSettings() { showScreen('settings-screen'); }

// --- GAME CORE ---

function startLevel() {
    const config = levelConfig[currentLevelIndex];
    boardSize = config.size;
    
    document.getElementById('level-display').innerText = t('game.level', { level: config.level });
    
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
    for (let i = numbers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [numbers[i], numbers[j]] = [numbers[j], numbers[i]];
    }

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
    const maxPieceSize = levelConfig[currentLevelIndex].maxPieceSize;
    let targetSize = Math.floor(Math.random() * (maxPieceSize - 1)) + 2;
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
    const containerWidth = Math.min(window.innerWidth * 0.88, window.innerHeight * 0.46, 420);
    const cellSize = (containerWidth - (boardSize * 3 + 10)) / boardSize;
    
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

    const filledCells = playerGrid.flat().filter(value => value !== 0).length;
    const progress = Math.round((filledCells / (boardSize * boardSize)) * 100);
    const progressLabel = document.getElementById('board-progress-label');
    const progressFill = document.getElementById('board-progress-fill');
    if (progressLabel) progressLabel.innerText = `${progress}%`;
    if (progressFill) progressFill.style.width = `${progress}%`;
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
        pDiv.style.gridTemplateRows = `repeat(${maxR+1}, 36px)`;
        pDiv.style.gridTemplateColumns = `repeat(${maxC+1}, 36px)`;
        
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
    const remaining = pieces.filter(piece => !piece.placed).length;
    const countLabel = document.getElementById('piece-count');
    if (countLabel) countLabel.innerText = `${remaining} ${t(remaining === 1 ? 'game.pieceUnit' : 'game.piecesUnit')}`;
}

// --- DRAG AND DROP (STRICT MODE) ---

function addDragLogic(element, pieceData) {
    let clone = null;
    let touchOffsetX = 0;
    let touchOffsetY = 0;
    let dragScale = 1;
    
    const getBoardCellSize = () => {
        const cell = document.querySelector('.cell');
        return cell ? cell.getBoundingClientRect().width : 36;
    };

    element.addEventListener('touchstart', (e) => {
        isDragging = true;
        const touch = e.touches[0];
        const rect = element.getBoundingClientRect();

        touchOffsetX = touch.clientX - rect.left;
        touchOffsetY = touch.clientY - rect.top;
        
        clone = element.cloneNode(true);
        clone.classList.add('dragging');
        
        dragScale = getBoardCellSize() / 36;
        clone.style.transform = `scale(${dragScale})`;
        
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
            // Keep the grabbed point under the finger after scaling the piece.
            clone.style.left = (x - touchOffsetX * dragScale) + 'px';
            clone.style.top = (y - touchOffsetY * dragScale - 70) + 'px';
        }
    }
    
    function calculateGridTarget(x, y) {
        // Use the scaled clone position so it matches what the player sees.
        const visualX = x - touchOffsetX * dragScale;
        const visualY = y - touchOffsetY * dragScale - 70;
        
        const board = document.getElementById('game-board');
        const boardRect = board.getBoundingClientRect();
        
        // Check if roughly inside board
        if (visualX > boardRect.right || visualX + element.offsetWidth * dragScale < boardRect.left ||
            visualY > boardRect.bottom || visualY + element.offsetHeight * dragScale < boardRect.top) {
            return null;
        }

        const firstBoardCell = board.querySelector(".cell[data-r='0'][data-c='0']");
        if (!firstBoardCell) return null;

        const boardCellRect = firstBoardCell.getBoundingClientRect();
        const boardStyle = getComputedStyle(board);
        const pieceStyle = getComputedStyle(element);
        const columnStep = boardCellRect.width + (parseFloat(boardStyle.columnGap) || 0);
        const rowStep = boardCellRect.height + (parseFloat(boardStyle.rowGap) || 0);
        const pieceGridX = visualX + (parseFloat(pieceStyle.borderLeftWidth) + parseFloat(pieceStyle.paddingLeft)) * dragScale;
        const pieceGridY = visualY + (parseFloat(pieceStyle.borderTopWidth) + parseFloat(pieceStyle.paddingTop)) * dragScale;

        const col = Math.round((pieceGridX - boardCellRect.left) / columnStep);
        const row = Math.round((pieceGridY - boardCellRect.top) / rowStep);
        if (row < 0 || row >= boardSize || col < 0 || col >= boardSize) return null;
        
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
    const completedIndex = currentLevelIndex;
    const wasCompleted = completedLevels.has(completedIndex);
    setTimeout(() => {
        completedLevels.add(completedIndex);
        recalculateProgress();
        saveProgress();
        updateProgressLabels();

        const nextIndex = completedIndex + 1;
        if (nextIndex >= levelConfig.length) {
            if (completedLevels.size === levelConfig.length && !wasCompleted) {
                showProgressionModal(
                    t('progression.allDoneTitle'),
                    t('progression.allDoneMessage'),
                    t('progression.allDoneButton'),
                    goToMap
                );
            } else {
                goToMap();
            }
            return;
        }

        const completedChapter = levelConfig[completedIndex].chapter;
        const nextChapter = levelConfig[nextIndex].chapter;
        if (!wasCompleted && nextChapter !== completedChapter) {
            const nextChapterName = t(`map.chapterTitle.${nextChapter}`);
            showProgressionModal(
                t('progression.chapterTitle', { chapter: t(`map.chapterTitle.${completedChapter}`) }),
                t('progression.chapterMessage', { chapter: nextChapterName }),
                t('progression.chapterButton'),
                () => goToGame(nextIndex)
            );
            return;
        }

        goToGame(nextIndex);
    }, 300);
}
