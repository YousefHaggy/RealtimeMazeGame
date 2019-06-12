from flask import Flask
from flask_socketio import SocketIO
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
	def __init__(self,playerList,roomID):
		self.playerList=playerList;
		self.roomID=roomID;
		seed=randint(1,100000)
		while seed in roomList:
			seed=randInt(1,100000)
		roomList.add(seed)
@socketio.on('connect_to_queue')
def handleConnect(data):
	player=Player(0,0,random.randint(1,1000000))
	if len(playersInQueue)>0:
		startNewMatch()
	else
		playersInQueue.append(player)
	print(playersInQueue)



if __name__ =='__main__':
	socketio.run(app)