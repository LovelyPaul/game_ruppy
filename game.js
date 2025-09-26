class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.score = 0;
        this.gameStartTime = 0;
        this.survivalTime = 0;

        this.luffy = new Luffy(this.canvas.width / 2, this.canvas.height - 80);
        this.fires = [];
        this.lastSpawnTime = 0;
        this.spawnInterval = 1500;

        this.keys = {
            left: false,
            right: false
        };

        this.levels = [
            { name: "불 피하기 초보자", minScore: 0 },
            { name: "불 회피 숙련자", minScore: 100 },
            { name: "불 회피 전문가", minScore: 300 },
            { name: "불 회피 마스터", minScore: 500 },
            { name: "불의 전설", minScore: 1000 }
        ];

        this.setupControls();
        this.gameLoop = this.gameLoop.bind(this);
    }

    setupControls() {
        document.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = true;
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = true;
                    e.preventDefault();
                    break;
            }
        });

        document.addEventListener('keyup', (e) => {
            switch(e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.keys.left = false;
                    e.preventDefault();
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.keys.right = false;
                    e.preventDefault();
                    break;
            }
        });

        const leftBtn = document.getElementById('leftBtn');
        const rightBtn = document.getElementById('rightBtn');

        leftBtn.addEventListener('touchstart', (e) => {
            this.keys.left = true;
            e.preventDefault();
        });

        leftBtn.addEventListener('touchend', (e) => {
            this.keys.left = false;
            e.preventDefault();
        });

        rightBtn.addEventListener('touchstart', (e) => {
            this.keys.right = true;
            e.preventDefault();
        });

        rightBtn.addEventListener('touchend', (e) => {
            this.keys.right = false;
            e.preventDefault();
        });

        leftBtn.addEventListener('mousedown', () => {
            this.keys.left = true;
        });

        leftBtn.addEventListener('mouseup', () => {
            this.keys.left = false;
        });

        rightBtn.addEventListener('mousedown', () => {
            this.keys.right = true;
        });

        rightBtn.addEventListener('mouseup', () => {
            this.keys.right = false;
        });
    }

    start() {
        this.isRunning = true;
        this.gameStartTime = Date.now();
        this.score = 0;
        this.survivalTime = 0;
        this.fires = [];
        this.luffy.reset();
        this.lastSpawnTime = 0;

        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';

        requestAnimationFrame(this.gameLoop);
    }

    gameLoop(currentTime) {
        if (!this.isRunning) return;

        const elapsed = (Date.now() - this.gameStartTime) / 1000;
        this.survivalTime = Math.floor(elapsed);
        this.score = Math.floor(elapsed * 10);

        this.update(currentTime);
        this.render();
        this.updateUI();

        requestAnimationFrame(this.gameLoop);
    }

    update(currentTime) {
        this.luffy.update(this.keys, this.canvas.width);

        if (currentTime - this.lastSpawnTime > this.spawnInterval) {
            this.spawnFire();
            this.lastSpawnTime = currentTime;

            this.spawnInterval = Math.max(300, 1500 - (this.survivalTime * 20));
        }

        for (let i = this.fires.length - 1; i >= 0; i--) {
            const fire = this.fires[i];
            fire.update();

            if (fire.y > this.canvas.height) {
                this.fires.splice(i, 1);
                continue;
            }

            if (this.checkCollision(this.luffy, fire)) {
                this.gameOver();
                return;
            }
        }
    }

    spawnFire() {
        const x = Math.random() * (this.canvas.width - 40);
        const speed = 2 + (this.survivalTime * 0.1);
        this.fires.push(new Fire(x, -40, speed));
    }

    checkCollision(luffy, fire) {
        const dx = luffy.x - fire.x;
        const dy = luffy.y - fire.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (luffy.radius + fire.radius - 10);
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.luffy.render(this.ctx);

        this.fires.forEach(fire => {
            fire.render(this.ctx);
        });
    }

    updateUI() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('survivalTime').textContent = this.survivalTime;
    }

    gameOver() {
        this.isRunning = false;

        const currentLevel = this.getCurrentLevel();
        const nextLevel = this.getNextLevel();

        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalSurvivalTime').textContent = this.survivalTime;
        document.getElementById('levelInfo').innerHTML =
            `현재 레벨: ${currentLevel.name}${nextLevel ? `<br>다음 레벨: ${nextLevel.name} (${nextLevel.minScore}점 달성 시)` : '<br>최고 레벨 달성!'}`;

        document.getElementById('gameOverScreen').style.display = 'flex';
    }

    getCurrentLevel() {
        for (let i = this.levels.length - 1; i >= 0; i--) {
            if (this.score >= this.levels[i].minScore) {
                return this.levels[i];
            }
        }
        return this.levels[0];
    }

    getNextLevel() {
        const currentLevel = this.getCurrentLevel();
        const currentIndex = this.levels.findIndex(level => level.name === currentLevel.name);
        return this.levels[currentIndex + 1] || null;
    }
}

class Luffy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 25;
        this.speed = 5;
        this.initialX = x;
        this.initialY = y;
        this.image = new Image();
        this.image.src = './public/luffy.png';
        this.imageLoaded = false;

        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    update(keys, canvasWidth) {
        if (keys.left && this.x - this.radius > 0) {
            this.x -= this.speed;
        }
        if (keys.right && this.x + this.radius < canvasWidth) {
            this.x += this.speed;
        }
    }

    render(ctx) {
        ctx.save();

        if (this.imageLoaded) {
            const size = this.radius * 2;
            ctx.drawImage(this.image, this.x - size/2, this.y - size/2, size, size);
        } else {
            ctx.fillStyle = '#8B4513';
            ctx.beginPath();
            ctx.arc(this.x, this.y - 10, this.radius - 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFE4C4';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#000';
            ctx.fillRect(this.x - 8, this.y - 8, 3, 6);
            ctx.fillRect(this.x + 5, this.y - 8, 3, 6);

            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y + 5, 8, 0, Math.PI);
            ctx.stroke();

            ctx.fillStyle = '#FF0000';
            ctx.fillRect(this.x - 20, this.y + 20, 40, 15);
        }

        ctx.restore();
    }

    reset() {
        this.x = this.initialX;
        this.y = this.initialY;
    }
}

class Fire {
    constructor(x, y, speed = 2) {
        this.x = x;
        this.y = y;
        this.radius = 20;
        this.speed = speed;
        this.image = new Image();
        this.image.src = './public/akainu.png';
        this.imageLoaded = false;

        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    update() {
        this.y += this.speed;
    }

    render(ctx) {
        ctx.save();

        if (this.imageLoaded) {
            const size = this.radius * 2;
            ctx.drawImage(this.image, this.x - size/2, this.y - size/2, size, size);
        } else {
            ctx.fillStyle = '#FF4500';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FF6347';
            ctx.beginPath();
            ctx.arc(this.x - 5, this.y - 5, this.radius - 8, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x + 3, this.y - 3, this.radius - 12, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}

let game = new Game();

function startGame() {
    game.start();
}

function restartGame() {
    game = new Game();
    game.start();
}