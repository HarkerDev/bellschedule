var DateUtil = require("./dateUtil.js");
var Schedule = require("./schedule.js");

var viewTypes = exports.viewTypes = {
	DAY: "day",
	WEEK: "week"
};

var viewType;

/**
 * Gets GET variables from URL and sets them as properties of the urlParams object.
 * Then updates the state of the current history entry with the appropriate week.
 */

/**
 * Adds appropriate event listeners to items in the schedule title.
 */
exports.init = function() {
	
	var initialDate = getDateFromUrlParams();
	
	Schedule.setDate(initialDate);
	
	//update history state
	window.history.replaceState(initialDate, document.title, document.location);
	
	document.getElementById("header").addEventListener("click", setTitleTitle);
	document.getElementById("leftArrow").addEventListener("click", goPrev);
	document.getElementById("rightArrow").addEventListener("click", goNext);
	
	document.getElementById("refresh").addEventListener("click", function() { Schedule.update(null,true); });
	
	setTitleTitle();
};

exports.setViewType = function(type) {
	viewType = type;
};


/**
 * Event listener for navigating through history.
 * (onload event will not fire when navigating through history items pushed by history.pushState, because the page does not reload)
 */
addEventListener("popstate", function(event) {
	getUrlParams();
	Schedule.update(event.state);
});

/**
 * Sets the title of the title to a random line from the title titles list
 */
function setTitleTitle() {
	var titles = document.getElementById("titleTitles").textContent.split("\n");
	document.getElementById("title").title=titles[Math.floor(Math.random()*titles.length)];
}

/**
 * Returns a Date object based on the current urlParams (GET variables in the URL).
 * If any part of the date is not specified, defaults to the current date/month/year.
 * If in week view, uses the Monday of the week instead of the day.
 */
function getDateFromUrlParams() {
	var urlParams = getUrlParams();
	
	var date = new Date();
	
	if(urlParams.y>0) date.setFullYear(urlParams.y);
	if(urlParams.m>0) date.setMonth(urlParams.m-1);
	if(urlParams.d>0) date.setDate(urlParams.d);
	
	if(viewType == viewTypes.WEEK) date = DateUtil.getMonday(date);
	else date = DateUtil.getDayBeginning(date);
	
	return date;
}

/**
 * Updates urlParams object based on the GET variables in the URL.
 * (variables as properties and values as values)
 */
function getUrlParams() {
	var urlParams = {};
	
	var match,
		pl = /(?!^)\+/g,  //regex for replacing non-leading + with space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function(s) { return decodeURIComponent(s.replace(pl, " ")); },
		query = location.search.substring(1);
	
	while (match = search.exec(query))
		urlParams[decode(match[1])] = decode(match[2]);
	
	return urlParams;
}

/**
 * Navigates schedule to previous date.
 */
function goPrev() {
	var date = Schedule.getDisplayDate();
	date.setDate(date.getDate() - (viewType == viewTypes.DAY ? 1 : 7));
	
	navigate(date);
}

/**
 * Navigates schedule to next date.
 */
function goNext() {
	var date = Schedule.getDisplayDate();
	date.setDate(date.getDate() + (viewType == viewTypes.DAY ? 1 : 7));
	
	navigate(date);
}

/**
 * Navigates schedule to current date.
 */
function goCurr() {
	var date = new Date();
	navigate(date);
}

function navigate(date) {
	updateSearch(date);
	Schedule.setDate(date);
}

/**
 * Updates GET variables and urlParams to reflect date in week and pushes corresponding history state.
 */
function updateSearch(week) {
	var urlParams = {};
	var curr = new Date();
	
	if(viewType == viewTypes.WEEK)
		curr = DateUtil.getMonday(curr);
	else
		curr = DateUtil.getDayBeginning(curr);
	
	if(week.getDate() != curr.getDate()) {
		urlParams.m = week.getMonth()+1;
		urlParams.d = week.getDate();
	}
	if(week.getYear() != curr.getYear())
		urlParams.y = week.getFullYear().toString().substr(-2);
	
	var search = "?";
	for(var param in urlParams) search += param + "=" + urlParams[param] + "&";
	search = search.slice(0,-1);
	
	var loc = document.location;
	history.pushState(week, document.title, loc.protocol + "//" + loc.host + loc.pathname + search + loc.hash);
}
