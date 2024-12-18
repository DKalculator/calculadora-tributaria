import React, { useState } from "react";
import axios from "axios";

const App = () => {
  const [renda, setRenda] = useState("");
  const [tipo, setTipo] = useState("PF");
  const [resultado, setResultado] = useState(null);

  const calcular = async () => {
    try {
      const response = await axios.post("http://localhost:5000/calculate", {
        renda: parseFloat(renda),
        tipo: tipo,
      });
      setResultado(response.data);
    } catch (error) {
      console.error("Erro ao calcular:", error);
    }
  };

  return (
    <div>
      <h1>Calculadora Tributária</h1>
      <div>
        <label>Renda (mensal ou anual): </label>
        <input
          type="number"
          value={renda}
          onChange={(e) => setRenda(e.target.value)}
          placeholder="Digite sua renda"
        />
      </div>
      <div>
        <label>Tipo de Atividade: </label>
        <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
          <option value="PF">Pessoa Física</option>
          <option value="PJ">Pessoa Jurídica</option>
        </select>
      </div>
      <button onClick={calcular}>Calcular</button>

      {resultado && (
        <div>
          <h2>Resultado</h2>
          <p>Renda: R$ {resultado.renda.toFixed(2)}</p>
          <p>Imposto Antigo: R$ {resultado.imposto_antigo.toFixed(2)}</p>
          <p>Imposto Novo: R$ {resultado.imposto_novo.toFixed(2)}</p>
          <p>Diferença: R$ {resultado.diferenca.toFixed(2)}</p>
          <p>Percentual de Diferença: {resultado.percentual_diferenca.toFixed(2)}%</p>
        </div>
      )}
    </div>
  );
};

export default App;
