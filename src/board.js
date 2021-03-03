/**
 * Represents logical part of the board
 */
class Board {
    constructor(width, height, minecount) {
        this.width = width;
        this.height = height;
        this.minecount = minecount;
        this.playing = false;
        this.finished = false;
        this.losePoint = {
            x: -1,
            y: -1,
        };
        this.timer = 0;

        this.generate();
    }

    placeRandomMine() {
        let x, y;
        do {
            x = Math.floor(Math.random() * this.width);
            y = Math.floor(Math.random() * this.height);
        } while (this.isMine(x, y));

        this.setMine(x, y, true);
    }

    // generating 2d arrays and filling in the mines
    generate() {
        this.mines = [];
        this.uncovered = [];
        this.flagged = [];
        for (let x = 0; x < this.width; x++) {
            this.mines[x] = [];
            this.uncovered[x] = [];
            this.flagged[x] = [];
            for (let y = 0; y < this.height; y++) {
                this.mines[x][y] = false;
                this.uncovered[x][y] = false;
                this.flagged[x][y] = false;
            }
        }

        // generating proper amount of mines
        this.mineCount = Math.min(this.width * this.height, this.minecount);
        for (let i = 0; i < this.mineCount; i++) {
            this.placeRandomMine();
        }
    }

    /**
     * Sets callback for when board state has been changed
     * @param  {function(number, number):void} callback Callback function
     */
    setChangedCallback(callback) {
        this.changedCallback = callback;
    }
    callChangedCallback() {
        if (this.changedCallback) this.changedCallback();
    }

    // fajna pętla do wykonywania dla wszystkich sąsiadów
    forEachNextTo(x, y, callback) {
        if (!callback) return;
        for (let ox = -1; ox <= 1; ox++)
            for (let oy = -1; oy <= 1; oy++) {
                let px = x + ox,
                    py = y + oy;
                if (!this.isValidCoords(px, py)) continue;
                callback(px, py);
            }
    }

    // getters and setters
    isValidCoords(x, y) {
        return !(x < 0 || x >= this.width || y < 0 || y >= this.height);
    }

    isMine(x, y) {
        if (!this.isValidCoords(x, y)) return false;
        else return this.mines[x][y];
    }

    setMine(x, y, state) {
        if (this.isValidCoords(x, y)) this.mines[x][y] = state;
    }

    getNumberOfMines(x, y) {
        let mineCount = 0;
        this.forEachNextTo(x, y, (px, py) => {
            if (this.isMine(px, py)) mineCount++;
        });
        return mineCount;
    }

    // flaga
    isFlagged(x, y) {
        if (!this.isValidCoords(x, y)) return false;
        else return this.flagged[x][y];
    }

    setFlag(x, y, state) {
        if (this.isValidCoords(x, y)) this.flagged[x][y] = state;
    }

    getNumberOfFlags(x, y) {
        let flagCount = 0;
        this.forEachNextTo(x, y, (px, py) => {
            if (this.isFlagged(px, py)) flagCount++;
        });
        return flagCount;
    }

    // odkrycia

    isUncovered(x, y) {
        if (!this.isValidCoords(x, y)) return false;
        else return this.uncovered[x][y];
    }

    uncoverField(x, y) {
        this.uncovered[x][y] = true;
        this.flagged[x][y] = false;
        //wykrycie klikniecia na bomby i wykrywania wina i losa
        this.checkLose(x, y);
        if (this.playing) this.checkWin();
    }

    recursiveUncover(x, y, force = false) {
        // normal uncover
        this.uncoverField(x, y);

        // recursive uncover for empty spaces
        if (this.getNumberOfMines(x, y) == 0 || force) {
            this.forEachNextTo(x, y, (px, py) => {
                if (this.isUncovered(px, py) || this.isFlagged(px, py)) return;
                if (px != x || py != y) this.recursiveUncover(px, py);
            });
        }
    }

