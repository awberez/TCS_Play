const db = require("../models"), Sequelize = require('sequelize'), Op = Sequelize.Op, colors = require("colors");

module.exports = (app)=>{

	let io = app.get('socketio'), match = io.of('/match'), matchConnections = {};

	app.get("/newgame/:id/:white/:black", (req, res)=>{
		db.GameList.findOne({
	        where: { match_id: req.params.id }
	    }).then((dbGame)=>{
	    	if (!dbGame) {
		    	db.GameList.create({ 
			    	match_id: req.params.id,
					white_id: req.params.white,
			    	black_id: req.params.black
			    }).then(() => {
		            res.send("success");
		        });
		    }
		    else { res.send("failure"); }
	    });
  	});

  	app.get("/match/:id/:player_id", (req, res)=>{
	    db.GameList.findOne({
	        where: { match_id: req.params.id }
	    }).then((dbPlayer)=>{
	    	let userData = {
	    		match_id: req.params.id,
	    		player_id: req.params.player_id,
	    		player_color: req.params.player_id == "observer" 
	    			? "observer" 
	    			: req.params.player_id == dbPlayer.black_id 
	    				? "black" 
	    				: "white"
	    	}
	    	req.params.player_id == dbPlayer.black_id
	    		? res.render("match", { match_id: dbPlayer.match_id, player: "black", encodedJson : encodeURIComponent(JSON.stringify(userData)) })
	    		: req.params.player_id == dbPlayer.white_id
	    			? res.render("match", { match_id: dbPlayer.match_id, player: "white", encodedJson : encodeURIComponent(JSON.stringify(userData)) })
	    			: req.params.player_id == "observer"
	    				? res.render("match", { match_id: dbPlayer.match_id, player: "observer", encodedJson : encodeURIComponent(JSON.stringify(userData)) })
	    				: res.render("unauthorized");
      	});
  	});

  	match.on('connection', (client)=>{
  		let match_id;
	  	client.on('join', (data)=>{
	  		console.log(colors.magenta(data));
	  		match_id = data.match_id;
	  		client.join(`match/${match_id}`);
	        client.emit('messages', 'Connected to server');
	        let socketInfo = {connection: data.player_color, socket_id: client.id};
	        matchConnections[`${match_id}`] ? matchConnections[`${match_id}`].push(socketInfo) : matchConnections[`${match_id}`] = [socketInfo];
	        match.to(`match/${match_id}`).emit('status', matchConnections[`${match_id}`]);
	        db.GameMove.findAll({
	        	where: { match_id: match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((gameMoves)=>{
	    		client.emit('moves', gameMoves);
	    	});
	    });
  		client.on('disconnect', ()=>{
  			matchConnections[`${match_id}`] = matchConnections[`${match_id}`].filter(e => e.socket_id !== client.id);
  			match.to(`match/${match_id}`).emit('status', matchConnections[`${match_id}`]);
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
				    	}).then((gameMoves2)=>{
				    		match.to(`match/${match_id}`).emit('moves', gameMoves2);
				    	});
				    }); 
		    	};
			});
	    });
	});

};