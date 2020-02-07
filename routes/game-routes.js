const db = require("../models"), Sequelize = require('sequelize'), Op = Sequelize.Op;

let matchList = {};

module.exports = (app)=>{

	app.get("/newgame/:id/:black/:white", (req, res)=>{
	    db.GameList.create({ 
	    	match_id: req.params.id, 
	    	black_id: req.params.black, 
	    	white_id: req.params.white
	    }).then(() => {
            res.send("success");
        })  
  	});

  	app.get("/match/:id/:player_id", (req, res)=>{
	    db.GameList.findOne({
	        where: { match_id: req.params.id }
	    }).then((dbPlayer)=>{
	    	req.params.player_id == dbPlayer.black_id
	    		? res.render("match", { match_id: dbPlayer.match_id, player: "black" })
	    		: req.params.player_id == dbPlayer.white_id
	    			? res.render("match", { match_id: dbPlayer.match_id, player: "white" })
	    			: res.render("unauthorized");
      	});
  	});

  	app.post("/getmove", (req, res)=>{
  		console.log(req.body);
  		let match_id = req.body.match_id, player_id = req.body.player_id, game_move = req.body.game_move;
  		db.GameList.findOne({
	        where: { match_id: match_id }
	    }).then((dbPlayer)=>{
	    	if (player_id != dbPlayer.white_id && player_id != dbPlayer.black_id) { res.render("unauthorized") }
	    	else db.GameMove.findAll({
	        	where: { match_id: match_id }
	    	}).then((gameMoves)=>{
	    		db.GameMove.create({ 
			    	match_id: match_id, 
			    	move_id: gameMoves.length + 1, 
			    	move: game_move
			    }).then(() => {
		            db.GameMove.findAll({
			        	where: { match_id: match_id }
			    	}).then((gameMoves2)=>{	
		    			console.log("getting move");
		    			console.log(player_id);
		    			console.log(dbPlayer.white_id);
		    			let waitForMove;
			    		if (player_id == dbPlayer.white_id) { //if white player queries
			    			if (gameMoves2.length % 2 == 0) { 
			    				res.send(gameMoves2);
			    				console.log("sent moves to white");
			    			}
			    			else { 
			    				waitForMove = setInterval(()=>{ 
			    					console.log("checking for move from black");
			    					db.GameMove.findAll({
							        	where: { match_id: match_id }
							    	}).then((gameMoves3)=>{	
				    					if (gameMoves3.length % 2 == 0) { 
						    				res.send(gameMoves3);
						    				console.log("sent moves to white");
						    				clearInterval(waitForMove);
						    			}
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
			    				waitForMove = setInterval(()=>{ 
			    					console.log("checking for move from white");
			    					db.GameMove.findAll({
							        	where: { match_id: match_id }
							    	}).then((gameMoves3)=>{	
				    					if (gameMoves3.length % 2 == 1) { 
						    				res.send(gameMoves3);
						    				console.log("sent moves to black");
						    				clearInterval(waitForMove);
						    			}
					    			});
			    				}, 1000); 
			    			};
			    		}
					});
		        }) 
			});
      	});
  	});

  	/*if (player_id == dbPlayer.white && gameMoves2.length % 2 == 1) console.log("move already submitted");
	  else if (player_id == dbPlayer.black && gameMoves2.length % 2 == 0) console.log("move already submitted");*/

};