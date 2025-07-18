// === TITIK MASUK UTAMA & EVENT LISTENERS ===

document.addEventListener('DOMContentLoaded', () => {
    const restartBtn = document.getElementById('restart');

    // Event Listeners untuk Drag & Drop
    nextBlocksElem.addEventListener('dragstart', (e) => {
        const target = e.target.closest('.block-preview');
        if (!target || !target.draggable) return;
        draggedBlockInfo.index = parseInt(target.dataset.blockIdx);
        draggedBlockInfo.block = nextBlocks[draggedBlockInfo.index];
        draggedBlockInfo.element = target;
        const clone = target.cloneNode(true);
        clone.style.position = 'absolute';
        clone.style.top = '-1000px';
        document.body.appendChild(clone);
        e.dataTransfer.setDragImage(clone, 10, 10); 
        setTimeout(() => {
            target.style.opacity = '0.5';
            if (document.body.contains(clone)) {
                 document.body.removeChild(clone);
            }
        }, 0);
    });

    gridElem.addEventListener('dragover', (e) => {
        e.preventDefault();
        const cell = e.target.closest('.cell');
        if (cell && draggedBlockInfo.block) {
            clearPreview();
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            if (canPlaceBlock(draggedBlockInfo.block, x, y)) {
                for (let r = 0; r < draggedBlockInfo.block.shape.length; r++) {
                    for (let c = 0; c < draggedBlockInfo.block.shape[r].length; c++) {
                        if (draggedBlockInfo.block.shape[r][c]) {
                            const previewCell = document.querySelector(`.cell[data-x='${x+c}'][data-y='${y+r}']`);
                            if (previewCell) previewCell.classList.add('preview');
                        }
                    }
                }
            }
        }
    });

    gridElem.addEventListener('drop', (e) => {
        e.preventDefault();
        clearPreview();
        const cell = e.target.closest('.cell');
        if (cell && draggedBlockInfo.block) {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            placeBlock(draggedBlockInfo.block, draggedBlockInfo.index, x, y);
        }
    });

    document.addEventListener('dragend', (e) => {
        if(draggedBlockInfo.element){
           draggedBlockInfo.element.style.opacity = '1';
        }
        clearPreview();
        draggedBlockInfo = { block: null, index: -1, element: null };
    });

    restartBtn.addEventListener('click', restartGame);

    // Memulai Game untuk pertama kali
    restartGame();
});