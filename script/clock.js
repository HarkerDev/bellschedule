/**
 * Updates the time on the bell schedule
 */
function updateClock() {
	var now = new Date();
	var h = now.getHours();
	var h12 = h%12;
	var m = now.getMinutes();
	document.getElementById('currentTime').innerHTML = (h12==0 ? 12: h12) + ":" + addLeadingZero(m) + (h>=12 ? " PM" : " AM");
}

/**
 * Adds leading zeroes as necessary to make output (at least) 2 characters long
 * (Assumes that n is an integer.)
 */
function addLeadingZero(n) {
	return (n<10) ? "0"+n : n;
}