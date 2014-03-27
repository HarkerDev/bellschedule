//warning: I left debug code everywhere, and much of this is still pretty messy.

/*
 * Globals
 */
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; //days of the week in string form
var urlParams; //object with GET variables as properties and their respective values as values
var schedules; //array of schedules (each schedule is an array in this array
var dispWeek; //Sunday of week currently being displayed by the schedule
//var updateScheduleInterval = 60; //The interval for the automatic update, in seconds. Defaults to one minute.
var updateScheduleID; //ID of interval of updateSchedule

var options = new Object();

/*
 * Event listener for navigating through history.
 * (body.onLoad will not fire when navigating through history items pushed by history.pushState, because the page does not reload)
 */
addEventListener("popstate", function(event) {
	updateSchedule(event.state);
});

/*
 * Parses schedules, creates schedule for correct week, sets title title on page load
 */
addEventListener("load", function(event) {
	initOptions();
	attachOptionActions();
	
	setTitleTitle();
	
	parseRawSchedule();

	setDispWeek();
	setHighlightedPeriod();
	
});

/*
 * Parses raw schedule in body of page into schedule array
 * Code is questionable
 */
function parseRawSchedule(){
	var rawSchedules=document.getElementById("schedules").textContent.split("\n"); //get raw schedule text
	schedules = new Array();
	var x=0; //index in schedules
	schedules[0] = new Array(); //create array of special schedule days
	
	while(rawSchedules.length>0){ //loop through all lines in raw schedule text
		if(rawSchedules[0].length==0){ //if line is empty, move to next index in schedules
			schedules[++x] = new Array(); //could probably use id as index instead, or just properties
			rawSchedules.shift();
		}else{ //if line has text, save in current location in schedules
			var str = rawSchedules.shift();
			if(x==0 && str.indexOf("|")>=0){ //behavior for blocks of dates with the same schedule
				var start = new Date(str.substring(0,str.indexOf("|")));
				var end = new Date(str.substring(str.indexOf("|")+1,str.indexOf("\t")));
				for(;start<=end;start.setDate(start.getDate()+1)){
					schedules[0].push(start.getMonth().valueOf()+1+"/"+start.getDate()+"/"+start.getFullYear().toString().substr(-2)+str.substring(str.indexOf("\t")));
				}
			}
			else schedules[x].push(str);
		}
	}
}

/*
 * Displays schedule of the week of the given date/time
 */
function setDispWeek(time,force){
	if(!time){
		time = new Date(); //set default time to now
		
		urlParams = getUrlParams(); //adjust week shown based on url if default
		if(urlParams["d"]>0) time.setDate(urlParams["d"]);
		if(urlParams["m"]>0) time.setMonth(urlParams["m"]-1);
		if(urlParams["y"]>0) time.setFullYear(urlParams["y"]);
		if(!isNaN(urlParams["w"])) time.setDate(time.getDate() + urlParams["w"]*7);
	}
	
	var date = new Date(time); //variable to keep track of current day in loop
	getSunday(date);
	
	if(force || !dispWeek || (date.valueOf()!=dispWeek.valueOf())){
		var schedule = document.getElementById("schedule"); //get schedule table
		
		dispWeek = new Date(date);
		
		if(date>getSunday(new Date())) document.getElementById("warning").style.display = "block"; //display warning if week is in the future
		else document.getElementById("warning").style.display = "none"; //else hide warning
		/*
		if(date.valueOf()==getSunday(new Date()).valueOf()) document.getElementById("currWeek").style.display = "none"; //hide back to current week button on current week
		else document.getElementById("currWeek").style.display = "inline"; //else show the button
		*/
		while(schedule.rows.length) schedule.deleteRow(-1); //clear existing weeks (rows); there should only be one, but just in case...
		
		var week = schedule.insertRow(-1); //create new week (row)
		
		for(var d=0;d<5;d++){ //for each day Monday through Friday (inclusive)
			date.setDate(date.getDate()+1); //increment day
			
			var daySchedule = getDayInfo(date); //get schedule for that day
			
			var col = week.insertCell(-1); //create cell for day
			col.date = date.valueOf(); //store date in cell element
			
			if(date.getMonth()==9 && date.getDate()==31) //check Halloween
				col.classList.add("halloween");
			
			var head = document.createElement("div"); //create header div in cell
			head.classList.add("head");
			var headWrapper = document.createElement("div");
			headWrapper.classList.add("headWrapper");
			headWrapper.innerHTML = days[date.getDay()] + "<div class=\"headDate\">" + daySchedule[2] + " (" + daySchedule[1] + ")</div>";
			head.appendChild(headWrapper);
			col.appendChild(head);
			
			var prevEnd = "8:00"; //set start of day to 8:00AM
			
			if(daySchedule[0] > 0) //populates cell with day's schedule (a bit messily)
				for(var i=1;i<schedules[daySchedule[0]].length;i++){
					var text = schedules[daySchedule[0]][i];
					var periodName = text.substring(0,text.indexOf("\t"))
					var periodTime = text.substring(text.indexOf("\t")+1);
					
					var start = periodTime.substring(0,periodTime.indexOf("-"));
					var end = periodTime.substring(periodTime.lastIndexOf("-")+1);
					
					if(options.showPassingPeriods){
						var passing = document.createElement("div");
						passing.classList.add("period");
						createPeriod(passing,"",prevEnd,start,date);
						col.appendChild(passing);
					}
					
					prevEnd = end;
					
					var period = document.createElement("div");
					period.classList.add("period");
					
					if(periodName.indexOf("|")>=0){ //handle split periods (i.e. lunches)
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
					}else{
						createPeriod(period,periodName,start,end,date);
					}
					
					col.appendChild(period);
				}
		}
	}
}

