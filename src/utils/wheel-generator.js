const { createCanvas } = require('canvas');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');
const os = require('os');

ffmpeg.setFfmpegPath(ffmpegPath);

/**
 * Dessine un segment avec un dégradé radial pour un effet 3D
 */
function drawSegment(ctx, center, radius, startAngle, endAngle, hue) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, startAngle, endAngle);
    ctx.closePath();

    // Dégradé radial pour l'effet "bubble/glossy"
    const gradient = ctx.createRadialGradient(center, center, radius * 0.2, center, center, radius);
    gradient.addColorStop(0, `hsl(${hue}, 90%, 70%)`);
    gradient.addColorStop(0.5, `hsl(${hue}, 80%, 50%)`);
    gradient.addColorStop(1, `hsl(${hue}, 70%, 30%)`);

    ctx.fillStyle = gradient;
    ctx.fill();

    // Bordure fine
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();
}

/**
 * Génère une image statique d'un frame spécifique de la roue avec un look Premium
 */
function drawFrame(ctx, size, participants, rotationAngle) {
    const center = size / 2;
    const radius = size * 0.42;

    // Fond avec un léger dégradé sombre
    const bgGrad = ctx.createRadialGradient(center, center, 0, center, center, size);
    bgGrad.addColorStop(0, '#2f3136');
    bgGrad.addColorStop(1, '#1e1f22');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    const segmentAngle = (Math.PI * 2) / participants.length;

    // 1. Cercle extérieur (ombre portée/glow)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, radius + 5, 0, Math.PI * 2);
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.restore();

    // 2. Dessiner les segments
    for (let i = 0; i < participants.length; i++) {
        const angle = rotationAngle + i * segmentAngle;
        const hue = (i * 360) / participants.length;
        drawSegment(ctx, center, radius, angle, angle + segmentAngle, hue);

        // Texte
        ctx.save();
        ctx.translate(center, center);
        ctx.rotate(angle + segmentAngle / 2);
        ctx.textAlign = 'right';
        ctx.fillStyle = '#ffffff';
        ctx.shadowBlur = 4;
        ctx.shadowColor = 'black';
        ctx.font = 'bold 20px "Segoe UI", Arial';

        const text = participants[i];
        const truncatedText = text.length > 14 ? text.substring(0, 11) + '...' : text;
        ctx.fillText(truncatedText, radius - 20, 7);
        ctx.restore();
    }

    // 3. Pin central (Bouton Premium)
    ctx.save();
    ctx.beginPath();
    ctx.arc(center, center, 25, 0, Math.PI * 2);
    const pinGrad = ctx.createLinearGradient(center - 20, center - 20, center + 20, center + 20);
    pinGrad.addColorStop(0, '#ffffff');
    pinGrad.addColorStop(1, '#bdc3c7');
    ctx.fillStyle = pinGrad;
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.fill();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    // 4. Flèche (fixe, look moderne)
    ctx.save();
    ctx.translate(center, center - radius);
    ctx.shadowBlur = 8;
    ctx.shadowColor = 'black';
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.moveTo(-18, -30);
    ctx.lineTo(18, -30);
    ctx.lineTo(0, 10);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
}

/**
 * Génère une vidéo (MP4) ou un GIF animé de la roue qui tourne
 */
async function generateAnimatedWheel(participants, winnerIndex, format = 'gif') {
    const size = 600;
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const tempDir = path.join(os.tmpdir(), `wheel_${Date.now()}`);
    fs.mkdirSync(tempDir, { recursive: true });

    // Plus de frames pour la vidéo (smooth)
    const numFrames = format === 'mp4' ? 60 : 35;
    const fps = format === 'mp4' ? 30 : 12;
    const segmentAngle = (Math.PI * 2) / participants.length;

    // Animation plus longue et fluide
    const totalRotation = Math.PI * 6 + (Math.PI * 2 - (winnerIndex * segmentAngle) - (segmentAngle / 2)) - Math.PI / 2;
    const startRotation = -Math.PI / 2;

    const outQuad = (t) => t * (2 - t);
    const outExpo = (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t);

    const framePaths = [];
    for (let i = 0; i < numFrames; i++) {
        const t = i / (numFrames - 1);
        const currentRotation = startRotation + totalRotation * outExpo(t);

        drawFrame(ctx, size, participants, currentRotation);

        const framePath = path.join(tempDir, `frame_${i.toString().padStart(3, '0')}.png`);
        fs.writeFileSync(framePath, canvas.toBuffer('image/png'));
        framePaths.push(framePath);
    }

    const outputPath = path.join(tempDir, `wheel.${format}`);

    await new Promise((resolve, reject) => {
        let command = ffmpeg().input(path.join(tempDir, 'frame_%03d.png')).inputFPS(fps);

        if (format === 'mp4') {
            command = command.outputOptions(['-c:v libx264', '-pix_fmt yuv420p', '-vf scale=600:600']);
        }

        command.output(outputPath)
            .on('end', resolve)
            .on('error', reject)
            .run();
    });

    const buffer = fs.readFileSync(outputPath);

    // Cleanup
    framePaths.forEach(p => fs.unlinkSync(p));
    fs.unlinkSync(outputPath);
    fs.rmdirSync(tempDir);

    return buffer;
}

module.exports = { generateAnimatedWheel };
