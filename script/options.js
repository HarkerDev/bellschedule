var options = exports.options = {}; //needs to be initialized before requiring schedule


var mobile = require("./mobile.js");
var nav = require("./nav.js");
var schedule = require("./schedule.js");

var isMobile = mobile.isMobile;



exports.init = function() {
	download("options.json", createOptions, displayOptionsError);
};

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
	if(document.getElementById("options").classList.contains("expanded"))
		contractOptions();
	else expandOptions();

}

/**
 * Initializes automatic option saving and sets options to previously-saved values, if any.
 * If no previous saved value exists, sets current (default) value as saved value.
 */
function initOptions() {
	var opt = document.getElementById("options");
	opt.addEventListener("mouseover", expandOptions);
	opt.addEventListener("mouseout", contractOptions);

	if(isMobile) opt.classList.add("mobile");

	document.getElementById("optionsArrow").addEventListener("click", toggleOptions);

	var inputs = opt.getElementsByTagName("input");

	if(localStorage.updateScheduleInterval) {
		//rename key
		localStorage.activeUpdateInterval=localStorage.updateScheduleInterval;
		localStorage.removeItem("updateScheduleInterval");
	}

	for(var i=0; i<inputs.length; i++)
	{
		var input = inputs[i];
		//special cases because localStorage saves values as strings
		if(input.type=="checkbox") {											//booleans
			input.addEventListener("change", function(event) {
				options[event.target.name] = localStorage[event.target.name] = event.target.checked;
			});

			if(localStorage[input.name]) options[input.name] = input.checked = localStorage[input.name]=="true";
			else options[input.name] = localStorage[input.name] = input.checked;
		}
		else if(input.type=="number") {										//numbers
			input.addEventListener("change", function(event) {
				options[event.target.name] = parseInt(localStorage[event.target.name] = event.target.value);
			});

			if(localStorage[input.name]) options[input.name] = parseInt(input.value = localStorage[input.name]);
			else options[input.name] = parseInt(localStorage[input.name] = input.value);
		}
		else {																//strings
			input.addEventListener("change", function(event) {
				options[event.target.name] = localStorage[event.target.name] = event.target.value;
			});

			if(localStorage[input.name]) options[input.name] = input.value = localStorage[input.name];
			else options[input.name] = localStorage[input.name] = input.value;
		}
	}
}

/**
 * Creates options in the options div.
 */
function createOptions(data) {
	// just assume the file has everything for now
	JSON.parse(data).sections.forEach(function(section) {
		if(!section.hasOwnProperty("platforms") ||
			((isMobile && section.platforms.indexOf("mobile") >= 0) || !isMobile)) {
			createOptionSection(section);
		}
	});

	initOptions();
	attachOptionActions();

	schedule.updateSchedule(null, true);
}

/**
 * Displays error about retrieving schedule.
 */
function displayOptionsError(timeout, status) {
	schedule.updateSchedule();
	
	if(timeout) {
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
	section.options.forEach(function(option) {
		if(!option.hasOwnProperty("platforms") ||
		   ((isMobile && option.platforms.indexOf("mobile") >= 0) || !isMobile)) {
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
	if(section.hasOwnProperty("tooltip")) {
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
	if(option.hasOwnProperty("tooltip")) {
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
	var defaultValue = (isMobile && option.hasOwnProperty("mobileDefault")) ? option.mobileDefault : option.default; //choose desktop or mobile default value
	if(input.type == "number") {
		input.min = 0; //may as well keep this here until any options can take negative
		input.value = defaultValue;
	} else if(input.type == "checkbox") {
		if(defaultValue) input.checked = "checked";
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
	schedule.updateUpdateInterval();
	document.getElementsByName("activeUpdateInterval")[0].addEventListener("change", function(event) {
		schedule.updateUpdateInterval();
	});
	document.getElementsByName("showPassingPeriods")[0].addEventListener("change", function(event) {
		schedule.updateSchedule(null,true);
	});

	document.getElementsByName("enablePeriodNotifications")[0].addEventListener("change", function(event) {
		if(options.enablePeriodNotifications) {
			var permission = Notification.permission;
			if(!("Notification" in window)) {
				alert("This browser does not support desktop notifications.");
			} else if(permission == "denied") {
				alert("Please allow desktop notifications for this site to enable this feature.");
			} else if(permission == "default") {
				Notification.requestPermission();
			}
		}
	});

	document.body.classList.add(options.enableDayView ? "day" : "week");
	nav.setViewType(options.enableDayView ? nav.viewTypes.DAY : nav.viewTypes.WEEK);
	document.getElementsByName("enableDayView")[0].addEventListener("change", function(event) {
		schedule.updateSchedule(null, true);
		
		document.body.classList.remove("week");
		document.body.classList.remove("day");
		
		nav.setViewType(options.enableDayView ? nav.viewTypes.DAY : nav.viewTypes.WEEK);
		
		nav.setViewType(options.enableDayView ? "day" : "week");
		
		scrollTo(0,0); //scroll back to top-left corner
	});

	if(!isMobile) {
		document.addEventListener("keydown", function(event) {
			switch (event.keyCode){
				case 116 : //F5
					if(options.interceptF5){
						//enabled
						event.preventDefault();
						schedule.updateSchedule();
					}
					break;
				case 82 : //R key
					if(options.interceptCtrlR && (event.ctrlKey||event.metaKey)){
						//enabled and control/cmd (meta)
						event.preventDefault();
						schedule.updateSchedule();
					}
					break;
				case 37 : //Left arrow
					goPrev();
					break;
				case 39 : //Right arrow
					goNext();
					break;
				case 40 : //Down arrow
					goCurr();
				break;
			}
		});

		setDoge(options.enableDoge);
		document.getElementsByName("enableDoge")[0].addEventListener("change", function(event) {
			setDoge(event.target.checked);
		});
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
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState == 4) {
			if(xmlhttp.status == 200) {
				cb(xmlhttp.responseText);
			} else if(errcb) {
				errcb(false, xmlhttp.status);
			}
		}
	};
	xmlhttp.ontimeout = function() {
		errcb(true, null);
	};
	xmlhttp.send();
}
