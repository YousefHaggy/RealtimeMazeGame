var cols, rows;
var w = 20;
var grid = [];
var current;
var stack = [];
var player;
var seed = 46;
var isGameStarted = false;
var isRoundOngoing = false;
var timeUntilNextRound = 0;
var enemyPlayers = [];
var playerCount = 1;
var canvas;
var socket = io('ws://' + document.domain + ':' + location.port);
var localRequestID;
var isAbleToPhase = false;
var phaseCount = 3;
var mazeWidth;
var mazeHeight;
var frameCount = 0;
var timeUntilRoundEndForced = 100;
var winningPlayerName = "";
var hud;

function setup() {
    hud = new Hud();
    mazeHeight = 700;
    mazeWidth = 800;
    w = 20
    var canvasRatio = mazeHeight / mazeWidth;
    var windowRatio = window.innerHeight / window.innerWidth;
    var newHeight;
    var newWidth;
    if (windowRatio < canvasRatio) {
        newHeight = window.innerHeight * .95;
        newWidth = newHeight / canvasRatio;
        w = newHeight / 35;
        console.log("height")
    } else {
        newWidth = window.innerWidth * .75;
        newHeight = newWidth * canvasRatio;
        w = newHeight / 35;
        console.log("width")
    }
    //newWidth=Math.floor(newWidth);
    //newHeight=Math.floor(newHeight);
    canvas = createCanvas(newWidth, newHeight);
    canvas.parent('canvas-container');

    cols = 40;
    rows = 35;

}

function windowResized() {
    mazeHeight = 700;
    mazeWidth = 800;
    w = 20
    var canvasRatio = mazeHeight / mazeWidth;
    var windowRatio = window.innerHeight / window.innerWidth;
    var newHeight;
    var newWidth;
    console.log(windowRatio)
    console.log(canvasRatio)
    if (windowRatio < canvasRatio) {
        newHeight = window.innerHeight * .95;
        newWidth = newHeight / canvasRatio;
        w = newHeight / 35;
        console.log("height")
    } else {
        newWidth = window.innerWidth * .75
        newHeight = newWidth * canvasRatio;
        w = newHeight / 35;
    }
    //newWidth=Math.floor(newWidth);
    //newHeight=Math.floor(newHeight);
    var c = document.getElementById("defaultCanvas0");
    c.width = newWidth;
    c.height = newHeight;
    c.style.width = newWidth + "px";
    c.style.height = newHeight + "px";
    canvas.width = newWidth;
    canvas.height = newHeight;
    clear()
    redraw();

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
        hud.show();
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

    player = new Player('#0000FF', localRequestID);

}

function index(r, c) {
    if (r < 0 || c < 0 || r > rows - 1 || c > cols - 1) {
        return -1;
    } else {
        return c + r * cols
    }
}

function Hud() {
    this.show = function() {
        fontSize = canvas.width * .03;
        textSize(fontSize)
        textAlign(CENTER, CENTER)
        if (winningPlayerName != "" || player.finishedRace || (!isRoundOngoing && isGameStarted)) {
            fill(0, 0, 0, 200)
            rect(0, 0, canvas.width, canvas.height)
        }
        fill('#FFFFFF')
        stroke('#000000')
        if (winningPlayerName != "") {

            text(winningPlayerName + " has won the game", canvas.width / 2, canvas.height / 2);
        }
        if (player.finishedRace) {

            text("You finished the round in " + player.completedRaceTime + " seconds...", canvas.width / 2, canvas.height / 2);
            if (isRoundOngoing) {
                text("Wating for other players... " + timeUntilRoundEndForced + " seconds", canvas.width / 2, (canvas.height / 2) + fontSize + 5);
            }

        }
        if (!isRoundOngoing && isGameStarted) {
            text("Next Rounds starts in " + timeUntilNextRound, canvas.width / 2, (canvas.height / 2) + fontSize + 5);
        }
    }
}

function updateLeaderBoard(playerList) {
    var leaderboard = document.getElementById("leaderboard");
    leaderboard.innerHTML = "";
    for (var i = 0; i < playerList.length; i++) {
        var node = document.getElementById("leaderboard-entry").cloneNode(true);
        node.id = "entry" + playerList[i].playerName;
        node.getElementsByTagName('div')[0].innerHTML = "#" + (i + 1) + " " + playerList[i].playerName;
        node.getElementsByTagName('div')[1].innerHTML = "Score: " + playerList[i].score;
        if (playerList[i].playerID == player.id) {
            node.style.color = "#f7dc6f";
        }
        leaderboard.appendChild(node);
    }

}

function roundCountDown() {
    timeUntilNextRound -= 1;
    if (timeUntilNextRound > 0) {
        setTimeout(roundCountDown, 1000);
    }
}

