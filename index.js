var cols, rows;
var w = 30;
var grid = [];
var current;
var stack = [];
var player;
var seed = 46;
var isGameStarted = false;
var enemyPlayers = [];
var socket;
function srand(seed) {
    var t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function setup() {
    createCanvas(600, 600);
    cols = floor(width / w);
    rows = floor(height / w);
    //generateMaze();
}

function draw() {
    if (isGameStarted) {
        background(147, 130, 116);
        for (var i = 0; i < grid.length; i++) {
            grid[i].show();
        }
        player.show();
        enemyPlayers.forEach(function(x) {
            x.show();
        })
    }
}

function generateMaze() {
    grid = []
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            var cell = new Cell(j, i);
            grid.push(cell);
        }
    }
    current = grid[0];
    stack.push(current);
    player = new Player('#0000FF',null);
    while (stack.length > 0) {
        current.visited = true;
        var neighbor = current.getNextNeighbor();
        if (neighbor) {
            neighbor.visited = true;
            stack.push(current);
            removeWall(current, neighbor);
            current = neighbor;
        } else if (stack.length > 0) {
            current = stack.pop();
            console.log("dur")
        }
    }
}

function index(r, c) {
    if (r < 0 || c < 0 || r > rows - 1 || c > cols - 1) {
        return -1;
    } else {
        return c + r * cols
    }
}

function removeWall(current, neighbor) {
    if (current.r < neighbor.r) {
        neighbor.walls[3] = false;
        current.walls[1] = false;
    } else if (current.r > neighbor.r) {
        neighbor.walls[1] = false;
        current.walls[3] = false;
    }
    if (current.c < neighbor.c) {
        neighbor.walls[0] = false;
        current.walls[2] = false;
    } else if (current.c > neighbor.c) {
        neighbor.walls[2] = false;
        current.walls[0] = false;
    }
}

function Cell(r, c) {
    this.r = r;
    this.c = c;
    this.walls = [true, true, true, true];
    this.visited = false;
    this.getNextNeighbor = function() {
        var validNeighbors = []
        var top = grid[index(c - 1, r)];
        var right = grid[index(c, r + 1)];
        var bottom = grid[index(c + 1, r)];
        var left = grid[index(c, r - 1)];
        if (top && !top.visited) {
            validNeighbors.push(top);
        }
        if (right && !right.visited) {
            validNeighbors.push(right);
        }
        if (bottom && !bottom.visited) {
            validNeighbors.push(bottom);
        }
        if (left && !left.visited) {
            validNeighbors.push(left);
        }
        if (validNeighbors.length > 0) {
            // var randInt = floor(random(0, validNeighbors.length));
            var randInt = floor(srand(seed++) * validNeighbors.length);
            return validNeighbors[randInt];
        } else {
            return undefined;
        }
    }
    this.show = function() {
        var x = this.r * w;
        var y = this.c * w;
        stroke(0);
        //strokeWeight(8);
        if (this.walls[0]) {
            line(x, y, x + w, y);
        }
        if (this.walls[1]) {
            line(x + w, y, x + w, y + w);
        }
        if (this.walls[2]) {
            line(x + w, y + w, x, y + w);
        }
        if (this.walls[3]) {
            line(x, y + w, x, y);
        }
    }
}

function Player(color,id) {
    this.r = 0;
    this.c = 0;
    this.color = color;
    this.id=id
    this.show = function() {
        var x = (this.c * w) + 5;
        var y = (this.r * w) + 5;
        noStroke();
        fill(this.color);
        rect(x, y, w - 10, w - 10);
        if (player.c == cols - 1 && player.r == rows - 1) {
            alert('win!');
        }
    }
}

function initializeEnemies(enemyPlayerList) {
    enemyPlayerList.forEach(function(x) {
        enemyPlayers.push(new Player("ff0000",x.playerID));
    })
}

function updatePlayerPosition() {
    socket.emit("player_position_changed", {
        col: player.col,
        row: player.row
    });
}
//Player controls
$(document).keydown(function(e) {
    if (isGameStarted) {
        switch (e.keyCode) {
            case 37:
                if (!grid[index(player.r, player.c - 1)].walls[1]) {
                    player.c = player.c - 1;
                    console.log(player.c)
                    updatePlayerPosition();
                }
                break;
            case 38:
                if (!grid[index(player.r - 1, player.c)].walls[2]) {
                    player.r = player.r - 1;
                    console.log(player.r)
                    updatePlayerPosition();
                }
                break;
            case 39:
                if (!grid[index(player.r, player.c + 1)].walls[3]) {
                    player.c = player.c + 1;
                    console.log(player.c)
                    updatePlayerPosition();

                }
                break;
            case 40:
                if (!grid[index(player.r + 1, player.c)].walls[0]) {
                    player.r = player.r + 1;
                    updatePlayerPosition();

                }
                break;
            default:
                return;
        }
        e.preventDefault();
    }
});
//Server stuff
function startGame() {
     socket = io('http://127.0.0.1:5000');


    document.getElementById("start-screen").style.display = "none";
    document.getElementsByTagName("canvas")[0].style.display = "block";
    document.getElementById("queue").style.display = "block";
    socket.on('join_room', function(msg) {

        console.log(msg);

        socket.emit('test', {
            some: 'data'
        });

    });

    socket.on('room_found', function() {
        console.log("ROOMFOUND")
        socket.emit('get_room_details');
    })
    socket.on('start_game', function(data) {
        console.log(data);
        seed = JSON.parse(data).seed;
        var enemyPlayerList = JSON.parse(data).playerList;
        isGameStarted = true;
        initializeEnemies(enemyPlayerList);
        generateMaze()
        document.getElementById("queue").style.display = "none";
    });
    socket.on('players_updated',function(data){
        parsedData=JSON.parse(data);
        enemyPlayers.forEach(function(player)
        {
            if (parsedData.playerID==player.playerID){
                player.col=parsedData.col;
                player.row=parsedData.row;
            }
        });
    });
    window.onbeforeunload = function() {
        socket.disconnect();
        return null;
    }
}