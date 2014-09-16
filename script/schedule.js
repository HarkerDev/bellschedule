var nav = require("./nav.js");
var dateUtil = require("./dateUtil.js");
var options = require("./options.js");
var opts = options.options;

/**
 * Constants
 */
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; //days of the week in string form
var schedules; //array of schedules (each schedule is an array in this array

/**
 * Globals
 */
var displayDate; //beginning of time period currently being displayed by the schedule

var hasFocus = true; //document.hasFocus() seems to be unreliable; assumes window has focus on page load

var updateScheduleID; //ID of interval of updateSchedule

exports.init = function() {
	document.addEventListener("visibilitychange", function(event) {
		if(!document.hidden) { //only slightly redundant; on un-minimize, document gains visibility without focus
			updateSchedule();
			// updateClock();
		}
		updateUpdateInterval();
	});

	addEventListener("focus", function(event) {
		updateSchedule();
		//updateClock();

		hasFocus = true;
		updateUpdateInterval();
	});
	addEventListener("blur", function(event) {
		hasFocus = false;
		updateUpdateInterval();
	});
	
	
	parseRawSchedules();
};

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
			updateSchedule();
		}, seconds * 1000); //convert to milliseconds
	else updateScheduleID = null;
}

/**
 * Parses raw schedule in body of page into schedule array
 * Code is questionable
 */
