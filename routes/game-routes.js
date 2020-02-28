const db = require("../models"), Sequelize = require('sequelize'), Op = Sequelize.Op;

let waitForMove = {};

module.exports = (app)=>{

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
	    		player_color: req.params.player_id == "observer" ? "observer" 
	    														 : req.params.player_id == dbPlayer.black_id ? "black" 
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

  	app.post("/getmove", (req, res)=>{
  		console.log(req.body);
  		let match_id = req.body.match_id, player_id = req.body.player_id, player_color = req.body.player_color, upToDate = req.body.upToDate, move_from, move_to, promotion, fen;
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
	    			console.log(`sending moves for match ${match_id} to observer`);
			    	res.send(gameMoves);
	    		}
	    		else if (gameMoves[1]) {
	    			if (move_from && gameMoves[1].lastMove == player_color && gameMoves[1].from !== move_from && gameMoves[1].to !== move_to ) {
	    				console.log("creating");
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
			    		console.log("sending moves to update");
			    		res.send(gameMoves);
			    	}
			    	else { 
			    		console.log("awaiting moves");
			    		sendTheMoves(); 
			    	};
			    }
			    else if (gameMoves[0]) {
	    			if (move_from && gameMoves[0].lastMove !== player_color) {
	    				console.log("creating2");
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
			    		console.log("sending moves to update2");
			    		res.send(gameMoves);
			    	}
			    	else { 
			    		console.log("awaiting moves2");
			    		sendTheMoves(); 
			    	};
			    }
			    else {
			    	if (move_from && player_color == "white") {
			    		console.log("creating3");
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
			    		console.log("awaiting moves3");
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
	    					console.log(`checking for move from black player in match ${match_id} attempt ${numberTimesChecked}`);
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
	    					console.log(`checking for move from white player in match ${match_id} attempt ${numberTimesChecked}`);
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