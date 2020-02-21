const db = require("../models"), Sequelize = require('sequelize'), Op = Sequelize.Op;

let waitForMove = {};

module.exports = (app)=>{

	app.get("/newgame/:id/:white/:black", (req, res)=>{
	    db.GameList.create({ 
	    	match_id: req.params.id,
			white_id: req.params.white,
	    	black_id: req.params.black
	    }).then(() => {
            res.send("success");
        })  
  	});

  	app.get("/match/:id/:player_id", (req, res)=>{
	    db.GameList.findOne({
	        where: { match_id: req.params.id }
	    }).then((dbPlayer)=>{
	    	let userData = {
	    		match_id: req.params.id,
	    		player_id: req.params.player_id,
	    		player_color: req.params.player_id == dbPlayer.black_id ? "black" : "white"
	    	}
	    	req.params.player_id == dbPlayer.black_id
	    		? res.render("match", { match_id: dbPlayer.match_id, player: "black", encodedJson : encodeURIComponent(JSON.stringify(userData)) })
	    		: req.params.player_id == dbPlayer.white_id
	    			? res.render("match", { match_id: dbPlayer.match_id, player: "white", encodedJson : encodeURIComponent(JSON.stringify(userData)) })
	    			: res.render("unauthorized");
      	});
  	});

  	app.post("/getmove", (req, res)=>{
  		console.log(req.body);
  		let match_id = req.body.match_id, player_id = req.body.player_id, player_color = req.body.player_color, upToDate = req.body.upToDate, game_move;
  		clearInterval(waitForMove[`${match_id} + ${player_id}`]);
  		if (req.body.game_move) game_move = req.body.game_move;
  		db.GameList.findOne({
	        where: { match_id: match_id }
	    }).then((dbPlayer)=>{
	    	if (player_id != dbPlayer.white_id && player_id != dbPlayer.black_id) { res.render("unauthorized") }
	    	else db.GameMove.findAll({
	        	where: { match_id: match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((gameMoves)=>{
	    		console.log(upToDate === "false");
	    		if (gameMoves[1]) {
	    			if (game_move && gameMoves[1].lastMove == player_color && gameMoves[1].move !== game_move) {
	    				console.log("creating");
			    		db.GameMove.create({ 
					    	match_id: match_id,
					    	lastMove: player_color,
					    	move: game_move
					    }).then(() => { sendTheMoves(dbPlayer); }); 
			    	}
			    	else if (upToDate === "false") {
			    		console.log("sending moves to update");
			    		db.GameMove.findAll({
				        	where: { match_id: match_id },
				        	order: [ [ 'id', 'DESC' ]]
				    	}).then((gameMoves2)=>{	
				    		res.send(gameMoves2);
				    	});
			    	}
			    	else { 
			    		console.log("awaiting moves");
			    		sendTheMoves(dbPlayer); 
			    	};
			    }
			    else if (gameMoves[0]) {
	    			if (game_move && gameMoves[0].lastMove !== player_color) {
	    				console.log("creating");
			    		db.GameMove.create({ 
					    	match_id: match_id,
					    	lastMove: player_color,
					    	move: game_move
					    }).then(() => { sendTheMoves(dbPlayer); }); 
			    	}
			    	else if (upToDate === "false") {
			    		console.log("sending moves to update");
			    		db.GameMove.findAll({
				        	where: { match_id: match_id },
				        	order: [ [ 'id', 'DESC' ]]
				    	}).then((gameMoves2)=>{	
				    		res.send(gameMoves2);
				    	});
			    	}
			    	else { 
			    		console.log("awaiting moves");
			    		sendTheMoves(dbPlayer); 
			    	};
			    }
			    else {
			    	if (game_move && player_color == "white") {
			    		console.log("creating2");
			    		db.GameMove.create({ 
					    	match_id: match_id,
					    	lastMove: player_color,
					    	move: game_move
					    }).then(() => { sendTheMoves(dbPlayer); }); 
			    	}
			    	else if (upToDate === "false") {
			    		console.log("sending moves to update2");
			    		db.GameMove.findAll({
				        	where: { match_id: match_id },
				        	order: [ [ 'id', 'DESC' ]]
				    	}).then((gameMoves2)=>{	
				    		res.send(gameMoves2);
				    	});
			    	}
			    	else { 
			    		console.log("awaiting moves2");
			    		sendTheMoves(dbPlayer); 
			    	};
			    }
			});
      	});
      	sendTheMoves = (dbPlayer) => {
            db.GameMove.findAll({
	        	where: { match_id: match_id },
	        	order: [ [ 'id', 'DESC' ]]
	    	}).then((gameMoves2)=>{	
    			console.log("getting move");
	    		if (player_color == "white") { //if white player queries
	    			if (gameMoves2.length % 2 == 0) { 
	    				res.send(gameMoves2);
	    				console.log("sent moves to white");
	    			}
	    			else { 
	    				let numberTimesChecked = 0;
	    				waitForMove[`${match_id} + ${player_id}`] = setInterval(()=>{ 
	    					numberTimesChecked++;
	    					console.log(`checking for move from black attempt ${numberTimesChecked}`);
	    					db.GameMove.findAll({
					        	where: { match_id: match_id },
	        					order: [ [ 'id', 'DESC' ]]
					    	}).then((gameMoves3)=>{	
		    					if (gameMoves3.length % 2 == 0) { 
				    				res.send(gameMoves3);
				    				console.log("sent moves to white");
				    				clearInterval(waitForMove[`${match_id} + ${player_id}`]);
				    			}
				    			else if (numberTimesChecked === 30) {
				    				res.send("retry");
				    				console.log("renew request sent to white");
				    				clearInterval(waitForMove[`${match_id} + ${player_id}`]);
				    			};
			    			});
	    				}, 1000); 
	    			};
	    		}
	    		else { //if black player queries
	    			if (gameMoves2.length % 2 == 1) { 
	    				res.send(gameMoves2);
	    				console.log("sent moves to black"); 
	    			}
	    			else { 
	    				let numberTimesChecked = 0;
	    				waitForMove[`${match_id} + ${player_id}`] = setInterval(()=>{ 
	    					numberTimesChecked++;
	    					console.log(`checking for move from white attempt ${numberTimesChecked}`);
	    					db.GameMove.findAll({
					        	where: { match_id: match_id },
	        					order: [ [ 'id', 'DESC' ]]
					    	}).then((gameMoves3)=>{	
		    					if (gameMoves3.length % 2 == 1) { 
				    				res.send(gameMoves3);
				    				console.log("sent moves to black");
				    				clearInterval(waitForMove[`${match_id} + ${player_id}`]);
				    			}
				    			else if (numberTimesChecked === 30) {
				    				res.send("retry");
				    				console.log("renew request sent to black");
				    				clearInterval(waitForMove[`${match_id} + ${player_id}`]);
				    			};
			    			});
	    				}, 1000); 
	    			};
	    		}
			});
		};
  	});

};