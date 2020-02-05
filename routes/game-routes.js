const db = require("../models"), Sequelize = require('sequelize'), Op = Sequelize.Op;

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
};