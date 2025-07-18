// === STATE & LOGIKA INTI PERMAINAN ===

// State (Status) Permainan
let grid = [];
let score = 0;
let nextBlocks = [];
let draggedBlockInfo = { block: null, index: -1, element: null };
let comboCounter = 0;
let gameTimeout = null;
let lastPlacedCells = [];

function createRandomBlock() {
    const shape = blockShapes[Math.floor(Math.random() * blockShapes.length)];
    const colorClass = colorClasses[Math.floor(Math.random() * colorClasses.length)];
    return { shape, colorClass };
}

function initGrid() {
    grid = Array.from({ length: gridSize }, () => Array(gridSize).fill(0));
}

function findBestMove(block) {
    let bestMove = { x: -1, y: -1, clears: 0 };
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            if (canPlaceBlock(block, x, y)) {
                const tempGrid = JSON.parse(JSON.stringify(grid));
                for (let r = 0; r < block.shape.length; r++) {
                    for (let c = 0; c < block.shape[r].length; c++) {
                        if (block.shape[r][c]) tempGrid[y + r][x + c] = 1;
                    }
                }
                let currentClears = 0;
                for (let i = 0; i < gridSize; i++) {
                    if (tempGrid[i].every(cell => cell)) currentClears++;
                    if (tempGrid.every(row => row[i])) currentClears++;
                }
                if (currentClears > bestMove.clears) {
                    bestMove = { x, y, clears: currentClears };
                }
            }
        }
    }
    return bestMove.clears > 0 ? bestMove : null;
}

function generateSmartNextBlocks() {
    if (!nextBlocks.some(b => b !== null)) {
        let blockPool = Array.from({ length: 10 }, () => createRandomBlock());
        let scoredBlocks = blockPool.map(blockObj => {
            let bestFitScore = 0;
            for (let y = 0; y < gridSize; y++) {
                for (let x = 0; x < gridSize; x++) {
                    if (canPlaceBlock(blockObj, x, y)) {
                        let neighbors = 0;
                        for (let r = 0; r < blockObj.shape.length; r++) {
                            for (let c = 0; c < blockObj.shape[r].length; c++) {
                                if(blockObj.shape[r][c]) {
                                    if (grid[y+r]?.[x+c-1]) neighbors++;
                                    if (grid[y+r]?.[x+c+1]) neighbors++;
                                    if (grid[y+r-1]?.[x+c]) neighbors++;
                                    if (grid[y+r+1]?.[x+c]) neighbors++;
                                }
                            }
                        }
                        if (neighbors > bestFitScore) bestFitScore = neighbors;
                    }
                }
            }
            return { blockObj, fitScore: bestFitScore };
        });
        scoredBlocks.sort((a, b) => b.fitScore - a.fitScore);
        if (score < 150) {
            nextBlocks = [scoredBlocks[0].blockObj, scoredBlocks[1].blockObj, scoredBlocks[2].blockObj];
        } else if (score < 400) {
            nextBlocks = [blockPool[0], blockPool[1], blockPool[2]];
        } else {
            nextBlocks = [scoredBlocks[7].blockObj, scoredBlocks[8].blockObj, scoredBlocks[9].blockObj];
        }
    }
    renderNextBlocks();
}

function canPlaceBlock(block, gridX, gridY) {
    if (!block) return false;
    for (let r = 0; r < block.shape.length; r++) {
        for (let c = 0; c < block.shape[r].length; c++) {
            if (block.shape[r][c]) {
                const gx = gridX + c;
                const gy = gridY + r;
                if (gy >= gridSize || gx >= gridSize || gy < 0 || gx < 0 || grid[gy][gx]) {
                    return false;
                }
            }
        }
    }
    return true;
}

function placeBlock(block, idx, gridX, gridY) {
    if (!canPlaceBlock(block, gridX, gridY)) return false;
    
    clearGhostBlock();
    lastPlacedCells = [];
    let cellsPlacedCount = 0;
    
    for (let r = 0; r < block.shape.length; r++) {
        for (let c = 0; c < block.shape[r].length; c++) {
            if (block.shape[r][c]) {
                grid[gridY + r][gridX + c] = block.colorClass;
                lastPlacedCells.push({ y: gridY + r, x: gridX + c });
                cellsPlacedCount++;
            }
        }
    }
    
    playSound('place');
    nextBlocks[idx] = null;
    updateScore(cellsPlacedCount * 5);

    const clearedInfo = clearLines();
    if (clearedInfo.total === 0) {
        comboCounter = 0;
    }

    renderGrid();
    generateSmartNextBlocks();

    const remainingBlocks = nextBlocks.filter(b => b !== null);
    if (remainingBlocks.length === 1) {
        const bestMove = findBestMove(remainingBlocks[0]);
        if (bestMove) {
            showGhostBlock(remainingBlocks[0], bestMove.x, bestMove.y);
        }
    }
    
    gameTimeout = setTimeout(checkGameOver, 100);
    return true;
}

