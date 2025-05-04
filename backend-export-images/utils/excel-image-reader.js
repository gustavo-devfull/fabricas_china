import ExcelJS from "exceljs";
import { Buffer } from "buffer";

export async function loadWorkbook(filePath) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  const imagens = [];

  for (const image of worksheet.getImages()) {
    const { range, imageId } = image;

    const row = range.tl.nativeRow + 1;
    const cellValue = worksheet.getCell(`A${row}`).value || `imagem_${row}`;
    const nomeArquivo = `${cellValue}.jpg`;

    const imgData = workbook.media.find(m => m.index === imageId);
    if (!imgData || !imgData.buffer) continue;

    imagens.push({
      nomeArquivo,
      buffer: imgData.buffer,
    });
  }

  return imagens;
}