function roundEndCountDown() {
    timeUntilRoundEndForced -= 1;
    if (timeUntilRoundEndForced > 0) {
        setTimeout(roundEndCountDown, 1000);
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
    this.finishedRace = false;
    this.score = 0;
    this.completedRaceTime = 0;
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
    enemyPlayers = [];
    enemyPlayerList.forEach(function(x) {
        enemyPlayers.push(new Player(false, x.playerID));
    })
}

function updatePlayerPosition(direction) {
    /* if (direction == "left") {
         if (!grid[index(player.r, player.c - 1)].walls[1]) {
             player.c = player.c - 1;
         }
     } else if (direction == "top") {
         if (!grid[index(player.r - 1, player.c)].walls[2]) {
             player.r = player.r - 1;
         }

     } else if (direction == "right") {
         if (!grid[index(player.r, player.c + 1)].walls[3]) {
             player.c = player.c + 1;
         }
     } else if (direction == "bottom") {
         if (!grid[index(player.r + 1, player.c)].walls[0]) {
             player.r = player.r + 1;
         }

     }*/
    socket.emit("player_position_changed", {
        'direction': direction
    });
}
//Player controls
kd.run(function() {
    frameCount += 1
    if (frameCount >= 5) {
        frameCount = 0;
        kd.tick();
        kd.LEFT.down(function() {
            updatePlayerPosition("left")
        });

        kd.UP.down(function() {
            updatePlayerPosition("top")
        });

        kd.RIGHT.down(function() {
            updatePlayerPosition("right")
        });
        kd.DOWN.down(function() {
            updatePlayerPosition("bottom")
        });
        kd.A.down(function() {
            updatePlayerPosition("left")
        });

        kd.W.down(function() {
            updatePlayerPosition("top")
        });

        kd.D.down(function() {
            updatePlayerPosition("right")
        });
        kd.S.down(function() {
            updatePlayerPosition("bottom")
        });
    }
});

$(document).keydown(function(e) {
    if (e.keyCode == 32) {
        socket.emit('spacebar');

    }
});



//Server stuff
function startGame() {

    document.getElementById("start-screen").style.display = "none";
    document.getElementsByTagName("canvas")[0].style.display = "block";
    document.getElementById("queue").style.display = "block";
    document.getElementById("playerCount").style.display = "block";
    var name = document.getElementById("nameInput").value;
    console.log(name);
    socket.emit('entered_queue', {
        'name': name
    });
    socket.on('join_room', function(msg) {

        console.log(msg);
        localRequestID = msg.playerID;


    });
    socket.on('room_found', function(data) {
        playerCount += 1;
        console.log("room FOUND");
        document.getElementById("playerCount").innerHTML = data + "/10";
        secondsRemaining = 3
        document.getElementById("queue").innerHTML = "Starting round 1 in " + secondsRemaining;
        startTimer = setInterval(function() {
            if (secondsRemaining > 0) {
                secondsRemaining -= 1;
                document.getElementById("queue").innerHTML = "Starting round 1 in " + secondsRemaining;
            } else {
                clearInterval(startTimer)
            }
        }, 1000);
    });

    socket.on('match_starting', function() {
        console.log("ROOMFOUND")
            // socket.emit('get_room_details');
    })
    socket.on('start_game', function(data) {
        console.log(data);
        seed = JSON.parse(data).seed;
        var enemyPlayerList = JSON.parse(data).playerList;
        var completePlayerList = JSON.parse(data).completePlayerList;
        isGameStarted = true;
        isRoundOngoing = true;
        initializeEnemies(enemyPlayerList);
        console.log(enemyPlayerList);
        generateMaze(JSON.parse(data).maze)
        updateLeaderBoard(completePlayerList)
        document.getElementById("lobby-screen").style.display = "none";
        timeUntilRoundEndForced = 100;
        setTimeout(roundEndCountDown, 1000);

    });
    socket.on('able_to_phase', function() {
        player.isAbleToPhase = !player.isAbleToPhase;
        if (player.isAbleToPhase) {
            phaseCount -= 1;
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
    socket.on("update_leaderboard", function(data) {
        var playerList = JSON.parse(data).completePlayerList;
        updateLeaderBoard(playerList);
    });
    socket.on("finished_race", function(data) {
        player.finishedRace = true;
        player.completedRaceTime = data;
        console.log("finished!")
    })
    socket.on("round_over", function(data) {
        console.log("teststest");
        isRoundOngoing = false;
        timeUntilNextRound = 3;
        setTimeout(roundCountDown, 1000);
    });
    socket.on("start_next_round", function(data) {
        generateMaze(JSON.parse(data).maze)
        isRoundOngoing = true;
        timeUntilRoundEndForced = 100;
        var enemyPlayerList = JSON.parse(data).playerList;
        var completePlayerList = JSON.parse(data).completePlayerList;
        initializeEnemies(enemyPlayerList);

    });
    socket.on('game_won', function(data) {
        parsedData = JSON.parse(data);
        playerName = parsedData.playerName;
        //document.getElementsByTagName("canvas")[0].style.display = "none";

        // document.getElementById("win").innerHTML = playerName + " has won the game";
        //document.getElementById("win").style.display = "block";
        winningPlayerName = playerName;
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