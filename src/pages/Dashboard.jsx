import React, { useEffect, useState } from "react";
import { db } from "../firebase";

import CardFabrica from "../components/CardFabrica";
import TabelaProdutos from "../components/TabelaProdutos";


import JSZip from "jszip";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";
import { collection, query, where, getDocs, doc, setDoc, addDoc, deleteDoc } from "firebase/firestore";

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const toggleVisible = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener("scroll", toggleVisible);
    return () => window.removeEventListener("scroll", toggleVisible);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return visible ? (
    <button
      onClick={scrollToTop}
      className="fixed bottom-6 right-6 bg-[#26668B] text-white px-4 py-2 rounded-full shadow-lg hover:bg-[#1f4f6e] transition-all duration-200 z-50"
      title="Voltar ao topo"
    >
      ↑ Topo
    </button>
  ) : null;
}

export default function Dashboard() {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [products, setProducts] = useState([]);
  const [segmentoSelecionado, setSegmentoSelecionado] = useState("todos");
  const [viagemSelecionada, setViagemSelecionada] = useState('');


  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');
  const [segment, setSegment] = useState('');
  const [observacao, setObservacao] = useState('');
  const [dataCadastro, setDataCadastro] = useState('');
  const [viagem, setViagem] = useState('');


  const [progressoExportacao, setProgressoExportacao] = useState(0);
  const [mensagemExportacao, setMensagemExportacao] = useState("");
    const handleExportImages = async (factoryId) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.xlsx';
  
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
  
      const formData = new FormData();
      formData.append('file', file);
      formData.append('factoryId', factoryId);
  
      setMensagemExportacao("Iniciando exportação...");
      setProgressoExportacao(0);
  
      try {
        const response = await fetch("/api/export-images", {
          method: "POST",
          body: formData,
        });
        
  
        if (!response.ok) throw new Error("Erro ao exportar imagens");
  
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let receivedText = "";
  
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
  
          receivedText += decoder.decode(value, { stream: true });
  
          const lines = receivedText.split("\n");
          for (const line of lines) {
            if (line.startsWith("progress:")) {
              const percent = Number(line.replace("progress:", "").trim());
              if (!isNaN(percent)) setProgressoExportacao(percent);
            }
          }
        }
  
        setMensagemExportacao("✅ Imagens exportadas e enviadas com sucesso!");
      } catch (err) {
        console.error(err);
        setMensagemExportacao("❌ Erro ao exportar imagens.");
      }
    };
  
    input.click();
  };
  
  async function importarImagensEExportarZip(event, factoryId) {
    const file = event.target.files[0];
    if (!file) return;
  
    const reader = new FileReader();
  
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  
      const zip = new JSZip();
      const erros = [];
  
      for (const row of rows) {
        const ref = row["REF"];
        const imageUrl = row["ImageURL"];
  
        if (!ref || !imageUrl) continue;
  
        try {
          // Atualiza o produto no Firestore com a nova imagem
          const q = query(collection(db, "produtos"), where("REF", "==", ref), where("factoryId", "==", factoryId));
          const querySnapshot = await getDocs(q);
          if (!querySnapshot.empty) {
            const docRef = querySnapshot.docs[0].ref;
            await setDoc(docRef, { imageUrl }, { merge: true });
          }
  
          // Faz o download da imagem
          const response = await fetch(imageUrl);
          const blob = await response.blob();
  
          // Adiciona ao ZIP
          const ext = imageUrl.split('.').pop().split(/\#|\?/)[0];
          zip.file(`${ref}.${ext}`, blob);
        } catch (err) {
          erros.push(ref);
        }
      }
  
      // Gera o ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `imagens_${factoryId}.zip`);
  
      if (erros.length) {
        alert(`Erro ao baixar imagens de: ${erros.join(", ")}`);
      } else {
        alert("Imagens importadas e ZIP baixado com sucesso.");
      }
    };
  
    reader.readAsArrayBuffer(file);
  }
  
  const handleSubmitFactory = async (e) => {
    e.preventDefault();
    if (!name || !contact || !location || !segment) {
      alert("Preencha todos os campos.");
      return;
    }

    await addDoc(collection(db, 'factories'), {
      name,
      contact,
      location,
      segment: segment.toUpperCase(),
      observacao,
      dataCadastro,
      viagem
    });



    setName('');
    setContact('');
    setLocation('');
    setSegment('');
    setShowForm(false);
    fetchFactories();
  };

  useEffect(() => {
    fetchFactories();
    fetchProducts();
  }, []);

  const fetchFactories = async () => {
    const snapshot = await getDocs(collection(db, "factories"));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setFactories(list);
  };

  const fetchProducts = async () => {
    const snapshot = await getDocs(collection(db, "produtos"));
    const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setProducts(list);
  };

  const handleDelete = async (id) => {
    await deleteDoc(doc(db, "factories", id));
    fetchFactories();
    if (selectedFactory?.id === id) setSelectedFactory(null);
  };

  const handleUpdateFactory = async (id, data) => {
    const ref = doc(db, "factories", id);
    await setDoc(ref, data, { merge: true });
    fetchFactories();
  };
  const [importando, setImportando] = useState(false);
  const [progresso, setProgresso] = useState(0);
  const [mensagemImportacao, setMensagemImportacao] = useState("");

  const handleImportForFactory = (event, factory) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();

    reader.onload = async (e) => {
      setImportando(true);
      setMensagemImportacao("");
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const linhas = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
      const dados = linhas.slice(2);

      const camposEsperados = [
        "REF", "DESCRIPTION", "NAME", "REMARK", "OBS", "NCM", "English Description",
        "CTNS", "UNIT/CTN", "QTY", "U.PRICE", "UNIT", "AMOUNT", "L", "W", "H",
        "CBM", "CBM TOTAL", "G.W", "T.G.W", "N.W", "T.N.W", "Peso Unitário(g)"
      ];
      let count = 0;
      for (const row of dados) {
        if (!row[0]) continue;

        const produtoCorrigido = {};
        let colunaIndex = 0;
        for (let i = 0; i < row.length; i++) {
          if (i === 7) continue;
          const campo = camposEsperados[colunaIndex];
          const valor = row[i];
          if (!campo) continue;
          if (typeof valor === "number") {
            produtoCorrigido[campo] = valor;
          } else if (!isNaN(valor) && valor !== "") {
            produtoCorrigido[campo] = Number(valor);
          } else {
            produtoCorrigido[campo] = String(valor ?? "").trim();
          }
          colunaIndex++;
        }
        produtoCorrigido.factoryId = factory.id;
        const ref = doc(collection(db, "produtos"));
        await setDoc(ref, produtoCorrigido, { merge: true });

        count++;
        setProgresso(Math.round((count / dados.length) * 100));
      }

      await fetchProducts();
      setImportando(false);
      setMensagemImportacao("Lista de produtos importada com sucesso!");
    };






    reader.readAsArrayBuffer(file);
  };



  const [produtoEditado, setProdutoEditado] = useState({});

  const factoriesFiltradas = segmentoSelecionado === "todos"
    ? [...factories]
    : factories.filter(f => f.segment?.toUpperCase() === segmentoSelecionado);

  // Filtro adicional por viagem, se quiser implementar (ex: setViagemSelecionada)
  const factoriesFiltradasPorViagem = viagemSelecionada
    ? factoriesFiltradas.filter(f => f.viagem === viagemSelecionada)
    : factoriesFiltradas;

  // Ordenar por data de cadastro (mais recente primeiro)
  factoriesFiltradasPorViagem.sort((a, b) => {
    const dataA = new Date(a.dataCadastro);
    const dataB = new Date(b.dataCadastro);
    return dataB - dataA;
  });

  const viagensUnicas = [...new Set(factories.map(f => f.viagem))].filter(v => v);

  const segmentosUnicos = [...new Set(factories.map(f => f.segment?.toUpperCase()))]
    .filter(s => s?.trim() !== "");

  const produtosFiltrados = selectedFactory
    ? products.filter(p => String(p.factoryId) === String(selectedFactory.id))
    : [];


  const totalCBM = produtosFiltrados.reduce((acc, prod) => {
    const edit = produtoEditado[prod.id];
    const CTNS = Number(edit?.["CTNS"] ?? prod["CTNS"]) || 0;
    if (CTNS <= 0) return acc;
    const CBM = Number(prod["CBM"]) || 0;
    return acc + CTNS * CBM;
  }, 0);

  const totalAmount = produtosFiltrados.reduce((acc, prod) => {
    const edit = produtoEditado[prod.id];
    const CTNS = Number(edit?.["CTNS"] ?? prod["CTNS"]) || 0;
    if (CTNS <= 0) return acc;
    const UNIT_CTN = Number(edit?.["UNIT/CTN"] ?? prod["UNIT/CTN"]) || 0;
    const PRICE = Number(edit?.["U.PRICE"] ?? prod["U.PRICE"]) || 0;
    const QTY = CTNS * UNIT_CTN;
    const AMOUNT = QTY * PRICE;
    return acc + AMOUNT;
  }, 0);

  return (
    <div className="font-nunito">
      <header className="flex items-center justify-between bg-[#26668B] text-white px-10" style={{ height: '70px' }}>
        <div className="flex items-center">
          <img src="/src/logo.svg" alt="Logo" className="h-[50px]" />
          <h1 className="ml-[50px] text-xl font-bold">Dashboard Fábricas China - Ravi</h1>
        </div>
      </header>

      <div className="p-6 font-nunito">

        <div className="flex items-center justify-between">
          <button
            className="bg-green-600 text-white px-4 py-2 rounded text-sm shadow hover:bg-green-700"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Fechar Cadastro" : "Cadastrar Fábrica"}
          </button>
          <div>

            <label className="text-sm font-semibold mr-2">Filtrar por Segmento:</label>
            <div className="flex gap-4">
  <div>
    <label className="text-sm font-semibold mr-2">Segmento:</label>
    <select
      className="border px-2 py-1 text-sm rounded"
      value={segmentoSelecionado}
      onChange={(e) => setSegmentoSelecionado(e.target.value)}
    >
      <option value="todos">Todos</option>
      {segmentosUnicos.map(segment => (
        <option key={segment} value={segment}>{segment}</option>
      ))}
    </select>
  </div>
  <div>
    <label className="text-sm font-semibold mr-2">Viagem:</label>
    <select
      className="border px-2 py-1 text-sm rounded"
      value={viagemSelecionada}
      onChange={(e) => setViagemSelecionada(e.target.value)}
    >
      <option value="">Todas</option>
      {viagensUnicas.map(viagem => (
        <option key={viagem} value={viagem}>{viagem}</option>
      ))}
    </select>
  </div>
</div>
</div></div>
      </div>

      {importando && (
        <div className="mt-4 bg-blue-100 border border-blue-300 text-blue-800 text-sm font-semibold px-6 py-6 rounded shadow">
          Importando produtos... {progresso}%
          <div className="w-full bg-gray-200 rounded mt-2 h-2">
            <div
              className="bg-blue-500 h-2 rounded"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      )}

      {mensagemImportacao && (
        <div className="mt-2 text-green-700 text-sm font-semibold">
          ✅ {mensagemImportacao}
        </div>
      )}
      {showForm && (
        <form onSubmit={handleSubmitFactory} className="bg-white border rounded shadow p-4 mb-6 max-w-3xl mx-auto">
          <h2 className="text-lg font-semibold mb-4">Nova Fábrica</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">


            <input
              type="text"
              className="border px-2 py-1 rounded"
              placeholder="Nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <input
              type="text"
              className="border px-2 py-1 rounded"
              placeholder="Contato"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              required
            />

            <select
              className="border px-2 py-1 rounded"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            >
              <option value="">Selecione a localização</option>
              <option value="Anhui">Anhui</option>
              <option value="Fujian">Fujian</option>
              <option value="Gansu">Gansu</option>
              <option value="Guangdong">Guangdong</option>
              <option value="Guizhou">Guizhou</option>
              <option value="Hainan">Hainan</option>
              <option value="Hebei">Hebei</option>
              <option value="Hunan">Hunan</option>
              <option value="Jiangsu">Jiangsu</option>
              <option value="Jiangxi">Jiangxi</option>
              <option value="Jilin">Jilin</option>
              <option value="Liaoning">Liaoning</option>
              <option value="Qinghai">Qinghai</option>
              <option value="Shaanxi">Shaanxi</option>
              <option value="Shandong">Shandong</option>
              <option value="Shanxi">Shanxi</option>
              <option value="Sichuan">Sichuan</option>
              <option value="Yunnan">Yunnan</option>
              <option value="Zhejiang">Zhejiang</option>
              <option value="Taiwan">Taiwan</option>
            </select>

            <input
              type="text"
              className="border px-2 py-1 rounded uppercase"
              placeholder="Segmento"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              required
            />

            <textarea
              className="border px-2 py-1 rounded col-span-2"
              placeholder="Observação"
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-2 col-span-2">
              <div>
                <label className="text-[0.65rem] text-gray-500 font-medium uppercase">Data de Cadastro</label>
                <input
                  type="date"
                  className="border px-2 py-1 rounded w-full"
                  value={dataCadastro}
                  onChange={(e) => setDataCadastro(e.target.value)}
                />
              </div>
              <div>
                <label className="text-[0.65rem] text-gray-500 font-medium uppercase">Viagem</label>
                <input
                  type="text"
                  className="border px-2 py-1 rounded w-full"
                  placeholder="Viagem"
                  value={viagem}
                  onChange={(e) => setViagem(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Salvar Fábrica</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {factoriesFiltradas.map((factory) => (
          <CardFabrica
            key={factory.id}
            factory={factory}
            selected={selectedFactory?.id === factory.id}
            onSelect={setSelectedFactory}
            onDelete={handleDelete}
            onUpdate={handleUpdateFactory}
            onImport={handleImportForFactory}
            onExportImages={handleExportImages}

          />
        ))}

      </div>

      <div className="mt-10 p-8">
        <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
          <h2 className="text-2xl font-semibold">
            Produtos{selectedFactory ? ` - ${selectedFactory.name}` : ""}
          </h2>

          {selectedFactory && (
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="bg-blue-100 text-blue-800 font-semibold px-4 py-2 rounded border border-blue-300 shadow">
              CBM COMPLETO: {totalCBM.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²

              </div>
              <div className="bg-green-100 text-green-800 font-semibold px-4 py-2 rounded border border-green-300 shadow">
                AMOUNT COMPLETO: ¥ {totalAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}

        </div>

        {!selectedFactory ? (
          <p className="text-gray-600">Selecione uma fábrica</p>
        ) : (
          <TabelaProdutos
            produtos={produtosFiltrados}
            onUpdate={fetchProducts}
            produtoEditado={produtoEditado}
            setProdutoEditado={setProdutoEditado}
          />)}

{mensagemExportacao && (
  <div className="my-4 bg-blue-100 border border-blue-300 text-blue-800 text-sm font-semibold px-4 py-2 rounded shadow">
    {mensagemExportacao}
    {progressoExportacao > 0 && progressoExportacao < 100 && (
      <div className="w-full bg-gray-200 rounded mt-2 h-2">
        <div
          className="bg-blue-500 h-2 rounded"
          style={{ width: `${progressoExportacao}%` }}
        />
      </div>
    )}
  </div>
)}

      </div>
      <ScrollToTopButton />

    </div>

  );
}
