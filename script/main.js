/**
 * Primary script for the Harker Bell Schedule
 * Hosted at http://harkerdev.github.io/bellschedule
**/

window.Mobile = require("./mobile.js");
window.Options = require("./options.js");
window.Schedule = require("./schedule.js");
window.Nav = require("./nav.js");

/**
 * CSS things
 */
addEventListener("scroll", function(event) {
	document.getElementById("header").style.left = scrollX + "px";
});

/**
 * Parses schedules, creates schedule for correct week, sets title title on page load.
 */
addEventListener("load", function(event) {
	//order does matter here
	//TODO enforce order by making schedule/nav take options as an argument?
	window.Mobile.init();
	window.Options.init();
	window.Schedule.init();
	window.Nav.init();
});