function parseRawSchedules() {
	var rawSchedules=document.getElementById("schedules").textContent.split("\n"); //get raw schedule text
	schedules = [];
	var x=0; //index in schedules
	schedules[0] = []; //create array of special schedule days

	while(rawSchedules.length>0)
	{
		//loop through all lines in raw schedule text
		if(rawSchedules[0].length==0)
		{
			//if line is empty, move to next index in schedules
			schedules[++x] = []; //could probably use id as index instead, or just properties
			rawSchedules.shift();
		}
		else
		{
			//if line has text, save in current location in schedules
			var str = rawSchedules.shift();
			if(x==0 && str.indexOf("|")>=0)
			{
				//behavior for blocks of dates with the same schedule
				var start = new Date(str.substring(0,str.indexOf("|")));
				var end = new Date(str.substring(str.indexOf("|")+1,str.indexOf("\t")));
				for(;start<=end;start.setDate(start.getDate()+1)) {
					schedules[0].push(start.getMonth().valueOf()+1+"/"+start.getDate()+"/"+start.getFullYear().toString().substr(-2)+str.substring(str.indexOf("\t")));
				}
			}
			else schedules[x].push(str);
		}
	}
}

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
	var daySchedule = getDayInfo(date); //get schedule for that day

	var col = week.insertCell(-1); //create cell for day
	col.date = date.valueOf(); //store date in cell element

	if(date.getMonth()==9 && date.getDate()==31) //check Halloween
		col.classList.add("halloween");

	var head = document.createElement("div"); //create header div in cell
	head.classList.add("head");
	var headWrapper = document.createElement("div");
	headWrapper.classList.add("headWrapper");
	headWrapper.innerHTML = days[date.getDay()] + "<div class=\"headDate\">" + daySchedule.dateString + /*" (" + daySchedule.id + ")*/"</div>"; //Portion commented out represents schedule id of that day
	head.appendChild(headWrapper);
	col.appendChild(head);

	var prevEnd = "8:00"; //set start of day to 8:00AM

	if(daySchedule.index > 0) { //populates cell with day's schedule (a bit messily)
		for(var i=1;i<schedules[daySchedule.index].length;i++) {
			var text = schedules[daySchedule.index][i];
			var periodName = makePeriodNameReplacements(text.substring(0,text.indexOf("\t")), daySchedule.replacements);
			var periodTime = text.substring(text.indexOf("\t")+1);
			

			var start = periodTime.substring(0,periodTime.indexOf("-"));
			var end = periodTime.substring(periodTime.lastIndexOf("-")+1);

			if(opts.showPassingPeriods) {
				var passing = document.createElement("div");
				passing.classList.add("period");
				createPeriod(passing,"",prevEnd,start,date);
				col.appendChild(passing);
			}

			prevEnd = end;

			var period = document.createElement("div");
			period.classList.add("period");

			if(periodName.indexOf("|")>=0) {
				//handle split periods (i.e. lunches)
				var table = document.createElement("table");
				table.classList.add("lunch");
				var row = table.insertRow(-1);

				var lunch1 = row.insertCell(-1);
				var lunch1Time = periodTime.substring(0,periodTime.indexOf("||"));

				createSubPeriods(
						lunch1,
						periodName.substring(0,periodName.indexOf("||")),
						start,
						lunch1Time.substring(lunch1Time.indexOf("-")+1,lunch1Time.indexOf("|")),
						lunch1Time.substring(lunch1Time.indexOf("|")+1,lunch1Time.lastIndexOf("-")),
						end,
						date
				);

				var lunch2 = row.insertCell(-1);
				var lunch2Time = periodTime.substring(periodTime.indexOf("||")+2);

				createSubPeriods(
						lunch2,
						periodName.substring(periodName.indexOf("||")+2),
						start,
						lunch2Time.substring(lunch2Time.indexOf("-")+1,lunch2Time.indexOf("|")),
						lunch2Time.substring(lunch2Time.indexOf("|")+1,lunch2Time.lastIndexOf("-")),
						end,
						date
				);

				period.appendChild(table);
			}
			else createPeriod(period,periodName,start,end,date);
			col.appendChild(period);
		}
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
 * For given day, returns index of schedule id in schedules, schedule id, and formatted date (mm/dd/yy).
 * Schedule id index is 0 if not found in schedules.
 */
function getDayInfo(day) {
	var dateString = day.getMonth().valueOf()+1 + "/" + day.getDate().valueOf() + "/" + day.getFullYear().toString().substr(-2); //format in mm/dd/YY

	var id;
	var index = 0;
	var replacements = [];
	
	for(var i=0;i<schedules[0].length;i++) //search for special schedule on day
		if(!schedules[0][i].indexOf(dateString)) {
			//found special schedule
			if(schedules[0][i].indexOf("[") >= 0) { //check for period replacements
				//cut replacements and space character out of id and save separately
				id = schedules[0][i].substring(schedules[0][i].indexOf("\t")+1,schedules[0][i].indexOf("[")-1);
				replacements = schedules[0][i].substring(schedules[0][i].indexOf("[")+1,schedules[0][i].indexOf("]")).split(",");
			} else {
				// no replacements to be made
				id = schedules[0][i].substring(schedules[0][i].indexOf("\t")+1);
			}
			
			index = getScheduleIndex(id);
		}
	
	if(id === undefined) { //no special schedule found
		id = day.getDay();
		if(id==0 || id==6) index = id = 0; //no school on weekends
		else index = id; //default schedule for that day
	}
	
	return { "index": index, "id": id, "dateString": dateString, "replacements": replacements };
}

/**
 * Gets the index in the list of schedules of the schedule with the given schedule id (or 0 if no matching schedules were found)
 */
function getScheduleIndex(id) {
	if(id==0) return 0; //schedule id 0 represents no school
	for(var i=1;i<schedules.length;i++) { //find index of schedule id
		if(id==schedules[i][0]) return i; //found specified schedule id
	}
	return 0; //couldn't find specified schedule
}

/**
 * Creates and returns a new period wrapper with the given content and start/end times.
 * Also applies any special properties based on period length (text on single line if too short, block period if longer than regular).
 */
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
 * Creates and appends two new sub-periods and passing period to parent period with given start and end times.
 */
function createSubPeriods(parent, name, start1, end1, start2, end2, date) {
	var p1 = document.createElement("div");
	p1.classList.add("period");
	createPeriod(
			p1,
			name.substring(0,name.indexOf("|")),
			start1,
			end1,
			date);
	parent.appendChild(p1);

	if(opts.showPassingPeriods) {
		var lunchPassing = document.createElement("div");
		lunchPassing.classList.add("period");
		createPeriod(lunchPassing,"",end1,start2,date);
		parent.appendChild(lunchPassing);
	}

	var p2 = document.createElement("div");
	p2.classList.add("period");
	var w2 = document.createElement("div");
	w2.classList.add("periodWrapper");
	createPeriod(
			p2,
			name.substring(name.indexOf("|")+1),
			start2,
			end2,
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
 * Updates schedule to display as it would on the given date/time; defaults to now if none is given.
 * Also updates
 */
function updateSchedule(time,force) {
	setDisplayDate(time,force);
	setHighlightedPeriod();
}
exports.updateSchedule = updateSchedule;

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
