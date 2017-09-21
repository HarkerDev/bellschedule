/**
 * Primary script for the Harker Bell Schedule
 * Hosted at http://harkerdev.github.io/bellschedule
 **/

/**
 * CSS things
 */
addEventListener("scroll", function (event) {
    document.getElementById("header").style.left = scrollX + "px";
});

/**
 * Returns an array of values in the array that aren't in a.
 */
Array.prototype.diff = function (a) {
    return this.filter(function (i) {
        return a.indexOf(i) < 0;
    });
};

/**
 * Constants
 */
var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]; //days of the week in string form
var schedules; //array of schedules (each schedule is an array in this array
var mobile = isMobile();

/**
 * Globals
 */
var displayDate; //beginning of time period currently being displayed by the schedule
var updateScheduleID; //ID of interval of updateSchedule
var hasFocus = true; //document.hasFocus() seems to be unreliable; assumes window has focus on page load
var options = {};

var urlParams; //object with GET variables as properties and their respective values as values

var inputStr = "";

var KEY_LEFT = 37;
var KEY_UP = 38;
var KEY_RIGHT = 39;
var KEY_DOWN = 40;
var KEY_A = 65;
var KEY_B = 66;
var KONAMI = "" + KEY_UP + KEY_UP + KEY_DOWN + KEY_DOWN + KEY_LEFT + KEY_RIGHT + KEY_LEFT + KEY_RIGHT + KEY_B + KEY_A;
//var isDoge;

var START_DATE = new Date('August 28, 2017'); //The start day of the school year. This should be a weekday.

var START_SCHEDULE = 1; //The schedule on the first day


//On a given day, independent of rotation, after school has a fixed function. This array maps the day (0 for Monday, etc.)
//to the particular function (e.g. Extra Help). This ultimately piggybacks on the replacement system.
var COLLABORATION_REPLACEMENTS = [
    "Collaboration -> Office Hours",
    "Collaboration -> Office Hours",
    "Collaboration -> Faculty Meeting",
    "Collaboration -> Office Hours",
    "Collaboration -> After School"
]

var TOTAL_SCHEDULES = 8; //The number of schedules to be cycled

var SCHEDULES = ["A", "B", "C", "D", "A", "B", "C", "D"]

var MILLIS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Gets GET variables from URL and sets them as properties of the urlParams object.
 * Then updates the state of the current history entry with the appropriate week.
 */
(function () {
    //decode GET vars in URL
    updateUrlParams();

    //update history state
    window.history.replaceState(getDateFromUrlParams(), document.title, document.location);
}());

/**
 * Event listeners
 */
document.addEventListener("visibilitychange", function (event) {
    if (!document.hidden) { //only slightly redundant; on un-minimize, document gains visibility without focus
        updateSchedule();
        // updateClock();
    }
    updateUpdateInterval();
});

addEventListener("focus", function (event) {
    updateSchedule();
    //updateClock();
    hasFocus = true;
    updateUpdateInterval();
});

addEventListener("blur", function (event) {
    hasFocus = false;
    updateUpdateInterval();
});

/**
 * Event listener for navigating through history.
 * (onload event will not fire when navigating through history items pushed by history.pushState, because the page does not reload)
 */
addEventListener("popstate", function (event) {
    updateUrlParams();
    updateSchedule(event.state);
});

/**
 * Updates urlParams object based on the GET variables in the URL.
 * (variables as properties and values as values)
 */
function updateUrlParams() {
    urlParams = {};

    var match,
        pl = /(?!^)\+/g, //regex for replacing non-leading + with space
        search = /([^&=]+)=?([^&]*)/g,
        decode = function (s) {
            return decodeURIComponent(s.replace(pl, " "));
        },
        query = location.search.substring(1);

    while (match = search.exec(query)) {
        urlParams[decode(match[1])] = decode(match[2]);
    }
}

/**
 * Parses schedules, creates schedule for correct week, sets title title on page load.
 */
addEventListener("load", function (event) {
    initViewport();
    initTitle();
    parseRawSchedule();

    //updateSchedule();
    //updateClock();
    download("options.json", createOptions, displayOptionsError);

    //isDoge = false;
});

function initViewport() {
    if (mobile) {
        var meta = document.createElement("meta");
        meta.name = "viewport";
        meta.content = 'user-scalable=no, initial-scale=1.0, maximum-scale=1.0';
        document.getElementsByTagName("head")[0].appendChild(meta);
        document.getElementsByTagName("body")[0].class = "mobile";
    }
}

/**
 * Adds appropriate event listeners to items in the schedule title.
 */
function initTitle() {
    document.getElementById("header").addEventListener("click", setTitleTitle);
    document.getElementById("leftArrow").addEventListener("click", goLast);
    document.getElementById("rightArrow").addEventListener("click", goNext);

    document.getElementById("refresh").addEventListener("click", function () {
        updateSchedule(null, true)
    });

    setTitleTitle();
}

/**
 * Parses raw schedule in body of page into schedule array
 * Code is questionable
 */
