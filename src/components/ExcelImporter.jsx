import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function ExcelImporter() {
  const [status, setStatus] = useState('');

  const importExcel = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    setStatus('Importando...');

    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(worksheet, { header: 0 });

        for (const item of data) {
          await addDoc(collection(db, 'produtos'), item);
        }

        setStatus('Importação concluída com sucesso!');
      } catch (error) {
        console.error('Erro na importação:', error);
        setStatus('Erro ao importar a planilha.');
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="mb-6 bg-white p-4 rounded shadow">
      <label className="block mb-2 font-medium">Importar Planilha Excel (.xlsx)</label>
      <input
        type="file"
        accept=".xlsx"
        onChange={importExcel}
        className="border p-2 w-full"
      />
      {status && <p className="mt-2 text-sm text-gray-700">{status}</p>}
    </div>
  );
}
