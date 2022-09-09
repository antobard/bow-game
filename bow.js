// Variables
const root = document.documentElement;
const docStyle = document.documentElement.style;

const refTextArrows = document.getElementById("arrowsLeft");
const refS = document.getElementById("s");
const refScore = document.getElementById("score");
const refCrosshair = document.getElementById("crosshair");
const refGameArea = document.getElementById("gameArea");

var refArrow;

var isDown = false;
var isNotched = false;
var isLvlLoading = false;

var frameCount = 0;

const gravity = 9.81;
var wind = 0;
var score = 0;
var arrowsLeft = 3;

var lvlIndex = 0;
const levels = [
    {scale: 1, offsetY: "-90%"},
    {scale: 0.8, offsetY: "-95%"},
    {scale: 0.6, offsetY: "-85%"},
    {scale: 0.4, offsetY: "-70%"},
    {scale: 0.2, offsetY: "-60%"},
];

var [mouseX, mouseY, woggleX, woggleY, positionX, positionY, crosshairX, crosshairY, arrowX, arrowY]
    = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

loadLevel();

// Event Listeners
document.addEventListener("mousedown", function(e) {
    isDown = true;

    refCrosshair.classList.add("focus");
    refCrosshair.addEventListener("animationend", notched);
}, true);

document.addEventListener("mousemove", function(e) {
    mouseX = e.clientX;
    mouseY = e.clientY;
}, true);

document.addEventListener("mouseup", function(e) {
    isDown = false;

    if (isNotched) {
        if (arrowsLeft > 0) {
            // Tir au milieu du viseur
            const crosshairPos = refCrosshair.getBoundingClientRect();
            crosshairX = crosshairPos.x + crosshairPos.width / 2;
            crosshairY = crosshairPos.y + crosshairPos.height / 2;
            createArrow(); // TODO: supprimer la fleche si elle touche autre chose que la cible ou le sol

            // Calcul de l'endroit où la flèche atterit
            arrowX = positionX + wind;
            arrowY = positionY + gravity;
            docStyle.setProperty("--arrowX", arrowX);
            docStyle.setProperty("--arrowY", arrowY);

            shotCheck(arrowX, arrowY);
            
            arrowsLeft--;
        }
    }
    refCrosshair.classList.remove("focus");
    isNotched = false;
}, true);


// Functions
function gameLoop() {
    frameCount++;

    if (!isLvlLoading) {
        if (arrowsLeft == 0 && refArrow == null) {
            if (lvlIndex < levels.length) {
                lvlIndex++;
                setTimeout(loadLevel, 2000);
                isLvlLoading = true;
            }
        }
    }
    
    if (frameCount % 2 == 0) {
        var woggleRange = 2;
        woggleX += getRandomIntInclusive(-woggleRange, woggleRange);
        woggleY += getRandomIntInclusive(-woggleRange, woggleRange);
    }
    if (frameCount % 180 == 0) {
        frameCount = 0;
    }

    positionX = mouseX + woggleX;
    positionY = mouseY + woggleY;

    docStyle.setProperty("--positionX", positionX);
    docStyle.setProperty("--positionY", positionY);

    updateInterface();

    requestAnimationFrame(gameLoop);
}

function loadLevel() {
    resetGame();

    docStyle.setProperty("--targetScale", levels[lvlIndex].scale);
    docStyle.setProperty("--targetOffsetY", levels[lvlIndex].offsetY);

    wind = getRandomIntInclusive(-20, 20);

    gameLoop();
    windObjects();
    isLvlLoading = false;
}

function resetGame() {
    arrowsLeft = 3;
    // score = 0;
    wind = 0;
    woggleX = 0;
    woggleY = 0;
    // refCrosshair.style.display = "none";
    root.style.cursor = "none";

    document.querySelectorAll(".arrow").forEach(mark => {
        refGameArea.removeChild(mark);
    });
    document.querySelectorAll(".cloud").forEach(mark => {
        refGameArea.removeChild(mark);
    });
    document.querySelectorAll(".leaf").forEach(mark => {
        refGameArea.removeChild(mark);
    });
}

function updateInterface() {
    refScore.textContent = score;

    refTextArrows.textContent = "";
    for (var i = 0; i < arrowsLeft; i++) {
        refTextArrows.textContent += "↑";
    }
    
    if (arrowsLeft == 1) {
        refS.textContent = "";
    } else if (arrowsLeft == 0) {
        refTextArrows.textContent = "No";
    } else {
        refS.textContent = "s";
    }
}

function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min +1)) + min;
}  

function createArrow() {
    const arrow = document.createElement("div");
    arrow.classList.add("arrow");

    const arrowTip = document.createElement("div");
    arrowTip.classList.add("arrowTip");
    arrow.appendChild(arrowTip);
    
    const arrowShadow = document.createElement("div");
    arrowShadow.classList.add("arrowShadow");
    arrow.appendChild(arrowShadow);

    arrow.classList.add("launched");
    arrow.addEventListener("animationend", stucked);

    refArrow = arrow;

    refGameArea.appendChild(arrow);
}

function notched() {
    isNotched = true;
}

function stucked() {
    refArrow.classList.remove("launched");

    refArrow.firstChild.style.display = "none";

    refArrow.style.left = arrowX - 10 + "px";
    refArrow.style.top = arrowY - 4 + "px";
    
    refArrow.classList.add("stucked");
    refArrow = null;
}

function shotCheck(posX, posY) {
    const clickedElements = [...document.elementsFromPoint(posX, posY)];

    for (var i = 0; i < clickedElements.length; i++) {
        if (clickedElements[i].classList.contains("targetRing")) {
            // Ajoute le contenu du cercle cliqué au score
            score += parseInt(clickedElements[i].textContent);
            break
        }
    }
}

function windObjects() {
    const cloudsNb = getRandomIntInclusive(1, (Math.abs(wind) / 2));
    const leavesNb = getRandomIntInclusive(3, (Math.abs(wind) / 2));
    var duration = 1;
    var delay = 0;

    for (var i = 0; i < cloudsNb; i++) {
        duration = 150 / Math.abs(wind) + "s"; // Plus il y a de vent, plus l'animation est rapide
        delay = i * getRandomIntInclusive(1, 2) + "s"; // Délaie les animations

        createWindObj("cloud", "left_to_right ", duration, delay);
    }

    for (var i = 0; i < leavesNb; i++) {
        duration = 50 / Math.abs(wind) + "s"; // Plus il y a de vent, plus l'animation est rapide
        delay = i * getRandomIntInclusive(1, 3) + "s"; // Délaie les animations

        createWindObj("leaf", "windBlowing ", duration, delay);
    }
}

function createWindObj(type, animName, duration, delay) {
    const obj = document.createElement("div");
    obj.classList.add(type);

    var direction = "";
    if (wind < 0) { direction = "reverse"; }

    obj.style.animation = 
        animName + duration + " linear " + delay + " infinite " + direction;

    const origins = ["left", "top", "right", "bottom", "center"];
    obj.style.transformOrigin = origins[Math.floor(Math.random() * origins.length)];
    obj.style.top = getRandomIntInclusive(40, 400) + "px";
    obj.style.left = "-150px";

    refGameArea.appendChild(obj);
}