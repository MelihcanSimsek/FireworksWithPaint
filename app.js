const fireworkCanvas = document.getElementById("fireworks");
const fireworkCanvasContext = fireworkCanvas.getContext("2d");
const paintCanvas = document.getElementById("paint");
const paintContext = paintCanvas.getContext("2d");

let isDrawing = false;
let hasImage = false;
let fireworks = [];
let paintCanvasHeight = 400;

fireworkCanvas.width = window.innerWidth;
fireworkCanvas.height = window.innerHeight-paintCanvasHeight/4;

paintCanvas.width = window.innerWidth;
paintCanvas.height = paintCanvasHeight;


class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        const angle = Math.random() * Math.PI * 2;
        const speed = (Math.random() - 0.5) * 12;
        this.velocity = {
            x: Math.cos(angle) * speed,
            y: Math.sin(angle) * speed
        };
        this.alpha = 1;
        this.friction = 0.99;
    }

    draw() {
        fireworkCanvasContext.globalAlpha = this.alpha;
        fireworkCanvasContext.beginPath();
        fireworkCanvasContext.arc(this.x, this.y, 2.3, 0, Math.PI * 2, false);
        fireworkCanvasContext.fillStyle = this.color;
        fireworkCanvasContext.fill();
    }

    update() {
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.alpha -= 0.01;
    }
}

class Firework {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.velocity = { x: 0, y: Math.random() * -6 - 2 };
        this.particles = [];
        this.lifespan = 90;
        this.hasExploded = false;
    }

    draw() {
        fireworkCanvasContext.beginPath();
        fireworkCanvasContext.arc(this.x, this.y, 4, 0, Math.PI * 2, false);
        fireworkCanvasContext.fillStyle = this.color;
        fireworkCanvasContext.fill();
    }

    explode() {
        if (!this.hasExploded) {
            if (!hasImage) {
                for (let i = 0; i < 350; i++) {
                    this.particles.push(new Particle(this.x, this.y, this.color));
                }
            } else {
                const imageData = getDrawnImage();
                const pixels = imageData.data;

                let minX = paintCanvas.width, maxX = 0, minY = paintCanvas.height, maxY = 0;

                for (let y = 0; y < paintCanvas.height; y++) {
                    for (let x = 0; x < paintCanvas.width; x++) {
                        const index = (y * paintCanvas.width + x) * 4;
                        const alpha = pixels[index + 3]; 

                        if (alpha > 0) {
                            if (x < minX) minX = x;
                            if (x > maxX) maxX = x;
                            if (y < minY) minY = y;
                            if (y > maxY) maxY = y;
                        }
                    }
                }

                const offsetX = this.x - (maxX - minX) / 2;
                const offsetY = this.y - (maxY - minY) / 2;
                for (let y = minY; y < maxY; y += 2) {
                    for (let x = minX; x < maxX; x += 2) {
                        const index = (y * paintCanvas.width + x) * 4;
                        const alpha = pixels[index + 3];

                        if (alpha > 0) {
                            const adjustedX = offsetX + (x - minX);
                            const adjustedY = offsetY + (y - minY);
                            this.particles.push(new Particle(adjustedX, adjustedY, this.color));
                        }
                    }
                }
            }
            this.hasExploded = true;
        }
    }

    update() {
        this.lifespan--;
        if (this.lifespan <= 0 && !this.hasExploded) {
            this.explode();
            this.velocity = { x: 0, y: 0 };
            this.hasExploded = true;
        } else if (this.lifespan > 0) {
            this.y += this.velocity.y;
        }
        this.particles.forEach(particle => {
            particle.update();
            particle.draw();
        });
    }
}


function animate() {
    requestAnimationFrame(animate);
    fireworkCanvasContext.clearRect(0, 0, fireworkCanvas.width, fireworkCanvas.height);

    fireworks.forEach((firework, index) => {
        firework.update();
        firework.draw();
        if (firework.lifespan <= 0 && firework.particles.every(p => p.alpha <= 0)) {
            fireworks.splice(index, 1);
        }
    });

    if (Math.random() < 0.015) {
        const x = Math.random() * fireworkCanvas.width;
        const color = `hsl(${Math.random() * 360}, 50%, 50%)`;
        fireworks.push(new Firework(x, fireworkCanvas.height, color));
    }
}

function drawPaintCanvas(event)
{
    if (!isDrawing) return;
    paintContext.lineWidth = 5;
    paintContext.lineCap = "round";
    paintContext.strokeStyle = "gray";
    paintContext.lineTo(event.offsetX, event.offsetY);
    paintContext.stroke();
    paintContext.beginPath();
    paintContext.moveTo(event.offsetX, event.offsetY);
}

function getDrawnImage() {
    return paintContext.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
}


function clearPaintCanvas() {
    hasImage= false;
    paintContext.clearRect(0, 0, paintCanvas.width, paintCanvas.height);
}


paintCanvas.addEventListener("mousedown", (event) => {
    isDrawing = true;
    paintContext.beginPath();
    drawPaintCanvas(event);
});

paintCanvas.addEventListener("mouseup", () => {
    isDrawing = false;
    paintContext.beginPath(); 
});

paintCanvas.addEventListener("mousemove", (event) => {
    if (isDrawing) {
        drawPaintCanvas(event);
    }
});

document.getElementById("saveButton").addEventListener("click", () => {
    const imageData = paintContext.getImageData(0, 0, paintCanvas.width, paintCanvas.height);
    let hasDrawnPixels = false;

    for (let i = 3; i < imageData.data.length; i += 4) {
        if (imageData.data[i] > 0) {
            hasDrawnPixels = true;
            break;
        }
    }

    if (hasDrawnPixels) {
        hasImage = true; 
    } else {
        hasImage = false; 
    }
});

document.getElementById("clearButton").addEventListener("click", () => {
    clearPaintCanvas();
});

clearPaintCanvas();
animate();
