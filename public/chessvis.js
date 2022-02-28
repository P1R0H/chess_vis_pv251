"use strict";

class MoveNode {
    constructor(parent) {
        this.wwins = 0;
        this.bwins = 0;
        this.draws = 0;
        this.total = 0;
        this.parent = parent;
        this.moves = {};
    }

    insert_moves(moves, result) {
        this[['draws','wwins','bwins'].at(eval(result))] += 1;
        this.total += 1;
        if(moves.length > 0 ) {
            if(moves[0] in this.moves) {
                this.moves[moves[0]]
                    .insert_moves(moves.slice(1), result);
            } else {
                this.moves[moves[0]] = new MoveNode(this);
                this.moves[moves[0]]
                    .insert_moves(moves.slice(1),result);
            }
        }
    }

    get_node(move) {
        return this.moves.hasOwnProperty(move) ? 
            this.moves[move] : new MoveNode(this);
    }
}

class Position {
    constructor() {
        this.pieces = {
            white: {
                K: "♔", Q: "♕", R: "♖", 
                B: "♗", N: "♘", P: "♙"
            },
            black: {
                K: "♚", Q: "♛", R: "♜",
                B: "♝", N: "♞", P: "♟︎" }
        }
        this.directions = {
            K: [1, [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]],
            Q: [8, [[0,1], [0,-1], [1,0], [-1,0], [1,1], [1,-1], [-1,1], [-1,-1]]],
            R: [8, [[0,1], [0,-1], [1,0], [-1,0]]],
            B: [8, [[1,1], [1,-1], [-1,1], [-1,-1]]],
            N: [1, [[1,2], [2,1], [1,-2], [-1,2], [2,-1], [-2,1], [-2,-1], [-1,-2]]]
        }

        this.position = this.initialPosition();
        this.moveList = [];
        this.play = "white";
    }

    initialPosition() {
        return [
            ["♖","♘","♗","♕","♔","♗","♘","♖"],
            ["♙","♙","♙","♙","♙","♙","♙","♙"],
            ["", "", "", "", "", "", "", "" ],
            ["", "", "", "", "", "", "", "" ],
            ["", "", "", "", "", "", "", "" ],
            ["", "", "", "", "", "", "", "" ],
            ["♟︎","♟︎","♟︎","♟︎","♟︎","♟︎","♟︎","♟︎"],
            ["♜","♞","♝","♛","♚","♝","♞","♜"]
        ];
    }
    
    resetMoves(moves) {
        this.position = this.initialPosition()
        this.play = "white";
        this.moveList = [];
        for(const move of moves) {
            this.makeMove(move);
        }
    }

    makeMove(move) {
        // parse move from move string and change position accordingly  
        this.moveList.push(move);

        if (move === "O-O") { this.castle(true); }
        else if (move === "O-O-O") { this.castle(false); }
        else {
            var prom; 
            var id; 
            var dest;
            
            move = move.replace(/\+/g, ""); // remove check (if present)
            [move, prom] = move.split("="); // extract promotion piece
            if (move.includes("x")) {  // resolve capturing move
                [id, dest] = move.split("x");
            } else {
                [id, dest] = [
                    move.substring(0, move.length-2),
                    move.substring(move.length-2)
                ]
            }

            dest = [dest[1] - 1, dest.charCodeAt(0) - 97] // dest square to indices
            // handle move
            if("KQRNB".includes(id[0])) {
                this.pieceMove(id, dest);
            } else {
                this.pawnMove(id, dest, prom);
            }
        }

        if (this.play == "white") {
            this.play = "black";
        } else {
            this.play = "white";
        }
    }


    findCandidate(dest, piece, vec, top) {
        var cur = [dest[0]+vec[0], dest[1]+vec[1]]
        while (top > 0 && cur[0] >= 0 && cur[0] < 8 && cur[1] >= 0 && cur[1] < 8) {
            if (this.position[cur[0]][cur[1]] === "") {
                cur = [cur[0]+vec[0], cur[1]+vec[1]]
                top--;
            } else if (this.position[cur[0]][cur[1]] === piece) {
                return cur;
            } else {
                break;
            }
        }
    }

