const db = require("../models"), Sequelize = require('sequelize'), Op = Sequelize.Op, colors = require("colors"), Filter = require('bad-words'), filter = new Filter(), 
sanitizeHtml = require('sanitize-html'), axios = require('axios');

module.exports = (app)=>{

	let io = app.get('socketio'), match = io.of('/match'), matchConnections = {};

  /*example newgame req json:
  	{ 	match_id: '492241',
	  	logo: 'logo png string',
		header: 'header string,
  		white_player: { id: '123', username: 'WhitePlayerName', uuid: '4244-4114-6867-5666' },
  		black_player: { id: '321', username: 'BlackPlayerName', uuid: '6533-4566-8453-1568' },
  		coaches: [ 
  			{ id: '101', username: 'FirstCoachName', uuid: '6577-9754-7642-3555' },
     		{ id: '202', username: 'SecondCoachName', uuid: '9096-2757-7524-5321' },
     		{ id: '303', username: 'ThirdCoachName', uuid: '8683-3462-4663-8019' } 
     	] 
    }*/

	app.post("/newgame", (req, res)=>{
		console.log(colors.white(req.body));
		db.GameList.findOne({
	        where: { match_id: req.body.match_id }
	    }).then((dbGame)=>{
    		let uuidList = [req.body.white_player.uuid, req.body.black_player.uuid];
    		if (req.body.coaches && req.body.coaches.length !== 0) { for (let coach of req.body.coaches) { uuidList.push(coach.uuid); }; };
    		db.UuidList.findOne({
    			where: { uuid: uuidList }
    		}).then((dbUuid)=>{
    			if (!dbGame && !dbUuid) {
    				let newGame = {}
			    	db.GameList.create({ 
				    	match_id: req.body.match_id,
						white_id: req.body.white_player.id,
				    	black_id: req.body.black_player.id,
				    	logo: req.body.logo,
				    	header: req.body.header
				    }).then(() => {
				    	let uuids = [], names = [];
				    	uuids.push(
				    		{ match_id: req.body.match_id, user_id: req.body.white_player.id, uuid: req.body.white_player.uuid },
			    			{ match_id: req.body.match_id, user_id: req.body.black_player.id, uuid: req.body.black_player.uuid }
			    		);
				    	names.push(
				    		{ user_id: req.body.white_player.id, user_name: req.body.white_player.username },
			    			{ user_id: req.body.black_player.id, user_name: req.body.black_player.username }
			    		);
				    	if (req.body.coaches && req.body.coaches.length !== 0) {
				    		for (let coach of req.body.coaches) { 
				    			uuids.push({ match_id: req.body.match_id, user_id: coach.id, uuid: coach.uuid });
				    			names.push({ user_id: coach.id, user_name: coach.username });
				    		};
				    	};
				    	db.UuidList.bulkCreate(uuids).then(()=>{
				    		db.NameList.bulkCreate(names, {
				    			updateOnDuplicate: ["user_name"]
				    		}).then(() => {
				    			res.send("success");
				    		});
				    	});
			        });
			    }
		    	else { 
		    		console.log(colors.red("duplication rejection"));
		    		res.send("failure"); 
		    	}    
		    });
		    
	    });
  	});

  	/*example addcoach req json:
  	{   coaches: [ 
  			{ match_id: 492241, id: '101', username: 'FirstCoachName', uuid: '6577-9754-7642-3555' },
     		{ match_id: 492241, id: '202', username: 'SecondCoachName', uuid: '9096-2757-7524-5321' },
     		{ match_id: 032950, id: '202', username: 'SecondCoachName', uuid: '8683-3462-4663-8019' } 
     	] 
    }*/

  	app.post("/addcoach", (req, res)=>{
		let uuids = [], names = [];
    	for (let coach of req.body.coaches) { 
			uuids.push({ match_id: req.body.match_id, user_id: coach.id, uuid: coach.uuid });
			names.push({ user_id: coach.id, user_name: coach.username });
		};
		db.UuidList.bulkCreate(uuids).then(()=>{
    		db.NameList.bulkCreate(names, {
    			updateOnDuplicate: ["user_name"]
    		}).then(() => {
    			res.send("success");
    		});
    	});
  	});

  	app.get("/match/:uuid", (req, res)=>{
	    db.UuidList.findOne({
	        where: { uuid: { [Op.eq]: req.params.uuid } }
	    }).then((dbUuid)=>{
	    	if(dbUuid) {
	    		db.GameList.findOne({
			        where: { match_id: dbUuid.match_id }
			    }).then((dbGame)=>{
			    	db.NameList.findOne({
			    		where: { user_id: dbGame.white_id }
				    }).then((dbWhite)=>{
				    	db.NameList.findOne({
				    		where: { user_id: dbGame.black_id }
				    	}).then((dbBlack)=>{
				    		let userData = {
					    		match_id: dbUuid.match_id,
					    		player_id: dbUuid.user_id,
					    		white_id: dbGame.white_id,
					    		white_name: dbWhite.user_name,
					    		black_id: dbGame.black_id,
					    		black_name: dbBlack.user_name
					    	};
					    	if (dbGame.logo) { userData.logo = dbGame.logo; };
					    	if (dbUuid.user_id == dbGame.white_id) {
					    		userData.player_name = dbWhite.user_name, userData.player_color = "white";
					    		console.log(userData);
					    		res.render("match", { encodedJson : encodeURIComponent(JSON.stringify(userData)) });
					    	} else 
					    	if (dbUuid.user_id == dbGame.black_id) {
					    		userData.player_name = dbBlack.user_name, userData.player_color = "black";
					    		res.render("match", { encodedJson : encodeURIComponent(JSON.stringify(userData)) });
					    	}
					    	else {
					    		db.NameList.findOne({
						    		where: { user_id: dbUuid.user_id }
						    	}).then((dbCoach)=>{
						    		userData.player_name = dbCoach.user_name, userData.player_color = "observer", userData.is_coach = true;
									res.render("match", { encodedJson : encodeURIComponent(JSON.stringify(userData)) });
						    	});
					    	};
				    	});
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
	  		db.GameList.findOne({
		        where: { match_id: client.match_id }
		    }).then((dbGame)=>{
		    	if (dbGame.game_status == "in progress") {
			  		db.GameMove.findAll({
			        	where: { match_id: client.match_id },
			        	order: [ [ 'id', 'DESC' ]]
			    	}).then((gameMoves)=>{
			    		if (data.resign && data.move_id == gameMoves.length) {
			    			colorConsole(`${client.color} player has resigned`);
			    			db.GameMove.create({ 
						    	match_id: client.match_id,
						    	lastMove: client.color,
						    	fen: data.fen,
						    	resign_id: client.player_id
						    }).then(() => { db.GameList.update( {game_status: data.game_end}, {returning: true, where: {match_id: client.match_id}} ).then(()=>{ 
						    	sendMatchContent(db.GameMove, 'moves'); }); 
						    	axios.get(`https://thechessschool.net/matches/status/${client.match_id}/${data.game_end}`).then((res)=>{ console.log(res); }).catch((error)=>{ console.log(error); });
							}); 
			    		} else 
			    		if ((gameMoves[1] && data.from && gameMoves[1].lastMove == client.color && gameMoves[1].from !== data.from && gameMoves[1].to !== data.to && data.move_id == gameMoves.length + 1) || 
		    				(gameMoves[0] && data.from && gameMoves[0].lastMove !== client.color && data.move_id == gameMoves.length + 1) || 
		    				(!gameMoves[0] && data.from && client.color == "white")) {
		    				colorConsole(`adding new move from ${client.color} player in match ${client.match_id}`);
				    		db.GameMove.create({ 
						    	match_id: client.match_id,
						    	lastMove: client.color,
						    	from: data.from,
						    	to: data.to,
						    	promotion: data.promotion,
						    	fen: data.fen
						    }).then(() => { 
						    	if (data.game_end) { db.GameList.update( {game_status: data.game_end}, {returning: true, where: {match_id: client.match_id}} ).then(()=>{ 
						    		sendMatchContent(db.GameMove, 'moves'); }); 
						    		axios.get(`https://thechessschool.net/matches/status/${client.match_id}/${data.game_end}`).then((res)=>{ console.log(res); }).catch((error)=>{ console.log(error); });
						    	}
						    	else { sendMatchContent(db.GameMove, 'moves'); };
						    }); 
				    	};
					});
				}
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

	  	sendMatchContent = (dbTable, channel)=>{
	  		dbTable.findAll({
	        	where: { match_id: client.match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((dbData)=>{ match.to(client.room).emit(channel, dbData); });
	  	};

	});

};