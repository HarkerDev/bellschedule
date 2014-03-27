var suchArray = ["such","very","much","many","so"];

var nounArray = ["schedule","time","date","table","class","lines","title","color"];

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
	document.body.style.backgroundImage = "url('doge.jpg')";
	
	suchIntervalID = setInterval("swapDoge()", delay);
	swapDoge();
}

function stopDoge() {
	document.body.style.backgroundImage = "";
	
	clearInterval(suchIntervalID);
	suchIntervalID = null;
	
	var doge = document.getElementsByClassName("doge");
	while(doge.length > 0) document.body.removeChild(doge[0]);
}

function createDoge() {	
	var div = document.createElement("div");
	var text = document.createTextNode(Math.random()<.1 ? "wow" : (choose(suchArray) + " " + choose(nounArray)));
	
	div.classList.add("doge");
	div.appendChild(text);
	
	div.style.font = "bold " + randInt(15,50) + "px 'Comic Sans MS'";
	div.style.color = "hsl(" + randInt(360) + ",100%,50%)";
	div.style.transform = div.style.webkitTransform = "rotate(" + randInt(-30,30) + "deg)";
	
	div.style.position = "absolute";
	div.style.visibility = "hidden"; //render invisible once to calculate width/height
	
	document.body.appendChild(div);
	
	/* 
	 * randomize position, but make sure div doesn't overflow off right/bottom of window
	 * all the divide by 2 nonsense accounts for rotation
	 *     (length of a side of a triangle must be less than the sum of the lengths of the other two sides)
	 */
	div.style.top = randInt(div.offsetWidth/2, window.innerHeight-div.offsetHeight-div.offsetWidth/2) + "px";
	div.style.left = randInt(div.offsetHeight/2, window.innerWidth-div.offsetWidth-div.offsetHeight/2) + "px";
	div.style.visibility = "visible";
}

function swapDoge() {
	var doges = document.getElementsByClassName("doge")
	if(doges.length >= maxDoge)
		document.body.removeChild(choose(doges));
	createDoge();
}

function choose(array) {
	return array[randInt(array.length)];
}

function randInt(x,y) {
	if(y==null)
		return Math.floor(Math.random()*x);
	else return Math.floor(Math.random()*(y-x) + x)
}

function rand(x,y) {
	if(y==null)
		return Math.random()*x
	else return Math.random()*(y-x) + x;
}