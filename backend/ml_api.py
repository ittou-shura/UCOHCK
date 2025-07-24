from flask import Flask, request, jsonify
from ml import load_models, assess

app = Flask(__name__)
models = load_models()

@app.route("/assess", methods=["POST"])
def assess_transaction():
    data = request.json
    try:
        result = assess(data, models)
        return jsonify({"risk": result["risk"], "probabilities": result["probs"], "flags": result["flags"]})
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(port=5001, debug=True)