    pieceMove(id, dest) {
        var cands = [];
        var piece = this.pieces[this.play][id[0]];
        var p_dirs = this.directions[id[0]];

        for(const vec of p_dirs[1]) {
            var cand = this.findCandidate(dest, piece, vec, p_dirs[0]);
            if (cand) { cands.push(cand); }
        }
        var ind = id.substring(1);
        var real;
        switch(ind.length) {
            case 0: // there should be only one candidate
                real = cands[0];
                break;
            case 1: // two candidates
                if("abcdefgh".includes(ind)) {
                    real = cands.filter(d => d[1] == ind.charCodeAt(0) - 97)[0];
                } else {
                    real = cands.filter(d => d[0] == ind-1)[0];    
                }
                break;
            default: // more candidates (really rare)
                real = cands.filter(d => 
                    d[1] == ind.charCodeAt(1)-97 && d[0] == ind[1]-1)[0];
        }
        this.position[real[0]][real[1]] = "";
        this.position[dest[0]][dest[1]] = piece;
    }

    pawnMove(id, dest, prom) {
        var piece = this.pieces[this.play].P;
        if (prom) {
            piece = this.pieces[this.play][prom];
        }

        var col = dest[1];
        var diff = 0;
        if (this.play == "white") {
            diff = -1;
        } else {
            diff = 1;
        }

        if (id.length) {
            col = id.charCodeAt(0) - 97;
            if (this.position[dest[0]][dest[1]] == "") { // enpassant
                this.position[dest[0]+diff][dest[1]] = "";
            }
        } else { // handle first move
            if (this.position[dest[0]+diff][col] == "") {
                diff = diff * 2;
            }
        }
        this.position[dest[0]+diff][col] = "";
        this.position[dest[0]][dest[1]] = piece;
    }

    castle(short) {
        var row = 7;
        if (this.play == "white") { row = 0; }
        if (short) {
            this.position[row][4] = "";
            this.position[row][7] = "";
            this.position[row][6] = this.pieces[this.play].K;
            this.position[row][5] = this.pieces[this.play].R;
        } else {
            this.position[row][4] = "";
            this.position[row][0] = "";
            this.position[row][2] = this.pieces[this.play].K;
            this.position[row][3] = this.pieces[this.play].R;
        }
    }

    toDOM() {
        var chessboardTable = document.createElement('table');
        for (var i = 0; i <= 8; i++) {
            var row = document.createElement('tr');
            for (var j = 0; j <= 8; j++) {
                var col = document.createElement('td');
                if (i != 8 && j != 0) {
                    col.className = (i+j)%2 ? "white tile" : "black tile";
                    col.textContent = this.position[8-(i+1)][j-1];
                } else if (i == 8 && j == 0) {
                    col.className = 'tile';
                } else {
                    col.className = 'label tile';
                    col.textContent = !j ? String(8-i) : String.fromCharCode(64 + j);
                }
                row.appendChild(col);
            }
            chessboardTable.appendChild(row);
        }
        return chessboardTable;
    }
}

var gameData = [];
var moveList = [];

var gameTree = new MoveNode(null);
var currentNode = gameTree;

var moveStats = null;
var position = null;

window.onload = init;


function previousMove() {
    // functionality of back button
    // return to previous position
    if(!currentNode.parent) {
        // pass
    } else {
        currentNode = currentNode.parent;
        position.moveList.pop();
        position.resetMoves(position.moveList);
    }
    update();
}

function chooseMove(move) {
    // choose exact move from position history
    var new_moves = position.moveList.slice(0, 
        move.target.getAttribute("seq"))
    
    currentNode = gameTree;
    for (var move of new_moves) {
        currentNode = currentNode.get_node(move);
    }
    position.resetMoves(new_moves);
    update();
}

function makeMove(move) {
    // Get next move fromm current position
    if (move === "") {
        currentNode = gameTree;
        position.resetMoves([]);
    } else {
        currentNode = currentNode.get_node(move);
        position.makeMove(move);
    }
    update();
}


function get_move_width(move, result) {
    let moves = currentNode.moves[move][result];
    let total = currentNode.moves[move]['total'];
    return `${100*moves/total}%`
}

