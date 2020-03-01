$(function(){

	$("#createGame").click(()=>{
		getGameLinks = ()=>{
			let match = ~~(Math.random() * 1000000) - 1, white = 1, black = 2;
			$.get(`/newgame/${match}/${white}/${black}`, (res)=>{ 
				if (res == "success") {
					let matchUrl = `${window.location.href}match/${match}/`;
					$("#gameLinks").empty().append(`
						<a id="whiteLink" href=${matchUrl}${white} target="blank">White Player Link</a><p>Copyable URL: ${matchUrl}${white}</p>
						<a id="blackLink" href=${matchUrl}${black} target="blank">Black Player Link</a><p>Copyable URL: ${matchUrl}${black}</p>
						<a id="blackLink" href=${matchUrl}observer target="blank">Observer Link</a>    <p>Copyable URL: ${matchUrl}observer</p>
					`);
				}
				else { getGameLinks(); };
			});
		}
		getGameLinks();
	});

})