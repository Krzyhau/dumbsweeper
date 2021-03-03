var board;
var boardDisplay;

function GenerateBoard() {
    if (board) {
        board.stopGame();
        delete board;
    }
    let boardData = GetInputs();
    board = new Board(boardData.width, boardData.height, boardData.minecount);
    if (!boardDisplay) {
        boardDisplay = new BoardDisplay("#board", board);
    } else {
        boardDisplay.setBoard(board);
    }
}

function GetInputs() {
    let inputs = {};
    inputs.width = document.querySelector("#width").value;
    inputs.height = document.querySelector("#height").value;
    inputs.minecount = document.querySelector("#minecount").value;
    return inputs;
}

function ShowSettings() {
    $("#settings").show();
}

function HideSettings() {
    $("#settings").hide();
}
