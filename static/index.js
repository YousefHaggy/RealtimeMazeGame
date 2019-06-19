var cols, rows;
var w = 20;
var grid = [];
var current;
var stack = [];
var player;
var seed = 46;
var isGameStarted = false;
var enemyPlayers = [];
var playerCount = 1;
var canvas;
var socket;
var isAbleToPhase = false;
var phaseCount = 3;
function setup() {

    mazeHeight = 700;
    mazeWidth = 800;
    mazeToWindowRatio = mazeHeight / $(window).height()
    if (mazeToWindowRatio > 1) {
        mazeHeight = mazeHeight / mazeToWindowRatio
        mazeWidth = mazeHeight / .875
        w = mazeWidth / 40
    }
    canvas = createCanvas(mazeWidth, mazeHeight);
    cols = floor(width / w);
    rows = floor(height / w);

}

function windowResized() {
    mazeHeight = 700;
    mazeWidth = 800;
    w = 20
    mazeToWindowRatio = mazeHeight / $(window).height()
    if (mazeToWindowRatio > 1) {
        mazeHeight = mazeHeight / mazeToWindowRatio
        mazeWidth = mazeHeight / .875
        w = mazeHeight / 35
    }
    resizeCanvas(mazeWidth, mazeHeight);
    fill(0, 255, 0)
    rect(w * 39, w * 34, w, w)
}

function draw() {
    if (isGameStarted) {
        background('#000000');
        for (var i = 0; i < grid.length; i++) {
            grid[i].show();
        }
        enemyPlayers.forEach(function(x) {
            x.show();
        })
        player.show();

    }
}

function generateMaze(maze) {
    grid = []
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var cell = new Cell(r, c);
            cell.walls = maze[index(r, c)];
            grid.push(cell);
        }
    }

    player = new Player('#0000FF', null);

}

function index(r, c) {
    if (r < 0 || c < 0 || r > rows - 1 || c > cols - 1) {
        return -1;
    } else {
        return c + r * cols
    }
}


function Cell(r, c) {
    this.r = r;
    this.c = c;
    this.walls = [true, true, true, true];
    this.visited = false;
    this.x = this.c * w;
    this.y = this.r * w;
    this.show = function() {
        this.x = this.c * w;
        this.y = this.r * w;
        var x = this.x;
        var y = this.y;
        stroke('#FFFFFF');
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
        if (this.r == rows - 1 && this.c == cols - 1) {
            fill("#FFD700");
            circle(x + w / 2, y + w / 2, w - 5)
        }
    }
}

function Player(color, id) {
    this.r = 0;
    this.c = 0;
    this.color = color;
    this.id = id
    this.alpha = 255
    this.isAbleToPhase = false;
    modifier = -1;
    if (!color) {
        this.red = random(255);
        this.green = random(255);
        this.blue = random(255);
    }
    this.show = function() {
        var x = (this.c * w) + (.25 * w);
        var y = (this.r * w) + (.25 * w);
        noStroke();
        if (!color) {
            stroke('#FFFFFF')
            fill(this.red, this.green, this.blue);
        } else {
            if (this.isAbleToPhase) {
                if (this.alpha >= 255) {
                    modifier = 1;
                } else if (this.alpha <= 100) {

                    modifier = -1;
                }
                this.alpha -= (10 * modifier);
                fill(0, 0, 255, this.alpha);
                stroke(255, 255, 255, this.alpha)

            } else {
                fill(0, 0, 255, 255);
                stroke('#FFFFFF')

            }
        }
        rect(x, y, w - (.5 * w), w - (.5 * w));
        if (player.c == cols - 1 && player.r == rows - 1) {}
    }
}

function initializeEnemies(enemyPlayerList) {
    enemyPlayerList.forEach(function(x) {
        enemyPlayers.push(new Player(false, x.playerID));
    })
}

function updatePlayerPosition(direction) {
    socket.emit("player_position_changed", {
        'direction': direction
    });
}
//Player controls
$(document).keydown(function(e) {
    if (isGameStarted) {
        switch (e.keyCode) {
            case 37:
                updatePlayerPosition("left");
                break;
            case 38:
                updatePlayerPosition("top");

                break;
            case 39:

                updatePlayerPosition("right");

                break;
            case 40:
                updatePlayerPosition("bottom");

                break;
            case 32:
                socket.emit('spacebar');
            default:
                return;
        }
        e.preventDefault();
    }
});
//Server stuff
function startGame() {

    document.getElementById("start-screen").style.display = "none";
    document.getElementsByTagName("canvas")[0].style.display = "block";
    document.getElementById("queue").style.display = "block";
    document.getElementById("playerCount").style.display = "block";
    socket = io('//' + document.domain + ':' + location.port);
    var name = document.getElementById("nameInput").value;
    console.log(name);
    socket.emit('entered_queue', {
        'name': name
    });
    socket.on('join_room', function(msg) {

        console.log(msg);

        socket.emit('test', {
            some: 'data'
        });

    });
    socket.on('room_found', function(data) {
        playerCount += 1;
        console.log("room FOUND");
        document.getElementById("playerCount").innerHTML = data + "/10";
        document.getElementById("queue").innerHTML = "Starting match..."
    })
    socket.on('match_starting', function() {
        console.log("ROOMFOUND")
            // socket.emit('get_room_details');
    })
    socket.on('start_game', function(data) {
        console.log(data);
        seed = JSON.parse(data).seed;
        var enemyPlayerList = JSON.parse(data).playerList;
        isGameStarted = true;
        initializeEnemies(enemyPlayerList);
        generateMaze(JSON.parse(data).maze)
        document.getElementById("lobby-screen").style.display = "none";
        document.getElementById("phaseCount").style.display = "block";

    });
    socket.on('able_to_phase', function() {
        player.isAbleToPhase = !player.isAbleToPhase;
        if (player.isAbleToPhase) {
            phaseCount -= 1;
            document.getElementById('phaseCount').innerHTML = "Phases remaining: " + phaseCount;
        }
    })
    socket.on('local_player_updated', function(data) {
        parsedData = JSON.parse(data);
        player.c = parsedData.col
        player.r = parsedData.row
        console.log(parsedData.isAbleToPhase)
        player.isAbleToPhase = parsedData.isAbleToPhase
    })
    socket.on('players_updated', function(data) {
        parsedData = JSON.parse(data);
        //  console.log(parsedData)
        enemyPlayers.forEach(function(player) {
            if (parsedData.playerID == player.id) {
                player.c = parsedData.col;
                player.r = parsedData.row;
            }
        });
    });
    socket.on('game_won', function(data) {
        parsedData = JSON.parse(data);
        playerName = parsedData.playerName;
        //document.getElementsByTagName("canvas")[0].style.display = "none";

        document.getElementById("win").innerHTML = playerName + " has won the game";
        document.getElementById("win").style.display = "block";
        enemyPlayers.forEach(function(player) {
            if (parsedData.playerID == player.id) {
                player.c = parsedData.col;
                player.r = parsedData.row;
            }
        });
        setTimeout(function() {
            isGameStarted = false;
        }, 500);
        setTimeout(function() {
            document.location.href = "";
        }, 4000);
    })
    $(window).on('beforeunload', function() {
        socket.close();
    });
}