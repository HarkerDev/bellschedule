var $ = require("jquery");
var Period = require("./period.js");
var Options = require("./options.js");

module.exports = CompoundPeriod;
function CompoundPeriod(names, starts, ends) {
	this.names = names;
	this.starts = starts;
	this.ends = ends;
	
	this.sections = [];
	
	for(var i=0; i<names.length; i++) {
		var sectionNames = names[i];
		var sectionStarts = starts[i];
		var sectionEnds = ends[i];
		
		var section = [];
		for(var j=0; j<sectionNames.length; j++) {
			section.push(new Period(sectionNames[j], sectionStarts[j], sectionEnds[j]));
		}
		
		this.sections.push(section);
	}
	
	this.start = this.sections[0][0].start;
	this.end = this.sections[0][this.sections.length-1].end;
};

CompoundPeriod.prototype.applyReplacement = function(replacements) {
	$.each(this.sections, function(index, section) {
		$.each(section, function(index, period) {
			period.applyReplacement(replacements);
		});
	});
};

CompoundPeriod.prototype.clone = function() {
	return new CompoundPeriod(this.names, this.starts, this.ends);
};

CompoundPeriod.prototype.getHTML = function(date) {
	var table = document.createElement("table");
	table.classList.add("compound");
	var row = table.insertRow(-1);

	var section1 = row.insertCell(-1);
	createCompoundPeriodSection(
			section1,
			this.sections[0],
			date
	);

	var section2 = row.insertCell(-1);
	createCompoundPeriodSection(
			section2,
			this.sections[1],
			date
	);

	return table;
};

/**
 * Creates and appends two new sub-periods and passing period to parent period with given start and end times.
 */
function createCompoundPeriodSection(parent, periods, date) {
	var p1 = document.createElement("div");
	p1.classList.add("period");
	p1.appendChild(Period.createPeriod(
			periods[0].name,
			periods[0].start,
			periods[0].end,
			date));
	parent.appendChild(p1);

	if(Options.options.showPassingPeriods) { //TODO: remove options requirement
		var lunchPassing = document.createElement("div");
		lunchPassing.classList.add("period");
		lunchPassing.appendChild(Period.createPeriod("",periods[0].end,periods[1].start,date));
		parent.appendChild(lunchPassing);
	}

	var p2 = document.createElement("div");
	p2.classList.add("period");
	var w2 = document.createElement("div");
	w2.classList.add("periodWrapper");
	p2.appendChild(Period.createPeriod(
			periods[1].name,
			periods[1].start,
			periods[1].end,
			date));
	parent.appendChild(p2);
}