/*
 * Sets the title of the title to a random line from the title titles list
 */
function setTitleTitle(){
	var titles = document.getElementById("titleTitles").textContent.split("\n");
	document.getElementById("title").title=titles[Math.floor(Math.random()*titles.length)];
}

/*
 * Gets GET variables from URL and returns them as properties of an object.
 */
function getUrlParams(){
	var urlParams;
	var match,
		pl     = /\+/g,  // Regex for replacing addition symbol with a space
		search = /([^&=]+)=?([^&]*)/g,
		decode = function (s) { return decodeURIComponent(s.replace(pl, " ")); },
		query  = location.search.substring(1);

	urlParams = {};
	while (match = search.exec(query))
	   urlParams[decode(match[1])] = decode(match[2]);
	return urlParams;
/* alternatively...
	(function(a) {
		if (a == "") return {};
		var b = {};
		for (var i = 0; i < a.length; ++i)
		{
			var p=a[i].split('=');
			if (p.length != 2) continue;
			b[p[0]] = decodeURIComponent(p[1].replace(/\+/g, " "));
		}
		return b;
	})(location.search.substr(1).split('&'));
*/
}

/*
 * Sets given date to the Sunday of next week if date is Saturday; else sets date to Sunday of that week
 */
function getSunday(date){
	if(date.getDay()>=6) date.setDate(date.getDate()+1); //set date to next Sunday if today is Saturday
	else date.setDate(date.getDate()-date.getDay()); //else set date Sunday of this week
	date.setHours(0,0,0,0); //set to beginning of day
	return date;
}

/*
 * Takes in a date and a string of form "hh:MM" and turns it into a time on the day of the given date.
 * Assumes hours less than 7 are PM and hours 7 or greater are AM.
 */
function getDateFromString(string,date){
	var hour = string.substring(0,string.indexOf(":"));
	var min = string.substring(string.indexOf(":")+1);
	if(hour<7) hour = parseInt(hour,10)+12; //assumes hours less than seven are PM and hours 7 or greater are AM
	return new Date(date.getFullYear(),date.getMonth(),date.getDate(),hour,min);
}

/*
 * For given day, returns index of schedule id in schedules, schedule id, and formatted date (mm/dd/yy).
 * Schedule id index is 0 if not found in schedules.
 */
function getDayInfo(day){
	var dateString = day.getMonth().valueOf()+1 + "/" + day.getDate().valueOf() + "/" + day.getFullYear().toString().substr(-2); //format in mm/dd/YY
	
	for(var i=0;i<schedules[0].length;i++) //search for special schedule on day
		if(!schedules[0][i].indexOf(dateString)){ //found special schedule
			var id = schedules[0][i].substr(schedules[0][i].indexOf("\t")+1)
			if(id==0) return [0,0,dateString]; //schedule id 0 represents no school
			for(var j=1;j<schedules.length;j++){ //find index of schedule id
				if(id==schedules[j][0]){
					return [j,id,dateString]; //found specified schedule id
				}
			}
			return [0,id,dateString]; //couldn't find specified schedule; display nothing instead
		}
	return [day.getDay(),day.getDay(),dateString]; //default schedule for that day
}

