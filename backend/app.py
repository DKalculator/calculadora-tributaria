from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Simulação de alíquotas (valores fictícios)
ALIQUOTAS_ANTIGAS = {
    "PF": 0.12,  # Pessoa Física
    "PJ": 0.15,  # Pessoa Jurídica
}

ALIQUOTAS_NOVAS = {
    "PF": 0.15,  # Pessoa Física
    "PJ": 0.20,  # Pessoa Jurídica
}

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    renda = data.get('renda', 0)
    tipo = data.get('tipo', 'PF')  # PF ou PJ

    # Cálculo com alíquotas antigas e novas
    imposto_antigo = renda * ALIQUOTAS_ANTIGAS.get(tipo, 0)
    imposto_novo = renda * ALIQUOTAS_NOVAS.get(tipo, 0)

    return jsonify({
        "renda": renda,
        "imposto_antigo": imposto_antigo,
        "imposto_novo": imposto_novo,
        "diferenca": imposto_novo - imposto_antigo,
        "percentual_diferenca": ((imposto_novo - imposto_antigo) / imposto_antigo) * 100 if imposto_antigo else 0
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
