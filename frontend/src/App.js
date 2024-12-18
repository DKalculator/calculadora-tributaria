import React, { useState, useEffect } from "react";
import "./index.css";
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js";
import { Bar } from "react-chartjs-2";
import aliquotas from "./aliquotas.json";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);




const App = () => {
  const [inputs, setInputs] = useState({
    receita: 1000000,
    lucro_liquido: 50000,
    estado: "SP",
    setor: "servicos",
  });
  const [resultado, setResultado] = useState(null);
  const limiteSimples = 4800000; // Limite para o Simples Nacional

  const fetchData = async () => {
    try {
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/simulate_regimes`, // URL dinâmica
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(inputs),
        }
      );
      const data = await response.json();
      setResultado(data);
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, [inputs]);

  

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const resetInputs = () => {
    setInputs({
      receita: 1000000,
      lucro_liquido: 50000,
      estado: "SP",
      setor: "servicos",
    });
  };

  const explicacaoDinamica = () => {
    const estadoSelecionado = inputs.estado;
    const setorSelecionado = inputs.setor;

    const icms = aliquotas.estados[estadoSelecionado]?.ICMS || 0.18;
    const iss = aliquotas.setores[setorSelecionado]?.ISS || 0.02;
    const ibs = aliquotas.estados[estadoSelecionado]?.IBS || 0.18;

    return (
      <>
        <p>
          <strong>Lucro Presumido:</strong> Alíquota de ICMS: {icms * 100}%, ISS: {iss * 100}%.
        </p>
        <p>
          <strong>Lucro Real:</strong> Base de cálculo sobre o lucro líquido da empresa com alíquota total de 34%.
        </p>
        <p>
          <strong>Novo Regime (IBS + CBS):</strong> IBS: {ibs * 100}% + CBS: 12% (total: {ibs * 100 + 12}%).
        </p>
      </>
    );
  };

  const regimes = [
    { nome: "Lucro Presumido", valor: resultado?.imposto_presumido },
    { nome: "Lucro Real", valor: resultado?.imposto_real },
    { nome: "Novo Regime", valor: resultado?.imposto_novo },
  ];

  // Adiciona o Simples Nacional somente se a receita for menor ou igual ao limite
  if (inputs.receita <= limiteSimples) {
    regimes.push({ nome: "Simples Nacional", valor: resultado?.simples_nacional });
  }

  const regimeMaisVantajoso = resultado
    ? regimes.reduce((min, regime) => (regime.valor < min.valor ? regime : min), regimes[0])
    : null;

  const dataGraficoBarra = resultado
    ? {
        labels: regimes.map((regime) => regime.nome),
        datasets: [
          {
            label: "Comparação de Impostos",
            data: regimes.map((regime) => regime.valor),
            backgroundColor: ["#6c757d", "#ffc107", "#007bff", "#28a745"],
          },
        ],
      }
    : null;

  return (
    <div className="container">
      <h1 className="titulo">Simulação Tributária PL 68/2024 - Compare IBS, CBS, Lucro Real e Presumido</h1>
      <div className="layout">
        <div className="coluna-esquerda">
          <div className="inputs">
            <h2>Entradas</h2>
            <label>Receita Bruta Anual: R$ {parseFloat(inputs.receita).toLocaleString()}</label>
            <input
              type="range"
              name="receita"
              min="20000"
              max="50000000"
              step="5000"
              value={inputs.receita}
              onChange={handleInputChange}
            />
            <label>Lucro Líquido (Lucro Real): R$ {parseFloat(inputs.lucro_liquido).toLocaleString()}</label>
            <input
              type="range"
              name="lucro_liquido"
              min="5000"
              max="10000000"
              step="5000"
              value={inputs.lucro_liquido}
              onChange={handleInputChange}
            />
            <label>Estado:</label>
            <select name="estado" value={inputs.estado} onChange={handleInputChange}>
              {Object.keys(aliquotas.estados).map((estado) => (
                <option key={estado} value={estado}>
                  {estado}
                </option>
              ))}
            </select>
            <label>Setor Econômico:</label>
            <select name="setor" value={inputs.setor} onChange={handleInputChange}>
              {Object.keys(aliquotas.setores).map((setor) => (
                <option key={setor} value={setor}>
                  {setor.charAt(0).toUpperCase() + setor.slice(1)}
                </option>
              ))}
            </select>            
          </div>
          <div className="explicacoes">
            <h2>Explicações</h2>
            {explicacaoDinamica()}
            {inputs.receita > limiteSimples && (
              <p className="alerta">
                O Simples Nacional não está disponível para receitas superiores a R$ 4.800.000,00.
              </p>
            )}
          </div>
        </div>
        <div className="coluna-direita">
          {resultado && (
            <>
              <div className="grafico">
                <h3>Comparação de Impostos</h3>
                <Bar data={dataGraficoBarra} 
                //key={JSON.stringify(dataGraficoBarra)} // Força o re-render
                />
                
              </div>
              <div className="tabela">
                <h3>Detalhamento dos Tributos</h3>
                <table>
                  <thead>
                    <tr>
                      <th>Regime</th>
                      <th>Imposto Total</th>
                      <th>% da Receita</th>
                    </tr>
                  </thead>
                  <tbody>
                    {regimes.map((regime) => (
                      <tr key={regime.nome}>
                        <td>{regime.nome}</td>
                        <td>R$ {regime.valor?.toFixed(2)}</td>
                        <td>{((regime.valor / inputs.receita) * 100).toFixed(2)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            
            </>
            
            
          )}
            
        </div>
       
      </div>
      <footer class="rodape">
  <div class="disclaimer">
    <p>
      <strong>Atenção:</strong> Os cálculos fornecidos por esta ferramenta são aproximados e baseados nas informações mais recentes disponíveis.  
      Mudanças legislativas podem não estar refletidas em tempo real, e os valores simulados não substituem orientação contábil ou jurídica profissional.  
      Consulte fontes oficiais ou especialistas antes de tomar decisões baseadas nos resultados apresentados.  
      Saiba mais no nosso <a href="/disclaimer.html">Disclaimer completo</a>.
    </p>
  </div>
</footer>

    </div>
    
  );
};

export default App;
