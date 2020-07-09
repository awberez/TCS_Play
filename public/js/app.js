$(function(){

	$("#createGame").click(()=>{
		$("#createGame").prop('disabled', true);
		setTimeout(()=>{ $("#createGame").prop('disabled', false); }, 1000);
		getGameLinks = ()=>{
			let match = ~~(Math.random() * 1000000) - 1,
			data = {
				match_id: match,
				white_player: {id: 115, username: "WhitePlayerName", uuid: generateUUID()},
				black_player: {id: 225, username: "BlackPlayerName", uuid: generateUUID()},
				coaches: [ {id: 999, username: "CoachName", uuid: generateUUID()} ]
			}
			$.post(`/newgame`, data, (res)=>{ 
				if (res == "success") {
					let matchUrl = `${window.location.href.slice(0, -9)}match/`, observeUrl = `${window.location.href.slice(0, -9)}observe/${match}/`,
					reviewUrl = `${window.location.href.slice(0, -9)}review/match/`, reviewCoachUrl = `${window.location.href.slice(0, -9)}review/coach/`
					$("#demoContent").empty().append(`
						<br/><br/>
						<a href=${matchUrl}${data.white_player.uuid} target="blank">White Player</a><p>Copyable URL: ${matchUrl}${data.white_player.uuid}</p>
						<a href=${matchUrl}${data.black_player.uuid} target="blank">Black Player</a><p>Copyable URL: ${matchUrl}${data.black_player.uuid}</p>
						<a href=${matchUrl}${data.coaches[0].uuid} target="blank">Coach</a><p>Copyable URL: ${matchUrl}${data.coaches[0].uuid}</p>
						<a href=${observeUrl}444/ObserverName target="blank">Observer</a><p>Copyable URL: ${observeUrl}444/ObserverName</p>
						<a href=${reviewCoachUrl}${data.coaches[0].uuid} target="blank">Game Review Coach (game must be ended first)</a><p>Copyable URL: ${reviewCoachUrl}${data.coaches[0].uuid}</p>
						<a href=${reviewUrl}${match} target="blank">Game Review Generic (game must be ended first)</a><p>Copyable URL: ${reviewUrl}${match}</p>
					`);
				}
				else { getGameLinks(); };
			});
		}
		getGameLinks();
	});

	generateUUID = () => {
		return `${~~(Math.random() * 10)}${~~(Math.random() * 10)}${~~(Math.random() * 10)}${~~(Math.random() * 10)}-${~~(Math.random() * 10)}${~~(Math.random() * 10)}${~~(Math.random() * 10)}${~~(Math.random() * 10)}-${~~(Math.random() * 10)}${~~(Math.random() * 10)}${~~(Math.random() * 10)}${~~(Math.random() * 10)}-${~~(Math.random() * 10)}${~~(Math.random() * 10)}${~~(Math.random() * 10)}${~~(Math.random() * 10)}`;
	}

})