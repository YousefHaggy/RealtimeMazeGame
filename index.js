var cols, rows;
var w = 20;
var grid = [];
var current;
var stack = [];

function setup() {
    createCanvas(600, 600);
    cols = floor(width / w);
    rows = floor(height / w);
    for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
            var cell = new Cell(r, c);
            grid.push(cell);
        }
    }
    current = grid[0];
}

function draw() {
    background(147, 130, 116);
    for (var i = 0; i < grid.length; i++) {
        grid[i].show();
    }
    current.visited=true;
    var neighbor = current.getNextNeighbor();    
if(neighbor){
	neighbor.visited= true;
     stack.push(current);
    removeWall(current,neighbor);
    current=neighbor;
}
else if(stack.length>0){
 current=stack.pop();
 console.log("dur")
}
}

function index(r, c) {
    if (r < 0 || c < 0 || r > rows - 1 || c > cols - 1) {
        return -1;
    } else {
        return c + r * cols
    }
}
function removeWall(current,neighbor){
	if(current.r<neighbor.r)
	{
		neighbor.walls[3]=false;
		current.walls[1]=false;
	}
	else if(current.r>neighbor.r)
	{
		neighbor.walls[1]=false;
		current.walls[3]=false;
	}
	if(current.c<neighbor.c)
	{
		neighbor.walls[0]=false;
		current.walls[2]=false;

	}
	else if(current.c>neighbor.c)
	{
		neighbor.walls[2]=false;
		current.walls[0]=false;

	}

  /*var x = a.r - b.r;
  if (x === 1) {
    a.walls[3] = false;
    b.walls[1] = false;
  } else if (x === -1) {
    a.walls[1] = false;
    b.walls[3] = false;
  }
  var y = a.c - b.c;
  if (y === 1) {
    a.walls[0] = false;
    b.walls[2] = false;
  } else if (y === -1) {
    a.walls[2] = false;
    b.walls[0] = false;
  }*/

}
function Cell(r, c) {
    this.r = r;
    this.c = c;
    this.walls = [true, true, true, true];
    this.visited = false;
    this.getNextNeighbor = function() {
        var validNeighbors = []
        var top = grid[index(r - 1, c)];
        var right = grid[index(r, c + 1)];
        var bottom = grid[index(r + 1, c)];
        var left = grid[index(r, c - 1)];
        if (top && !top.visited) 
        {
        	validNeighbors.push(top);
        }
        if (bottom && !bottom.visited) 
        {
        	validNeighbors.push(bottom);
        }
        if (left && !left.visited) 
        {
        	validNeighbors.push(left);
        }
         if (right && !right.visited) 
        {
        	validNeighbors.push(right);
        }
        if(validNeighbors.length>0)
        {
        	var randInt= floor(random(0,validNeighbors.length));
        	console.log("ROW:"+validNeighbors[randInt].r+" COL:"+validNeighbors[randInt].c)
        	return validNeighbors[randInt];
        }
        else{
        	return undefined;
        }
    }
   
    this.show = function() {
        var x = this.r * w;
        var y = this.c * w;
        stroke(0);
        strokeWeight(8);

        if (this.walls[0]) {
            line(x, y, x + w, y);

        }
        if (this.walls[1]) {
            line(x + w, y, x + w, y + w);
        }
        if (this.walls[2]) {
            line(x+w, y + w, x , y + w);
        }
        if (this.walls[3]) {
            line(x, y+w, x,y);
        }
if (this.visited) {
      noStroke();
      fill(255, 0, 255, 100);
      rect(x, y, w, w);
    }
    }
}