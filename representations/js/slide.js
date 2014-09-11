(function ( document, window ) {

	var timeSec = 3600;
	var seconds, h, m, s;
	var pad = function(n) {
	    return (n < 10 ? "0" + n : n);
	};
	var formatSeconds = function(secs) {
	    seconds = timeSec % 86400;
	    h = parseInt(seconds / 3600);
	    seconds = seconds % 3600;     
	    m = parseInt(seconds / 60);
	    s = parseInt(seconds % 60);
	    return pad(h) +":"+ pad(m) +":"+ pad(s);
	};

	var slides = document.getElementsByClassName("slide"), len = slides.length, i;
	for (i = 0; i < len; i++) {
		slides[i].innerHTML = slides[i].innerHTML + "<span class='header'/>";
		if (i == 0 || i == len - 1) {
			continue;
		}
		//slides[i].innerHTML = slides[i].innerHTML + "<p class='countdown'>" + formatSeconds(timeSec) + "</p>";
		slides[i].innerHTML = slides[i].innerHTML + "<p class='footer'>" + i + " / " + (len - 2) + "</p>";
	}

	var countdowns = document.getElementsByClassName("countdown"), len = countdowns.length, sec;
	var countdown = function() {
		if (timeSec == 0) {
			clearInterval(interval);
			return;
		}
		timeSec--;
		sec = formatSeconds(timeSec);
		for (i = 0; i < len; i++) {
			countdowns[i].innerHTML = sec;
		}
	};

	var interval;
	var startCountdown = function () {
		interval = setInterval(countdown, 1000);
		window.removeEventListener('impress:stepleave', startCountdown, false);
	};
	//window.addEventListener('impress:stepleave', startCountdown, false);

})(document, window);