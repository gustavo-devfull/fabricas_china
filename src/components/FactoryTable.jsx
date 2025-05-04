import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function FactoryTable() {
  const [dados, setDados] = useState([]);

  useEffect(() => {
    const carregar = async () => {
      const query = await getDocs(collection(db, 'produtos'));
      setDados(query.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    carregar();
  }, []);

  return (
    <div className="bg-white p-4 shadow rounded">
      <h2 className="text-lg font-semibold mb-2">Produtos Importados</h2>
      <table className="table-auto w-full text-sm">
        <thead>
          <tr>
            {dados[0] && Object.keys(dados[0]).filter(key => key !== 'id').map((key) => (
              <th key={key} className="border p-2">{key}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dados.map((item) => (
            <tr key={item.id}>
              {Object.entries(item).filter(([key]) => key !== 'id').map(([key, value]) => (
                <td key={key} className="border p-2">{value}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
