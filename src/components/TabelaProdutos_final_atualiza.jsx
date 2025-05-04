
import React, { useState } from "react";
import { doc, setDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

export default function TabelaProdutos({ produtos, onUpdate, produtoEditado, setProdutoEditado }) {
    const [expandidoId, setExpandidoId] = useState(null);
  const [editandoId, setEditandoId] = useState(null);

  const principais = ["REF", "NAME", "CTNS", "QTY", "U.PRICE", "AMOUNT", "CBM TOTAL"];
  const todos = [
    "REF", "DESCRIPTION", "NAME", "REMARK", "OBS", "NCM", "English Description",
    "CTNS", "UNIT/CTN", "QTY", "U.PRICE", "UNIT", "AMOUNT", "L", "W", "H",
    "CBM", "CBM TOTAL", "G.W", "T.G.W", "N.W", "T.N.W", "Peso Unitário(g)"
  ];

  const camposEditaveis = ["CTNS", "UNIT/CTN", "U.PRICE"];

  const handleInput = (id, campo, valor) => {
    if (editandoId !== id) setEditandoId(id);
    setProdutoEditado((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [campo]: valor
      }
    }));
  };

  const handleSalvar = async (id) => {
    const dados = produtoEditado[id];
    try {
      const ref = doc(db, "produtos", id);
      await setDoc(ref, dados, { merge: true });
      if (onUpdate) onUpdate();
      setEditandoId(null);
    } catch (err) {
      console.error("Erro ao salvar produto:", err);
    }
  };

  const handleExcluir = async (id) => {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    try {
      await deleteDoc(doc(db, "produtos", id));
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Erro ao excluir produto:", err);
    }
  };

  
  const totalCBM = produtos.reduce((acc, prod) => acc + (parseFloat(prod["CBM TOTAL"]) || 0), 0);
  const totalAmount = produtos.reduce((acc, prod) => {
  const edit = produtoEditado[prod.id];
  const CTNS = Number(edit?.['CTNS'] ?? prod['CTNS']);
  if (CTNS <= 0) return acc;
  const UNIT_CTN = Number(edit?.['UNIT/CTN'] ?? prod['UNIT/CTN']);
  const PRICE = Number(edit?.['U.PRICE'] ?? prod['U.PRICE']);
  const QTY = CTNS * UNIT_CTN;
  const AMOUNT = QTY * PRICE;
  return acc + AMOUNT;
    const edit = produtoEditado[prod.id];
    const CTNS = Number(edit?.["CTNS"] ?? prod["CTNS"]);
    const UNIT_CTN = Number(edit?.["UNIT/CTN"] ?? prod["UNIT/CTN"]);
    const PRICE = Number(edit?.["U.PRICE"] ?? prod["U.PRICE"]);
    const QTY = CTNS * UNIT_CTN;
    const AMOUNT = QTY * PRICE;
  
    return AMOUNT > 0 ? acc + AMOUNT : acc;
  }, 0);
  
  if (!produtos || produtos.length === 0) {
    return <p className="text-gray-500 text-xs">Nenhum produto cadastrado para esta fábrica.</p>;
  }

  return (<>

      

    <div className="space-y-4 mt-4">
      {produtos.map((prod) => {
        const editData = produtoEditado[prod.id] || {};
        const CTNS = Number(editData["CTNS"] ?? prod["CTNS"]);
        const UNIT_CTN = Number(editData["UNIT/CTN"] ?? prod["UNIT/CTN"]);
        const UPRICE = Number(editData["U.PRICE"] ?? prod["U.PRICE"]);
        const QTY = CTNS * UNIT_CTN;
        const AMOUNT = QTY * UPRICE;
        const CBM_TOTAL = Number(prod["CBM"]) * CTNS;

        const imgUrl = `https://nyc3.digitaloceanspaces.com/moribr/base-fotos/${prod.REF}.jpg`;

        return (
      

          <div
            key={prod.id}
            className="border rounded p-4 bg-white shadow-sm"
            style={{ borderColor: "#222", borderWidth: "0.5px" }}
          >
            <div className="flex gap-4">
              <img
                src={imgUrl}
                onError={(e) =>
                  (e.target.src =
                    "https://nyc3.digitaloceanspaces.com/moribr/base-fotos/placeholder-image.jpg")
                }
                alt={prod.NAME}
                className="w-[250px] h-[200px] object-contain border"
              />

              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-xs">
                {principais.map((campo) => (
                  <div key={campo} className="border rounded px-2 py-1" style={{ borderColor: '#222', borderWidth: '0.5px' }}>
                    <span className="block font-semibold text-gray-700">{campo}</span>
                    {camposEditaveis.includes(campo) ? (
                      <input
                        className="border px-1 py-0.5 w-full text-xs rounded"
                        style={{ borderColor: '#ccc', borderWidth: '0.5px' }}
                        value={editData[campo] ?? prod[campo]}
                        onChange={(e) => handleInput(prod.id, campo, e.target.value)}
                      />
                    ) : campo === "QTY" ? (
                      QTY.toFixed(2)
                    ) : campo === "AMOUNT" ? (
                      AMOUNT.toFixed(2)
                      ) : campo === "CBM TOTAL" ? (
                      CBM_TOTAL.toFixed(6)
                    ) : (
                      prod[campo]
                    )}
                  </div>
                ))}
              </div>
            </div>

            {expandidoId === prod.id && (
              <div className="mt-4 overflow-auto">
                <table className="table-auto w-full text-xs border border-gray-300">
                  <thead>
                    <tr className="bg-gray-100">
                      {todos.map((col) => (
                        <th key={col} className="border px-2 py-1 text-left" style={{ borderWidth: "0.3px", borderColor: "#ccc" }}>{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
  <tr>
{todos.map((col) => (
  <td key={col} className="border px-2 py-1" style={{ borderWidth: "0.3px", borderColor: "#ccc" }}>
    {col === "QTY"
      ? QTY.toFixed(2)
      : col === "AMOUNT"
      ? AMOUNT.toFixed(2)
      : col === "CBM TOTAL"
      ? CBM_TOTAL.toFixed(6)
      : col === "T.G.W"
      ? (CTNS * (parseFloat(prod["G.W"]) || 0)).toFixed(2)
      : col === "T.N.W"
      ? (CTNS * (parseFloat(prod["N.W"]) || 0)).toFixed(2)
      : prod[col]}
  </td>
))}

  </tr>
</tbody>
                </table>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              {editandoId === prod.id && (
                <button
                  onClick={() => handleSalvar(prod.id)}
                  className="bg-green-600 text-white px-2 py-1 text-xs rounded"
                >
                  Salvar
                </button>
              )}
              <button
                onClick={() => handleExcluir(prod.id)}
                className="bg-red-600 text-white px-2 py-1 text-xs rounded"
              >
                Excluir
              </button>
              <button
                onClick={() => setExpandidoId(expandidoId === prod.id ? null : prod.id)}
                className="bg-gray-300 text-black px-2 py-1 text-xs rounded border"
              >
                {expandidoId === prod.id ? "Ocultar detalhes" : "Ver mais detalhes"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  </>);
}
