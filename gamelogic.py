import random
cols=35
rows=35
grid=[]
class Cell():
	def __init__(self,row,col):
		self.col=col
		self.row=row
		self.walls=[True,True,True,True]
		self.visited=False
	def getRandomNeighbor(self):
		neighbors=[]
		top,right,bottom,left=None,None,None,None
		if index(self.row,self.col-1):
			left=grid[index(self.row,self.col-1)]
		if index(self.row+1,self.col):
			bottom= grid[index(self.row+1,self.col)]
		if index(self.row,self.col+1):
			right= grid[index(self.row,self.col+1)]
		if index(self.row-1,self.col):
			top= grid[index(self.row-1,self.col)]
		if top is not None and not top.visited:
			neighbors.append(top)
		if right is not None and not right.visited:
			neighbors.append(right)
		if bottom is not None and not bottom.visited:
			neighbors.append(bottom)
		if left is not None and not left.visited:
			neighbors.append(left)
		if len(neighbors)>0:
			return neighbors[random.randint(0,len(neighbors)-1)]
		else:
			return None
def index(r,c):
	if r<0 or c<0 or r>34 or c>34:
		return False
	else:
		return c + r * cols
def removeWall(current,neighbor):
	if current.row < neighbor.row:
		current.walls[2]=False
		neighbor.walls[0]=False
	elif current.row > neighbor.row:
		current.walls[0]=False
		neighbor.walls[2]=False
	if current.col > neighbor.col:
		current.walls[3]=False
		neighbor.walls[1]=False
	elif current.col < neighbor.col:
		current.walls[1]=False
		neighbor.walls[3]=False

def generateMaze():
	global grid
	grid.clear()
	for r in range(0,rows):
		for c in range(0,cols):
			grid.append(Cell(r,c)) 
	stack=[]
	current=grid[0]
	stack.append(current)
	while len(stack)>0:
		current.visited=True
		neighbor=current.getRandomNeighbor()
		if neighbor:
			neighbor.visited=True
			removeWall(current,neighbor)
			stack.append(neighbor)
			current=neighbor
		else:
			current=stack.pop()
	return grid
