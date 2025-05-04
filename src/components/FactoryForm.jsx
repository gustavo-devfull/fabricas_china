import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function FactoryForm() {
  const [factory, setFactory] = useState({
    nome: '',
    contato: '',
    localizacao: '',
    segmento: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "fabricas"), factory);
      alert("Fábrica cadastrada com sucesso!");
      setFactory({ nome: '', contato: '', localizacao: '', segmento: '' });
    } catch (error) {
      console.error("Erro ao cadastrar fábrica:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 bg-gray-100 p-4 rounded">
      <input type="text" placeholder="Nome da Fábrica" value={factory.nome} onChange={(e) => setFactory({...factory, nome: e.target.value})} className="border p-2 w-full mb-2" required />
      <input type="text" placeholder="Contato" value={factory.contato} onChange={(e) => setFactory({...factory, contato: e.target.value})} className="border p-2 w-full mb-2" required />
      <input type="text" placeholder="Localização" value={factory.localizacao} onChange={(e) => setFactory({...factory, localizacao: e.target.value})} className="border p-2 w-full mb-2" required />
      <input type="text" placeholder="Segmento" value={factory.segmento} onChange={(e) => setFactory({...factory, segmento: e.target.value})} className="border p-2 w-full mb-2" required />
      <button className="bg-blue-500 text-white px-4 py-2 rounded">Cadastrar Fábrica</button>
    </form>
  );
}
