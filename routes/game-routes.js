const db = require("../models"), Sequelize = require('sequelize'), Op = Sequelize.Op, colors = require("colors");

module.exports = (app)=>{

	const io = app.get('socketio'), match = io.of('/match');

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
  		//add socket to the room for a specific game and return all moves for that game
	  	client.on('join', (data)=>{
	  		console.log(colors.red(data));
	  		client.join(`match/${data.match_id}`);
	        client.emit('messages', 'Connected to server');
	        db.GameMove.findAll({
	        	where: { match_id: data.match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((gameMoves)=>{
	    		client.emit('moves', gameMoves);
	    	});
	    });
	  	//update game database with new move, then return all moves to every socket in the game's room
	  	client.on('moveMade', (data)=>{
	  		colorConsole = (message)=>{ 
	  			data.player_color == "white" 
	  				? console.log(colors.yellow(message)) 
	  				: data.player_color == "black"
	  					? console.log(colors.cyan(message))
	  					: console.log(colors.magenta(message)); 
  			};
	  		colorConsole(data);
	  		db.GameMove.findAll({
	        	where: { match_id: data.match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((gameMoves)=>{
    			if ((gameMoves[1] && data.from && gameMoves[1].lastMove == data.player_color && gameMoves[1].from !== data.from && gameMoves[1].to !== data.to) || 
    				(gameMoves[0] && data.from && gameMoves[0].lastMove !== data.player_color) || 
    				(data.from && data.player_color == "white")) {
    				colorConsole(`adding new move from ${data.player_color} player in match ${data.match_id}`);
		    		db.GameMove.create({ 
				    	match_id: data.match_id,
				    	lastMove: data.player_color,
				    	from: data.from,
				    	to: data.to,
				    	promotion: data.promotion,
				    	fen: data.fen
				    }).then(() => { 
				    	db.GameMove.findAll({
				        	where: { match_id: data.match_id },
				        	order: [ [ 'id', 'DESC' ]]
				    	}).then((gameMoves2)=>{
				    		match.to(`match/${data.match_id}`).emit('moves', gameMoves2);
				    	});
				    }); 
		    	}
			});
	    });
	});

};