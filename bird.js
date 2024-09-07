let board;
let boardWidth = window.innerWidth;
let boardHeight = window.innerHeight;
let context;

let baseWidth = 750;
let minBirdWidth = 20; // Minimum bird width
let maxBirdWidth = baseWidth / 2; // Maximum bird width for larger screens

let fallAudio = new Audio('./audio/004.mp3');

// Proportional bird dimensions based on board size
let birdWidth = Math.max(Math.min(boardWidth / 10, maxBirdWidth), minBirdWidth);
let birdHeight = birdWidth * (boardHeight*(.8) / boardWidth); // Maintain aspect ratio
let birdX = boardWidth / 8;
let birdY = boardHeight / 4;
let birdImg;

let bird = {
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
};

let pipeWidth = baseWidth / 25;
let pipeHeight = baseWidth / 2;
let pipeX = boardWidth;
let pipeY = 0;

let openingSpace = boardHeight / 2; // Reduced gap between pipes

let pipeArray = [];
let topPipeImage;
let bottomPipeImage;

let velocityX = -baseWidth / 300;
let velocityY = 0;
let gravity = baseWidth / 11000;
let gameOver = true; // Start game in a paused state
let isPaused = false; // New flag to track pause state
let score = 0;
let highScore = 0;

let collisionAudio = new Audio('./audio/bird.mp3');
let video;

// Load high score from localStorage
function getHighScore() {
    try {
        let score = localStorage.getItem("highScore");
        return score ? parseInt(score) : 0;
    } catch (error) {
        console.warn("LocalStorage is not available:", error);
        return 0;
    }
}

function setHighScore(score) {
    try {
        localStorage.setItem("highScore", score);
    } catch (error) {
        console.warn("LocalStorage is not available:", error);
    }
}

window.onload = function () {
    board = document.querySelector("#board");
    video = document.querySelector("#video");

    // Set canvas dimensions to match window size
    board.width = boardWidth;
    board.height = boardHeight;

    context = board.getContext("2d");

    birdImg = new Image();
    birdImg.src = "./images/bird.png";
    birdImg.onload = function () {
        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    };

    topPipeImage = new Image();
    topPipeImage.src = "./images/top.jpeg";
    bottomPipeImage = new Image();
    bottomPipeImage.src = "./images/bottom.jpeg";

    // Load high score from safe wrapper
    highScore = getHighScore();

    // Set up play, pause, and restart button functionality
    let playButton = document.querySelector('#playButton');
    let pauseButton = document.querySelector('#pauseButton');
    let restartButton = document.querySelector('#restartButton');

    playButton.addEventListener('click', startGame);
    pauseButton.addEventListener('click', pauseGame);
    restartButton.addEventListener('click', restartGame);

    // Run the update function repeatedly to animate the game
    requestAnimationFrame(update);

    // Place pipes every 1500ms
    setInterval(placePipes, 1500);

    // Register bird movement
    document.addEventListener('keydown', moveBird);
    document.addEventListener('touchstart', moveBird);
};

function update() {
    if (!gameOver && !isPaused) { // Check if the game is not paused or over
        context.clearRect(0, 0, board.width, board.height);

        velocityY += gravity;
        bird.y = Math.max(bird.y + velocityY, 0); // Prevent bird from flying off the top

        context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);

        if (bird.y > board.height) {
            fallAudio.play();
            gameOver = true;
            muteBackgroundVideo();
        }

        for (let i = 0; i < pipeArray.length; i++) {
            let pipePair = pipeArray[i];
            pipePair.topPipe.x += velocityX;
            pipePair.bottomPipe.x += velocityX;

            context.drawImage(pipePair.topPipe.img, pipePair.topPipe.x, pipePair.topPipe.y, pipePair.topPipe.width, pipePair.topPipe.height);
            context.drawImage(pipePair.bottomPipe.img, pipePair.bottomPipe.x, pipePair.bottomPipe.y, pipePair.bottomPipe.width, pipePair.bottomPipe.height);

            if (!pipePair.passed && bird.x > pipePair.topPipe.x + pipeWidth) {
                score++;
                pipePair.passed = true;
            }

            if (detectCollision(bird, pipePair.topPipe) || detectCollision(bird, pipePair.bottomPipe)) {
                collisionAudio.play();
                gameOver = true;
                muteBackgroundVideo();

                if (score > highScore) {
                    highScore = score;
                    setHighScore(highScore); // Use safe localStorage wrapper
                }
            }
        }

        while (pipeArray.length > 0 && pipeArray[0].topPipe.x < -pipeWidth) {
            pipeArray.shift();
        }

        displayScore();

        if (gameOver) {
            displayGameOver();
        }
    }

    requestAnimationFrame(update);
}

