/**
 * Returns the Monday of next week if date is Saturday; else returns the Monday of that week
 */
exports.getMonday = function(d) {
	var date = new Date(d);
	if(date.getDay()>=6) date.setDate(date.getDate()+2); //set date to next Monday if today is Saturday
	else date.setDate(date.getDate()-date.getDay()+1); //else set date Monday of this week
	return getDayBeginning(date);
};

/**
 * Sets given date to beginning of the day (12:00 AM).
 */
function getDayBeginning(date) {
	var d = new Date(date);
	d.setHours(0,0,0,0);
	return d;
}
exports.getDayBeginning = getDayBeginning;
