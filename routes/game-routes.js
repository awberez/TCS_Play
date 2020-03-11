const db = require("../models"), Sequelize = require('sequelize'), Op = Sequelize.Op, colors = require("colors");

let waitForMove = {};

module.exports = (app)=>{

	let io = app.get('socketio');

	io.of('/match').on('connection', (client)=>{

	  	client.on('join', (data)=>{
	  		client.join(`match/${data.match_id}`);
	        console.log(colors.red(data));
	        client.emit('messages', 'Connected to server');
	        db.GameMove.findAll({
	        	where: { match_id: data.match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((gameMoves)=>{
	    		client.emit('moves', gameMoves);
	    	});
	    });

	  	client.on('moveMade', (data)=>{
	  		colorConsole = (message)=>{ 
  			data.player_color == "white" 
  				? console.log(colors.yellow(message)) 
  				: data.player_color == "black"
  					? console.log(colors.cyan(message))
  					: console.log(colors.magenta(message)); };
	  		colorConsole(data);
	  		db.GameMove.findAll({
	        	where: { match_id: data.match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((gameMoves)=>{
	    		if (gameMoves[1]) {
	    			if (data.from && gameMoves[1].lastMove == data.player_color && gameMoves[1].from !== data.from && gameMoves[1].to !== data.to ) {
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
					    		io.of('/match').to(`match/${data.match_id}`).emit('moves', gameMoves2);
					    	});
					    }); 
			    	}
			    	else { io.of('/match').to(`match/${data.match_id}`).emit('moves', gameMoves); };
			    }
			    else if (gameMoves[0]) {
	    			if (data.from && gameMoves[0].lastMove !== data.player_color) {
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
					    		io.of('/match').to(`match/${data.match_id}`).emit('moves', gameMoves2);
					    	});
					    }); 
			    	}
			    	else { io.of('/match').to(`match/${data.match_id}`).emit('moves', gameMoves); };
			    }
			    else {
			    	if (data.from && data.player_color == "white") {
			    		colorConsole(`adding new move from white player in match ${data.match_id}`);
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
					    		io.of('/match').to(`match/${data.match_id}`).emit('moves', gameMoves2);
					    	});
					    }); 
			    	}
			    	else { io.of('/match').to(`match/${data.match_id}`).emit('moves', gameMoves); };
			    }
			});
	    });

	});


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

  	/*app.post("/getmove", (req, res)=>{
  		let match_id = req.body.match_id, player_id = req.body.player_id, player_color = req.body.player_color, upToDate = req.body.upToDate, move_from, move_to, promotion, fen;
  		colorConsole = (message)=>{ 
  			player_color == "white" 
  				? console.log(colors.yellow(message)) 
  				: player_color == "black"
  					? console.log(colors.cyan(message))
  					: console.log(colors.magenta(message)); };
  		colorConsole(req.body);
  		clearInterval(waitForMove[`${match_id} + ${player_id}`]);
  		if (req.body.from) move_from = req.body.from, move_to = req.body.to, promotion = req.body.promotion, fen = req.body.fen;
  		db.GameList.findOne({
	        where: { match_id: match_id }
	    }).then((dbPlayer)=>{
	    	if (player_id != dbPlayer.white_id && player_id != dbPlayer.black_id && player_id != "observer") { res.render("unauthorized") }
	    	else db.GameMove.findAll({
	        	where: { match_id: match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((gameMoves)=>{
	    		if (player_id == "observer") {
	    			console.log(`${`sending moves for match ${match_id} to observer`.magenta}`);
			    	res.send(gameMoves);
	    		}
	    		else if (gameMoves[1]) {
	    			if (move_from && gameMoves[1].lastMove == player_color && gameMoves[1].from !== move_from && gameMoves[1].to !== move_to ) {
	    				colorConsole(`adding new move from ${player_color} player in match ${match_id}`);
			    		db.GameMove.create({ 
					    	match_id: match_id,
					    	lastMove: player_color,
					    	from: move_from,
					    	to: move_to,
					    	promotion: promotion,
					    	fen: fen
					    }).then(() => { sendTheMoves(); }); 
			    	}
			    	else if (upToDate === "false") {
			    		colorConsole(`sending moves to update ${player_color} player in match ${match_id}`);
			    		res.send(gameMoves);
			    	}
			    	else { 
			    		colorConsole(`${player_color} player in match ${match_id} awaiting moves`);
			    		sendTheMoves(); 
			    	};
			    }
			    else if (gameMoves[0]) {
	    			if (move_from && gameMoves[0].lastMove !== player_color) {
	    				colorConsole(`adding new move from ${player_color} player in match ${match_id}`);
			    		db.GameMove.create({ 
					    	match_id: match_id,
					    	lastMove: player_color,
					    	from: move_from,
					    	to: move_to,
					    	promotion: promotion,
					    	fen: fen
					    }).then(() => { sendTheMoves(); }); 
			    	}
			    	else if (upToDate === "false") {
			    		colorConsole(`sending moves to update ${player_color} player in match ${match_id}`);
			    		res.send(gameMoves);
			    	}
			    	else { 
			    		console.log(`${player_color} player in match ${match_id} awaiting moves`);
			    		sendTheMoves(); 
			    	};
			    }
			    else {
			    	if (move_from && player_color == "white") {
			    		colorConsole(`adding new move from white player in match ${match_id}`);
			    		db.GameMove.create({ 
					    	match_id: match_id,
					    	lastMove: player_color,
					    	from: move_from,
					    	to: move_to,
					    	promotion: promotion,
					    	fen: fen
					    }).then(() => { sendTheMoves(); }); 
			    	}
			    	else { 
			    		colorConsole(`${player_color} player in match ${match_id} awaiting moves`);
			    		sendTheMoves(); 
			    	};
			    }
			});
      	});
      	sendTheMoves = () => {
            db.GameMove.findAll({
	        	where: { match_id: match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((gameMoves2)=>{	
    			colorConsole(`getting move for ${player_color} player in match ${match_id}`);
	    		if (player_color == "white") { //if white player queries
	    			if (gameMoves2.length % 2 == 0) { 
	    				res.send(gameMoves2);
	    				colorConsole(`sent moves to white player in match ${match_id}`);
	    			}
	    			else { 
	    				let numberTimesChecked = 0;
	    				waitForMove[`${match_id} + ${player_id}`] = setInterval(()=>{ 
	    					numberTimesChecked++;
	    					console.log(`${`checking for move from black player in match ${match_id} attempt ${numberTimesChecked}`.yellow}`);
	    					db.GameMove.findAll({
					        	where: { match_id: match_id },
	        					order: [ [ 'id', 'DESC' ]]
					    	}).then((gameMoves3)=>{	
		    					if (gameMoves3.length % 2 == 0) { 
				    				res.send(gameMoves3);
				    				console.log(`${`sent moves to white player in match ${match_id}`.yellow}`);
				    				clearInterval(waitForMove[`${match_id} + ${player_id}`]);
				    			}
				    			else if (numberTimesChecked === 5) {
				    				res.send("retry");
				    				console.log(`${`renew request sent to white player in match ${match_id}`.yellow}`);
				    				clearInterval(waitForMove[`${match_id} + ${player_id}`]);
				    			};
			    			});
	    				}, 1000); 
	    			};
	    		}
	    		else { //if black player queries
	    			if (gameMoves2.length % 2 == 1) { 
	    				res.send(gameMoves2);
	    				colorConsole(`sent moves to black player in match ${match_id}`);
	    			}
	    			else { 
	    				let numberTimesChecked = 0;
	    				waitForMove[`${match_id} + ${player_id}`] = setInterval(()=>{ 
	    					numberTimesChecked++;
	    					console.log(`${`checking for move from white player in match ${match_id} attempt ${numberTimesChecked}`.cyan}`);
	    					db.GameMove.findAll({
					        	where: { match_id: match_id },
	        					order: [ [ 'id', 'DESC' ]]
					    	}).then((gameMoves3)=>{	
		    					if (gameMoves3.length % 2 == 1) { 
				    				res.send(gameMoves3);
				    				console.log(`${`sent moves to black player in match ${match_id}`.cyan}`);
				    				clearInterval(waitForMove[`${match_id} + ${player_id}`]);
				    			}
				    			else if (numberTimesChecked === 5) {
				    				res.send("retry");
				    				console.log(`${`renew request sent to black player in match ${match_id}`.cyan}`);
				    				clearInterval(waitForMove[`${match_id} + ${player_id}`]);
				    			};
			    			});
	    				}, 1000); 
	    			};
	    		}
			});
		};
  	});*/

};