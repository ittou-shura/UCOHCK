from flask import Flask, request, jsonify
from ml import load_models, assess
from datetime import datetime

app = Flask(__name__)
models = load_models()

@app.route("/assess", methods=["POST"])
def assess_transaction():
    data = request.json

    # Optional: normalize ISO timestamp → hour
    t = data.get("time")
    if isinstance(t, str):
        t = datetime.fromisoformat(t.rstrip("Z")).hour
        data["time"] = t

    try:
        result = assess(data, models)
        risk = result["risk"]
        response = {
            "risk":          risk,
            "probabilities": result["probs"],
            "flags":         result["flags"],
        }

        if risk == "High":
            response["is_fraud"] = True

        return jsonify(response)

    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == "__main__":
    app.run(port=5001, debug=True)