    /**
     * For first click in the game, make sure clicked field and fields
     * around it don't contain mines, making start more convenient.
     * If mine was clicked, using vanilla algorithm (moving mine in
     * first empty field in top left corner.) If there is a mine around,
     * moving it in a new random spot.
     */
    assureEmptyClick(x, y) {
        let fieldCount = this.width * this.height;
        if (this.minecount >= fieldCount) return;

        // when pressed a mine
        if (this.isMine(x, y)) {
            let replaced = false;
            for (let mx = 0; mx < this.width && !replaced; mx++) {
                for (let my = 0; my < this.height && !replaced; my++) {
                    if (!this.isMine(mx, my)) {
                        this.setMine(mx, my, true);
                        this.setMine(x, y, false);
                        replaced = true;
                    }
                }
            }
        }

        // when mine is around
        if (this.minecount <= fieldCount - 9) {
            while (this.getNumberOfMines(x, y) > 0) {
                let minesCount = 0;
                this.forEachNextTo(x, y, (px, py) => {
                    if (this.isMine(px, py)) {
                        minesCount++;
                        this.mines[px][py] = false;
                    }
                });
                for (let i = 0; i < minesCount; i++) {
                    this.placeRandomMine();
                }
            }
        }
    }

    // checking and handling winning
    checkWin() {
        let remainingCount = 0;
        for (let x = 0; x < this.width; x++) {
            for (let y = 0; y < this.height; y++) {
                if (!this.isUncovered(x, y)) remainingCount++;
            }
        }
        if (remainingCount == this.minecount) {
            this.stopGame();
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    if (!this.isUncovered(x, y)) this.flagged[x][y] = true;
                }
            }
        }
    }

    // checking and handling losing
    checkLose(x, y) {
        if (this.isMine(x, y)) {
            this.stopGame();
            this.losePoint = {
                x: x,
                y: y,
            };
            for (let x = 0; x < this.width; x++) {
                for (let y = 0; y < this.height; y++) {
                    let flag = this.isFlagged(x, y);
                    let mine = this.isMine(x, y);
                    if ((mine || flag) && flag != mine)
                        this.uncovered[x][y] = true;
                }
            }
        }
    }

    startGame() {
        if (this.playing) this.stopGame();
        this.playing = true;
        this.startTime = new Date().getTime();
        this.timerUpdate = setInterval(() => {
            let currTime = new Date().getTime();
            this.timer = (currTime - this.startTime) / 1000;
        }, 100);
    }

    stopGame() {
        this.playing = false;
        this.finished = true;
        if (this.timerUpdate) clearInterval(this.timerUpdate);
    }

    // user input for uncovering (left and middle mouse button)
    userUncover(x, y, middleClick) {
        if (this.finished) return;
        if (this.isFlagged(x, y)) return;

        if (this.isUncovered(x, y)) {
            //number clicking
            let mineNum = this.getNumberOfMines(x, y);
            let flagNum = this.getNumberOfFlags(x, y);
            if (flagNum == mineNum) {
                this.recursiveUncover(x, y, true);
            }
        } else if (!middleClick) {
            //normal field uncover
            if (!this.playing) {
                this.assureEmptyClick(x, y);
                this.startGame();
            }
            this.recursiveUncover(x, y);
        }

        this.callChangedCallback();
    }

    // user input for flagging (right mouse button)
    userFlag(x, y) {
        if (this.finished || !this.playing) return;

        if (!this.isUncovered(x, y)) {
            this.setFlag(x, y, !this.isFlagged(x, y));
        } else {
            let minesCount = 0;
            let coveredCount = 0;
            let flagCount = 0;
            this.forEachNextTo(x, y, (px, py) => {
                if (this.isMine(px, py)) minesCount++;
                if (!this.isUncovered(px, py)) coveredCount++;
                if (this.isFlagged(px, py)) flagCount++;
            });
            if (minesCount == coveredCount) {
                this.forEachNextTo(x, y, (px, py) => {
                    if (!this.isUncovered(px, py)) {
                        this.setFlag(px, py, true);
                    }
                });
            }
        }
        

        this.callChangedCallback();
    }
}