function parseRawSchedule() {
    var rawSchedules = document.getElementById("schedules").textContent.split("\n"); //get raw schedule text
    schedules = new Array();
    var x = 0; //index in schedules
    schedules[0] = new Array(); //create array of special schedule days

    //loop through all lines in raw schedule text
    while (rawSchedules.length > 0) {
        if (rawSchedules[0].length == 0) {
            //if line is empty, move to next index in schedules
            schedules[++x] = new Array(); //could probably use id as index instead, or just properties
            rawSchedules.shift();
        } else {
            //if line has text, save in current location in schedules
            var str = rawSchedules.shift();
            if (x == 0 && str.indexOf("|") >= 0) {
                //behavior for blocks of dates with the same schedule
                var start = new Date(str.substring(0, str.indexOf("|")));
                var end = new Date(str.substring(str.indexOf("|") + 1, str.indexOf("\t")));
                for (; start <= end; start.setDate(start.getDate() + 1)) {
                    schedules[0].push(start.getMonth().valueOf() + 1 +
                        "/" + start.getDate() +
                        "/" + start.getFullYear().toString().substr(-2) +
                        str.substring(str.indexOf("\t")));
                }
            } else {
                schedules[x].push(str);
            }
        }
    }
}

/**
 * Displays schedule of the week of the given date/time
 */
function setDisplayDate(time, force) {
    var date = (time ? new Date(time) : getDateFromUrlParams()); //variable to keep track of current day in loop

    setDayBeginning(date);

    if (force || !displayDate || (date.valueOf() != displayDate.valueOf())) {
        var schedule = document.getElementById("schedule"); //get schedule table

        displayDate = new Date(date);

        displayMessage = "Welcome back! Tell a freshman about <a href='http://tiny.cc/hsbell'>tiny.cc/hsbell</a>.";
        if (isSameDate(date, new Date("12/12/16"))) {
            displayMessage += "<span style='font-weight:bold;color: red;'>Finals Disclaimer:</span> All morning exams have different call times divided by grade or course that are not displayed here. To see when you need to get to school, check out the official schedule <a href='http://resources.harker.org/download/us-final-exams-schedule/'>here</a>."
        }
        if (getMonday(date) > getMonday(new Date())) {
            displayMessage += "<br>This is a future date, so the schedule may be incorrect. (In particular, special/alternate schedules may be missing.)"; //display warning if date is in the future
        }

        warn(displayMessage)

        //warn("Hungry? <a href='http://tiny.cc/lunchmenu' style='text-decoration:none;color:#000;'>http://tiny.cc/lunchmenu</a>")

        /*warn("<b style='color:#FF8020'>UPDATE FROM STUCO!</b> Find out what Harker Student Council is working on for YOU at <a style='font-weight:bold' href='http://tiny.cc/harkerstuco'>tiny.cc/harkerstuco</a>!"
              + "<br><b>Submit Honor Council Feedback: </b><a style='font-weight:bold' href=http://bit.ly/harkerfeedback>bit.ly/harkerfeedback</a>"
              + "<br>Use this link <b>only</b> if you have concerns about possible breaches of academic integrity or wish to report Code of Conduct violations."
              + "<br><b>Submit StuCo Feedback:</b> Email <a style='font-weight:bold' href=mailto:16GraceG@students.harker.org>16GraceG@students.harker.org</a>"
              + "<br>Otherwise, direct your suggestions and concerns here."
              +"<br><b>Dowload the new iOS app <a href='http://goo.gl/ZDMMRp'>here</a> to get live push notifications.</b>"); //else display message*/

        /*
          if(date.valueOf()==getMonday(new Date()).valueOf()) document.getElementById("currWeek").style.display = "none"; //hide back to current week button on current week
          else document.getElementById("currWeek").style.display = "inline"; //else show the button
        */
        while (schedule.rows.length) {
            schedule.deleteRow(-1); //clear existing weeks (rows); there should only be one, but just in case...  
        }

        var week = schedule.insertRow(-1); //create new week (row)

        if (!options.enableDayView) {
            date = getMonday(date);
            for (var d = 0; d < 5; d++) {
                //for each day Monday through Friday (inclusive)
                createDay(week, date);
                date.setDate(date.getDate() + 1); //increment day
            }
        } else {
            createDay(week, date);
        }
    }
}

/**
 * Returns a Date object based on the current urlParams (GET variables in the URL).
 * If any part of the date is not specified, defaults to the current date/month/year.
 * If in week view, uses the Monday of the week instead of the day.
 */
function getDateFromUrlParams() {
    var date = new Date();

    if (urlParams["y"] > 0 && urlParams["m"] > 0 && urlParams["d"] > 0) {
        date = new Date("20" + urlParams["y"], urlParams["m"] - 1, urlParams["d"]);
    }

    if (urlParams["m"] > 0 && urlParams["d"] > 0) {
        date = new Date((new Date()).getFullYear(), urlParams["m"] - 1, urlParams["d"]);
    }

    if (!options.enableDayView) {
        date = getMonday(date);
    }
    return date;
}

/**
 * Displays the given warning or hides the warning div if no warning text is given.
 */
function warn(text) {
    var warning = document.getElementById("warning")

    if (text) {
        warning.style.display = "block";
    } else {
        warning.style.display = "none";
    }

    warning.innerHTML = text;
}

/**
 * Creates the day for the given date and appends it to the given week
 */
