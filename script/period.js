
module.exports = Period;
function Period(name, start, end) {
	this.name = name;
	this.start = start;
	this.end = end;
};

Period.prototype.applyReplacement = function(replacements) {
	var newName = replacements[this.name];
	if(newName) {
		this.name = newName;
	}
};

Period.prototype.getHTML = function(date) {
	return createPeriod(this.name, this.start, this.end, date);
};

Period.prototype.clone = function() {
	return new Period(this.name, this.start, this.end);
};

/**
 * Creates and returns a new period wrapper with the given content and start/end times.
 * Also applies any special properties based on period length (text on single line if too short, block period if longer than regular).
 */
module.exports.createPeriod = createPeriod;
function createPeriod(name, start, end, date) {
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

	return periodWrapper;
	} else return null;
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
