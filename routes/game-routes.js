const db = require("../models"), Sequelize = require('sequelize'), Op = Sequelize.Op, colors = require("colors"), Filter = require('bad-words'), filter = new Filter();

module.exports = (app)=>{

	let io = app.get('socketio'), match = io.of('/match'), matchConnections = {};

	app.post("/newgame", (req, res)=>{
		console.log(colors.white(req.body));
		db.GameList.findOne({
	        where: { match_id: req.body.match_id }
	    }).then((dbGame)=>{
	    	if (!dbGame) {
		    	db.GameList.create({ 
			    	match_id: req.body.match_id,
					white_id: req.body.white_player.id,
			    	black_id: req.body.black_player.id
			    }).then(() => {
			    	let observers = [];
			    	for (let observer of req.body.observers) { observers.push({ match_id: req.body.match_id, observer_id: observer.id }); };
			    	db.ObserveList.bulkCreate(observers)
			    	.then(() => {
			    		let names = [];
			    		names.push(
				    		{ user_id: req.body.white_player.id, user_name: req.body.white_player.username },
			    			{ user_id: req.body.black_player.id, user_name: req.body.black_player.username }
			    		);
			    		for (let observer of req.body.observers) { names.push({ user_id: observer.id, user_name: observer.username }); };
			    		db.NameList.bulkCreate(names, {
			    			updateOnDuplicate: ["user_name"]
			    		}).then(() => {
			    			res.send("success");
			    		});
			    	});
		        });
		    }
		    else { res.send("failure"); }
	    });
  	});

  	app.get("/match/:id/:player_id", (req, res)=>{
	    db.GameList.findOne({
	        where: { match_id: req.params.id }
	    }).then((dbGame)=>{
	    	if(dbGame) {
		    	db.NameList.findOne({
		    		where: { user_id: dbGame.white_id }
			    }).then((dbWhite)=>{
			    	db.NameList.findOne({
			    		where: { user_id: dbGame.black_id }
			    	}).then((dbBlack)=>{
			    		let userData = {
				    		match_id: req.params.id,
				    		player_id: req.params.player_id,
				    		white_name: dbWhite.user_name,
				    		black_name: dbBlack.user_name
				    	}
				    	if (req.params.player_id == dbGame.white_id) {
				    		userData.player_name = dbWhite.user_name, userData.player_color = "white";
				    		console.log(userData);
				    		res.render("match", { player: "White", encodedJson : encodeURIComponent(JSON.stringify(userData)) });
				    	}
				    	else if (req.params.player_id == dbGame.black_id) {
				    		userData.player_name = dbBlack.user_name, userData.player_color = "black";
				    		res.render("match", { player: "Black", encodedJson : encodeURIComponent(JSON.stringify(userData)) });
				    	}
				    	else {
				    		db.ObserveList.findAll({
				    			where: { match_id: req.params.id }
				    		}).then((dbObservers)=>{
				    			if (dbObservers.some(e => e.observer_id == req.params.player_id)) {
				    				db.NameList.findOne({
				    					where: { user_id: req.params.player_id }
				    				}).then((dbObserver)=>{
				    					userData.player_name = dbObserver.user_name, userData.player_color = "observer";
								    	res.render("match", { player: "observer", encodedJson : encodeURIComponent(JSON.stringify(userData)) });
				    				});
								}
								else { res.render("unauthorized"); };
				    		});
				    	};
			    	});
		    	});
			}
			else { res.render("unauthorized"); };
      	});
  	});

  	match.on('connection', (client)=>{

		client.on('join', (data)=>{
	  		client.match_id = data.match_id, client.room = `match/${client.match_id}`, client.player_name = data.player_name, client.player_id = data.player_id, 
	  		client.color = `${data.player_color == "white" || data.player_color == "black" ? data.player_color : `observer ${data.player_id}`}`;
	  		console.log(colors.magenta(`${client.player_name} has connected to match ${client.match_id}`));
	  		client.join(client.room);
	        client.emit('messages', 'Connected to server');
	        let playerInfo = { color: client.color, name: client.player_name, id: client.player_id };
	        if (matchConnections[`${client.match_id}`]) {
		        	matchConnections[`${client.match_id}`] = matchConnections[`${client.match_id}`].filter(e => e.color !== client.color);
		        	matchConnections[`${client.match_id}`].push(playerInfo);
		        }
		    else { matchConnections[`${client.match_id}`] = [playerInfo] };
		    match.to(client.room).emit('status', matchConnections[`${client.match_id}`]);
	        sendMatchContent(db.GameMove, 'moves');
	    	sendMatchContent(db.GameChat, 'chat');
	    });

  		client.on('disconnect', ()=>{
  			console.log(colors.red(`${client.color} has disconnected from match ${client.match_id}`));
  			if (matchConnections[`${client.match_id}`]) {
  				matchConnections[`${client.match_id}`] = matchConnections[`${client.match_id}`].filter(e => e.color !== client.color);
  				matchConnections[`${client.match_id}`].length === 0 ? delete matchConnections[`${client.match_id}`] : match.to(client.room).emit('status', matchConnections[`${client.match_id}`]);
  			}
  		});

	  	client.on('moveMade', (data)=>{
	  		colorConsole = (message)=>{ client.color == "white" ? console.log(colors.yellow(message)) : console.log(colors.cyan(message)); };
	  		colorConsole(data);
	  		db.GameMove.findAll({
	        	where: { match_id: client.match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((gameMoves)=>{
    			if ((gameMoves[1] && data.from && gameMoves[1].lastMove == client.color && gameMoves[1].from !== data.from && gameMoves[1].to !== data.to) || 
    				(gameMoves[0] && data.from && gameMoves[0].lastMove !== client.color) || 
    				(data.from && client.color == "white")) {
    				colorConsole(`adding new move from ${client.color} player in match ${client.match_id}`);
		    		db.GameMove.create({ 
				    	match_id: client.match_id,
				    	lastMove: client.color,
				    	from: data.from,
				    	to: data.to,
				    	promotion: data.promotion,
				    	fen: data.fen
				    }).then(() => { sendMatchContent(db.GameMove, 'moves'); }); 
		    	};
			});
	    });

	  	client.on('chat', (message)=>{
	  		db.GameChat.create({
	  			match_id: client.match_id,
	  			player_name: client.player_name,
	  			player_message: filter.clean(message)
	  		}).then(()=>{ sendMatchContent(db.GameChat, 'chat'); })
	  	});

	  	sendMatchContent = (dbTable, channel)=>{
	  		dbTable.findAll({
	        	where: { match_id: client.match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((dbData)=>{ match.to(client.room).emit(channel, dbData); });
	  	};

	});

};