/*
 * Creates and returns a new period wrapper with the given content and start/end times.
 * Also applies any special properties based on period length (text on single line if too short, block period if longer than regular).
 */
function createPeriod(parent,name,start,end,date){
	startDate = getDateFromString(start,date);
	endDate = getDateFromString(end,date);
	
	var periodWrapper = document.createElement("div");
	periodWrapper.classList.add("periodWrapper");
	periodWrapper.start = startDate;
	periodWrapper.end = endDate;
	
	var length = (endDate-startDate)/60000;
	
	if(length > 0) {
		periodWrapper.style.height = (length-1) + "px"; //minus 1 to account for 1px border
		
		if(length >= 15) {
			periodWrapper.innerHTML = name + (length<30 ? " " : "<br />") + start + "-" + end;
			if(length>50 && !name.indexOf("P")) //handle block periods (class=long, i.e. bold text)
				periodWrapper.classList.add("long");
		}
		
	return parent.appendChild(periodWrapper);
	}
	
}

/*
 * Creates and appends two new sub-periods and passing period to parent period with given start and end times.
 */
function createSubPeriods(parent,name,start1,end1,start2,end2,date){
	var p1 = document.createElement("div");
	p1.classList.add("period");
	createPeriod(
			p1,
			name.substring(0,name.indexOf("|")),
			start1,
			end1,
			date);
	parent.appendChild(p1);
	
	if(options.showPassingPeriods){
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

/*
 * Navigates schedule to previous week.
 */
function goLastWeek(){
	var week = new Date(dispWeek); //change schedule
	week.setDate(week.getDate() - 7);
	updateSchedule(week);
	
	if(isNaN(urlParams["w"])) //update url
		urlParams["w"] = -1;
	else {
		urlParams["w"] -= 1;
		if(urlParams["w"] == 0)
			delete urlParams["w"];
	}
	updateSearch(week);
}
/*
 * Navigates schedule to next week.
 */
function goNextWeek(){
	var week = new Date(dispWeek); //change schedule
	week.setDate(week.getDate() + 7);
	updateSchedule(week);
	
	if(isNaN(urlParams["w"])) //update url
		urlParams["w"] = 1;
	else{
		urlParams["w"] = parseInt(urlParams["w"]) + 1;
		if(urlParams["w"] == 0)
			delete urlParams["w"];
	}
	updateSearch(week);
}
/*
 * Navigates schedule to current week.
 */
function goCurrWeek(){
	var week = new Date(); //The current week.
	updateSchedule(week);
	
	delete urlParams["w"];
	delete urlParams["m"];
	delete urlParams["d"];
	delete urlParams["y"];
	
	updateSearch(week);
}

/*
 * Updates GET variables to those in urlParams, pushes history state
 */
function updateSearch(week){
	var search = "?";
	for(var param in urlParams){
		search += param + "=" + urlParams[param] + "&";
	}
	search = search.slice(0,-1);
	
	history.pushState(week, document.title, location.protocol + "//" + location.host + location.pathname + search + location.hash);
}

/*
 * Highlights given date/time on the schedule; defaults to now if none is given
 */
function setHighlightedPeriod(time){
	//set default time argument
	if(!time) time = Date.now();
	
	//set date based on time (for finding day to highlight)
	var date = new Date(time);
	date.setHours(0,0,0,0);
	
	//clear previous highlighted day/periods
	var prevDay = document.getElementById("today");
	if(prevDay){
		//clear previous highlighted day
		prevDay.id = "";
		
		//clear previous highlighted periods
		var prevPeriods = prevDay.getElementsByClassName("now");
		for(var i=prevPeriods.length-1;i>=0;i--){
			var prevPeriod = prevPeriods[i];
			prevPeriod.classList.remove("now");
			//remove period length
			var periodLength = prevPeriod.getElementsByClassName("periodLength")[0];
			if(periodLength) prevPeriod.removeChild(periodLength);
		}
	}
	
	//set new highlighted day/period
	var days = document.getElementById("schedule").rows[0].cells;
	for(var d=0;d<days.length;d++){
		var day = days[d];
		if(date.valueOf() == day.date){ //test if date should be highlighted
			//set new highlighted day
			day.id = "today";
			
			//set new highlighted periods
			var periods = document.getElementsByClassName("periodWrapper");
			for(var p=0;p<periods.length;p++){
				var period = periods[p];
				if(time-period.start>=0 && time-period.end<0){ //test if period should be highlighted
					period.classList.add("now");
					//add period length if it fits
					if((period.end-period.start)/60000>=40){
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
}

/*
 * Updates schedule to display as it would on the given date/time; defaults to now if none is given
 */
function updateSchedule(time,force){
	setDispWeek(time,force);
	
	setHighlightedPeriod();
}

function expandOptions(){
	document.getElementById("options").classList.add("optionsExpanded");
	document.getElementById("optionsArrow").innerHTML = "&#8600;";
}

function contractOptions(){
	document.getElementById("options").classList.remove("optionsExpanded");
	document.getElementById("optionsArrow").innerHTML = "&#8598;";
}

function toggleOptions(){
	if(document.getElementById("options").classList.contains("optionsExpanded"))
		contractOptions();
	else expandOptions();
}

function initOptions(){
	var opt = document.getElementById("options");
	opt.addEventListener("mouseover", expandOptions);
	opt.addEventListener("mouseout", contractOptions);
	
	document.getElementById("optionsArrow").addEventListener("click", toggleOptions);
	
	var inputs = opt.getElementsByTagName("input");
	
	for(var i=0; i<inputs.length; i++) {
		var input = inputs[i];
		//special cases because localStorage saves values as strings
		if(input.type=="checkbox") {											//booleans
			input.addEventListener("change", function(event) {
				options[event.target.name] = localStorage[event.target.name] = event.target.checked;
			});
			
			if(localStorage[input.name]) options[input.name] = input.checked = localStorage[input.name]=="true";
			else options[input.name] = localStorage[input.name] = input.checked;
		} else if(input.type=="number") {										//numbers
			input.addEventListener("change", function(event) {
				options[event.target.name] = parseInt(localStorage[event.target.name] = event.target.value);
			});
			
			if(localStorage[input.name]) options[input.name] = parseInt(input.value = localStorage[input.name]);
			else options[input.name] = parseInt(localStorage[input.name] = input.value);
		} else {																//strings
			input.addEventListener("change", function(event) {
				options[event.target.name] = localStorage[event.target.name] = event.target.value;
			});
			
			if(localStorage[input.name]) options[input.name] = input.value = localStorage[input.name];
			else options[input.name] = localStorage[input.name] = input.value;
		}
	}
}

function attachOptionActions(){
	setUpdateInterval(options.updateScheduleInterval);
	document.getElementsByName("updateScheduleInterval")[0].addEventListener("change", function(event) {
		setUpdateInterval(event.target.value);
	});
	document.getElementsByName("showPassingPeriods")[0].addEventListener("change", function(event) {
		updateSchedule(null,true);
	});
	
	document.addEventListener("keydown", function(event) {
		switch (event.keyCode){ 
			case 116 : //F5
				if(options.interceptF5){ //enabled
					event.preventDefault();
					updateSchedule();
				}
				break;
			case 82 : //R key
				if(options.interceptCtrlR && (event.ctrlKey||event.metaKey)){ //enabled and control/cmd (meta)
					event.preventDefault();
					updateSchedule();
				}
				break;
			case 37 : //Left arrow
				goLastWeek();
			break;
			case 39 : //Right arrow
				goNextWeek();
			break;
			case 40 :
				goCurrWeek();
			break;
		}
	});
	
	setDoge(options.enableDoge);
	document.getElementsByName("enableDoge")[0].addEventListener("change", function(event) {
		setDoge(event.target.checked);
	});
}

/*
* Updates the interval for automatically refreshing the page.
* seconds is the new interval in seconds.
*/
function setUpdateInterval(seconds) {
	clearInterval(updateScheduleID);
	if(seconds>0)
		updateScheduleID = setInterval("updateSchedule()", seconds * 1000); //Convert to milliseconds.
	else updateScheduleID = null;
}