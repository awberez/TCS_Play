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
				observers: [{id: 101, username: "FirstObserverName"}, {id: 202, username: "SecondObserverName"}, {id: 303, username: "ThirdObserverName"}]
			}
			$.post(`/newgame`, data, (res)=>{ 
				if (res == "success") {
					let matchUrl = `${window.location.href}match/${match}/`;
					$("#gameLinks").empty().append(`
						<a id="whiteLink" href=${matchUrl}123 target="blank">White Player Link</a><p>Copyable URL: ${matchUrl}123</p>
						<a id="blackLink" href=${matchUrl}321 target="blank">Black Player Link</a><p>Copyable URL: ${matchUrl}321</p>
						<a id="blackLink" href=${matchUrl}101 target="blank">Observer Link</a>    <p>Copyable URL: ${matchUrl}101</p>
						<a id="blackLink" href=${matchUrl}202 target="blank">Observer Link</a>    <p>Copyable URL: ${matchUrl}202</p>
						<a id="blackLink" href=${matchUrl}303 target="blank">Observer Link</a>    <p>Copyable URL: ${matchUrl}303</p>
					`);
				}
				else { getGameLinks(); };
			});
		}
		getGameLinks();
	});

})