$(document).ready(function () {
	var zeroes = function (value) {
		if (value < 10){
			return "0"+value;
		}
		if (value >= 100){
			return value/10;
		}
		return value;
	}
	var moving = false;
	var remove = function () {
		if (!moving) {
			moving = true;
			TweenLite.to($('.countdown'), 2, {top:'-250px', ease: Expo.easeIn});
			TweenLite.to($('.mainscreen'), 2, {opacity:'1', ease: Expo.easeIn});
		}
	}

	var countdown = function (date) {
		date = date.subtract(10, 'ms');
		var minutes = zeroes(date.minutes());
		var seconds = zeroes(date.seconds());
		var ms = zeroes(date.milliseconds());
		$('#time').html(minutes+":"+seconds+":"+ms);
		if(date.seconds() <= 1) {
			remove();
		}
		if(date.milliseconds() >= 0) {
			setTimeout(function() { countdown(date) }, 10);
		}
	}

	var date = moment.duration($('#time').html());
	countdown(date);
});