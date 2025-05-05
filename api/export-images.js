// /api/export-images.js
export default async function handler(req, res) {
     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Método não permitido' });
     }
   
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
    

    fs.unlinkSync(filePath); // remove temp       res.status(200).json({ success: true, message: 'Imagens exportadas' });
     } catch (err) {
       console.error('Erro:', err);
       res.status(500).json({ success: false, message: 'Erro interno do servidor' });
     }
   }
   