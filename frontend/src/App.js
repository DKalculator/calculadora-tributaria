import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [renda, setRenda] = useState('');
  const [resultado, setResultado] = useState(null);

  const calcular = async () => {
    const response = await axios.post('https://seu-projeto-backend.onrender.com/calculate', {
      renda: parseFloat(renda),
    });
    setResultado(response.data);
  };

  return (
    <div>
      <h1>Calculadora Tributária</h1>
      <input
        type="number"
        value={renda}
        onChange={(e) => setRenda(e.target.value)}
        placeholder="Digite sua renda"
      />
      <button onClick={calcular}>Calcular</button>
      {resultado && (
        <div>
          <p>Imposto Antigo: {resultado.antigo_imposto}</p>
          <p>Imposto Novo: {resultado.novo_imposto}</p>
          <p>Diferença: {resultado.diferenca}</p>
        </div>
      )}
    </div>
  );
};

export default App;
