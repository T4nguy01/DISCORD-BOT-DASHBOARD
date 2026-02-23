const { createCanvas } = require('canvas');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');
const os = require('os');

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Génère une image statique d'un frame spécifique de la roue
 */
function drawFrame(ctx, size, participants, rotationAngle) {
    const center = size / 2;
    const radius = size * 0.4;

    // Fond
    ctx.fillStyle = '#2c2f33';
    ctx.fillRect(0, 0, size, size);

    const segmentAngle = (Math.PI * 2) / participants.length;

    // Dessiner les segments
    for (let i = 0; i < participants.length; i++) {
        const angle = rotationAngle + i * segmentAngle;

        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.arc(center, center, radius, angle, angle + segmentAngle);
        ctx.closePath();

        const hue = (i * 360) / participants.length;
        ctx.fillStyle = `hsl(${hue}, 70%, 50%)`;
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(angle + segmentAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 16px Arial';

        const text = participants[i];
        const truncatedText = text.length > 15 ? text.substring(0, 12) + '...' : text;
        ctx.fillText(truncatedText, radius - 10, 5);
        ctx.restore();
    }

    // Cercle central
    ctx.beginPath();
    ctx.arc(center, center, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.stroke();

    // Flèche (fixe, en haut)
    ctx.fillStyle = '#ff0000';
    ctx.beginPath();
    ctx.moveTo(center - 15, center - radius - 20);
    ctx.lineTo(center + 15, center - radius - 20);
    ctx.lineTo(center, center - radius + 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
}

/**
 * Génère une image de roue de la fortune statique (pour compatibilité)
 */
function generateWheel(participants, winnerIndex) {
    const size = 500;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');

    const segmentAngle = (Math.PI * 2) / participants.length;
    const finalRotation = -Math.PI / 2 - (winnerIndex * segmentAngle) - (segmentAngle / 2);

    drawFrame(ctx, size, participants, finalRotation);
    return canvas.toBuffer('image/png');
}

/**
 * Génère un GIF animé de la roue qui tourne
 */
async function generateAnimatedWheel(participants, winnerIndex) {
    const size = 500;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const tempDir = path.join(os.tmpdir(), `wheel_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    const numFrames = 30;
    const segmentAngle = (Math.PI * 2) / participants.length;

    // On veut faire au moins 2 tours complets avant de s'arrêter
    const totalRotation = Math.PI * 4 + (Math.PI * 2 - (winnerIndex * segmentAngle) - (segmentAngle / 2)) - Math.PI / 2;
    const startRotation = -Math.PI / 2;

    // Easing function (decelerate)
    const outQuad = (t) => t * (2 - t);

    const framePaths = [];
    for (let i = 0; i < numFrames; i++) {
        const t = i / (numFrames - 1);
        const currentRotation = startRotation + totalRotation * outQuad(t);

        drawFrame(ctx, size, participants, currentRotation);

        const framePath = path.join(tempDir, `frame_${i.toString().padStart(3, '0')}.png`);
        fs.writeFileSync(framePath, canvas.toBuffer('image/png'));
        framePaths.push(framePath);
    }

    const gifPath = path.join(tempDir, 'wheel.gif');

    await new Promise((resolve, reject) => {
        ffmpeg()
            .input(path.join(tempDir, 'frame_%03d.png'))
            .inputFPS(10)
            .output(gifPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });

    const gifBuffer = fs.readFileSync(gifPath);

    // Cleanup
    framePaths.forEach(p => fs.unlinkSync(p));
    fs.unlinkSync(gifPath);
    fs.rmdirSync(tempDir);

    return gifBuffer;
}

module.exports = { generateWheel, generateAnimatedWheel };
