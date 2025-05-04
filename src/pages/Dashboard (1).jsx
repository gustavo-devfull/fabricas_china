
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection, getDocs, addDoc, deleteDoc, doc, setDoc
} from "firebase/firestore";
import * as XLSX from "xlsx";
import CardFabrica from "../components/CardFabrica";
import TabelaProdutos from "../components/TabelaProdutos";

export default function Dashboard() {
  const [factories, setFactories] = useState([]);
  const [selectedFactory, setSelectedFactory] = useState(null);
  const [products, setProducts] = useState([]);
  const [segmentoSelecionado, setSegmentoSelecionado] = useState("todos");

  
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [location, setLocation] = useState('');
  const [segment, setSegment] = useState('');

  const handleSubmitFactory = async (e) => {
    e.preventDefault();
    if (!name || !contact || !location || !segment) {
      alert("Preencha todos os campos.");
      return;
    }

    await addDoc(collection(db, 'factories'), {
      name, contact, location, segment: segment.toUpperCase(),
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

  const handleImportForFactory = (event, factory) => {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
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
      }

      fetchProducts();
    };
    reader.readAsArrayBuffer(file);
  };


  
  const [produtoEditado, setProdutoEditado] = useState({});

  const factoriesFiltradas = segmentoSelecionado === "todos"
    ? factories
    : factories.filter(f => f.segment?.toUpperCase() === segmentoSelecionado);

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
          <select
            className="border px-2 py-1 text-sm rounded"
            value={segmentoSelecionado}
            onChange={(e) => setSegmentoSelecionado(e.target.value)}
          >
            <option value="todos">Todos</option>
            {segmentosUnicos.map(segment => (
              <option key={segment} value={segment}>{segment}</option>
            ))}
          </select></div></div>
        </div>

        
        {showForm && (
          <form onSubmit={handleSubmitFactory} className="bg-white border rounded shadow p-4 mb-6 max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Nova Fábrica</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              <input type="text" className="border px-2 py-1 rounded" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} required />
              <input type="text" className="border px-2 py-1 rounded" placeholder="Contato" value={contact} onChange={(e) => setContact(e.target.value)} required />
              <input type="text" className="border px-2 py-1 rounded" placeholder="Localização" value={location} onChange={(e) => setLocation(e.target.value)} required />
              <input type="text" className="border px-2 py-1 rounded uppercase" placeholder="Segmento" value={segment} onChange={(e) => setSegment(e.target.value)} required />
            </div>
            <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">Salvar Fábrica</button>
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
  />
))}

        </div>

        <div className="mt-10 p-8">
<div className="flex flex-wrap items-center justify-between mb-4 gap-4">
  <h2 className="text-lg font-semibold">
    Produtos{selectedFactory ? ` - ${selectedFactory.name}` : ""}
  </h2>

  {selectedFactory && (
    <div className="flex flex-wrap gap-4 text-sm">
    <div className="bg-blue-100 text-blue-800 font-semibold px-4 py-2 rounded border border-blue-300 shadow">
  CBM COMPLETO: {totalCBM.toFixed(3)}
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
/>          )}
        </div>
      </div>
  );
}
