/**
 * Primary script for the Harker Bell Schedule
 * Hosted at http://harkerdev.github.io/bellschedule
**/

var options = require("./options.js");
var mobile = require("./mobile.js");
var nav = require("./nav.js");
var dateUtil = require("./dateUtil.js");
var schedule = require("./schedule.js");

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
	mobile.init();

	nav.init();

	schedule.init();

	//updateSchedule();
	//updateClock();
	
	options.init();
});