function createDay(week, date) {
    var daySchedule = getDayInfo(date); //get schedule for that day

    var col = week.insertCell(-1); //create cell for day
    col.date = date.valueOf(); //store date in cell element

    //check Halloween
    if (date.getMonth() == 9 && date.getDate() == 31) {
        col.classList.add("halloween");
    }

    var head = document.createElement("div"); //create header div in cell
    head.classList.add("head");
    var headWrapper = document.createElement("div");
    headWrapper.classList.add("headWrapper");
    var scheduleString = ""; //Should we display the schedule id (e.g. A) next to the date
    //Make sure not to display anything if daySchedule is empty
    if (typeof daySchedule.name != 'undefined' || daySchedule.name != null) {
        //Not a weekend, so add
        scheduleString = "(" + daySchedule.name + ")";
    }
    if (scheduleString === "()") {
        //It's a holiday so delete the extra parenthesis
        scheduleString = "";
    }
    headWrapper.innerHTML = days[date.getDay()] + "<div class=\"headDate\">" +
        daySchedule.dateString + " " + scheduleString + "</div>"; //Portion commented out represents schedule id of that day
    head.appendChild(headWrapper);
    col.appendChild(head);

    var prevEnd = "8:00"; //set start of day to 8:00AM
    // for sub periods, passing periods are already handled and do not need to be added in the next iteration

    if (daySchedule.index > 0) { //populates cell with day's schedule (a bit messily)
        for (var i = 1; i < schedules[daySchedule.index].length; i++) {
            var text = schedules[daySchedule.index][i];
            var periodName = makePeriodNameReplacements(text.substring(0, text.indexOf("\t")), daySchedule.replacements);
            var periodTime = text.substring(text.indexOf("\t") + 1);

            var start = periodTime.substring(0, periodTime.indexOf("-"));
            var end = periodTime.substring(periodTime.lastIndexOf("-") + 1);

            // only creates a new passing period before the period if either 1) it's a split lunch period in the new schedule or
            // 2) the date is not within the bounds of the new schedule
            if (options.showPassingPeriods) {
                var passing = document.createElement("div");
                passing.classList.add("period");
                createPeriod(passing, "", prevEnd, start, date);
                col.appendChild(passing);
            }

            prevEnd = end;

            var period = document.createElement("div");
            period.classList.add("period");

            if (periodName.indexOf("|") >= 0) {
                //handle split periods (i.e. lunches)
                var table = document.createElement("table");
                table.classList.add("lunch");
                var row = table.insertRow(-1);

                var period1 = row.insertCell(-1);
                var period2 = row.insertCell(-1);

                var period1Time = periodTime.substring(0, periodTime.indexOf("||"));
                var period2Time = periodTime.substring(periodTime.indexOf("||") + 2);

                var period1Name = periodName.substring(0, periodName.indexOf("||"));
                var period2Name = periodName.substring(periodName.indexOf("||") + 2);

                //If there are two sets of subperiods (i.e. a|b||c|d) there should be 4 "|"s
                if (findNumberOfOccurences(periodName, "|") == 4) {
                    show1Time = true;
                    show2Time = true;

                    createSubPeriods(
                        period1,
                        period1Name,
                        start,
                        period1Time.substring(period1Time.indexOf("-") + 1, period1Time.indexOf("|")),
                        period1Time.substring(period1Time.indexOf("|") + 1, period1Time.lastIndexOf("-")),
                        end,
                        date,
                        show1Time,
                        show2Time
                    );

                    createSubPeriods(
                        period2,
                        period2Name,
                        start,
                        period2Time.substring(period2Time.indexOf("-") + 1, period2Time.indexOf("|")),
                        period2Time.substring(period2Time.indexOf("|") + 1, period2Time.lastIndexOf("-")),
                        end,
                        date,
                        show1Time,
                        show2Time
                    );
                } else {
                    //parent, name, start, end, date
                    createPeriod(
                        period1,
                        period1Name,
                        start,
                        end,
                        date
                    )

                    show1Time = daySchedule.id == 4 || daySchedule.id == "ReCreate";
                    show2Time = !(show1Time);
                    //parent, name, start1, end1, start2, end2, date, show 1st, show 2nd
                    createSubPeriods(
                        period2,
                        period2Name,
                        start,
                        period2Time.substring(period2Time.indexOf("-") + 1, period2Time.indexOf("|")),
                        period2Time.substring(period2Time.indexOf("|") + 1, period2Time.lastIndexOf("-")),
                        end,
                        date,
                        show1Time,
                        show2Time
                    );
                }
                period.appendChild(table);
            } else {
                createPeriod(period, periodName, start, end, date);
                //parent, name, start, end, date
                //createSubPeriods(
                //lunch2,
                //periodName.substring(periodName.indexOf("||")+2),
                //start,
                //lunch2Time.substring(lunch2Time.indexOf("-")+1,lunch2Time.indexOf("|")),
                //lunch2Time.substring(lunch2Time.indexOf("|")+1,lunch2Time.lastIndexOf("-")),
                //end,
                //date
                //);
            }
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
    if (replacements.length > 0) {
        for (var i = 0; i < replacements.length; i++) {
            if (!replacements[i].indexOf(periodName)) {
                return replacements[i].substring(replacements[i].indexOf("->") + 2);
            }
        }
    }
    return periodName;
}

/**
 * Sets the title of the title to a random line from the title titles list
 */
function setTitleTitle() {
    var titles = document.getElementById("titleTitles").textContent.split("\n");
    document.getElementById("title").title = titles[Math.floor(Math.random() * titles.length)];
}

/**
 * Returns the Monday of next week if date is Saturday; else returns the Monday of that week
 */
function getMonday(d) {
    var date = new Date(d);
    if (date.getDay() >= 6) {
        date.setDate(date.getDate() + 2); //set date to next Monday if today is Saturday  
    } else {
        date.setDate(date.getDate() - date.getDay() + 1); //else set date Monday of this week  
    }
    setDayBeginning(date); //set to beginning of day
    return date;
}

/**
 * Sets given date to beginning of the day (12:00 AM).
 */
function setDayBeginning(date) {
    date.setHours(0, 0, 0, 0);
}

/**
 * Takes in a date and a string of form "hh:MM" and turns it into a time on the day of the given date.
 * Assumes hours less than 7 are PM and hours 7 or greater are AM.
 */
function getDateFromString(string, date) {
    var hour = string.substring(0, string.indexOf(":"));
    var min = string.substring(string.indexOf(":") + 1);
    if (hour < 7) {
        hour = parseInt(hour, 10) + 12; //assumes hours less than seven are PM and hours 7 or greater are AM  
    }
    return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hour, min);
}

/**
 * For given day, returns index of schedule id in schedules, schedule id, and formatted date (mm/dd/yy).
 * Schedule id index is 0 if not found in schedules.
 */
function getDayInfo(day) {
    var dateString = day.getMonth().valueOf() + 1 + "/" + day.getDate().valueOf() + "/" + day.getFullYear().toString().substr(-2); //format in mm/dd/YY

    var id;
    var index = 0;
    var replacements = [];

    //search for special schedule on day
    for (var i = 0; i < schedules[0].length; i++) {
        if (!schedules[0][i].indexOf(dateString)) {
            //found special schedule
            if (schedules[0][i].indexOf("[") >= 0) { //check for period replacements
                //cut replacements and space character out of id and save separately
                id = schedules[0][i].substring(schedules[0][i].indexOf("\t") + 1, schedules[0][i].indexOf("[") - 1)
                replacements = schedules[0][i].substring(schedules[0][i].indexOf("[") + 1, schedules[0][i].indexOf("]")).split(",");
            } else {
                // no replacements to be made
                id = schedules[0][i].substring(schedules[0][i].indexOf("\t") + 1);
            }
            index = getScheduleIndex(id);
        }
    }

    if (id === undefined) { //no special schedule found
        id = day.getDay();
        if (id == 0 || id == 6) {
            index = id = 0; //no school on weekends  
        } else { //default schedule for that day
            id = calculateScheduleRotationID(day);
            index = getScheduleIndex(id);
            //Utilizes the replacement system and the fixed mapping to determine
            //and display the particular after school function on a given day.
            //Note that this is completely independent of the rotation of the
            //schdule.
        }
    }

    var name = "";

    if (id <= TOTAL_SCHEDULES) {
        name = SCHEDULES[id - 1];
    }

    replacements.push(COLLABORATION_REPLACEMENTS[day.getDay() - 1]);

    return {
        "index": index,
        "id": id,
        "dateString": dateString,
        "replacements": replacements,
        "name": name
    };
}

/**
 * Gets the index in the list of schedules of the schedule with the given schedule id (or 0 if no matching schedules were found)
 */
function getScheduleIndex(id) {
    if (id == 0) {
        return 0; //schedule id 0 represents no school
    }
    for (var i = 1; i < schedules.length; i++) { //find index of schedule id
        if (id == schedules[i][0]) {
            return i; //found specified schedule id  
        }
    }
    return 0; //couldn't find specified schedule
}

/**
 * Determines which schedule should be displayed given the four block rotation.
 * This futher factors out weekends and holidays when
 * considering which day to display. Relies on a known starting anchor day with
 * a given schedule and continues the cycle from there.
 */
function calculateScheduleRotationID(date) {
    var daysDifference = Math.ceil((date.getTime() - START_DATE.getTime()) / MILLIS_PER_DAY);
    //Factor out weekends
    daysDifference -= countWeekendDays(START_DATE, date);
    //Factor out holidays
    var dateExp = /\d{1,2}\/\d{1,2}\/\d{2}/ //Finds dates of the format M(M)/D(D)/YY
    for (var i = 0; i < schedules[0].length; i++) {
        var entry = schedules[0][i];

        if (entry.search(dateExp) != -1) {
            //Parse entry into date and id
            var dateString = entry.split("\t")[0];
            //Convert the date to format M(M)/D(D)/YYYY because Date defaults to 1900s
            dateString = dateString.substring(0, dateString.length - 2) + "20" + dateString.substring(dateString.length - 2);
            var entryDate = new Date(dateString);
            var entryId = entry.split("\t")[1];
            //If the checked schedule "entry" is a holiday in the future that occurs
            //before the date that is being calculated "date" but after the start of
            //schedule rotation, don't consider it in the cycle. Furthermore, if the holiday
            //in question is on a weekend (as can happen for long breaks) do not consider it
            //as it has already been factored in in the prior weekend exclusion.
            if (getScheduleIndex(entryId) == 0 && date >= entryDate && entryDate >= START_DATE && entryDate.getDay() != 0 && entryDate.getDay() != 6) {
                daysDifference--;
            }
        }
    }

    var id;

    if (daysDifference < 0) { //Different formula needed for events before start day
        id = START_SCHEDULE + Math.floor(daysDifference % TOTAL_SCHEDULES) + TOTAL_SCHEDULES;
    } else {
        id = START_SCHEDULE + Math.floor(daysDifference % TOTAL_SCHEDULES);
    }

    if (id > 8) {
        id -= 8;
    }

    //Even schedules repeat (2 and 6 are the same and 4 and 8 are the same)
    if (id > 4 && id % 2 == 0) {
        id = id - 4;
    }

    return id;
}

/**
 * Creates and returns a new period wrapper with the given content and start/end times.
 * Also applies any special properties based on period length (text on single line if too short, block period if longer than regular).
 */
function createPeriod(parent, name, start, end, date, showTime) {
    //Do not show time for very small periods (e.g. class meetings)
    if (typeof (showTime) === "undefined") {
        showTime = true;
    }
    startDate = getDateFromString(start, date);
    endDate = getDateFromString(end, date);

    var periodWrapper = document.createElement("div");
    periodWrapper.classList.add("periodWrapper");
    periodWrapper.periodName = name;
    periodWrapper.start = startDate;
    periodWrapper.end = endDate;
    var length = (endDate - startDate) / 60000;
    if (options.color == true) {
        if (periodWrapper.periodName == "P1") {
            periodWrapper.classList.add("periodone");
        }
        if (periodWrapper.periodName == "P2") {
            periodWrapper.classList.add("periodtwo");
        }
        if (periodWrapper.periodName == "P3") {
            periodWrapper.classList.add("periodthree");
        }
        if (periodWrapper.periodName == "P4") {
            periodWrapper.classList.add("periodfour");
        }
        if (periodWrapper.periodName == "P5") {
            periodWrapper.classList.add("periodfive");
        }
        if (periodWrapper.periodName == "P6") {
            periodWrapper.classList.add("periodsix");
        }
        if (periodWrapper.periodName == "P7") {
            periodWrapper.classList.add("periodseven");
        }
        /*if (periodWrapper.periodName == "Lunch") {
            periodWrapper.classList.add("lunchtime");
        }*/
        /*if (periodWrapper.periodName == "School Meeting" || periodWrapper.periodName == "Advisory") {
            periodWrapper.classList.add("meeting");
        }
        if (periodWrapper.periodName == "Office Hours") {
            periodWrapper.classList.add("officehours");
        }
        if (periodWrapper.periodName == "Club Leadership" || periodWrapper.periodName == "Junior Mtg." ||
            periodWrapper.periodName == "Soph Mtg." || periodWrapper.periodName == "Frosh Mtg." ||
            periodWrapper.periodName == "Senior Mtg.") {
            periodWrapper.classList.add("meetingtwo");
        }*/
    }
    if (length > 0) {
        periodWrapper.style.height = (length - 1) + "px"; //minus 1 to account for 1px border

        if (length >= 15) {
            if (name) {
                periodWrapper.innerHTML = name;
            }
            //Force long periods (30 minutes and up) to have a time
            if (showTime) {
                periodWrapper.innerHTML += (length < 30 ? " " : "<br />") + start + " – " + end;
            }
            //if(length>50 && !name.indexOf("P")) //handle block periods (class=long, i.e. bold text)
            //periodWrapper.classList.add("long");
        }
        return parent.appendChild(periodWrapper);
    }
}

/**
 * Creates and appends two new sub-periods and passing period to parent period with given start and end times.
 */
function createSubPeriods(parent, name, start1, end1, start2, end2, date, showFirstTime, showSecondTime) {
    if (typeof (showFirstTime) === "undefined") {
        showFirstTime = true;
    }
    if (typeof (showSecondTime) === "undefined") {
        showSecondTime = true;
    }

    var p1 = document.createElement("div");
    p1.classList.add("period");
    createPeriod(
        p1,
        name.substring(0, name.indexOf("|")),
        start1,
        end1,
        date,
        showFirstTime
    );
    parent.appendChild(p1);

    if (options.showPassingPeriods) {
        var lunchPassing = document.createElement("div");
        lunchPassing.classList.add("period");
        createPeriod(lunchPassing, "", end1, start2, date);
        parent.appendChild(lunchPassing);
    }

    var p2 = document.createElement("div");
    p2.classList.add("period");
    //var w2 = document.createElement("div");
    //w2.classList.add("periodWrapper");
    createPeriod(
        p2,
        name.substring(name.indexOf("|") + 1),
        start2,
        end2,
        date,
        showSecondTime
    );
    parent.appendChild(p2);
}

/**
 * Creates and appends just three new sub-periods (passing periods added manually) with given start and end times.
 */
function create3SubPeriods(parent, name1, start1, end1, name2, start2, end2, name3, start3, end3, date) {
    var p1 = document.createElement("div");
    p1.classList.add("period");
    createPeriod(
        p1,
        name1,
        start1,
        end1,
        date
    );
    parent.appendChild(p1);

    var p2 = document.createElement("div");
    p2.classList.add("period");
    //var w2 = document.createElement("div");
    //w2.classList.add("periodWrapper");
    createPeriod(
        p2,
        name2,
        start2,
        end2,
        date
    );
    parent.appendChild(p2);

    var p3 = document.createElement("div");
    p3.classList.add("period");
    createPeriod(
        p3,
        name3,
        start3,
        end3,
        date
    );
    parent.appendChild(p3);
}

/**
 * Navigates schedule to previous date.
 */
function goLast() {
    var date = new Date(displayDate);
    date.setDate(date.getDate() - (options.enableDayView ? 1 : 7));
    updateSchedule(date);
    updateSearch(date);
}

/**
 * Navigates schedule to next date.
 */
function goNext() {
    var date = new Date(displayDate);
    date.setDate(date.getDate() + (options.enableDayView ? 1 : 7));
    updateSchedule(date);
    updateSearch(date);
}

/**
 * Navigates schedule to current date.
 */
function goCurr() {
    var date = new Date();
    updateSchedule(date);
    updateSearch(date);
}

/**
 * Updates GET variables and urlParams to reflect date in week and pushes corresponding history state.
 */
function updateSearch(week, noHistory) {
    var curr = new Date();

    if (!options.enableDayView) {
        curr = getMonday(curr);
    }

    if (week.getDate() != curr.getDate() || week.getMonth() != curr.getMonth()) {
        urlParams["m"] = week.getMonth() + 1;
        urlParams["d"] = week.getDate();
    } else {
        delete urlParams["m"];
        delete urlParams["d"];
    }
    if (week.getYear() != curr.getYear()) {
        urlParams["y"] = week.getFullYear().toString().substr(-2);
    } else {
        delete urlParams["y"];
    }

    var search = "?";
    for (var param in urlParams) {
        search += param + "=" + urlParams[param] + "&";
    }
    search = search.slice(0, -1);

    history.pushState(week, document.title, location.protocol + "//" + location.host + location.pathname + search + location.hash);
}

/**
 * Highlights given date/time on the schedule; defaults to now if none is given
 */
function setHighlightedPeriod(time) {
    //set default time argument
    if (!time) {
        time = Date.now();
    }

    //set date based on time (for finding day to highlight)
    var date = new Date(time);
    date.setHours(0, 0, 0, 0);

    //clear previous highlighted day/periods
    //TODO: maybe it would be better to not clear highlights when nothing needs to be changed.
    var prevDay = document.getElementById("today");
    var prevPeriods = [];
    if (prevDay) {
        //clear previous highlighted periods
        prevPeriods = Array.prototype.slice.call(prevDay.getElementsByClassName("now")); //get copy of array, not reference to it (needed to check for period changes later)

        for (var i = prevPeriods.length - 1; i >= 0; i--) {
            var prevPeriod = prevPeriods[i];
            prevPeriod.classList.remove("now");
            //remove period length
            var periodLength = prevPeriod.getElementsByClassName("periodLength")[0];
            if (periodLength) {
                prevPeriod.removeChild(periodLength);
            }
        }

        //clear previous highlighted day
        //needs to be done after getting prevPeriods, or else prevDay no longer points anywhere
        prevDay.id = "";
    }

    //set new highlighted day/period
    var days = document.getElementById("schedule").rows[0].cells;
    for (var d = 0; d < days.length; d++) {
        var day = days[d];
        if (date.valueOf() == day.date) { //test if date should be highlighted
            //set new highlighted day
            day.id = "today";

            //set new highlighted periods
            var periods = day.getElementsByClassName("periodWrapper");
            for (var p = 0; p < periods.length; p++) {
                var period = periods[p];
                if (time - period.start >= 0 && time - period.end < 0) { //test if period should be highlighted
                    period.classList.add("now");
                    //add period length if it fits
                    if ((period.end - period.start) / 60000 >= 40) {
                        var length = (period.end - time) / 60000;
                        period.innerHTML += "<div class=\"periodLength\">" +
                            (length > 1 ? Math.round(length) + " min. left</div>" : Math.round(length * 60) + " sec. left</div>");
                    }
                }
            }
        }
    }

    if (options.enablePeriodNotifications) {
        var currPeriods = Array.prototype.slice.call(document.getElementsByClassName("now")); //needs to be an array and not an HTML

        var diff1 = currPeriods.diff(prevPeriods);
        var diff2 = prevPeriods.diff(currPeriods);

        for (var i = 0; i < diff1.length; i++) {
            var name = currPeriods[i].periodName;
            if (name && !hasFocus) {
                sendNotification(name + " has started.", options.notificationDuration);
            }
        }
        for (var i = 0; i < diff2.length; i++) {
            var name = prevPeriods[i].periodName;
            if (name && !hasFocus) {
                sendNotification(name + " has ended.", options.notificationDuration);
            }
        }
    }
}

/**
 * Updates schedule to display as it would on the given date/time; defaults to now if none is given.
 * Also updates
 */
function updateSchedule(time, force) {
    setDisplayDate(time, force);
    setHighlightedPeriod();
}

/**
 * Expands the options div and changes the options arrow to point down and to the right.
 */
function expandOptions() {
    document.getElementById("options").classList.add("expanded");
    document.getElementById("optionsArrow").innerHTML = "&#8600;";
}

/**
 * Contracts the options div and changes the options arrow to point up and to the left.
 */
function contractOptions() {
    document.getElementById("options").classList.remove("expanded");
    document.getElementById("optionsArrow").innerHTML = "&#8598;";
}

/**
 * Toggles the options div between extended and contracted and updates options arrow accordingly.
 */
function toggleOptions() {
    if (document.getElementById("options").classList.contains("expanded")) {
        contractOptions();
    } else {
        expandOptions();
    }
}

/**
 * Initializes automatic option saving and sets options to previously-saved values, if any.
 * If no previous saved value exists, sets current (default) value as saved value.
 */
function initOptions() {
    var opt = document.getElementById("options");
    opt.addEventListener("mouseover", expandOptions);
    opt.addEventListener("mouseout", contractOptions);

    if (mobile) {
        opt.classList.add("mobile");
    }

    document.getElementById("optionsArrow").addEventListener("click", toggleOptions);

    var inputs = opt.getElementsByTagName("input");

    if (localStorage.updateScheduleInterval) {
        //rename key
        localStorage.activeUpdateInterval = localStorage.updateScheduleInterval;
        localStorage.removeItem("updateScheduleInterval");
    }

    for (var i = 0; i < inputs.length; i++) {
        var input = inputs[i];
        //special cases because localStorage saves values as strings
        if (input.type == "checkbox") { //booleans
            input.addEventListener("change", function (event) {
                options[event.target.name] = localStorage[event.target.name] = event.target.checked;
            });

            if (localStorage[input.name]) {
                options[input.name] = input.checked = localStorage[input.name] == "true";
            } else {
                options[input.name] = localStorage[input.name] = input.checked;
            }
        } else if (input.type == "number") { //numbers
            input.addEventListener("change", function (event) {
                options[event.target.name] = parseInt(localStorage[event.target.name] = event.target.value);
            });

            if (localStorage[input.name]) {
                options[input.name] = parseInt(input.value = localStorage[input.name]);
            } else {
                options[input.name] = parseInt(localStorage[input.name] = input.value);
            }
        } else { //strings
            input.addEventListener("change", function (event) {
                options[event.target.name] = localStorage[event.target.name] = event.target.value;
            });

            if (localStorage[input.name]) {
                options[input.name] = input.value = localStorage[input.name];
            } else {
                options[input.name] = localStorage[input.name] = input.value;
            }
        }
    }
}

/**
 * Creates options in the options div.
 */
function createOptions(data) {
    // just assume the file has everything for now
    JSON.parse(data).sections.forEach(function (section) {
        if (!section.hasOwnProperty("platforms") ||
            ((mobile && section.platforms.indexOf("mobile") >= 0) || !mobile)) {
            createOptionSection(section);
        }
    });

    initOptions();
    attachOptionActions();
    updateSchedule(null, true);
}

/**
 * Displays error about retrieving schedule.
 */
function displayOptionsError(timeout, status) {
    updateSchedule();
    if (timeout) {
        warn("Retrieval of options.json timed out!");
    } else {
        warn("Something went wrong while retrieving options.json!");
    }
}

/**
 * Create and insert options section.
 */
function createOptionSection(section) {
    createOptionSectionTitle(section);
    section.options.forEach(function (option) {
        if (!option.hasOwnProperty("platforms") ||
            ((mobile && option.platforms.indexOf("mobile") >= 0) || !mobile)) {
            createOption(option);
        }
    });
}

/**
 * Create and insert options section title.
 */
function createOptionSectionTitle(section) {
    var tr = document.createElement("tr");
    var th = document.createElement("th");
    th.colspan = 2;
    if (section.hasOwnProperty("tooltip")) {
        var span = document.createElement("span");
        span.title = section["tooltip"];
        span.innerHTML = section.name + '<sup class="tooltipIndicator">?</sup>';
        th.appendChild(span);
    } else {
        th.textContent = section.name;
    }
    tr.appendChild(th);
    document.getElementById("optionsContent").appendChild(tr);
}

/**
 * Create and insert option into options.
 */
function createOption(option) {
    var tr = document.createElement("tr");
    var tddesc = document.createElement("td");
    var tdinput = document.createElement("td");
    if (option.hasOwnProperty("tooltip")) {
        var span = document.createElement("span");
        span.title = option.tooltip;
        span.innerHTML = option.description + '<sup class="tooltipIndicator">?</sup>:';
        tddesc.appendChild(span);
    } else {
        tddesc.textContent = option.description + ":";
    }
    var input = document.createElement("input");
    input.name = option.name;
    input.type = option.type;
    var defaultValue = (mobile && option.hasOwnProperty("mobileDefault")) ? option.mobileDefault : option.default; //choose desktop or mobile default value
    if (input.type == "number") {
        input.min = 0; //may as well keep this here until any options can take negative
        input.value = defaultValue;
    } else if (input.type == "checkbox") {
        if (defaultValue) input.checked = "checked";
    }
    tdinput.appendChild(input);
    tr.appendChild(tddesc);
    tr.appendChild(tdinput);
    document.getElementById("optionsContent").appendChild(tr);
}

/**
 * Creates event listeners for option-specific actions on option change and applies option-specific actions on page load.
 */
function attachOptionActions() {
    updateUpdateInterval();
    document.getElementsByName("activeUpdateInterval")[0].addEventListener("change", function (event) {
        updateUpdateInterval();
    });
    document.getElementsByName("showPassingPeriods")[0].addEventListener("change", function (event) {
        updateSchedule(null, true);
    });
    document.getElementsByName("color")[0].addEventListener("change", function (event) {
        updateSchedule(null, true);
    });

    document.getElementsByName("enablePeriodNotifications")[0].addEventListener("change", function (event) {
        if (options.enablePeriodNotifications) {
            var permission = Notification.permission;
            if (!("Notification" in window)) {
                alert("This browser does not support desktop notifications.");
            } else if (permission == "denied") {
                alert("Please allow desktop notifications for this site to enable this feature.");
            } else if (permission == "default") {
                Notification.requestPermission();
            }
        }
    });

    document.body.classList.add(options.enableDayView ? "day" : "week");
    document.getElementsByName("enableDayView")[0].addEventListener("change", function (event) {
        updateSchedule(null, true);

        document.body.classList.remove("week");
        document.body.classList.remove("day");
        document.body.classList.add(options.enableDayView ? "day" : "week");

        scrollTo(0, 0); //scroll back to top-left corner
    });

    if (!mobile) {
        document.addEventListener("keydown", function (event) {
            switch (event.keyCode) {
                case 116: //F5
                    if (options.interceptF5) {
                        //enabled
                        event.preventDefault();
                        updateSchedule();
                    }
                    break;
                case 82: //R key
                    if (options.interceptCtrlR && (event.ctrlKey || event.metaKey)) {
                        //enabled and control/cmd (meta)
                        event.preventDefault();
                        updateSchedule();
                    }
                    break;
                case 37: //Left arrow
                    goLast();
                    break;
                case 39: //Right arrow
                    goNext();
                    break;
                case 40: //Down arrow
                    goCurr();
                    break;
            }
            inputStr += event.keyCode;
            if (inputStr.indexOf(KONAMI) != -1) {
                //isDoge = !isDoge;
                //setDoge(isDoge);
                inputStr = "";
            }
        });

        /*setDoge(options.enableDoge);
          document.getElementsByName("enableDoge")[0].addEventListener("change", function(event) {
          setDoge(event.target.checked);
          });*/ // in light of recent complaints, doge mode has been discontinued (1/28/2015)
    }
}

/**
 * Retrieve file data via XMLHttpRequest.
 *
 * cb is for successful retrieval and takes a String as a parameter.
 * errcb is for an error on retrieval and takes:
 *    1. a boolean representing whether or not the error was a timeout.
 *    2. an integer representing the status of the response (this is null on timeout).
 */
function download(url, cb, errcb) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open("GET", url, true);
    xmlhttp.onreadystatechange = function () {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200) {
                cb(xmlhttp.responseText);
            } else if (errcb) {
                errcb(false, xmlhttp.status);
            }
        }
    };
    xmlhttp.ontimeout = function () {
        errcb(true, null);
    };
    xmlhttp.send();
}

