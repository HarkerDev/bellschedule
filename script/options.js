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
	createIndividualOptions(OptionsObject);
};

function makeLocalStorageChanges() {
	//rename updateScheduleInterval to activeUpdateInterval
	if(localStorage.updateScheduleInterval) {
		localStorage.activeUpdateInterval=localStorage.updateScheduleInterval;
		localStorage.removeItem("updateScheduleInterval");
	}
}

function initOptionsSection() {
	var opt = document.getElementById("options");
	
	opt.addEventListener("mouseover", expandOptions);
	opt.addEventListener("mouseout", contractOptions);
	document.getElementById("optionsArrow").addEventListener("click", toggleOptionsState);
}

function expandOptions() {
	document.getElementById("options").classList.add("expanded");
	document.getElementById("optionsArrow").innerHTML = "&#8600;";
}

function contractOptions() {
	document.getElementById("options").classList.remove("expanded");
	document.getElementById("optionsArrow").innerHTML = "&#8598;";
}

function toggleOptionsState() {
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

function createIndividualOptions(data) {
	data.sections.forEach(function(section) {
		if(!section.hasOwnProperty("platforms") ||
			((isMobile && section.platforms.indexOf("mobile") >= 0) || !isMobile)) {
			createOptionSection(section);
		}
	});
	
	attachIndividualOptionActions();
}

function createOptionSection(section) {
	createOptionSectionTitle(section);
	section.options.forEach(function(option) {
		if(!option.hasOwnProperty("platforms") ||
		   ((isMobile && option.platforms.indexOf("mobile") >= 0) || !isMobile)) {
			createOption(option);
		}
	});
}

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
	var name = input.name = option.name;
	var type = input.type = option.type;
	var defaultValue = (isMobile && option.hasOwnProperty("mobileDefault")) ? option.mobileDefault : option.default;
	if(type == "number") {                                                              //numbers
		input.min = 0; //may as well keep this here until any options take negative values
		input.addEventListener("change", function(event) {
			options[name] = parseInt(localStorage[name] = input.value);
		});
		if(localStorage[name]) options[name] = input.value = parseInt(localStorage[name]);
		else localStorage[name] = input.value = options[name] = defaultValue;
	} else if(type == "checkbox") {                                                     //booleans
		input.addEventListener("change", function(event) {
			options[name] = localStorage[name] = input.checked;
		});
		if(localStorage[name]) options[name] = input.checked = localStorage[name]=="true";
		else localStorage[name] = options[name] = input.checked = defaultValue;
	} else {                                                                            //strings
		input.addEventListener("change", function(event) {
			options[name] = localStorage[name] = input.value;
		});
		if(localStorage[name]) options[name] = input.value = localStorage[name];
		else localStorage[name] = options[name] = input.value = defaultValue;
	}
	tdinput.appendChild(input);
	tr.appendChild(tddesc);
	tr.appendChild(tdinput);
	document.getElementById("optionsContent").appendChild(tr);
}

/**
 * Creates event listeners for option-specific actions on option change and applies option-specific actions on page load.
 */
function attachIndividualOptionActions() {
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
			setDoge(options.enableDoge);
		});
	}
}
