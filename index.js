var cols, rows;
var w = 40;
var grid = [];
var current;
var stack = [];

function setup() {
    createCanvas(600, 600);
    cols = floor(width / w);
    rows = floor(height / w);
    for (var i = 0; i < rows; i++) {
        for (var j = 0; j < cols; j++) {
            var cell = new Cell(i, j);
            grid.push(cell);
        }
    }
    current = grid[0];
}

function draw() {
    background(147,130,116);
    for (var i = 0; i < grid.length; i++) {
        grid[i].show();
    }
}

function Cell(i, j) {
    this.i = i;
    this.j = j;
    this.walls = [true, true, true, true];
    this.visited = false;
    this.show = function() {
        var x = this.i * w;
        var y = this.j * w;
        stroke(0);
        strokeWeight(8);
        if (this.walls[0])
        {
        	line(x,y,x+y,y);
        }
        if (this.walls[1])
        {
        	line(x+w,y,x+w,y+w);
        }
        if (this.walls[2])
        {
        	line(x,y+w,x+y,y+w);
        }
        if (this.walls[3])
        {
        	line(x,y,x,y+w);
        }
   
}
}