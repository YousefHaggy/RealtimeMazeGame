from flask import Flask
from flask_socketio import SocketIO, join_room, leave_room
from flask_cors import CORS
import random
app= Flask(__name__)
CORS(app)
socketio=SocketIO(app)
roomList=[]
playersInQueue=[]
class Player:
	def __init__(self,col,row,playerID):
		self.col=col
		self.row=row
		self.playerID=playerID
class Room:
	def __init__(self):
		self.playerList=[];
		self.gameOver=False
		self.seed=randint(1,100000)
		roomList.add(seed)
	def add_player(self,player):
		self.playerList.append(player)
@socketio.on('connect_to_queue')
def handleConnect(data):
	player=Player(0,0,random.randint(1,1000000))
	matchFound=False
	for room in roomList:
		if len(room.playerList)<2:
			matchFound=True
			room.add_player(player)
			join_room(room.seed)
			startMatch(room.seed)
	if not matchFound:
		room=Room().add_player(player)
		join_room(room.seed)
	print(playersInQueue)
def startNewMatch(seed):
	send(seed,room=seed)




if __name__ =='__main__':
	socketio.run(app)