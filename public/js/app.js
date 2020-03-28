$(function(){

	$("#createGame").click(()=>{
		$("#createGame").prop('disabled', true);
		setTimeout(()=>{ $("#createGame").prop('disabled', false); }, 1000);
		getGameLinks = ()=>{
			let match = ~~(Math.random() * 1000000) - 1,
			data = {
				match_id: match,
				white_player: {id: 123, username: "WhitePlayerName", uuid: generateUUID()},
				black_player: {id: 321, username: "BlackPlayerName", uuid: generateUUID()},
				coaches: [
					{id: 101, username: "FirstCoachName", uuid: generateUUID()}, 
					{id: 202, username: "SecondCoachName", uuid: generateUUID()}
				]
			}
			$.post(`/newgame`, data, (res)=>{ 
				if (res == "success") {
					let matchUrl = `${window.location.href}match/`, observeUrl = `${window.location.href}observe/${match}/`;
					$("#gameLinks").empty().append(`
						<a id="whiteLink" href=${matchUrl}${data.white_player.uuid} target="blank">White Player Link</a><p>Copyable URL: ${matchUrl}${data.white_player.uuid}</p>
						<a id="blackLink" href=${matchUrl}${data.black_player.uuid} target="blank">Black Player Link</a><p>Copyable URL: ${matchUrl}${data.black_player.uuid}</p>
						<a id="blackLink" href=${matchUrl}${data.coaches[0].uuid}   target="blank">Coach 1 Link</a>     <p>Copyable URL: ${matchUrl}${data.coaches[0].uuid}</p>
						<a id="blackLink" href=${matchUrl}${data.coaches[1].uuid}   target="blank">Coach 2 Link</a>     <p>Copyable URL: ${matchUrl}${data.coaches[1].uuid}</p>
						<a id="blackLink" href=${observeUrl}444/FirstObserver  target="blank">Observer 1 Link</a><p>Copyable URL: ${observeUrl}444/FirstObserver</p>
						<a id="blackLink" href=${observeUrl}555/SecondObserver target="blank">Observer 2 Link</a><p>Copyable URL: ${observeUrl}555/SecondObserver</p>
						<a id="blackLink" href=${observeUrl}666/ThirdObserver  target="blank">Observer 3 Link</a><p>Copyable URL: ${observeUrl}666/ThirdObserver</p>
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