function moveBird(event) {
    if (!isPaused && (event.code == "Space" || event.code == "ArrowUp" || event.type === "touchstart")) {
        // Jump when the bird is still in play
        if (!gameOver) {
            let jumpHeight = isSmartphone() ? -boardHeight / 300 : -boardHeight / 250; // Adjust jump height based on device type
            velocityY = jumpHeight;
        }
    }
}

function isSmartphone() {
    return /Mobi|Android/i.test(navigator.userAgent);
}

function placePipes() {
    if (gameOver || isPaused) return; // Only place pipes if not paused or game over

    let randomPipeY = pipeY - pipeHeight / 4 - Math.random() * (pipeHeight / 2);

    let topPipe = {
        img: topPipeImage,
        x: pipeX,
        y: randomPipeY,
        width: pipeWidth,
        height: pipeHeight
    };

    let bottomPipe = {
        img: bottomPipeImage,
        x: pipeX,
        y: randomPipeY + pipeHeight + openingSpace,
        width: pipeWidth,
        height: pipeHeight
    };

    pipeArray.push({
        topPipe: topPipe,
        bottomPipe: bottomPipe,
        passed: false
    });
}

function detectCollision(a, b) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function startGame() {
    if (gameOver) {
        resetGame(); // Reset only if game is over
    }
    gameOver = false;
    isPaused = false; // Unpause the game if it's paused
    document.querySelector('#playButton').disabled = true;
    document.querySelector('#pauseButton').disabled = false;
    document.querySelector('#restartButton').disabled = false;
    playBackgroundVideo();
}

function pauseGame() {
    isPaused = true; // Set the paused flag
    document.querySelector('#playButton').disabled = false;
    document.querySelector('#pauseButton').disabled = true;
    muteBackgroundVideo(); // Pause background video when game is paused
}

function restartGame() {
    resetGame(); // Reset the game
    startGame();
}

function resetGame() {
    bird.y = birdY;
    velocityY = 0;
    pipeArray = [];
    score = 0;
    gameOver = false; // Ensure the game is not over after reset
    isPaused = false; // Ensure the game is unpaused after reset
    playBackgroundVideo();
}
function displayScore() {
    // Highlight the high score with a stroke or background
    context.font = "bold 20px sans-serif"; // Font style for both scores
    
    // Add stroke around high score to highlight it
    context.strokeStyle = "red"; // Outline color for high score
    context.lineWidth = 3; // Stroke thickness
    context.strokeText(`High Score: ${highScore}`, 20, 80);

    // Set fill color for high score text
    context.fillStyle = "white"; 
    context.fillText(`High Score: ${highScore}`, 20, 80);

    // Set color for the current score to yellow
    context.fillStyle = "yellow"; 
    context.fillText(`Score: ${score}`, 20, 40);
}

function displayGameOver() {
    context.font = "40px sans-serif";
    const gameOverText = "GAME OVER!";
    const restart = "Press any key to start.";
    context.fillStyle = "red";
    context.strokeStyle = "white";
    context.lineWidth = 5;
    context.font = "40px sans-serif";
    const textSize = context.measureText(gameOverText);
    const x = (boardWidth - textSize.width) / 2; // Center position for the x-coordinate
    const y = boardHeight / 3; // Center position for the y-coordinate

    context.strokeText(gameOverText, x, y);
    context.fillText(gameOverText, x, y);

    
}
function muteBackgroundVideo() {
    video.pause();
}

function playBackgroundVideo() {
    video.play();
}


function detectCollision(a, b) {
    return a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y;
}
