$(function(){

	$("#createGame").click(()=>{
		$("#createGame").prop('disabled', true);
		setTimeout(()=>{ $("#createGame").prop('disabled', false); }, 1000);
		getGameLinks = ()=>{
			let match = ~~(Math.random() * 1000000) - 1,
			data = {
				match_id: match,
				white_player: {id: 123, username: "WhitePlayerName"},
				black_player: {id: 321, username: "BlackPlayerName"},
				coaches: [{id: 101, username: "FirstCoachName"}, {id: 202, username: "SecondCoachName"}, {id: 303, username: "ThirdCoachName"}]
			}
			$.post(`/newgame`, data, (res)=>{ 
				if (res == "success") {
					let matchUrl = `${window.location.href}match/${match}/`, observeUrl = `${window.location.href}observe/${match}/`;
					$("#gameLinks").empty().append(`
						<a id="whiteLink" href=${matchUrl}123 target="blank">White Player Link</a><p>Copyable URL: ${matchUrl}123</p>
						<a id="blackLink" href=${matchUrl}321 target="blank">Black Player Link</a><p>Copyable URL: ${matchUrl}321</p>
						<a id="blackLink" href=${matchUrl}101 target="blank">Coach 1 Link</a>     <p>Copyable URL: ${matchUrl}101</p>
						<a id="blackLink" href=${matchUrl}202 target="blank">Coach 2 Link</a>     <p>Copyable URL: ${matchUrl}202</p>
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

})