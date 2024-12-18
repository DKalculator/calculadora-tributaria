from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

@app.route('/calculate', methods=['POST'])
def calculate():
    data = request.json
    renda = data.get('renda', 0)
    novo_imposto = renda * 0.15
    antigo_imposto = renda * 0.12
    return jsonify({
        'renda': renda,
        'novo_imposto': novo_imposto,
        'antigo_imposto': antigo_imposto,
        'diferenca': novo_imposto - antigo_imposto
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