/**
 * Sets the correct update interval based on the current state (focus and visibility) of the document.
 */
function updateUpdateInterval() {
    if (document.hidden) {
        setUpdateInterval(options.hiddenUpdateInterval); //assume that hidden implies no focus
    } else if (hasFocus) {
        setUpdateInterval(options.activeUpdateInterval);
    } else {
        setUpdateInterval(options.inactiveUpdateInterval);
    }
}

/**
 * Updates the interval for automatically refreshing the page.
 * seconds is the new interval in seconds.
 */
function setUpdateInterval(seconds) {
    clearInterval(updateScheduleID);
    if (seconds > 0) {
        updateScheduleID = setInterval(function () {
            //updateClock();
            updateSchedule();
        }, seconds * 1000); //convert to milliseconds
    } else {
        updateScheduleID = null;
    }
}

/**
 * Creates a desktop notification with the given text for a title and removes it after the given duration in seconds.
 * A duration of 0 or less will disable auto-closing the notification.
 */
function sendNotification(text, duration) {
    if ("Notification" in window) { //check that browser supports notifications
        var notification = new Notification(text);
        if (duration > 0) {
            setTimeout(function () {
                notification.close();
            }, duration * 1000);
        }
    }
}

/**
 * Function to detect whether the page is being displayed on a mobile device.
 * Currently checks if the useragent/vendor matches a regex string for mobile phones.
 */
