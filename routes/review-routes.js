const db = require("../models"), Sequelize = require('sequelize'), Op = Sequelize.Op, colors = require("colors"), Filter = require('bad-words'), filter = new Filter(), 
sanitizeHtml = require('sanitize-html');

module.exports = (app)=>{

	let io = app.get('socketio'), review = io.of('/review');
	filter.removeWords('pawn');

	app.get("/review/coach/:uuid", (req, res)=>{
	    db.UuidList.findOne({
	        where: { uuid: { [Op.eq]: req.params.uuid } }
	    }).then((dbUuid)=>{
	    	if(dbUuid) {
	    		db.GameList.findOne({
			        where: { match_id: dbUuid.match_id }
			    }).then((dbGame)=>{
			    	if (dbGame.game_status != "in progress") {
				    	db.NameList.findOne({
				    		where: { user_id: dbGame.white_id }
					    }).then((dbWhite)=>{
					    	db.NameList.findOne({
					    		where: { user_id: dbGame.black_id }
					    	}).then((dbBlack)=>{
						    	if (dbUuid.user_id != dbGame.white_id && dbUuid.user_id != dbGame.black_id) {
						    		db.NameList.findOne({
							    		where: { user_id: dbUuid.user_id }
							    	}).then((dbCoach)=>{
							    		let userData = {
								    		match_id: dbUuid.match_id,
								    		white_id: dbGame.white_id,
								    		white_name: dbWhite.user_name,
								    		black_id: dbGame.black_id,
								    		black_name: dbBlack.user_name,
								    		logo: dbGame.logo,
								    		header: dbGame.header,
								    		user_name: dbCoach.user_name
								    	};
							    		res.render("review", { encodedJson : encodeURIComponent(JSON.stringify(userData)) });
							    	});
						    	}
						    	else { res.render("unauthorized"); };
							});
					    });
					}
					else { res.render("unauthorized"); };
			    });
			}
			else { res.render("unauthorized"); };
      	});
  	});

  	app.get("/review/match/:id", (req, res)=>{
  		db.GameList.findOne({
	        where: { match_id: { [Op.eq]: req.params.id } }
	    }).then((dbGame)=>{
	    	if(dbGame && dbGame.game_status != "in progress") {
	    		db.NameList.findOne({
		    		where: { user_id: dbGame.white_id }
			    }).then((dbWhite)=>{
			    	db.NameList.findOne({
			    		where: { user_id: dbGame.black_id }
			    	}).then((dbBlack)=>{
				    	let userData = {
				    		match_id: dbGame.match_id,
				    		white_id: dbGame.white_id,
				    		white_name: dbWhite.user_name,
				    		black_id: dbGame.black_id,
				    		black_name: dbBlack.user_name,
				    		logo: dbGame.logo,
				    		header: dbGame.header,
				    	};
			    		res.render("review", { encodedJson : encodeURIComponent(JSON.stringify(userData)) });
					});
			    });
			}
			else { res.render("unauthorized"); };
      	});
  	});

  	review.on('connection', (client)=>{

  		client.on('join', (data)=>{
	  		client.match_id = data.match_id, client.room = `review/${client.match_id}`;
	  		if (data.user_name) { client.user_name = data.user_name; };
	  		client.join(client.room);
	        client.emit('messages', 'Connected to server');
	        sendMatchContent(db.GameMove, 'moves');
	    	sendMatchContent(db.GameChat, 'chat');
	    	sendMatchContent(db.ReviewNote, 'notes');
	    });

	    client.on('note', (message)=>{
	  		db.ReviewNote.create({
	  			match_id: client.match_id,
	  			move_id: message.move_id,
	  			move_name: message.move_name,
	  			message: sanitizeHtml(filter.clean(message.text), {
	  				allowedTags: [],
					allowedAttributes: {},
	  			})
	  		}).then(()=>{ sendMatchContent(db.ReviewNote, 'notes'); });
	  	});

	    sendMatchContent = (dbTable, channel)=>{
	  		dbTable.findAll({
	        	where: { match_id: client.match_id },
	        	order: [ [ 'id', 'ASC' ]]
	    	}).then((dbData)=>{ review.to(client.room).emit(channel, dbData); });
	  	};
		
	});

};