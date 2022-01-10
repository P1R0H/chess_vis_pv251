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
                    .insert_moves(moves.slice(1,-1), result);
            } else {
                this.moves[moves[0]] = new MoveNode(this);
                this.moves[moves[0]]
                    .insert_moves(moves.slice(1,-1),result);
            }
        }
    }

    get_node(move) {
        return this.moves.hasOwnProperty(move) ? 
            this.moves[move] : new MoveNode(this);
    }
}

class MoveBar {
    constructor() {
        this.moves = [];
    }
    
    make_move(move) {
        this.moves.push(move)
    }

    prev() {
        this.moves.pop()
    }
    toString() {
        return this.moves.join(" > ")
    }
}

var gameData = [];
var gameTree = new MoveNode(null);
var currentNode = gameTree;
var moveBar = new MoveBar();

var moveStats = null;

window.onload = init;

  //  .sort((a,b) => d3.descending( currentNode.moves[a].total, 
//    currentNode.moves[b].total )
//)


function move_evnt(evnt) {
    update(evnt)
}

function update(move) {
    if(move === "") {
        currentNode = gameTree;
    } else {
        currentNode = currentNode.get_node(move);
    }
    moveStats?.remove();
    moveStats = d3.select("#move_stats")
        .selectAll("div")
        .data(Object.keys(currentNode.moves))
        .enter()
        .append('div')
        .attr("id","bar");

    var bar = moveStats.append("div")
        .attr("id", "move")
        .style("width", "50px")
        .text(d => d)
        .on("click", update);

    moveStats.insert("div")
        .style("width", "300px")
        .style("height", "100%")
        .style("background-color", "white")
        .append("div").append('div');
        
    moveStats.insert("div")
        .attr("id", "score")
        .style("text-align", "right")
        .style("width", "50px")
        .text(d => currentNode.moves[d].total);

    moveStats.sort((a,b) => d3.descending(
            currentNode.moves[a].total,
            currentNode.moves[b].total ));


    console.log(`update: ${move}`)
      
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
            .split(/\d+\. /)
            .slice(1,-1)
            .reduce((acc, item) => { 
                acc.push(...item.split(/\s+/)
                                .filter((x) => { return x.length > 1; })); 
                return acc; 
            }, [])

        var attrs = gameStr
            .split(/\]\s+/)
            .map( (x) => { 
                return x.slice(1,-1).split(" \""); 
            }).slice(0,-2);
        
        var gameObj = {};
        for(var attr of attrs) {
            gameObj[attr[0].toLowerCase()] = attr[1];
        }
        gameObj["moves"] = moves;
        gameData.push(gameObj);
        gameTree.insert_moves(gameObj.moves, gameObj.result)
    }
    update("")
}

// Shows 
function uploadPgn(e) {
    document.getElementById("file-input").click();
    document.getElementById("file-input").onchange = evt => {
        let reader = new FileReader(); 
        reader.readAsText(
            (evt.target).files[0])
        reader.onload = evt => {
            parsePgn(evt.target.result)
            console.log("png parsed")
        }
    }
}

// create chessboard element with classes and tags
function createChessBoard() {
    var chessboardTable = document.createElement('table');
    for (var i = 0; i <= 8; i++) {
        var row = document.createElement('tr');
        for (var j = 0; j <= 8; j++) {
            var col = document.createElement('td');
            if (i != 8 && j != 0) {
                col.id = `board_${String.fromCharCode(96 + j)}_${8-i}`;
                col.className = (i + j) % 2 ? 'white' : 'black';
            }
            else if (i == 8 && j == 0){
                // pass
            }
            else {
                col.className = 'label';
                col.textContent = j == 0 ? String(8-i) : String.fromCharCode(64 + j);
            }
            row.appendChild(col);
        }
        chessboardTable.appendChild(row);
    }
    return chessboardTable;
}

function init(evnt) {
    document
        .getElementById('chessboard')
        .appendChild( createChessBoard() );
    $("td").addClass("tile");
    document.getElementById("upBtn").onclick = uploadPgn;
}
