var nav = require("./nav.js");
var dateUtil = require("./dateUtil.js");
var options = require("./options.js");
var parser = require("./scheduleParser.js");
window.parser = parser;

var opts = options.options;

/**
 * Constants
 */
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; //days of the week in string form


/**
 * Globals
 */
var displayDate; //beginning of time period currently being displayed by the schedule

var hasFocus = true; //document.hasFocus() seems to be unreliable; assumes window has focus on page load

var updateScheduleID; //ID of interval of updateSchedule

exports.init = function() {
	document.addEventListener("visibilitychange", function(event) {
		if(!document.hidden) { //only slightly redundant; on un-minimize, document gains visibility without focus
			update();
			// updateClock();
		}
		updateUpdateInterval();
	});

	addEventListener("focus", function(event) {
		update();
		//updateClock();

		hasFocus = true;
		updateUpdateInterval();
	});
	addEventListener("blur", function(event) {
		hasFocus = false;
		updateUpdateInterval();
	});
	
	
	parser.init();
};

exports.getDisplayDate = function() {
	return new Date(displayDate);
}

//exports.setHiddenUpdateInterval = function(interval) {
//	opts.hiddenUpdateInterval = interval;
//};
//exports.setActiveUpdateInterval = function(interval) {
//	opts.activeUpdateInterval = interval;
//};
//exports.setInactiveUpdateInterval = function(interval) {
//	opts.inactiveUpdateInterval = interval;
//};

/**
 * Sets the correct update interval based on the current state (focus and visibility) of the document.
 */
function updateUpdateInterval() {
	if(document.hidden) setUpdateInterval(opts.hiddenUpdateInterval); //assume that hidden implies no focus
	else if(hasFocus) setUpdateInterval(opts.activeUpdateInterval);
	else setUpdateInterval(opts.inactiveUpdateInterval);
}
exports.updateUpdateInterval = updateUpdateInterval;

/**
 * Updates the interval for automatically refreshing the page.
 * seconds is the new interval in seconds.
 */
function setUpdateInterval(seconds) {
	clearInterval(updateScheduleID);
	if(seconds>0)
		updateScheduleID = setInterval(function() {
			//updateClock();
			update();
		}, seconds * 1000); //convert to milliseconds
	else updateScheduleID = null;
}

/**
 * Updates schedule to display as it would on the given date/time; defaults to now if none is given.
 * Also updates
 */
function update(time,force) {
	setDisplayDate(time,force);
	setHighlightedPeriod();
}
exports.update = update;

/**
 * Displays schedule of the week of the given date/time
 */
function setDisplayDate(time, force) {
	var date = (time ? new Date(time) : nav.getDateFromUrlParams()); //variable to keep track of current day in loop

	dateUtil.setDayBeginning(date);

	if(force || !displayDate || (date.valueOf()!=displayDate.valueOf())) {
		var schedule = document.getElementById("schedule"); //get schedule table

		displayDate = new Date(date);

		if(dateUtil.getMonday(date) > dateUtil.getMonday(new Date()))
			warn("This is a future date, so the schedule may be incorrect. (In particular, special/alternate schedules may be missing.)"); //display warning if date is in the future
		else warn(""); //else display message

		/*
		if(date.valueOf()==dateUtil.getMonday(new Date()).valueOf()) document.getElementById("currWeek").style.display = "none"; //hide back to current week button on current week
		else document.getElementById("currWeek").style.display = "inline"; //else show the button
		*/
		while(schedule.rows.length) schedule.deleteRow(-1); //clear existing weeks (rows); there should only be one, but just in case...

		var week = schedule.insertRow(-1); //create new week (row)

		if(!opts.enableDayView) {
			date = dateUtil.getMonday(date);
			for(var d=0;d<5;d++) {
				//for each day Monday through Friday (inclusive)
				createDay(week, date);

				date.setDate(date.getDate()+1); //increment day
			}
		} else createDay(week, date);
	}
}


/**
 * Displays the given warning or hides the warning div if no warning text is given.
 */
function warn(text) {
	var warning = document.getElementById("warning");
	
	if(text) warning.style.display = "block";
	else warning.style.display = "none";
	
	warning.innerHTML = text;
}

/**
 * Creates the day for the given date and appends it to the given week
 */
