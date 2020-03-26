const db = require("../models"), Sequelize = require('sequelize'), Op = Sequelize.Op, colors = require("colors"), Filter = require('bad-words'), filter = new Filter(), sanitizeHtml = require('sanitize-html');

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
			    	let coaches = [];
			    	for (let coach of req.body.coaches) { coaches.push({ match_id: req.body.match_id, coach_id: coach.id }); };
			    	db.CoachList.bulkCreate(coaches)
			    	.then(() => {
			    		let names = [];
			    		names.push(
				    		{ user_id: req.body.white_player.id, user_name: req.body.white_player.username },
			    			{ user_id: req.body.black_player.id, user_name: req.body.black_player.username }
			    		);
			    		for (let coach of req.body.coaches) { names.push({ user_id: coach.id, user_name: coach.username }); };
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
	        where: { match_id: { [Op.eq]: req.params.id } }
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
				    		white_id: dbGame.white_id,
				    		white_name: dbWhite.user_name,
				    		black_id: dbGame.black_id,
				    		black_name: dbBlack.user_name
				    	};
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
				    		db.CoachList.findAll({
				    			where: { match_id: { [Op.eq]: req.params.id } }
				    		}).then((dbCoaches)=>{
				    			if (dbCoaches.some(e => e.coach_id == req.params.player_id)) {
				    				db.NameList.findOne({
				    					where: { user_id: req.params.player_id }
				    				}).then((dbCoach)=>{
				    					userData.player_name = dbCoach.user_name, userData.player_color = "observer", userData.is_coach = true;
								    	res.render("match", { encodedJson : encodeURIComponent(JSON.stringify(userData)) });
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

  	app.get("/observe/:id/:observer_id/:observer_name", (req, res)=>{
  		db.GameList.findOne({
	        where: { match_id: { [Op.eq]: req.params.id } }
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
				    		player_id: req.params.observer_id,
				    		player_name: req.params.observer_name,
				    		player_color: "observer",
				    		white_id: dbGame.white_id,
				    		white_name: dbWhite.user_name,
				    		black_id: dbGame.black_id,
				    		black_name: dbBlack.user_name
				    	};
			    		res.render("match", { encodedJson : encodeURIComponent(JSON.stringify(userData)) });
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
	  		console.log(colors.magenta(`${client.color} has connected to match ${client.match_id}`));
	  		client.join(client.room);
	        client.emit('messages', 'Connected to server');
	        let playerInfo = { color: client.color, name: client.player_name, id: client.player_id };
	        if (data.is_coach) { playerInfo.is_coach = true };
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
	    		if (data.resign) {
	    			colorConsole(`${client.color} player has resigned`);
	    			db.GameMove.create({ 
				    	match_id: client.match_id,
				    	lastMove: client.color,
				    	fen: data.fen,
				    	resign_id: client.player_id
				    }).then(() => { 
				    	sendMatchContent(db.GameMove, 'moves');
				    	db.GameList.update( {in_progress: false}, {returning: true, where: {match_id: client.match_id}} );
				    }); 
	    		}
    			else if ((gameMoves[1] && data.from && gameMoves[1].lastMove == client.color && gameMoves[1].from !== data.from && gameMoves[1].to !== data.to) || 
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
				    }).then(() => { 
				    	sendMatchContent(db.GameMove, 'moves');
				    	if (data.game_end) { db.GameList.update( {in_progress: false}, {returning: true, where: {match_id: client.match_id}} ); };
				    }); 
		    	};
			});
	    });

	  	client.on('chat', (message)=>{
	  		db.GameChat.create({
	  			match_id: client.match_id,
	  			player_id: client.player_id,
	  			player_message: sanitizeHtml(filter.clean(message.text), {
	  				allowedTags: [],
					allowedAttributes: {},
	  			}),
	  			fen: message.fen
	  		}).then(()=>{ sendMatchContent(db.GameChat, 'chat'); })
	  	});

	  	client.on('resign', (data)=>{
	  		db.GameList.update( {in_progress: "resignation", loser_id: client.player_id}, {returning: true, where: {match_id: client.match_id}} ).then(()=>{
				match.to(client.room).emit('resign', client.player_id);
	  		});
	  	});

	  	sendMatchContent = (dbTable, channel)=>{
	  		dbTable.findAll({
	        	where: { match_id: client.match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((dbData)=>{ 
	    		match.to(client.room).emit(channel, dbData); 
	    		db.GameList.findOne({
	    			where: { match_id: client.match_id }
	    		}).then((dbMatch)=>{ if (dbMatch.in_progress == "resignation") { match.to(client.room).emit('resign', dbMatch.loser_id); }; });
	    	});
	  	};

	});

};