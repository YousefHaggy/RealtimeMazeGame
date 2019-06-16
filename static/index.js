var cols, rows;
var w = 20;
var grid = [];
var current;
var stack = [];
var player;
var seed = 46;
var isGameStarted = false;
var enemyPlayers = [];
var playerCount=1;
var socket;
function srand(seed) {
    var t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

function setup() {
    createCanvas(700, 700);
    cols = floor(width / w);
    rows = floor(height / w);
    //generateMaze();
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
        if(this.r==rows-1 && this.c==cols-1)
        {
            fill(0,255,0);
            circle(x+w/2,y+w/2,w-5)
        }
    }
}

function Player(color,id) {
    this.r = 0;
    this.c = 0;
    this.color = color;
    this.id=id
     if(!color){
            this.red=random(255);
            this.green=random(255);
            this.blue=random(255);
        }
    this.show = function() {
        var x = (this.c * w) + 5;
        var y = (this.r * w) + 5;
        noStroke();
        if(!color){
         
            fill(this.red,this.green,this.blue);
        }
        else{
        fill(this.color);
        }
        stroke('#FFFFFF')
        rect(x, y, w - 10, w - 10);
        if (player.c == cols - 1 && player.r == rows - 1) {
        }
    }
}

function initializeEnemies(enemyPlayerList) {
    enemyPlayerList.forEach(function(x) {
        enemyPlayers.push(new Player(false,x.playerID));
    })
}

function updatePlayerPosition() {
    socket.emit("player_position_changed", {
        'col': player.c,
        'row': player.r
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

    document.getElementById("start-screen").style.display = "none";
    document.getElementsByTagName("canvas")[0].style.display = "block";
    document.getElementById("queue").style.display = "block";
    document.getElementById("playerCount").style.display = "block";
    socket = io('//'+document.domain+':'+location.port);
    socket.emit('entered_queue');
    socket.on('join_room', function(msg) {

        console.log(msg);

        socket.emit('test', {
            some: 'data'
        });

    });
    socket.on('room_found',function(data){
        playerCount+=1;
        console.log("room FOUND");
        document.getElementById("playerCount").innerHTML=data+"/10";
    })
    socket.on('match_starting', function() {
       // console.log("ROOMFOUND")
        socket.emit('get_room_details');
    })
    socket.on('start_game', function(data) {
       // console.log(data);
        seed = JSON.parse(data).seed;
        var enemyPlayerList = JSON.parse(data).playerList;
        isGameStarted = true;
        initializeEnemies(enemyPlayerList);
        generateMaze()
        document.getElementById("queue").style.display = "none";
    });
    socket.on('players_updated',function(data){
        parsedData=JSON.parse(data);
      //  console.log(parsedData)
        enemyPlayers.forEach(function(player)
        {
            if (parsedData.playerID==player.id){
                player.c=parsedData.col;
                player.r=parsedData.row;
            }
        });
    });
    socket.on('game_won',function(data){
        parsedData=JSON.parse(data);
        enemyPlayers.forEach(function(player)
        {
            if (parsedData.playerID==player.id){
                player.c=parsedData.col;
                player.r=parsedData.row;
            }
        });
        setTimeout(function(){isGameStarted=false;},500);
        setTimeout(function(){document.location.href="";},4000);
        console.log("WON");
    })
    window.onbeforeunload = function() {
        socket.disconnect();
        return null;
    }
}