function get_move_text(move, result) {
    let moves = currentNode.moves[move][result]
    return moves === 0 ? "" : moves 
}

function update() {
    // Update stats view
    // TODO -> once only branch is left, 
    // print out relevant game;

    moveStats?.remove();
    moveStats = d3.select("#moveStats")
        .selectAll("div")
        .data(Object.keys(currentNode.moves))
        .enter()
        .append('div')
        .attr("id","bar");

    moveStats.append("div")
        .attr("id", "move")
        .text(d => d)
        .on("click", makeMove);

    var bar = moveStats.insert("div")
        .attr("id", "resBar");
        
    moveStats.insert("div")
        .attr("id", "count")
        .text(d => currentNode.moves[d].total);
    
    bar.append("div")
        .attr("class", "wRes")
        .attr("id", "res")
        .style("width", d => get_move_width(d, "wwins"))
        .text(d => get_move_text(d, "wwins"));

    bar.insert("div")
        .attr("class", "dRes")
        .attr("id", "res")
        .style("width", d => get_move_width(d, "draws"))
        .text(d => get_move_text(d, "draws"));

    bar.insert("div")
        .attr("class", "bRes")
        .attr("id", "res")
        .style("width", d => get_move_width(d, "bwins"))
        .text(d => get_move_text(d, "bwins"));

    moveStats.sort((a,b) => d3.descending(
            currentNode.moves[a].total,
            currentNode.moves[b].total ));
    
    var board = document.getElementById("chessboard");
    board.removeChild(board.lastElementChild);
    board.appendChild(position.toDOM());

    var moves = document.getElementById("moves");
    while(moves.lastElementChild) {
        moves.removeChild(moves.lastElementChild)
    }

    var white = true;
    for (var i = 0; i < position.moveList.length; i++) {
        var move = document.createElement("div")
        move.className = "move " + (white ? "wmove" : "bmove");
        move.textContent = position.moveList[i];
        move.setAttribute("seq", i+1);
        move.onclick = chooseMove;
        moves.appendChild(move)
        white = !white;

    }


}

function parsePgn(pgnStr) {
    gameData = [];
    gameTree = new MoveNode(null);

    console.log("parsing started...");
    // parse PGN to datastructure
    // match game ((?:\[)(?:.|\s)+?\s[01]-[10])
    // match moves \d+\. ([A-Za-z].+?)\s(?:([A-Za-z].+?)\s)?
    // match attributes (?:\[(\w+)\s"(.+)"])
    
    var games = pgnStr
        .split(/\s(0\-1|1\-0|1\/2-1\/2)/)
        .filter((item) => { return item.length > 9; });
    var counter = 1;
    for(let gameStr of games) {
        console.log(`parsing game ${counter++}/${games.length}`);
        var moves = gameStr
            .split(/\s\d+\./)
            .slice(1)
            .reduce((acc, item) => { 
                acc.push(...item.split(/\s+/)
                                .filter((x) => { return x.length > 1; })); 
                return acc; 
            }, [])

        var attrs = gameStr
            .split(/\]\s+/)
            .slice(0,-1)
            .map( (x) => { 
                return x.slice(1,-1).split(" \""); 
            });
        
        var gameObj = {};
        for(var attr of attrs) {
            gameObj[attr[0].toLowerCase()] = attr[1];
        }
        gameObj["moves"] = moves;
        gameData.push(gameObj);
        gameTree.insert_moves(gameObj.moves, gameObj.result)
    }
    makeMove("")
}

// Shows 
function uploadPgn(e) {
    document.getElementById("fileInput").click();
    document.getElementById("fileInput").onchange = evt => {
        let reader = new FileReader(); 
        reader.readAsText(
            (evt.target).files[0])
        reader.onload = evt => {
            parsePgn(evt.target.result)
            console.log("png parsed")
        }
    }
}


function init(evnt) {
    document.getElementById("upBtn").onclick = uploadPgn;
    document.getElementById("prevBtn").onclick = previousMove;
    
    position = new Position();
    document.getElementById("chessboard").appendChild(
        position.toDOM()
    )
}
