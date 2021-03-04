/**
 * Represents visual part of the board
 */
class BoardDisplay {
    constructor(divid, board) {
        this.div = $(divid);
        this.setBoard(board);
        setInterval(() => {
            let timer = this.board ? this.board.timer : 0;
            if (timer > 999.9) timer = 999.9;
            $("#time span").html(timer.toFixed(1));
        }, 100);

        $(window).resize((e) => {
            this.checkBoardSize();
        });
    }

    checkBoardSize() {
        let windowWidth = $(window).width();
        let windowHeight = $(window).height() - $("#controls").height();
        let windowRatio = windowWidth / windowHeight;
        let boardRatio = this.board.width / this.board.height;

        let size;
        if (windowRatio < boardRatio || windowHeight < 300) {
            size = (90 / this.board.width) + "vw";
        } else {
            size =
                "calc(" +
                90 / this.board.height +
                "vh - " +
                55 / this.board.height +
                "px)";
        }
        this.div.css("font-size", size);

        
    }

    setBoard(board) {
        this.board = board;
        this.board.setChangedCallback(() => this.refresh());
        this.refresh();
    }

    setSelectedFields(x, y, selected, multiple = true) {
        if (!multiple) {
            if (!this.board.isValidCoords(x, y)) return;
            if (this.board.isFlagged(x, y)) return;
            let field = $(".field-" + x + "-" + y);
            if (selected != field.hasClass("selected")) {
                field.toggleClass("selected");
            }
        } else {
            for (let ox = -1; ox <= 1; ox++)
                for (let oy = -1; oy <= 1; oy++) {
                    let px = x + ox,
                        py = y + oy;
                    this.setSelectedFields(px, py, selected, false);
                }
        }
    }

    refreshFlagCounter() {
        //odświeżenie informacji o flagach
        let flagDisplayCounter = document.querySelector("#flags span");
        let flagCount = 0;
        for (let x = 0; x < this.board.width; x++) {
            for (let y = 0; y < this.board.height; y++) {
                if (this.board.isFlagged(x, y)) flagCount++;
            }
        }
        let counter = this.board.minecount - flagCount;
        let text = counter.toString();

        if (counter > 999) text = "!!!";
        if (counter < -99) text = "-??";
        
        flagDisplayCounter.innerHTML = text;
    }

    refresh() {
        this.refreshFlagCounter();

        this.div.empty();
        this.checkBoardSize();
        this.div.css("display", "block");

        this.div.toggleClass("game", !this.board.displayCovered);

        for (let y = 0; y < this.board.height; y++) {
            let line = $("<div></div>");
            line.addClass("line");
            for (let x = 0; x < this.board.width; x++) {
                // tworzenie fielda
                let field = $("<div></div>");
                field.addClass("field");
                field.addClass("field-" + x + "-" + y);
                if (this.board.isFlagged(x, y)) {
                    field.addClass("flag");
                    if (
                        this.board.isUncovered(x, y) &&
                        !this.board.isMine(x, y)
                    ) {
                        field.addClass("mistake");
                    }
                }
                if (this.board.isUncovered(x, y) || this.board.displayCovered) {
                    if (this.board.isUncovered(x, y)) {
                        field.addClass("uncovered");
                    }
                    if (this.board.isMine(x, y)) {
                        // mina
                        field.addClass("mine");
                        if (
                            this.board.losePoint.x == x &&
                            this.board.losePoint.y == y
                        ) {
                            field.addClass("mistake");
                        }
                    } else {
                        // cyfra
                        let numOfMines = this.board.getNumberOfMines(x, y);
                        if (numOfMines > 0) {
                            field.addClass("num" + numOfMines);
                            field.html("<span>" + numOfMines + "</span>");
                        }
                    }
                }

                // dodawanie specjalnych eventów na wejście gracza

                field.on("contextmenu", (e) => {
                    e.preventDefault();
                    this.board.onUserClick(x, y, 2);
                });
                field.on("mouseup", (e) => {
                    if (e.button == 0) {
                        this.board.onUserClick(x, y, 0);
                    }
                });

                field.on("auxclick", (e) => {
                    if (e.button == 1) {
                        e.preventDefault();
                        this.board.onUserClick(x, y, 1);
                    }
                });

                if (!this.board.finished) {
                    field.on("mouseenter", (e) => {
                        this.setSelectedFields(
                            x,
                            y,
                            true,
                            this.board.isUncovered(x, y)
                        );
                    });

                    field.on("mouseleave", (e) => {
                        this.setSelectedFields(
                            x,
                            y,
                            false,
                            this.board.isUncovered(x, y)
                        );
                    });
                }

                line.append(field);
            }
            this.div.append(line);
        }
    }
}
