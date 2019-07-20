from flask import Flask, request, jsonify, render_template
from flask_socketio import SocketIO, join_room, leave_room, emit, rooms, send, close_room
from flask_cors import CORS
import random
from threading import Timer
import eventlet
import json;
from gamelogic import generateMaze, updatePlayer
from datetime import datetime
eventlet.monkey_patch()
app= Flask(__name__)
#app.config.update(TEMPLATES_AUTO_RELOAD=True, DEBUG=True)
cors = CORS(app, resources={r"/api/*": {"origins": "*"}})
socketio=SocketIO(app)
ROOMS={}
PLAYERS={}
seedList=[]
class Player():
	def __init__(self,col,row,playerID,playerName="unnamed"):
		self.col=col
		self.row=row
		self.playerName=playerName
		self.roomID='unassigned'
		self.playerID=playerID
		self.phasesLeft=15
		self.score=0;
		self.isAbleToPhase=False;
		self.isRacing=False;
	def serialize(self):
		return{
		'col': self.col,
		'row': self.row,
		'roomID': self.roomID,
		'playerID': self.playerID,
		'playerName':self.playerName,
		'isAbleToPhase':self.isAbleToPhase,
		'score': self.score
		}
class Room():
	def __init__(self,seed,maze):
		self.playerList=[];
		self.gameStarted=False
		self.isRoundOnGoing=False;
		self.seed=seed;
		self.maze=maze
		self.roundsLeft=5
		self.playersDoneRacing=0;
		self.roundStartTime=datetime.utcnow();

	def add_player(self,player):
		self.playerList.append(player)
	def remove_player(self,playerID):
		for player in self.playerList:
			if player.playerID == playerID:
				self.playerList.remove(player)
	def serialize(self,requestSID="none"):
		return{
		'playerList':[player.serialize() for player in self.playerList if player.playerID != requestSID],
		'completePlayerList':[player.serialize() for player in self.playerList],
		'gameStarted':self.gameStarted,
		'maze': [cell.walls for cell in self.maze]
		}
@app.route("/")
def index():
	return render_template('index.html')
@socketio.on('entered_queue')
def handleConnect(data):
	if data['name'] is "":
		PLAYERS[request.sid]=Player(0,0,request.sid)
	else:
		PLAYERS[request.sid]=Player(0,0,request.sid,data['name'])
	matchFound=False
	for seed,room in ROOMS.items():
		print(str(len(room.playerList)))
		print(str(room.gameStarted))
		if len(room.playerList)<2 and room.gameStarted==False:
			matchFound=True
			PLAYERS[request.sid].roomID=seed;
			room.add_player(PLAYERS[request.sid])
			join_room(seed)
			emit("room_found",len(room.playerList),room=seed)
			print("In room" +str(PLAYERS[request.sid].roomID))
			eventlet.spawn_after(3,startGame,seed)
		elif room.gameStarted==False and len(room.playerList)<10:
			matchFound=True
			PLAYERS[request.sid].roomID=seed;
			room.add_player(PLAYERS[request.sid])
			join_room(seed)
			print("MORE THAN 2")
			print("In room " +str(PLAYERS[request.sid].roomID))
			emit("room_found",len(room.playerList),room=seed)
	if not matchFound:
		seed=random.randint(1,100000)
		while seed in seedList:
			seed=random.randint(1,100000)
		seedList.append(seed)
		room=Room(seed,generateMaze())
		PLAYERS[request.sid].roomID=seed;
		room.add_player(PLAYERS[request.sid])
		ROOMS[seed]=room;
		join_room(seed)
	print("new connect event " +str(PLAYERS[request.sid].roomID))
	emit('join_room',{'room':seed,'playerID':request.sid})
 
	
@socketio.on('discgonnect')
def handleDisconnect():
	print(ROOMS)
	if request.sid in PLAYERS:
		roomID=PLAYERS[request.sid].roomID
		leave_room(roomID)
		ROOMS[roomID].remove_player(request.sid)
		if len(ROOMS[roomID].playerList)==0:
			del ROOMS[roomID]
			print(ROOMS)
		del PLAYERS[request.sid]
