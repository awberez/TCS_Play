$(function(){

	$("#createGame").click(()=>{
		getGameLinks = ()=> {
			let match = ~~(Math.random() * 1000000) - 1, white = 1, black = 2;
			$.get(`/newgame/${match}/${white}/${black}`, (res)=>{ 
				if (res == "success") {
					$("#gameLinks").empty().append(`
						<a id="whiteLink" href=/match/${match}/${white} target="blank">White Player Link</a><p id="whiteUrl">Copyable URL: </p>
						<a id="blackLink" href=/match/${match}/${black} target="blank">Black Player Link</a><p id="blackUrl">Copyable URL: </p>
					`);
					$("#whiteUrl").html(`Copyable URL: ${window.location.href.slice(0, -1)}${$("#whiteLink").attr("href")}`);
					$("#blackUrl").html(`Copyable URL: ${window.location.href.slice(0, -1)}${$("#blackLink").attr("href")}`);
				}
				else { getGameLinks(); };
			});
		}
		getGameLinks();
	});

})