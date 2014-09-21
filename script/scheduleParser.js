/**
 * Handles all parsing of schedule data from the HTML and retrieval of schedules for spcific days.
 */

var $ = require("jquery");
var Period = require("./period.js");
var CompoundPeriod = require("./compoundPeriod.js");

var DATE_PARTS_SEPARATOR = "\t";

var REPLACEMENTS_SEPARATOR = /, ?/; // , with optional following space
var REPLACEMENT_SYMBOL = / ?-> ?/;  // -> with optional surrounding spaces

var SCHEDULE_PARTS_SEPARATOR = "\t";

var COMPOUND_PERIOD_SECTIONS_SEPARATOR = / ?\|\| ?/; // || with optional surrounding spaces
var COMPOUND_PERIOD_PERIODS_SEPARATOR = / ?\| ?/;    // || with optional surrounding spaces

var TIMES_SEPARATOR = / ?- ?/; // - with optional surrounding spaces

var dates = {};
var schedules = {}; //array of schedules (each schedule is an array in this array

exports.init = function() {
	parseDates();
	parseSchedules();
};

function parseDates() {
	var rawDates = document.getElementById("dates").textContent.split("\n"); //get raw schedule text
	for(var i=0; i<rawDates.length; i++) {
		var parts = rawDates[i].split(DATE_PARTS_SEPARATOR);
		var date = parts[0];
		var id = parts[1];
		var replacements = {};
		
		if(parts[2]) {
			var rawReplacements = parts[2].split(REPLACEMENTS_SEPARATOR);
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
			var parts = rawSchedule[j].split(SCHEDULE_PARTS_SEPARATOR);
			var name = parts[0];
			var span = parts[1];
			
			if(name.indexOf("||")>=0) {
				var rawNames = name.split(COMPOUND_PERIOD_SECTIONS_SEPARATOR);
				var rawSpans = span.split(COMPOUND_PERIOD_SECTIONS_SEPARATOR);
				
				var names = [];
				var starts = [];
				var ends = [];
				$.each(rawNames, function(index, rawSectionNames) {
					names.push(rawSectionNames.split(COMPOUND_PERIOD_PERIODS_SEPARATOR));
				});
				$.each(rawSpans, function(index, rawSectionSpans) {
					var sectionSpans = rawSectionSpans.split(COMPOUND_PERIOD_PERIODS_SEPARATOR);
					var sectionStarts = [];
					var sectionEnds = [];
					$.each(sectionSpans, function(index2, sectionSpan) {
						var times = sectionSpan.split(TIMES_SEPARATOR);
						var start = times[0];
						var end = times[1];
						sectionStarts.push(start);
						sectionEnds.push(end);
					});
					starts.push(sectionStarts);
					ends.push(sectionEnds);
				});
				
				schedule.push(new CompoundPeriod(names, starts, ends));
			} else {
				var times = span.split(TIMES_SEPARATOR);
				var start = times[0];
				var end = times[1];
				schedule.push(new Period(name, start, end));
			}
		}
		schedules[id] = schedule;
	}
}

/**
 * For given day, returns index of schedule id in schedules, schedule id, and formatted date (mm/dd/yy).
 * Schedule id index is 0 if not found in schedules.
 */
exports.getSchedule = function(day) {
	var dateString = day.getMonth().valueOf()+1 + "/" + day.getDate().valueOf() + "/" + day.getFullYear().toString().substr(-2); //format in mm/dd/YY
	var date = dates[dateString];

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
//	newSchedule = $.extend(true, [], schedule);
	
	console.log(schedule);
	
	return getScheduleWithReplacements(schedule, replacements);
};

function getScheduleWithReplacements(schedule, replacements) {
	var newSchedule = [];
	for(var i=0; i<schedule.length; i++) {
		var period = schedule[i].clone();
		period.applyReplacement(replacements);
		newSchedule.push(period);
	}
	return newSchedule;
}
