//javascript:(function(){document.body.appendChild(document.createElement('script')).src="http://harkerdev.github.io/bellschedule/doge.js";setTimeout("startDoge(2000)",500);})();
//bookmarklet to run doge mode on any page (nouns will be the same, though)

var suchAdjectives = ["such","very","much","many","so"];

var suchNouns = ["schedule","time","date","table","class","periods","lines","title","color","day","organize","impress", "harkerdev"];

var suchDelay = 2000;	//delay between adding new div in ms
var maxDoge = 5;		//max number of dogeDivs
var suchIntervalID;		//interval ID for doge adding

function setDoge(state) {
	if(state) startDoge(suchDelay);
	else stopDoge();
}

function setDogeDelay(delay) { suchDelay = delay; }
function setDogeMax(max) { maxDoge = max; }

function startDoge(delay) {
	document.body.style.backgroundImage = "url('http://harkerdev.github.io/bellschedule/doge.jpg')";
	
	suchIntervalID = setInterval("swapDogeDiv()", delay);
	swapDogeDiv();
}

function stopDoge() {
	document.body.style.backgroundImage = "";
	
	clearInterval(suchIntervalID);
	suchIntervalID = null;
	
	var doge = document.getElementsByClassName("doge");
	for(var i=0;i<doge.length;i++) removeDogeDiv(doge[i]);
}

function createDogeDiv() {
	var dogeDiv = document.createElement("div");
	var text = document.createTextNode(Math.random()<.1 ? "wow" : (choose(suchAdjectives) + " " + choose(suchNouns)));
	
	dogeDiv.classList.add("doge");
	dogeDiv.appendChild(text);
	
	dogeDiv.style.font = "bold " + randInt(15,50) + "px 'Comic Sans MS'";
	dogeDiv.style.color = "hsl(" + randInt(360) + ",100%,50%)";
	dogeDiv.style.transform = dogeDiv.style.webkitTransform = "rotate(" + randInt(-30,30) + "deg)";
	
	dogeDiv.style.position = "fixed";
	dogeDiv.style.opacity = "0"; //render invisible once to calculate width/height
	dogeDiv.style.transition = dogeDiv.style.webkitTransition = "opacity .2s";
	
	document.body.appendChild(dogeDiv);
	
	/* 
	 * randomize position, but make sure dogeDiv doesn't overflow off right/bottom of window
	 * all the dogeDivide by 2 nonsense accounts for rotation
	 *     (length of a side of a triangle must be less than the sum of the lengths of the other two sides)
	 */
	dogeDiv.style.top = randInt(dogeDiv.offsetWidth/2, window.innerHeight-dogeDiv.offsetHeight-dogeDiv.offsetWidth/2) + "px";
	dogeDiv.style.left = randInt(dogeDiv.offsetHeight/2, window.innerWidth-dogeDiv.offsetWidth-dogeDiv.offsetHeight/2) + "px";
	dogeDiv.style.opacity = "1";
}

function removeDogeDiv(dogeDiv) {
	if(dogeDiv.style.opacity != "0") { //don't remove div that's already disappearing
		dogeDiv.style.opacity = "0";
		setTimeout(function() {document.body.removeChild(dogeDiv);}, 1000); //wait a second to let fade animation finish
	}
}

function swapDogeDiv() {
	var doges = document.getElementsByClassName("doge")
	if(doges.length >= maxDoge)
		removeDogeDiv(choose(doges));
	createDogeDiv();
}

function choose(array) {
	return array[randInt(array.length)];
}

function randInt(x,y) {
	if(y==null)
		return Math.floor(Math.random()*x);
	else return Math.floor(Math.random()*(y-x) + x)
}