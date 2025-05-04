import React, { useState } from "react";

export default function CardFabrica({ factory, selected, onSelect, onDelete, onUpdate, onImport, onExportImages }) {
  const [editando, setEditando] = useState(false);
  const [formData, setFormData] = useState({ ...factory });

  const handleSalvar = () => {
    onUpdate(factory.id, formData);
    setEditando(false);
  };

  return (
    <div
      className={`bg-white rounded shadow-sm p-4 space-y-2 text-sm border-2 ${
        selected ? 'border-[#1d8ccc]' : 'border-[#d1d1d1]'
      }`}
    >
      {editando ? (
        <div className="grid grid-cols-1 gap-2">
          <input
            type="date"
            className="border px-2 py-1 rounded"
            placeholder="Data de Cadastro"
            value={formData.dataCadastro || ""}
            onChange={(e) => setFormData({ ...formData, dataCadastro: e.target.value })}
          />

          <input
            type="text"
            className="border px-2 py-1 rounded"
            placeholder="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="text"
            className="border px-2 py-1 rounded"
            placeholder="Contato"
            value={formData.contact}
            onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
          />
          <input
            type="text"
            className="border px-2 py-1 rounded"
            placeholder="Localização"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          />
          <input
            type="text"
            className="border px-2 py-1 rounded uppercase"
            placeholder="Segmento"
            value={formData.segment}
            onChange={(e) => setFormData({ ...formData, segment: e.target.value.toUpperCase() })}
          />
          <input
            type="text"
            className="border px-2 py-1 rounded"
            placeholder="Observação"
            value={formData.observacao || ""}
            onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[0.65rem] text-gray-500 font-medium uppercase">Data de Cadastro</label>
              <input
                type="date"
                className="border px-2 py-1 rounded w-full"
                value={formData.dataCadastro || ""}
                onChange={(e) => setFormData({ ...formData, dataCadastro: e.target.value })}
              />
            </div>
            <div>
              <label className="text-[0.65rem] text-gray-500 font-medium uppercase">Viagem</label>
              <input
                type="text"
                className="border px-2 py-1 rounded w-full"
                placeholder="Viagem"
                value={formData.viagem || ""}
                onChange={(e) => setFormData({ ...formData, viagem: e.target.value })}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm text-gray-800">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[0.65rem] text-gray-500 font-medium uppercase">Nome</p>
              <p className={`text-base ${selected ? "text-lg text-[#26668B] uppercase font-bold" : ""}`}>{factory.name}</p>
            </div>
            <div>
              <p className="text-[0.65rem] text-gray-500 font-medium uppercase">Contato</p>
              <p className="text-base">{factory.contact}</p>
            </div>
            <div>
              <p className="text-[0.65rem] text-gray-500 font-medium uppercase">Localização</p>
              <p className="text-base">{factory.location}</p>
            </div>
            <div>
              <p className="text-[0.65rem] text-gray-500 font-medium uppercase">Segmento</p>
              <p className="text-base uppercase font-semibold">{factory.segment}</p>
            </div>
          </div>

          {factory.observacao && (
            <div className="mt-2">
              <p className="text-[0.65rem] text-gray-500 font-medium uppercase">Observação</p>
              <p className="text-base">{factory.observacao}</p>
            </div>
          )}
          {factory.dataCadastro && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[0.65rem] text-gray-500 font-medium uppercase">Data de Cadastro</label>
                <input
                  type="date"
                  className="border px-2 py-1 rounded w-full"
                  value={formData.dataCadastro || ""}
                  onChange={(e) => setFormData({ ...formData, dataCadastro: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[0.65rem] text-gray-500 font-medium uppercase">Viagem</label>
                <input
                  type="text"
                  className="border px-2 py-1 rounded w-full"
                  placeholder="Viagem"
                  value={formData.viagem || ""}
                  onChange={(e) => setFormData({ ...formData, viagem: e.target.value })}
                />
              </div>
            </div>
          )}
        </div>
      )}

      <hr className="my-3 border-t border-gray-300" />
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="flex gap-2 flex-wrap">
          {editando ? (
            <>
              <button onClick={handleSalvar} className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs">Salvar</button>
              <button onClick={() => setEditando(false)} className="bg-gray-400 hover:bg-gray-500 text-white px-3 py-1 rounded text-xs">Cancelar</button>
            </>
          ) : (
            <>
              <button onClick={() => onSelect(factory)} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs">Selecionar</button>
              <button onClick={() => onDelete(factory.id)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs">Excluir</button>
              <button onClick={() => setEditando(true)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs">Editar</button>
            </>
          )}
        </div>
        {!editando && (
          <div className="flex flex-col gap-1">
            <input type="file" id={`import-${factory.id}`} accept=".xlsx" className="hidden" onChange={(e) => onImport(e, factory)} />
            <button onClick={() => document.getElementById(`import-${factory.id}`).click()} className="bg-green-700 hover:bg-green-800 text-white px-3 py-1 rounded text-xs">Importar Produtos</button>
            <button onClick={() => onExportImages(factory.id)} className="bg-indigo-700 hover:bg-indigo-800 text-white px-3 py-1 rounded text-xs">Exportar Imagens</button>
          </div>
        )}
      </div>
    </div>
  );
}
