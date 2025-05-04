import express from "express";
import multer from "multer";
import fs from "fs";
import XLSX from "xlsx";
import JSZip from "jszip";
import fetch from "node-fetch";
import cors from "cors";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const app = express();
const upload = multer({ dest: "uploads/" });
const PORT = 3001;

app.use(cors());
app.use(express.json());

// DigitalOcean Spaces config
const s3 = new S3Client({
  region: "nyc3",
  endpoint: "https://nyc3.digitaloceanspaces.com",
  credentials: {
    accessKeyId: "DO00U3TGARCUQ4BBXLUF",
    secretAccessKey: "2UOswaN5G4JUnfv8wk/QTlO3KQU+5qywlnmoG8ho6kM",
  },
});

// ✅ ROTA PRINCIPAL
app.post("/api/export-images", upload.single("file"), async (req, res) => {
  try {
    if (!req.file || !req.file.path) throw new Error("Arquivo não recebido");

    const filePath = req.file.path;
    const workbook = XLSX.readFile(filePath);
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
        count++;
      } catch (err) {
        console.error(`❌ Erro ao baixar imagem de ${ref}:`, err);
      }
    }

    const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });
    const zipName = `imagens_${Date.now()}.zip`;

    await s3.send(
      new PutObjectCommand({
        Bucket: "moribr",
        Key: `zips/${zipName}`,
        Body: zipBuffer,
        ACL: "public-read",
        ContentType: "application/zip",
      })
    );

    fs.unlinkSync(filePath); // remove o arquivo temporário

    res.json({
      success: true,
      message: `${count} imagens exportadas`,
      zipUrl: `https://moribr.nyc3.cdn.digitaloceanspaces.com/zips/${zipName}`,
    });
  } catch (err) {
    console.error("Erro geral:", err);
    res.status(500).json({ success: false, message: "Erro ao exportar imagens" });
  }
});

// 🚀 Inicia o servidor
app.listen(PORT, () => {
  console.log(`✅ Servidor rodando em http://localhost:${PORT}`);
});
