// server.js (modo ES module)

import express from "express";
import cors from "cors";
import multer from "multer";
import JSZip from "jszip";
import { read, utils } from "xlsx";
import { config } from "dotenv";
import fetch from "node-fetch";
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import XLSX from "xlsx";

// carrega variáveis de ambiente
config();
import multer from "multer";

const upload = multer({ dest: "uploads/" });
const app = express();
app.use(cors());

// DigitalOcean Spaces
const s3 = new S3Client({
  region: "nyc3",
  endpoint: "https://moribr.nyc3.digitaloceanspaces.com",
  credentials: {
    accessKeyId: "DO00U3TGARCUQ4BBXLUF",
    secretAccessKey: "2UOswaN5G4JUnfv8wk/QTlO3KQU+5qywlnmoG8ho6kM",
  },
});

// Endpoint
app.post("/api/export-images", upload.single("file"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const workbook = XLSX.readFile(req.file.path); // ✅ Correto!
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    const zip = new JSZip();
    let count = 0;

    for (const row of rows) {
      const ref = row["REF"];
      const imageUrl = row["ImageURL"];

      if (!ref || !imageUrl) continue;

      try {
        const response = await fetch(imageUrl);
        const buffer = await response.arrayBuffer();
        const ext = imageUrl.split(".").pop().split("?")[0];
        zip.file(`${ref}.${ext}`, Buffer.from(buffer));
        console.log(`✔️ Baixado: ${ref}`);
      } catch (err) {
        console.error(`Erro ao baixar imagem de ${ref}:`, err);
      }

      count++;
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipName = `imagens_${Date.now()}.zip`;

    // Upload para DigitalOcean Spaces
    await s3.send(
      new PutObjectCommand({
        Bucket: "moribr",
        Key: `zips/${zipName}`,
        Body: zipBuffer,
        ACL: "public-read",
        ContentType: "application/zip",
      })
    );

    fs.unlinkSync(filePath); // remove arquivo temporário
    res.json({
      success: true,
      zipUrl: `https://moribr.nyc3.cdn.digitaloceanspaces.com/zips/${zipName}`,
    });
  } catch (err) {
    console.error("Erro geral:", err);
    res.status(500).json({ success: false, message: "Erro ao exportar imagens" });
  }
});

app.listen(3001, () => {
  console.log("🚀 API rodando em http://localhost:3001");
});
