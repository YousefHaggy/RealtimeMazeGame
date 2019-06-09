var cols, rows;
var w = 60;
var grid = [];
var current;
var stack = [];
var player;

function setup() {
    createCanvas(600, 600);
    cols = floor(width / w);
    rows = floor(height / w);

    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            var cell = new Cell(j, i);
            grid.push(cell);
        }
    }
    current = grid[0];
    stack.push(current);
    generateMaze();
    player = new Player();
}

function draw() {
    background(147, 130, 116);
    for (var i = 0; i < grid.length; i++) {
        grid[i].show();
    }
    player.show();
    
}

function generateMaze() {
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
            var randInt = floor(random(0, validNeighbors.length));
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

function Player() {
    this.r = 0;
    this.c = 0;
    this.show = function() {
        var x = (this.c * w) + 5;
        var y = (this.r * w) + 5;
        noStroke();
        fill(0, 0, 255)
        rect(x, y, w - 10, w - 10);
        if (player.c == cols - 1 && player.r == rows - 1) {
            alert('win!');
        }
    }
}
$(document).keydown(function(e) {
    switch (e.keyCode) {
        case 37:
            if (!grid[index(player.r, player.c - 1)].walls[1]) {
                player.c = player.c - 1;
                console.log(player.c)
            }
            break;
        case 38:
            if (!grid[index(player.r - 1, player.c)].walls[2]) {
                player.r = player.r - 1;
                console.log(player.r)
            }
            break;
        case 39:
            if (!grid[index(player.r, player.c + 1)].walls[3]) {
                player.c = player.c + 1;
                console.log(player.c)
            }
            break;
        case 40:
            if (!grid[index(player.r + 1, player.c)].walls[0]) {
                player.r = player.r + 1;
            }
            break;
        default:
            return;
    }
    e.preventDefault();
});