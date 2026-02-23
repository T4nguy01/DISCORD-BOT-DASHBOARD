const axios = require('axios');
const FormData = require('form-data');
const logger = console;

const FILE_UPLOAD_TIMEOUT = parseInt(process.env.FILE_UPLOAD_TIMEOUT || "25") * 1000;
const UPLOAD_USER_AGENT = process.env.UPLOAD_USER_AGENT || "WPLACE-FC-BOT/1.0 (+https://github.com/T4nguy01/BOT)";

async function uploadBytes(buffer, filename) {
    try {
        const form = new FormData();
        form.append('file', buffer, { filename, contentType: 'image/png' });

        if (process.env.X0_SECRET_MODE === "1") {
            form.append('secret', '');
        }
        if (process.env.X0_EXPIRES) {
            form.append('expires', process.env.X0_EXPIRES);
        }

        const response = await axios.post('https://0x0.st', form, {
            headers: {
                ...form.getHeaders(),
                'User-Agent': UPLOAD_USER_AGENT
            },
            timeout: FILE_UPLOAD_TIMEOUT
        });

        if (response.status === 200) {
            const url = response.data.trim();
            if (url.startsWith('http')) return url;
        }
    } catch (e) {
        logger.error("Echec upload 0x0.st:", e.message);
    }
    return null;
}

module.exports = { uploadBytes };
