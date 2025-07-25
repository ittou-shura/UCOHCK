import sys, joblib, warnings
from pathlib import Path
import numpy as np, pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report
from xgboost import XGBClassifier

warnings.filterwarnings("ignore")

# ------------------------------------------------ CONFIG
DATA_PATH      = Path("data.csv")
SAFE_LOCATIONS = {"Kolkata", "kolkata", "Kolkata, West Bengal"}
RAND_SEED      = 42

# ------------------------------------------------ TRAINING
if __name__ == "__main__" and len(sys.argv) > 1 and sys.argv[1].lower() == "train":
    if not DATA_PATH.exists():
        sys.exit(f"❌  {DATA_PATH} not found")

    df = pd.read_csv(DATA_PATH)
    required = {"amount", "time", "location", "risk"}
    if not required.issubset(df.columns):
        sys.exit(f"❌  CSV must contain columns {required}")

    # ensure correct types
    df = df.assign(
        amount=df["amount"].astype(int),
        time=df["time"].astype(int)
    )

    print(f"✔ Loaded {len(df)} rows  |  risk distribution:\n{df['risk'].value_counts()}\n")

    # -- Isolation Forest on location strings
    ohe_loc = OneHotEncoder(handle_unknown="ignore", sparse_output=False)
    X_loc   = ohe_loc.fit_transform(df[["location"]])
    iso_loc = IsolationForest(
        n_estimators=150,
        contamination=0.01,
        random_state=RAND_SEED
    ).fit(X_loc)

    # -- XGBoost on amount + time
    scaler = StandardScaler()
    X_num  = scaler.fit_transform(df[["amount", "time"]])
    y      = df["risk"].astype(int)

    X_tr, X_te, y_tr, y_te = train_test_split(
        X_num, y, test_size=0.2,
        stratify=y, random_state=RAND_SEED
    )

    xgb = XGBClassifier(
        objective="binary:logistic",
        eval_metric="logloss",
        use_label_encoder=False,
        random_state=RAND_SEED,
        verbosity=0
    )
    xgb.fit(X_tr, y_tr)

    print("=== XGBoost Performance ===")
    print(classification_report(y_te, xgb.predict(X_te), digits=4))

    # -- Persist artifacts
    joblib.dump(scaler,   "scaler.pkl")
    joblib.dump(xgb,      "xgb_amt_time.pkl")
    joblib.dump(ohe_loc,  "ohe_location.pkl")
    joblib.dump(iso_loc,  "iso_location.pkl")

    print("\n✅ Saved: scaler.pkl, xgb_amt_time.pkl, ohe_location.pkl, iso_location.pkl")

# ------------------------------------------------ MODEL LOADER

def load_models():
    return {
        "scaler":  joblib.load("scaler.pkl"),
        "xgb":     joblib.load("xgb_amt_time.pkl"),
        "ohe_loc": joblib.load("ohe_location.pkl"),
        "iso_loc": joblib.load("iso_location.pkl")
    }

# ------------------------------------------------ ASSESSMENT

def assess(tx: dict, mdl: dict) -> dict:
    amt  = int(tx.get("amount", 0))
    hour = int(tx.get("time", 0))
    if not (0 <= hour <= 23):
        raise ValueError("time must be between 0 and 23 inclusive")
    loc  = tx.get("location", "")

    # amount+time anomaly via XGBoost
    X_val = mdl["scaler"].transform([[amt, hour]])
    prob = mdl["xgb"].predict_proba(X_val)[0, 1]
    flag_amt_time = prob > 0.5

    # location anomaly via Isolation Forest
    loc_vec = mdl["ohe_loc"].transform([[loc]])
    flag_loc = mdl["iso_loc"].predict(loc_vec)[0] == -1
    flag_loc = flag_loc or (loc not in SAFE_LOCATIONS)

    # count unusual factors
    count = int(flag_amt_time) + int(flag_loc)
    if count == 0:
        risk = "Low"
    elif count == 1:
        risk = "Medium"
    else:
        risk = "High"

    return {
        "risk": risk,
        "flags": {
            "amount_time": flag_amt_time,
            "location":    flag_loc
        },
        "probabilities": {
            "amount_time": prob,
            "location":    None
        }
    }
