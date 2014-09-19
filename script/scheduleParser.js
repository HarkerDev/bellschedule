/**
 * 
 * Handles all parsing of schedule data from the HTML and retrieval of schedules for spcific days.
 */

var $ = require("jquery");
var Period = require("./period.js");
var CompoundPeriod = require("./compoundPeriod.js");

window.Period = Period;

var REPLACEMENT_SEPARATOR = /, ?/; // , with or without following space
var REPLACEMENT_SYMBOL = / ?-> ?/; // -> with or without surrounding spaces

var dates = {};
var schedules = {}; //array of schedules (each schedule is an array in this array
exports.dates = dates;
exports.schedules = schedules;

exports.init = function() {
	console.log("parse dates");
	parseDates();
	console.log("parse sched");
	parseSchedules();
	console.log(dates);
};

function parseDates() {
	var rawDates = document.getElementById("dates").textContent.split("\n"); //get raw schedule text
	for(var i=0; i<rawDates.length; i++) {
		var parts = rawDates[i].split("\t");
		var date = parts[0];
		var id = parts[1];
		var replacements = {};
		
		if(parts[2]) {
			var rawReplacements = parts[2].split(REPLACEMENT_SEPARATOR);
			for(var j=0; j<rawReplacements.length; j++) {
				var replacementParts = rawReplacements[j].split(REPLACEMENT_SYMBOL);
				var name = replacementParts[0];
				var newName = replacementParts[1];
				replacements[name] = newName;
			}
		}
		
		dates[date] = {
			id: id,
			replacements: replacements
		};
	}
}

/**
 * Parses raw schedule in body of page into schedule array
 * Code is questionable
 */
function parseSchedules() {
	var rawSchedules = document.getElementById("schedules").textContent.split("\n\n"); //get raw schedule text

	for(var i=0; i<rawSchedules.length; i++) {
		var rawSchedule = rawSchedules[i].split("\n");
		var id = rawSchedule[0];
		var schedule = [];
		for(var j=1; j<rawSchedule.length; j++) {
			var periodParts = rawSchedule[j].split("\t");
			var name = periodParts[0];
			var span = periodParts[1];
			
			if(name.indexOf("||")>=0) {
				var rawNames = name.split("||"); //TODO: rename vars to be more descriptive
				var rawSpans = span.split("||");
				
				var names = [];
				var spans = [];
				$.each(rawNames, function(index, value) {
					names.push(value.split("|"));
				})
				$.each(rawSpans, function(index, value) {
					spans.push(value.split("|"));
				})
				
				schedule.push(new CompoundPeriod(names, spans));
//					first: createCompoundPeriodPart(rawNames[0], rawSpans[0]),
//					second: createCompoundPeriodPart(rawNames[1], rawSpans[1])
			} else {
				schedule.push(new Period(name, span));
			}
		}
		schedules[id] = schedule;
	}
}

function createCompoundPeriodSection(rawNames, rawSpans) {
	var names = rawNames.split("|");
	var times = rawSpans.split("|");
	return [
		createPeriodPart(names[0], times[0]),
		createPeriodPart(names[1], times[1])
	];
}

function createPeriodPart(name, span) {
	return {
		name: name,
		start: span.substring(0,span.indexOf("-")),
		end: span.substring(span.lastIndexOf("-")+1)
	};
}

/**
 * For given day, returns index of schedule id in schedules, schedule id, and formatted date (mm/dd/yy).
 * Schedule id index is 0 if not found in schedules.
 */
exports.getDayInfo = function(day) {
	var dateString = day.getMonth().valueOf()+1 + "/" + day.getDate().valueOf() + "/" + day.getFullYear().toString().substr(-2); //format in mm/dd/YY
	var date = dates[dateString];
	
	console.log(date);

	var id;
	var replacements;
	if(date) {
		id = date.id;
		
		replacements = date.replacements;
		
	} else {
		id = day.getDay();
		replacements = [];
	}
	
	var schedule = (schedules[id] ? schedules[id] : []);
	//$.extend([], schedule)
	schedule =  $.merge([], schedule);
	
	makeReplacements(schedule, replacements);
	
	return schedule;
};

function makeReplacements(schedule, replacements) {
	for(var i=0; i<schedule.length; i++) {
		var period = schedule[i];
		period.applyReplacement(replacements);
		
	}
}
