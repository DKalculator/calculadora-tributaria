from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import logging

# Configuração de Logs
logging.basicConfig(level=logging.DEBUG)

app = Flask(__name__)
CORS(app)

# Carregar alíquotas do arquivo JSON externo
with open("aliquotas.json") as f:
    ALIQUOTAS = json.load(f)

# Validação de entradas
def validar_entrada(receita, lucro_liquido):
    if receita <= 0:
        return "Receita deve ser maior que zero."
    if lucro_liquido < 0:
        return "Lucro Líquido não pode ser negativo."
    return None

def validar_setor_estado(estado, setor):
    if estado not in ALIQUOTAS["novo_regime"]["IBS"]:
        return f"Estado '{estado}' inválido."
    if setor not in ALIQUOTAS["setores"]:
        return f"Setor '{setor}' inválido."
    return None


# Cálculo do Simples Nacional
def calcular_simples_nacional(receita):
    faixas = ALIQUOTAS["simples_nacional"]
    for faixa in faixas:
        if receita <= faixa["limite"]:
            return receita * faixa["aliquota"]
    return receita * 0.30  # Alíquota máxima

# Cálculo do Regime Atual
def calcular_regime_atual(receita, lucro_liquido, estado, setor):
    regime_atual = ALIQUOTAS["regime_atual"]
    
    pis_cofins = receita * regime_atual["PIS_COFINS"]
    icms = receita * regime_atual["ICMS"].get(estado, regime_atual["ICMS"]["default"])
    iss = receita * regime_atual["ISS"].get(setor, regime_atual["ISS"]["default"])
    
    # Lucro Presumido
    base_presumida = receita * regime_atual["lucro_presumido"].get(setor, regime_atual["lucro_presumido"]["default"])
    irpj_csll_presumido = base_presumida * regime_atual["aliquota_presumida"]
    total_presumido = pis_cofins + icms + iss + irpj_csll_presumido

    # Lucro Real
    irpj_csll_real = lucro_liquido * regime_atual["IRPJ_CSLL"]
    total_real = pis_cofins + icms + iss + irpj_csll_real

    return total_presumido, total_real, pis_cofins, icms, iss, irpj_csll_real

# Cálculo do Novo Regime
def calcular_novo_regime(receita, estado, setor):
    # Buscar alíquota IBS
    estado_data = ALIQUOTAS["novo_regime"]["IBS"].get(estado, ALIQUOTAS["novo_regime"]["IBS"]["default"])
    ibs_aliquota = estado_data.get(setor, estado_data.get("default", 0.18))

    # Alíquota CBS fixa
    cbs_aliquota = ALIQUOTAS["novo_regime"]["CBS"]

    # Cálculo total
    return receita * (ibs_aliquota + cbs_aliquota)



def calcular_simples_nacional(receita):
    faixas = ALIQUOTAS["simples_nacional"]
    for faixa in faixas:
        if receita <= faixa["limite"]:
            return receita * faixa["aliquota"]
    return None

@app.route('/simulate_regimes', methods=['POST'])
def simulate_regimes():
    data = request.json
    receita = float(data.get("receita", 0))
    lucro_liquido = float(data.get("lucro_liquido", 0))
    estado = data.get("estado", "default")
    setor = data.get("setor", "default")

    logging.debug(f"Entradas: receita={receita}, lucro_liquido={lucro_liquido}, estado={estado}, setor={setor}")

    validacao = validar_entrada(receita, lucro_liquido)
    if validacao:
        return jsonify({"erro": validacao}), 400

    validacao_setor_estado = validar_setor_estado(estado, setor)
    if validacao_setor_estado:
        return jsonify({"erro": validacao_setor_estado}), 400

    imposto_presumido, imposto_real, pis_cofins, icms, iss, irpj_csll_real = calcular_regime_atual(receita, lucro_liquido, estado, setor)
    imposto_novo = calcular_novo_regime(receita, estado, setor)
    simples_nacional = calcular_simples_nacional(receita)

    if simples_nacional is None:
        aviso_simples = "Receita excede o limite para o Simples Nacional (R$ 4.800.000,00)."
        simples_nacional = 0
    else:
        aviso_simples = None

    explicacoes = {
        "lucro_presumido": f"Base presumida de {ALIQUOTAS['regime_atual']['lucro_presumido'].get(setor, 0.32) * 100}%, com alíquota total de 25%.",
        "lucro_real": "Cálculo sobre o lucro líquido com alíquota total de 34% (IRPJ + CSLL).",
        "novo_regime": f"IBS: {ALIQUOTAS['novo_regime']['IBS'][estado].get(setor, 0.18) * 100:.2f}%, CBS: {ALIQUOTAS['novo_regime']['CBS'] * 100:.2f}%.",
        "simples_nacional": aviso_simples or "Alíquota progressiva conforme receita anual."
    }

    return jsonify({
        "imposto_presumido": imposto_presumido,
        "imposto_real": imposto_real,
        "imposto_novo": imposto_novo,
        "simples_nacional": simples_nacional,
        "explicacoes": explicacoes,
        "detalhes": {
            "PIS_COFINS": pis_cofins,
            "ICMS": icms,
            "ISS": iss,
            "IRPJ_CSLL_REAL": irpj_csll_real,
        }
    })

if __name__ == "__main__":
    app.run(debug=True)
