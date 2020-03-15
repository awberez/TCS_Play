const db = require("../models"), Sequelize = require('sequelize'), Op = Sequelize.Op, colors = require("colors");

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
	    }).then((dbPlayer)=>{
	    	db.NameList.findOne({
	    		where: { user_id: dbPlayer.white_id }
		    }).then((dbWhite)=>{
		    	db.NameList.findOne({
		    		where: { user_id: dbPlayer.black_id }
		    	}).then((dbBlack)=>{
		    		let userData = {
			    		match_id: req.params.id,
			    		player_id: req.params.player_id,
			    		white_name: dbWhite.user_name,
			    		black_name: dbBlack.user_name
			    	}
			    	if (req.params.player_id == dbPlayer.white_id) {
			    		userData.player_name = dbWhite.user_name, userData.player_color = "white";
			    		console.log(userData);
			    		res.render("match", { player: "White", encodedJson : encodeURIComponent(JSON.stringify(userData)) });
			    	}
			    	else if (req.params.player_id == dbPlayer.black_id) {
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
      	});
  	});

  	match.on('connection', (client)=>{
  		let match_id, player_name;
	  	client.on('join', (data)=>{
	  		match_id = data.match_id, player_name = `${data.player_color == "white" || data.player_color == "black" ? data.player_color : `observer ${data.player_id}`}`;
	  		console.log(colors.magenta(`${player_name} has connected to match ${match_id}`));
	  		client.join(`match/${match_id}`);
	        client.emit('messages', 'Connected to server');
	        let playerInfo = { color: player_name, name: data.player_name };
	        matchConnections[`${match_id}`] ? matchConnections[`${match_id}`].push(playerInfo) : matchConnections[`${match_id}`] = [playerInfo];
	        match.to(`match/${match_id}`).emit('status', matchConnections[`${match_id}`]);
	        db.GameMove.findAll({
	        	where: { match_id: match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((gameMoves)=>{ client.emit('moves', gameMoves); });
	    });
  		client.on('disconnect', ()=>{
  			console.log(colors.red(`${player_name} has disconnected from match ${match_id}`));
  			matchConnections[`${match_id}`] = matchConnections[`${match_id}`].filter(e => e.color !== player_name);
  			matchConnections[`${match_id}`].length === 0 ? delete matchConnections[`${match_id}`] : match.to(`match/${match_id}`).emit('status', matchConnections[`${match_id}`]);
  		});
	  	client.on('moveMade', (data)=>{
	  		colorConsole = (message)=>{ data.player_color == "white" ? console.log(colors.yellow(message)) : console.log(colors.cyan(message)); };
	  		colorConsole(data);
	  		db.GameMove.findAll({
	        	where: { match_id: match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((gameMoves)=>{
    			if ((gameMoves[1] && data.from && gameMoves[1].lastMove == data.player_color && gameMoves[1].from !== data.from && gameMoves[1].to !== data.to) || 
    				(gameMoves[0] && data.from && gameMoves[0].lastMove !== data.player_color) || 
    				(data.from && data.player_color == "white")) {
    				colorConsole(`adding new move from ${data.player_color} player in match ${match_id}`);
		    		db.GameMove.create({ 
				    	match_id: match_id,
				    	lastMove: data.player_color,
				    	from: data.from,
				    	to: data.to,
				    	promotion: data.promotion,
				    	fen: data.fen
				    }).then(() => { 
				    	db.GameMove.findAll({
				        	where: { match_id: match_id },
				        	order: [ [ 'id', 'DESC' ]]
				    	}).then((gameMoves2)=>{ match.to(`match/${match_id}`).emit('moves', gameMoves2); });
				    }); 
		    	};
			});
	    });
	});

};