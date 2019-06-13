from flask import Flask, request, jsonify
from flask_socketio import SocketIO, join_room, leave_room, emit, rooms, send
from flask_cors import CORS
import random
import json;
app= Flask(__name__)
CORS(app)
socketio=SocketIO(app)
ROOMS={}
PLAYERS={}
seedList=[]
class Player():
	def __init__(self,col,row,playerID):
		self.col=col
		self.row=row
		self.roomID='unassigned'
		self.playerID=playerID
	def serialize(self):
		return{
		'col': self.col,
		'row': self.row,
		'roomID': self.roomID,
		'playerID': self.playerID
		}
class Room():
	def __init__(self,seed):
		self.playerList=[];
		self.gameOver=False
		self.seed=seed;
	def add_player(self,player):
		self.playerList.append(player)
	def serialize(self):
		return{
		'playerList':[player.serialize() for player in self.playerList],
		'gameOver':self.gameOver,
		'seed':self.seed
		}

@socketio.on('connect_to_queue')
def handleConnect(data):
	PLAYERS[request.sid]=Player(0,0,request.sid)
	matchFound=False
	for seed,room in ROOMS.items():
		if len(room.playerList)<2:
			matchFound=True
			PLAYERS[request.sid].roomID=seed;
			room.add_player(PLAYERS[request.sid])
			join_room(seed)
			message=json.dumps(room.serialize())
			print(message)
			emit("start_game",message,room=seed)
	if not matchFound:
		seed=random.randint(1,100000)
		while seed in seedList:
			seed=random.randint(1,100000)
		room=Room(seed)
		PLAYERS[request.sid].roomID=seed;
		room.add_player(PLAYERS[request.sid])
		ROOMS[seed]=room;
		join_room(seed)
	emit('join_room',{'room':seed})
@socketio.on('test')
def handleTest(data):
	print(PLAYERS[request.sid].roomID)
def startNewMatch(seed):
	send(seed,room=seed)




if __name__ =='__main__':
	socketio.run(app)