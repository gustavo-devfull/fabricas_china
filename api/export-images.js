import formidable from 'formidable';
import fs from 'fs';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { loadWorkbook } from '../../utils/excel-image-reader.js';

const s3 = new S3Client({
  region: "nyc3",
  endpoint: "https://nyc3.digitaloceanspaces.com",
  credentials: {
    accessKeyId: "DO00U3TGARCUQ4BBXLUF",
    secretAccessKey: "2UOswaN5G4JUnfv8wk/QTlO3KQU+5qywlnmoG8ho6kM",
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  const form = new formidable.IncomingForm({ keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Erro no parser:', err);
      return res.status(500).json({ success: false, message: 'Erro no upload' });
    }

    try {
      const filePath = files.file.filepath;
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

      fs.unlinkSync(filePath); // Remove temp
      res.status(200).json({ success: true, message: 'Imagens exportadas', count });
    } catch (err) {
      console.error('Erro geral:', err);
      res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
  });
}

export const config = {
  api: {
    bodyParser: false,
  },
};