function createDay(week, date) {
	var daySchedule = parser.getDayInfo(date); //get schedule for that day
	
	var dateString = date.getMonth().valueOf()+1 + "/" + date.getDate().valueOf() + "/" + date.getFullYear().toString().substr(-2);
	
	var col = week.insertCell(-1); //create cell for day
	col.date = date.valueOf(); //store date in cell element
	
	if(date.getMonth()==9 && date.getDate()==31) //check Halloween
		col.classList.add("halloween");
	
	var head = document.createElement("div"); //create header div in cell
	head.classList.add("head");
	var headWrapper = document.createElement("div");
	headWrapper.classList.add("headWrapper");
	headWrapper.innerHTML = days[date.getDay()] + "<div class=\"headDate\">" + dateString + /*" (" + daySchedule.id + ")*/"</div>"; //Portion commented out represents schedule id of that day
	head.appendChild(headWrapper);
	col.appendChild(head);
	
	var prevEnd = "8:00"; //set start of day to 8:00AM
	

	for(var i=0;i<daySchedule.length;i++) {
		var periodObj = daySchedule[i];


		var passing = document.createElement("div");
		passing.classList.add("period");

		

		var period = document.createElement("div");
		period.classList.add("period");
		
		if(daySchedule[i].compound) {
			if(opts.showPassingPeriods) {
				createPeriod(passing,"",prevEnd,periodObj.left[0].start,date);
				col.appendChild(passing);
				prevEnd = periodObj.left[1].end;
			}
			
			//handle split periods (i.e. lunches)
			var table = document.createElement("table");
			table.classList.add("lunch");
			var row = table.insertRow(-1);

			var lunch1 = row.insertCell(-1);

			createCompoundPeriod(
					lunch1,
					periodObj.left,
					date
			);

			var lunch2 = row.insertCell(-1);

			createCompoundPeriod(
					lunch2,
					periodObj.right,
					date
			);

			period.appendChild(table);
		}
		else {
			if(opts.showPassingPeriods) {
				createPeriod(passing,"",prevEnd,periodObj.period.start,date);
				col.appendChild(passing);
				prevEnd = periodObj.period.end;
			}
			
			var start = periodObj.period.start;
			var end = periodObj.period.end;
			createPeriod(period,periodObj.period.name,start,end,date);
		}
		col.appendChild(period);
	}
}

/**
 * Returns new name for period based on array of replacements.
 * If the current period name is listed in the array of replacements, returns the new, replaced name; otherwise, returns current name.
 * replacements is an array of strings of the form "OldName->NewName"
 */
function makePeriodNameReplacements(periodName, replacements) {
	if(replacements.length > 0) {
		for(var i=0;i<replacements.length;i++) {
			if(!replacements[i].indexOf(periodName))
				return replacements[i].substring(replacements[i].indexOf("->")+2);
		}
	}
	return periodName;
}

/**
 * Creates and returns a new period wrapper with the given content and start/end times.
 * Also applies any special properties based on period length (text on single line if too short, block period if longer than regular).
 */
//function createPeriod(parent, periodObj, date) {
//	console.log(periodObj + "per");
//	createPeriod(parent, periodObj.name, periodObj.start, periodObj.end, date);
//}
	
function createPeriod(parent, name, start, end, date) {
	startDate = getDateFromString(start,date);
	endDate = getDateFromString(end,date);

	var periodWrapper = document.createElement("div");
	periodWrapper.classList.add("periodWrapper");
	periodWrapper.periodName = name;
	periodWrapper.start = startDate;
	periodWrapper.end = endDate;

	var length = (endDate-startDate)/60000;

	if(length > 0) {
		periodWrapper.style.height = (length-1) + "px"; //minus 1 to account for 1px border

		if(length >= 15) {
			if(name) periodWrapper.innerHTML = name + (length<30 ? " " : "<br />") + start + " – " + end;
			if(length>50 && !name.indexOf("P")) //handle block periods (class=long, i.e. bold text)
				periodWrapper.classList.add("long");
		}

	return parent.appendChild(periodWrapper);
	}
}

/**
 * Takes in a date and a string of form "hh:MM" and turns it into a time on the day of the given date.
 * Assumes hours less than 7 are PM and hours 7 or greater are AM.
 */