function isMobile() {
    var a = navigator.userAgent || navigator.vendor || window.opera;
    if (window.innerWidth <= 800 && window.innerHeight <= 600) {
        return true;
    }
    return /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4));
}

/**
 * Updates the time on the bell schedule
 */
function updateClock() {
    var now = new Date();
    var h = now.getHours();
    var h12 = h % 12;
    var m = now.getMinutes();
    document.getElementById('currentTime').innerHTML = (h12 == 0 ? 12 : h12) + ":" + addLeadingZero(m) + (h >= 12 ? " PM" : " AM");
}

/**
 * Adds leading zeroes as necessary to make output (at least) 2 characters long
 * (Assumes that n is an integer.)
 */
function addLeadingZero(n) {
    return (n < 10) ? "0" + n : n;
}

/**
 * Checks if two dates are the same, ignoring hours, minutes, and seconds
 */
function isSameDate(d1, d2) {
    return (
        d1.getFullYear() === d2.getFullYear() &&
        d2.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
    );
}

/**
 * Determines how many times the character or character sequence
 * char appears in str.
 */
function findNumberOfOccurences(str, char) {
    for (var count = -1, index = -2; index != -1; count++, index = str.indexOf(char, index + 1));
    return count;
}

function countWeekendDays(start, end) {
    var numDays = 1 + Math.round((end.getTime() - start.getTime()) / MILLIS_PER_DAY);
    var numSat = Math.floor((start.getDay() + numDays) / 7);
    return 2 * numSat + (start.getDay() == 0) - (end.getDay() == 6);
}
