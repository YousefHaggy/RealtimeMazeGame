from flask import Flask, request, jsonify
from flask_socketio import SocketIO, join_room, leave_room, emit, rooms, send, close_room
from flask_cors import CORS
import random
import eventlet
import json;
eventlet.monkey_patch()
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
	def remove_player(self,playerID):
		for player in self.playerList:
			if player.playerID == playerID:
				del player
	def serialize(self,requestSID):
		return{
		'playerList':[player.serialize() for player in self.playerList if player.playerID != requestSID],
		'gameOver':self.gameOver,
		'seed':self.seed
		}

@socketio.on('connect')
def handleConnect():
	PLAYERS[request.sid]=Player(0,0,request.sid)
	matchFound=False
	for seed,room in ROOMS.items():
		if len(room.playerList)<2:
			matchFound=True
			PLAYERS[request.sid].roomID=seed;
			room.add_player(PLAYERS[request.sid])
			join_room(seed)
			emit("room_found",room=seed)
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
 
	
@socketio.on('disconnessct')
def handleDisconnect():
	roomID=PLAYERS[request.sid].roomID
	leave_room(roomID)
	ROOMS[roomID].remove_player(request.sid)
	if len(ROOMS[roomID].playerList)==0:
		del ROOMS[roomID]
	del PLAYERS[request.sid]
@socketio.on('get_room_details')
def getRoomDetails():
	roomID=PLAYERS[request.sid].roomID
	message=json.dumps(ROOMS[roomID].serialize(request.sid))
	emit("start_game",message,room=request.sid)
@socketio.on('player_position_changed')
def playerPositionChanged(data):
	print(str(data))
	roomID=PLAYERS[request.sid].roomID
	for player in ROOMS[roomID].playerList:
		if player.playerID==request.sid:
			if abs(player.col-data['col']) <=1 and abs(player.row-data['row']) <=1:
				player.col=data['col']
				player.row=data['row']
				if player.col==24 and player.row==24:
					message=json.dumps(player.serialize())
					emit("game_won",message,room=roomID)
					roomID=PLAYERS[request.sid].roomID
					close_room(roomID)
					del ROOMS[roomID]
					del PLAYERS[request.sid]
				else:
					message=json.dumps(player.serialize())
					emit("players_updated",message,room=roomID,skip_sid=request.sid)
	



if __name__ =='__main__':
	socketio.run(app)