function clearLines() {
    let linesToClear = { rows: [], cols: [] };
    for (let y = 0; y < gridSize; y++) {
        if (grid[y].every(cell => cell)) linesToClear.rows.push(y);
    }
    for (let x = 0; x < gridSize; x++) {
        if (grid.every(row => row[x])) linesToClear.cols.push(x);
    }
    
    let totalLinesCleared = linesToClear.rows.length + linesToClear.cols.length;
    if (totalLinesCleared > 0) {
        playSound('clear');
        comboCounter++;
        calculatePointsAndShowAnimation(linesToClear, lastPlacedCells);
        linesToClear.rows.forEach(y => grid[y].fill(0));
        linesToClear.cols.forEach(x => grid.forEach(row => row[x] = 0));
    }
    return { total: totalLinesCleared };
}

function calculatePointsAndShowAnimation(clearedInfo, placedCells) {
    const totalCleared = clearedInfo.rows.length + clearedInfo.cols.length;
    const isCrossClear = clearedInfo.rows.length > 0 && clearedInfo.cols.length > 0;
    let points = 0;
    let animationText = "";
    let animationGlowClass = "";

    if (grid.every(row => row.every(cell => cell === 0))) {
        animationText = "Perfect"; points += 5000; animationGlowClass = 'glow-perfect';
    } else if (totalCleared >= 3) {
        animationText = "Unbelievable"; points += 3000; animationGlowClass = 'glow-unbelievable';
    } else if (comboCounter >= 3) {
        animationText = "Fantastic"; points += 2500; animationGlowClass = 'glow-fantastic';
    } else if (totalCleared === 2 || isCrossClear) {
        animationText = "Amazing"; points += 2000; animationGlowClass = 'glow-amazing';
    } else if (totalCleared === 1) {
        const emptyCells = grid.flat().filter(c => c === 0).length + totalCleared;
        if (emptyCells > gridSize * gridSize * 0.8) {
            animationText = "Great Job"; points += 1000; animationGlowClass = 'glow-nice';
        } else {
            animationText = "Nice"; points += 500; animationGlowClass = 'glow-nice';
        }
    }
    
    if (comboCounter >= 2) {
        playSound('combo');
        if (comboCounter === 2) {
            points += 800;
            if (!animationText || animationText === "Nice" || animationText === "Great Job") {
                animationText = `Combo x${comboCounter}`; animationGlowClass = 'glow-fantastic';
            }
        } else {
            points += 1000 * (comboCounter - 2);
        }
    }

    const isCleanSweep = placedCells.some(pCell => 
        clearedInfo.rows.includes(pCell.y) || clearedInfo.cols.includes(pCell.x)
    );
    if (isCleanSweep) {
        points += 1000;
        if (animationText === "Nice" || animationText === "Great Job" || animationText === "") {
            animationText = "Clean Sweep!"; animationGlowClass = 'glow-sweep';
        }
    }
    
    showAnimation(animationText, animationGlowClass);
    updateScore(points);
}

function updateScore(pointsToAdd) {
    score += pointsToAdd;
    scoreElem.innerText = 'Score: ' + score;
}

function checkGameOver() {
    for (const block of nextBlocks) {
        if (!block) continue;
        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                if (canPlaceBlock(block, x, y)) return;
            }
        }
    }
    playSound('gameover');
    gameTimeout = setTimeout(() => {
        alert(`Game Over!\nFinal Score: ${score}`);
        restartGame();
    }, 100);
}

function restartGame() {
    if (gameTimeout) clearTimeout(gameTimeout);
    clearGhostBlock();
    initGrid();
    score = 0;
    comboCounter = 0;
    lastPlacedCells = [];
    nextBlocks = [];
    draggedBlockInfo = { block: null, index: -1, element: null };
    scoreElem.innerText = 'Score: 0';
    renderGrid();
    generateSmartNextBlocks();
    if (bgMusic) bgMusic.play().catch(e => {});
}