// backend/server.js
import express from "express";
import multer from "multer";
import cors from "cors";
import fs from "fs";
import path from "path";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { loadWorkbook } from "./utils/excel-image-reader.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
app.use(cors());

const upload = multer({ dest: "uploads/" });

const s3 = new S3Client({
  region: "nyc3",
  endpoint: "https://nyc3.digitaloceanspaces.com",
  credentials: {
    accessKeyId: "DO00U3TGARCUQ4BBXLUF",
    secretAccessKey: "2UOswaN5G4JUnfv8wk/QTlO3KQU+5qywlnmoG8ho6kM",
  },
});

app.post("/api/export-images", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const imagens = await loadWorkbook(filePath); // nome e buffer

    let count = 0;
    
for (const img of imagens) {
  const command = new PutObjectCommand({
    Bucket: "moribr",
    Key: `base-fotos/${img.nomeArquivo}`,
    Body: img.buffer,
    ACL: "public-read",
    ContentType: "image/jpeg",
  });

  await s3.send(command);
  console.log(`✔️ Enviado: ${img.nomeArquivo}`);
  count++;
}
    

    fs.unlinkSync(filePath); // remove temp
    res.json({ success: true, count });
  } catch (err) {
    console.error("Erro geral:", err);
    res.status(500).json({ success: false, message: err.message });
  }
});

app.listen(3001, () => {
  console.log("🚀 Servidor rodando em http://localhost:3001");
});
