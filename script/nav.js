var DateUtil = require("./dateUtil.js");
var Schedule = require("./schedule.js");

var viewTypes = exports.viewTypes = {
	DAY: "day",
	WEEK: "week"
};

var viewType;

exports.init = function() {
	
	var initialDate = getDateFromURL();
	
	Schedule.setDate(initialDate);
	
	//update history state
	window.history.replaceState(initialDate, document.title, document.location);
	
	document.getElementById("header").addEventListener("click", randomizeTitleTitle);
	document.getElementById("leftArrow").addEventListener("click", goPrev);
	document.getElementById("rightArrow").addEventListener("click", goNext);
	
	randomizeTitleTitle();
};

exports.setViewType = function(type) {
	viewType = type;
};

/**
 * Event listener for navigating through history.
 * (onload event will not fire when navigating through history items pushed by history.pushState, because the page does not reload)
 */
addEventListener("popstate", function(event) {
	getURLParams();
	Schedule.setSchedule(event.state);
});

function randomizeTitleTitle() {
	var titles = document.getElementById("titleTitles").textContent.split("\n");
	document.getElementById("title").title=titles[Math.floor(Math.random()*titles.length)];
}

function getDateFromURL() {
	var urlParams = getURLParams();
	
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
function getURLParams() {
	var NON_LEADING_PLUS = /(?!^)\+/g;  //regex for replacing non-leading + with space
	var SEARCH = /([^&=]+)=?([^&]*)/g;
	var decode = function(s) { return decodeURIComponent(s.replace(NON_LEADING_PLUS, " ")); };
	
	var urlParams = {};
	var query = location.search.substring(1);
	
	var match = SEARCH.exec(query);
	while (match) {
		urlParams[decode(match[1])] = decode(match[2]);
		match = SEARCH.exec(query);
	}
	
	return urlParams;
}

exports.goPrev = goPrev;
function goPrev() {
	var date = Schedule.getDisplayDate();
	date.setDate(date.getDate() - (viewType == viewTypes.DAY ? 1 : 7));
	
	navigate(date);
}

exports.goNext = goNext;
function goNext() {
	var date = Schedule.getDisplayDate();
	date.setDate(date.getDate() + (viewType == viewTypes.DAY ? 1 : 7));
	
	navigate(date);
}

exports.goCurr = goCurr;
function goCurr() {
	var date = (viewType == viewTypes.DAY ? DateUtil.getDayBeginning(new Date()) : DateUtil.getMonday(new Date()));
	navigate(date);
}

function navigate(date) {
	updateURL(date);
	Schedule.setDate(date);
}

function updateURL(week) {
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
