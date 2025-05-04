import React, { useState } from "react";

export default function ExportaImagens() {
  const [arquivo, setArquivo] = useState(null);
  const [progresso, setProgresso] = useState(0);
  const [mensagem, setMensagem] = useState("");
  const [log, setLog] = useState([]);

  const handleArquivo = (e) => {
    setArquivo(e.target.files[0]);
    setMensagem("");
    setLog([]);
    setProgresso(0);
  };

  const handleExportar = async () => {
    if (!arquivo) {
      alert("Selecione um arquivo .xlsx primeiro.");
      return;
    }

    const formData = new FormData();
    formData.append("planilha", arquivo);

    const response = await fetch("http://localhost:3001/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      setMensagem("Erro ao processar a planilha.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let done = false;

    let chunks = "";

    while (!done) {
      const { value, done: isDone } = await reader.read();
      done = isDone;
      const texto = decoder.decode(value || new Uint8Array(), { stream: !done });
      chunks += texto;

      // Atualiza a barra de progresso com base em mensagens no log
      try {
        const json = JSON.parse(chunks);
        setLog(json.logs || []);
        setMensagem("Upload completo!");
        setProgresso(100);
      } catch (err) {
        const matches = texto.match(/Progresso: (\d+)%/);
        if (matches) setProgresso(Number(matches[1]));
      }
    }
  };

  return (
    <div className="p-6 border rounded bg-white shadow max-w-xl mx-auto mt-6">
      <h2 className="text-xl font-bold mb-4">Exportar imagens e subir para Spaces</h2>

      <input type="file" accept=".xlsx" onChange={handleArquivo} className="mb-4" />

      <button
        onClick={handleExportar}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        Exportar Imagens
      </button>

      {progresso > 0 && (
        <div className="mt-4">
          <p className="text-sm">Progresso: {progresso}%</p>
          <div className="w-full bg-gray-200 h-2 rounded">
            <div
              className="h-2 bg-blue-500 rounded"
              style={{ width: `${progresso}%` }}
            ></div>
          </div>
        </div>
      )}

      {mensagem && <p className="mt-4 text-green-600 font-semibold">{mensagem}</p>}

      {log.length > 0 && (
        <div className="mt-4 text-sm bg-gray-50 border rounded p-2 max-h-64 overflow-y-auto">
          <p className="font-semibold mb-2">Log:</p>
          <ul className="list-disc ml-5 space-y-1">
            {log.map((linha, i) => (
              <li key={i}>{linha}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