function getDateFromString(string, date) {
	var hour = string.substring(0,string.indexOf(":"));
	var min = string.substring(string.indexOf(":")+1);
	if(hour<7) hour = parseInt(hour,10)+12; //assumes hours less than seven are PM and hours 7 or greater are AM
	return new Date(date.getFullYear(),date.getMonth(),date.getDate(),hour,min);
}

/**
 * Creates and appends two new sub-periods and passing period to parent period with given start and end times.
 */
function createCompoundPeriod(parent, periods, date) {
	var p1 = document.createElement("div");
	p1.classList.add("period");
	createPeriod(
			p1,
			periods[0].name,
			periods[0].start,
			periods[0].end,
			date);
	parent.appendChild(p1);

	if(opts.showPassingPeriods) {
		var lunchPassing = document.createElement("div");
		lunchPassing.classList.add("period");
		createPeriod(lunchPassing,"",periods[0].end,periods[1].start,date);
		parent.appendChild(lunchPassing);
	}

	var p2 = document.createElement("div");
	p2.classList.add("period");
	var w2 = document.createElement("div");
	w2.classList.add("periodWrapper");
	createPeriod(
			p2,
			periods[1].name,
			periods[1].start,
			periods[1].end,
			date);
	parent.appendChild(p2);
}

/**
 * Highlights given date/time on the schedule; defaults to now if none is given
 */
function setHighlightedPeriod(time) {
	//set default time argument
	if(!time) time = Date.now();

	//set date based on time (for finding day to highlight)
	var date = new Date(time);
	date.setHours(0,0,0,0);

	//clear previous highlighted day/periods
	//TODO: maybe it would be better to not clear highlights when nothing needs to be changed.
	var prevDay = document.getElementById("today");
	var prevPeriods = [];
	if(prevDay) {
		//clear previous highlighted periods
		prevPeriods = Array.prototype.slice.call(prevDay.getElementsByClassName("now")); //get copy of array, not reference to it (needed to check for period changes later)

		for(var i=prevPeriods.length-1;i>=0;i--) {
			var prevPeriod = prevPeriods[i];
			prevPeriod.classList.remove("now");
			//remove period length
			var periodLength = prevPeriod.getElementsByClassName("periodLength")[0];
			if(periodLength) prevPeriod.removeChild(periodLength);
		}
		
		//clear previous highlighted day
		//needs to be done after getting prevPeriods, or else prevDay no longer points anywhere
		prevDay.id = "";
	}

	//set new highlighted day/period
	var days = document.getElementById("schedule").rows[0].cells;
	for(var d=0;d<days.length;d++) {
		var day = days[d];
		if(date.valueOf() == day.date) { //test if date should be highlighted
			//set new highlighted day
			day.id = "today";

			//set new highlighted periods
			var periods = day.getElementsByClassName("periodWrapper");
			for(var p=0;p<periods.length;p++) {
				var period = periods[p];
				if(time-period.start>=0 && time-period.end<0) { //test if period should be highlighted
					period.classList.add("now");
					//add period length if it fits
					if((period.end-period.start)/60000>=40) {
						var length = (period.end - time) / 60000;
						period.innerHTML += "<div class=\"periodLength\">" +
								(length>1 ?
									Math.round(length) + " min. left</div>" :
									Math.round(length*60) + " sec. left</div>");
					}
				}
			}
		}
	}

	if(opts.enablePeriodNotifications) {
		var currPeriods = Array.prototype.slice.call(document.getElementsByClassName("now")); //needs to be an array and not an HTML

		var diff1 = currPeriods.diff(prevPeriods);
		var diff2 = prevPeriods.diff(currPeriods);

		for(var i=0; i<diff1.length; i++) {
			var name = currPeriods[i].periodName;
			if(name && !hasFocus) sendNotification(name + " has started.", opts.notificationDuration);
		}
		for(var i=0; i<diff2.length; i++) {
			var name = prevPeriods[i].periodName;
			if(name && !hasFocus) sendNotification(name + " has ended.", opts.notificationDuration);
		}
	}
}

/**
 * Creates a desktop notification with the given text for a title and removes it after the given duration in seconds.
 * A duration of 0 or less will disable auto-closing the notification.
 */
function sendNotification(text, duration) {
	if("Notification" in window) { //check that browser supports notifications
		var notification = new Notification(text);
		if(duration > 0)
			setTimeout(function() {notification.close();}, duration*1000);
	}
}
