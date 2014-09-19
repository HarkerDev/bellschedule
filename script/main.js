/**
 * Primary script for the Harker Bell Schedule
 * Hosted at http://harkerdev.github.io/bellschedule
**/

window.Options = require("./options.js");
window.Mobile = require("./mobile.js");
window.Nav = require("./nav.js");
window.Schedule = require("./schedule.js");

/**
 * CSS things
 */
addEventListener("scroll", function(event) {
	document.getElementById("header").style.left = scrollX + "px";
});

/**
 * Returns an array of values in the array that aren't in a.
 */
Array.prototype.diff = function(a) {
	return this.filter(function(i) {return a.indexOf(i) < 0;});
};


/**
 * Parses schedules, creates schedule for correct week, sets title title on page load.
 */
addEventListener("load", function(event) {
	window.Mobile.init();
	
	window.Nav.init();
	
	window.Schedule.init();
	
	window.Options.init();
});