@socketio.on('get_room_details')
def getRoomDetails():
	roomID=PLAYERS[request.sid].roomID
	message=json.dumps(ROOMS[roomID].serialize(request.sid))
	print("getRoomDetails " +str(PLAYERS[request.sid].roomID))
	emit("start_game",message,room=request.sid)
@socketio.on('player_position_changed')
def playerPositionChanged(data):
	roomID=PLAYERS[request.sid].roomID
	if ROOMS[roomID].isRoundOnGoing and ROOMS[roomID].gameStarted:
		for player in ROOMS[roomID].playerList:
			if player.playerID==request.sid and player.isRacing:
				updatePlayer(player,data['direction'],ROOMS[roomID].maze)
				message=json.dumps(player.serialize())
				emit("local_player_updated",message,room=request.sid)
				if player.col==39 and player.row==34:
					player.isRacing=False
					raceCompletionTime=(datetime.utcnow()-ROOMS[roomID].roundStartTime).total_seconds();
					player.score+=round(1000/raceCompletionTime);
					print(round(raceCompletionTime,2))
					message=json.dumps(player.serialize())
					emit("players_updated",message,room=roomID,skip_sid=request.sid)
					ROOMS[roomID].playerList.sort(key= lambda x:x.score,reverse=True);
					message=json.dumps(ROOMS[roomID].serialize())
					emit("update_leaderboard",message,room=roomID)
					emit("finished_race",str(round(raceCompletionTime,2)),room=request.sid)
					ROOMS[roomID].playersDoneRacing+=1
					if ROOMS[roomID].playersDoneRacing==3 or ROOMS[roomID].playersDoneRacing>=len(ROOMS[roomID].playerList):
						ROOMS[roomID].isRoundOnGoing=False;
						message=json.dumps(ROOMS[roomID].serialize(request.sid))
						emit("round_over",message,room=roomID);
						eventlet.spawn_after(3,startNextRound,roomID)

					#
					#emit("game_won",message,room=roomID)
					#roomID=PLAYERS[request.sid].roomID
					#close_room(roomID)
					#del ROOMS[roomID]
					#del PLAYERS[request.sid]
				else:
					message=json.dumps(player.serialize())
					emit("players_updated",message,room=roomID,skip_sid=request.sid)
@socketio.on('spacebar')
def onSpacebar():
	if PLAYERS[request.sid].phasesLeft>0 and not PLAYERS[request.sid].isAbleToPhase:
		PLAYERS[request.sid].isAbleToPhase=True
		PLAYERS[request.sid].phasesLeft-=1
		emit("able_to_phase",room=request.sid)

def startGame(roomID):
	with app.test_request_context():
		ROOMS[roomID].gameStarted=True
		ROOMS[roomID].isRoundOnGoing=True
		socketio.emit("match_starting",room=roomID);
		for player in ROOMS[roomID].playerList:
			player.isRacing=True;
			message=json.dumps(ROOMS[roomID].serialize(player.playerID))
			socketio.emit("start_game",message,room=player.playerID)

def startNextRound(roomID):
	with app.test_request_context():
		ROOMS[roomID].maze=generateMaze()
		ROOMS[roomID].playersDoneRacing=0
		ROOMS[roomID].roundsLeft-=1
		ROOMS[roomID].roundStartTime=datetime.utcnow()
		ROOMS[roomID].isRoundOnGoing=True
		for player in ROOMS[roomID].playerList:
			player.col=0;
			player.row=0;
			player.phasesLeft=3
			player.isAbleToPhase=False;
			player.isRacing=True
		for player in ROOMS[roomID].playerList:
			message=json.dumps(ROOMS[roomID].serialize(player.playerID))
			socketio.emit("start_next_round",message,room=player.playerID)

if __name__ =='__main__':
	socketio.run(app)