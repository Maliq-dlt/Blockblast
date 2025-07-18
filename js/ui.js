// === FUNGSI TAMPILAN, SUARA, DAN ANIMASI ===

// Elemen DOM
const gridElem = document.getElementById('grid');
const nextBlocksElem = document.getElementById('next-blocks');
const scoreElem = document.getElementById('score');
const animationPopup = document.getElementById('animation-popup');

// Elemen Audio
const sounds = {
    place: document.getElementById('audio-place'),
    clear: document.getElementById('audio-clear'),
    combo: document.getElementById('audio-combo'),
    gameover: document.getElementById('audio-gameover'),
};
const bgMusic = document.getElementById('background-music');

function playSound(soundName) {
    const sound = sounds[soundName];
    if (sound) {
        sound.currentTime = 0;
        sound.play().catch(e => {});
    }
}

function showAnimation(text, glowClass) {
    if (!text) return;
    animationPopup.classList.remove(...glowClasses);
    if (glowClass) {
        animationPopup.classList.add(glowClass);
    }
    animationPopup.textContent = text;
    animationPopup.classList.add('show');
    setTimeout(() => {
        animationPopup.classList.remove('show');
        if (glowClass) {
            animationPopup.classList.remove(glowClass);
        }
    }, 1500);
}

function renderGrid() {
    gridElem.innerHTML = '';
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const cell = document.createElement('div');
            const cellValue = grid[y][x];
            cell.className = cellValue ? `cell filled ${cellValue}` : 'cell';
            cell.setAttribute('data-x', x);
            cell.setAttribute('data-y', y);
            gridElem.appendChild(cell);
        }
    }
}

function renderNextBlocks() {
    nextBlocksElem.innerHTML = '';
    nextBlocks.forEach((block, index) => {
        const blockContainer = document.createElement('div');
        blockContainer.className = 'block-preview';
        if (block) {
            blockContainer.draggable = true;
            blockContainer.setAttribute('data-block-idx', index);
            blockContainer.style.display = 'inline-grid';
            const rows = block.shape.length;
            const cols = Math.max(...block.shape.map(row => row.length || 0));
            blockContainer.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
            blockContainer.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
            for (let r = 0; r < rows; r++) {
                for (let c = 0; c < (block.shape[r]?.length || 0); c++) {
                    const cellDiv = document.createElement('div');
                    if (block.shape[r][c]) {
                        cellDiv.className = `block-cell ${block.colorClass}`;
                    }
                    blockContainer.appendChild(cellDiv);
                }
            }
        } else {
            blockContainer.style.width = '60px'; 
            blockContainer.style.height = '60px';
        }
        nextBlocksElem.appendChild(blockContainer);
    });
}

function clearGhostBlock() {
    document.querySelectorAll('.cell.ghost').forEach(c => c.classList.remove('ghost'));
}

function showGhostBlock(block, x, y) {
    clearGhostBlock();
    for (let r = 0; r < block.shape.length; r++) {
        for (let c = 0; c < block.shape[r].length; c++) {
            if (block.shape[r][c]) {
                const ghostCell = document.querySelector(`.cell[data-x='${x+c}'][data-y='${y+r}']`);
                if (ghostCell) ghostCell.classList.add('ghost');
            }
        }
    }
}

function clearPreview() {
    document.querySelectorAll('.cell.preview').forEach(c => c.classList.remove('preview'));
}