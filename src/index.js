import http from "node:http";
import { createAiAssistant } from "./aiAssistant.js";
import { loadConfig } from "./config.js";
import { createExportReport } from "./exportReport.js";
import { createRedTagRepository } from "./googleSheetsRepository.js";
import { logger } from "./logger.js";
import { normalizeMessage } from "./normalizeMessage.js";
import { processMessage } from "./processMessage.js";
import { startWhatsAppClient } from "./whatsAppClient.js";

// Titik awal aplikasi
async function main() {
    const config = loadConfig();

    // Web server dummy untuk health check platform cloud (seperti Render / Koyeb)
    const port = process.env.PORT || 3000;
    http.createServer((req, res) => {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("WhatsApp Bot is running!");
    }).listen(port, () => {
        logger.info(`Web server aktif di port ${port}`);
    });

    const redTagRepository = createRedTagRepository(config);
    const aiAssistant = config.geminiApiKey ? createAiAssistant({ apiKey: config.geminiApiKey, model: config.geminiModel, redTagRepository }) : null;
    const exportReport = createExportReport({
        redTagRepository,
        clientId: config.microsoftClientId,
        site: config.sharePointSite,
        folderUrls: config.sharePointLinks
    });

    if (config.allowedGroupIds.length === 0) {
        logger.warn("ALLOWED_GROUP_IDS masih kosong, semua pesan akan diabaikan, salin groupId dari log ke .env");
    }

    await startWhatsAppClient({
        phoneNumber: config.whatsAppPhoneNumber,
        onMessage: async (rawMessage, { sendReply, sendTyping, sendDocument, botJids }) => {
            const message = normalizeMessage(rawMessage);

            if (!message) {
                return;
            }

            await processMessage(message, {
                allowedGroupIds: config.allowedGroupIds,
                redTagRepository,
                aiAssistant,
                botJids,
                sendReply,
                sendTyping,
                sendDocument,
                exportReport
            });
        }
    });
}

main().catch((error) => {
    logger.error(`Aplikasi gagal dijalankan: ${error.message}`);
    process.exit(1);
});