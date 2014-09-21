var options = exports.options = {}; //needs to be initialized before requiring schedule


var Mobile = require("./mobile.js");
var Nav = require("./nav.js");
var Schedule = require("./schedule.js");
var OptionsObject = require("./optionsObject.js");

var isMobile = Mobile.isMobile;



exports.init = function() {
	makeLocalStorageChanges();
	initOptionsSection();
	applyInitialSettings();
	createOptions(OptionsObject);
};

function makeLocalStorageChanges() {
	if(localStorage.updateScheduleInterval) {
		//rename key
		localStorage.activeUpdateInterval=localStorage.updateScheduleInterval;
		localStorage.removeItem("updateScheduleInterval");
	}
}

function initOptionsSection() {
	var opt = document.getElementById("options");
	
	opt.addEventListener("mouseover", expandOptions);
	opt.addEventListener("mouseout", contractOptions);
	document.getElementById("optionsArrow").addEventListener("click", toggleOptions);
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
	if(document.getElementById("options").classList.contains("expanded"))
		contractOptions();
	else expandOptions();

}

function applyInitialSettings() {
	Schedule.updateUpdateInterval();
	
	document.body.classList.add(options.enableDayView ? "day" : "week");
	Nav.setViewType(options.enableDayView ? Nav.viewTypes.DAY : Nav.viewTypes.WEEK);
	
	setDoge(options.enableDoge);
}

/**
 * Creates options in the options div.
 */
function createOptions(data) {
	data.sections.forEach(function(section) {
		if(!section.hasOwnProperty("platforms") ||
			((isMobile && section.platforms.indexOf("mobile") >= 0) || !isMobile)) {
			createOptionSection(section);
		}
	});
	
	initIndividualOptions();
	attachOptionActions();
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
 * Initializes automatic option saving and sets options to previously-saved values, if any.
 * If no previous saved value exists, sets current (default) value as saved value.
 */
function initIndividualOptions() {
	var inputs = document.getElementById("options").getElementsByTagName("input");
	for(var i=0; i<inputs.length; i++)
	{
		var input = inputs[i];
		//special cases because localStorage saves values as strings
		if(input.type=="checkbox") {                                      //booleans
			input.addEventListener("change", function(event) {
				options[event.target.name] = localStorage[event.target.name] = event.target.checked;
			});
			
			if(localStorage[input.name]) options[input.name] = input.checked = localStorage[input.name]=="true";
			else options[input.name] = localStorage[input.name] = input.checked;
		}
		else if(input.type=="number") {                                   //numbers
			input.addEventListener("change", function(event) {
				options[event.target.name] = parseInt(localStorage[event.target.name] = event.target.value);
			});
			
			if(localStorage[input.name]) options[input.name] = parseInt(input.value = localStorage[input.name]);
			else options[input.name] = parseInt(localStorage[input.name] = input.value);
		}
		else {                                                                //strings
			input.addEventListener("change", function(event) {
				options[event.target.name] = localStorage[event.target.name] = event.target.value;
			});
			
			if(localStorage[input.name]) options[input.name] = input.value = localStorage[input.name];
			else options[input.name] = localStorage[input.name] = input.value;
		}
	}
}

/**
 * Creates event listeners for option-specific actions on option change and applies option-specific actions on page load.
 */
function attachOptionActions() {
	
	document.getElementsByName("activeUpdateInterval")[0].addEventListener("change", function(event) {
		Schedule.updateUpdateInterval();
	});
	document.getElementsByName("showPassingPeriods")[0].addEventListener("change", function(event) {
		Schedule.forceUpdate();
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
	
	
	document.getElementsByName("enableDayView")[0].addEventListener("change", function(event) {
		Schedule.forceUpdate();
		
		document.body.classList.remove("week");
		document.body.classList.remove("day");
		
		Nav.setViewType(options.enableDayView ? Nav.viewTypes.DAY : Nav.viewTypes.WEEK);
		
		Nav.setViewType(options.enableDayView ? "day" : "week");
		
		scrollTo(0,0); //scroll back to top-left corner
	});
	
	if(!isMobile) {
		document.addEventListener("keydown", function(event) {
			switch (event.keyCode){
				case 116 : //F5
					if(options.interceptF5) {
						//enabled
						event.preventDefault();
						Schedule.update();
					}
					break;
				case 82 : //R key
					if(options.interceptCtrlR && (event.ctrlKey||event.metaKey)) {
						//enabled and control/cmd (meta)
						event.preventDefault();
						Schedule.update();
					}
					break;
				case 37 : //Left arrow
					Nav.goPrev();
					break;
				case 39 : //Right arrow
					Nav.goNext();
					break;
				case 40 : //Down arrow
					Nav.goCurr();
				break;
			}
		});
		
		document.getElementsByName("enableDoge")[0].addEventListener("change", function(event) {
			setDoge(event.target.checked);
		});
	}
}
