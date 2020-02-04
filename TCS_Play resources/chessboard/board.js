var Board     = null,
    Unclicked = null,
    JChess;

function initBoard() {
    Board = new Chessboard('board', {
        position:        (BoardPos && BoardPos.pieces) || ChessUtils.FEN.emptyId, eventHandlers: {
            onPieceSelected: pieceSelected, onMove: pieceMove, onSquareSelected: squareSelected
        }, useAnimation: true, showBoardLabels: true, showNextMove: false
    });
    Board.setOrientation(WhiteMove ? ChessUtils.ORIENTATION.white : ChessUtils.ORIENTATION.black);
    if (BoardPos) Board.setArrows(BoardPos.arrows);
    if (!BoardUnlocked) {
        lockBoard();
    } else {
        unlockBoard();
    }

    JChess = new Chess();
}

function pieceMove(move) {
    var curMove = (move.from + "-" + move.to);
    BoardMove   = curMove;

    if (Challenge) {
        if (move.to !== NextMove.to) {
            finishedChallenge("Sorry, wrong square! Select an option to try again.");
        } else {
            soundChirp();
            Board.slidingMove({
                                  move: curMove, callback: function () {
                    setTimeout(nextChallengeMove, 250);
                }
                              });
        }
        return null;
    }

    Board.move(curMove);

    if (Demo) {return null;}

    if (curMove === NextMove) {
        soundHappy();
        lockBoard();
        MNum++;
        SNum++;
        var msg = NextMoveMsg;
        loadMove();
        setMainText(msg);
        Board.setPosition(BoardPos.pieces);
        Board.setArrows(BoardPos.arrows);
    } else {
        var msg     = "Sorry! That's not the right move here.<br><br>Try again or click the 'Move' button for help.";
        var penalty = 1;
        if (AlsoCorrect) {
            var acs = AlsoCorrect;
            for (var n = 0; n < acs.length; n++) {
                if (curMove === acs[n].move) {
                    msg     = acs[n].msg || "That move is possible, but isn't the one I was looking for!";
                    msg += "<br><br>No points were gained or lost for that answer. Click the button to try again.";
                    penalty = 0;
                    loadAudio('AC');
                    break;
                }
            }
        }
        if (penalty) soundUnhappy();
        if (penalty && !Points[CNum - 1][PNum - 1][0]) {
            Penalty++;
            moveAlert(msg, 'lost1');
        } else {
            moveAlert(msg, 'reset');
        }
    }

    return null;
}

function pieceSelected(notationSquare) {
    if (Challenge && notationSquare !== NextMove.from) {
        finishedChallenge("Sorry, wrong square! Select an option to try again.");
    }
    var i,
        movesPosition = [],
        notationIndex = ChessUtils.convertNotationSquareToIndex(notationSquare);

    for (i = 0; i < 64; i++) {
        if (i !== notationIndex) movesPosition.push(i);
    }
    return movesPosition;
}

function squareSelected(notationSquare) {
    if (!notationSquare || Demo) {
        lockAlert();
        return false;
    }
    var i = Unclicked.indexOf(notationSquare);
    if (Challenge) {
        if (i) {
            finishedChallenge("Sorry, wrong square! Select an option to try again.");
        } else {
            soundChirp();
            Unclicked = nextChallengeMove();
        }
        return false;
    } else if (i !== -1) {
        Unclicked.splice(i, 1);
        if (Unclicked.length == 0) {
            soundHappy();
            lockBoard();
            MNum++;
            SNum++;
            var msg = NextMoveMsg;
            loadMove();
            setMainText(msg);
        }
        return true;
    } else {
        Penalty++;
        pointsLost(1);
        moveAlert("That's not a correct answer. Try again!", false);
        return false;
    }
}

function setBoardPos(pos) {
    Board.setOrientation(WhiteMove ? ChessUtils.ORIENTATION.white : ChessUtils.ORIENTATION.black);
    Board.setPosition(pos.pieces, false);
    Board.setArrows(pos.arrows, false);
}

function setBoardMove(move) {
    if (ShowingOption) {
        setTimeout(function () {
            if (ShowingOption) Board.slidingMove(move); // Verify that it hasn't been reset during delay
        }, 1000);
    } else if (move) {
        Board.slidingMove(move, BoardPos.pieces, BoardPos.arrows);
    } else if (ClickSquares) {
        Board.setArrows(BoardPos.arrows, true);
    }
}

function setBoardPieces(pieces) {
    Board.setPosition(pieces, false);
}

function getBoardPieces() {
    return Board.getPosition();
}

function boardMoves(player) {
    JChess.load(Board.getPosition(ChessUtils.FEN.id) + ' ' + player + ' - - 0 1');
    return JChess.moves({verbose: true});
}

function boardSquareMoves(pieces, square, fenx) {
    Board.setPosition(pieces, false);
    JChess.load(Board.getPosition(ChessUtils.FEN.id) + fenx);
    return JChess.moves({square: square});
}

function unlockBoard() {
    CLOG && console.log("Unlock board");
    BoardUnlocked = true;
    if (Demo || !ClickSquares) {
        Board.enableUserInput(1);
    } else {
        CLOG && console.log("Click Puzzle");
        Unclicked = ClickSquares.slice(0);
        Board.enableUserInput(2);
    }
}

function lockBoard() {
    CLOG && console.log("Lock board");
    BoardUnlocked = false;
    Board.enableUserInput(0);
}

function resetBoard() {
    Unclicked = null;
    Board.clear();
}

function boardLabels(show) {
    CLOG && console.log("Board labels:", show);
    if (show) {
        $('div.chess_frame').removeClass('chess_label_hidden');
    } else {
        $('div.chess_frame').addClass('chess_label_hidden');
    }
}
