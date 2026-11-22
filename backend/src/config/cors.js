const cors = require("cors");

// Configurar as origens e os cabeçalhos permitidos para o frontend
function criarCors() {
    const valor = process.env.CORS_ORIGIN || "http://localhost:5173";
    let url;
    try { url = new URL(valor); } catch { throw new Error("Configure CORS_ORIGIN com a origem do frontend Vite."); }
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
        throw new Error("CORS_ORIGIN deve conter somente protocolo, host e porta.");
    }
    const permitida = url.origin;
    return cors({
        // Autorizar a origem configurada para as requisições do frontend
        origin(origem, callback) { callback(null, !origem || origem === permitida ? permitida : false); },
        methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["Content-Disposition"],
        optionsSuccessStatus: 204,
    });
}

module.exports = criarCors;
