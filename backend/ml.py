"""
========================================================
Fraud-Risk Classifier  (XGBoost + Neural-Net + I-Forest)
--------------------------------------------------------
Features
  • amount     (int) – transaction amount
  • time       (int) – hour of day, 0–23
  • location   (str) – city / branch / region
  • risk       (int) – 0=Low,1=Medium,2=High (must already be numeric)

Save as: ml.py
--------------------------------------------------------
Train   : python ml.py train
Predict : python ml.py
CSV file: data.csv  with columns including at least:
   amount, time, location, risk
========================================================
"""

import sys
import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report
from xgboost import XGBClassifier
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers

warnings.filterwarnings("ignore")

# ------------------------------------------------ CONFIG
DATA_PATH      = Path("./data/data.csv")
SAFE_LOCATIONS = {"Kolkata"}        # trusted locations in training set
RAND_SEED      = 42
NN_EPOCHS      = 60
NN_BATCH       = 32

tf.random.set_seed(RAND_SEED)
np.random.seed(RAND_SEED)


# --------------------------------- Neural-network builder
def build_nn(input_dim: int = 2, num_classes: int = 3) -> keras.Model:
    model = keras.Sequential([
        layers.Input(shape=(input_dim,)),
        layers.Dense(64, activation="relu"),
        layers.Dropout(0.3),
        layers.Dense(32, activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(16, activation="relu"),
        layers.Dense(num_classes, activation="softmax")
    ])
    model.compile(
        optimizer=keras.optimizers.Adam(1e-3),
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"]
    )
    return model


# ------------------------------------------------ TRAINING
def train_models(csv_path: Path = DATA_PATH):
    if not csv_path.exists():
        sys.exit(f"❌  {csv_path} not found")

    # 1) load full CSV and normalize column names
    df = pd.read_csv(csv_path)
    df.columns = (
        df.columns
          .str.strip()
          .str.lower()
          .str.replace(" ", "_")
    )

    # 2) rename if needed
    if "value" in df.columns and "amount" not in df.columns:
        df = df.rename(columns={"value": "amount"})
    if "risk_level" in df.columns and "risk" not in df.columns:
        df = df.rename(columns={"risk_level": "risk"})

    # 3) ensure required columns
    required = {"amount", "time", "location", "risk"}
    missing = required - set(df.columns)
    if missing:
        sys.exit(f"❌  Missing columns: {missing}")

    # 4) select only the ones we need
    df = df[list(required)]

    # 5) parse ISO‑8601 time → hour if needed
    if not np.issubdtype(df["time"].dtype, np.integer):
        df["time"] = pd.to_datetime(df["time"], utc=True).dt.hour.astype(int)

    # 6) ensure amount and risk are integers
    df["amount"] = df["amount"].astype(int)
    df["risk"]   = df["risk"].astype(int)

    print(f"✔ {len(df)} rows  |  risk distribution:\n{df['risk'].value_counts()}\n")

    # ---------------- Isolation Forest on LOCATION
    ohe_loc = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    X_loc   = ohe_loc.fit_transform(df[["location"]])
    iso_loc = IsolationForest(
        n_estimators=150, contamination=0.01, random_state=RAND_SEED
    ).fit(X_loc)

    # ---------------- XGBoost & NN on AMOUNT+TIME
    scaler = StandardScaler()
    X_num  = scaler.fit_transform(df[["amount", "time"]])
    y      = df["risk"]

    X_tr, X_te, y_tr, y_te = train_test_split(
        X_num, y, test_size=0.2,
        stratify=y, random_state=RAND_SEED
    )

    # ---- XGBoost (multi-class)
    xgb = XGBClassifier(
        objective="multi:softprob",
        num_class=len(y.unique()),
        eval_metric="mlogloss",
        use_label_encoder=False,
        random_state=RAND_SEED,
        verbosity=0
    )
    xgb.fit(X_tr, y_tr)

    # flatten predictions if needed
    y_pred_xgb = xgb.predict(X_te)
    if hasattr(y_pred_xgb, "ndim") and y_pred_xgb.ndim > 1:
        y_pred_xgb = np.argmax(y_pred_xgb, axis=1)

    print("=== XGBoost performance ===")
    print(classification_report(y_te, y_pred_xgb, digits=4))

    # ---- Neural-Network (multi-class)
    nn = build_nn(input_dim=2, num_classes=len(y.unique()))
    nn.fit(
        X_tr, y_tr,
        epochs=NN_EPOCHS,
        batch_size=NN_BATCH,
        validation_split=0.2,
        verbose=0
    )
    nn_raw = nn.predict(X_te, verbose=0)
    if nn_raw.ndim > 1:
        nn_pred = nn_raw.argmax(axis=1)
    else:
        nn_pred = (nn_raw > 0.5).astype(int).ravel()

    print("=== Neural Network performance ===")
    print(classification_report(y_te, nn_pred, digits=4))

    # ---- Save artefacts
    joblib.dump(scaler,        "scaler.pkl")
    joblib.dump(xgb,           "xgb_amt_time.pkl")
    nn.save("nn_amt_time.keras")
    joblib.dump(ohe_loc,       "ohe_location.pkl")
    joblib.dump(iso_loc,       "iso_location.pkl")
    print("\n✅  Saved: scaler.pkl, xgb_amt_time.pkl, nn_amt_time.keras, "
          "ohe_location.pkl, iso_location.pkl")


# ------------------------------------------------ LOAD
def load_models():
    return dict(
        scaler   = joblib.load("scaler.pkl"),
        xgb      = joblib.load("xgb_amt_time.pkl"),
        nn       = keras.models.load_model("nn_amt_time.keras"),
        ohe_loc  = joblib.load("ohe_location.pkl"),
        iso_loc  = joblib.load("iso_location.pkl")
    )


# ------------------------------------------------ PREDICT
def assess(tx: dict, mdl: dict) -> dict:
    amt  = int(tx["amount"])
    hour = int(tx["time"])
    if not (0 <= hour <= 23):
        raise ValueError("time must be 0–23")
    loc  = tx["location"]

    X = mdl["scaler"].transform([[amt, hour]])
    xgb_probs = mdl["xgb"].predict_proba(X)[0]
    nn_probs  = mdl["nn"].predict(X, verbose=0)[0]
    ensemble_probs = (xgb_probs + nn_probs) / 2
    pred_class = int(np.argmax(ensemble_probs))

    loc_vec  = mdl["ohe_loc"].transform([[loc]])
    loc_flag = (mdl["iso_loc"].predict(loc_vec)[0] == -1) or (loc not in SAFE_LOCATIONS)

    inv_map   = {0: "Low Risk", 1: "Medium Risk", 2: "High Risk"}
    risk_label = inv_map.get(pred_class, f"Class {pred_class}")

    return {
        "risk": risk_label,
        "flags": {
            "amount_time": pred_class != 0,
            "location":    bool(loc_flag)
        },
        "probs": {
            "xgb":      float(xgb_probs[pred_class]),
            "nn":       float(nn_probs[pred_class]),
            "ensemble": float(ensemble_probs[pred_class])
        }
    }


# ------------------------------------------------ CLI
def cli():
    mdl = load_models()
    print("\n💳  Enter transaction details")
    amount    = input("Amount (int): ").strip()
    time_hour = input("Time (hour 0–23): ").strip()
    location  = input("Location: ").strip()

    result = assess(
        {"amount": int(amount), "time": int(time_hour), "location": location},
        mdl
    )

    print("\n=== RISK RESULT ===")
    print(f"Risk classification : {result['risk']}")
    print(f"Amount+Time flag    : {'UNUSUAL' if result['flags']['amount_time'] else 'normal'}")
    print(f"Location flag       : {'UNUSUAL' if result['flags']['location']    else 'normal'}")
    print(f"Ensemble probability: {result['probs']['ensemble']:.4f}")


# ------------------------------------------------ main
if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1].lower() == "train":
        train_models(DATA_PATH)
    else:
        cli()
