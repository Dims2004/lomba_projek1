import secrets, os, json, re
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
import engine as E

app = Flask(__name__, static_folder="static")
KF = os.path.join(os.path.dirname(os.path.abspath(__file__)), "keys.json")
KEYS = set(json.load(open(KF))) if os.path.exists(KF) else set()  # key tetap valid walau server restart
TX = {}

def save_keys(): json.dump(sorted(KEYS), open(KF, "w"))
def digits(n): return "".join(secrets.choice("0123456789") for _ in range(n))
def luhn(n):
    d = [int(c) for c in n][::-1]
    return (sum(d[0::2]) + sum(sum(divmod(x * 2, 10)) for x in d[1::2])) % 10 == 0

def safe(fn):
    def w(*a, **k):
        try: return fn(*a, **k)
        except (ValueError, KeyError, TypeError, IndexError) as e: return jsonify(error=str(e)), 400
    w.__name__ = fn.__name__
    return w

@app.get("/")
def index(): return send_from_directory("static", "index.html")

@app.post("/api/validate")
@safe
def validate():
    err, warn = E.validate(request.json); return jsonify(errors=err, warnings=warn)

@app.post("/api/benchmark")
@safe
def benchmark(): return jsonify(rows=E.benchmark(request.json))

@app.post("/api/pricing")
@safe
def pricing(): return jsonify(E.price(request.json))

@app.post("/api/pay/init")
@safe
def pay_init():
    b = request.json; method = b["method"]
    if method not in ("va", "qris", "card"): raise ValueError("Metode pembayaran tidak dikenal.")
    p = E.price(b["model"]); sub = p["total"]; tax = round(sub * .11); tid = secrets.token_hex(8)
    t = dict(id=tid, method=method, items=p["items"], subtotal=sub, tax=tax, total=sub + tax,
             customer=str(b.get("customer", ""))[:60], paid=False, detail={})
    if method == "va":
        bank = b.get("bank", "BCA"); pre = {"BCA": "39", "BNI": "8808", "BRI": "26215", "Mandiri": "88908"}.get(bank, "39")
        t["detail"] = dict(bank=bank, va=pre + digits(16 - len(pre)))
    elif method == "qris":
        t["detail"] = dict(merchant="RESCHEDULE STUDIO", nmid="ID" + digits(13), rrn=digits(12))
    TX[tid] = t
    return jsonify(id=tid, total=t["total"], detail=t["detail"])

@app.post("/api/pay/confirm")
@safe
def pay_confirm():
    b = request.json; t = TX.get(b["id"])
    if not t: raise ValueError("Tagihan tidak ditemukan.")
    if t["paid"]: raise ValueError("Tagihan ini sudah dibayar.")
    if t["method"] == "card":
        c = b.get("card", {}); num = re.sub(r"\D", "", str(c.get("number", "")))
        if not 13 <= len(num) <= 19 or not luhn(num): raise ValueError("Nomor kartu tidak valid.")
        if not str(c.get("holder", "")).strip(): raise ValueError("Isi nama pemegang kartu.")
        m = re.fullmatch(r"(\d{2})/(\d{2})", str(c.get("exp", "")))
        if not m or not 1 <= int(m[1]) <= 12: raise ValueError("Masa berlaku harus berformat MM/YY.")
        now = datetime.now()
        if (2000 + int(m[2]), int(m[1])) < (now.year, now.month): raise ValueError("Kartu sudah kedaluwarsa.")
        if not re.fullmatch(r"\d{3,4}", str(c.get("cvv", ""))): raise ValueError("CVV harus 3 atau 4 digit.")
        brand = "Visa" if num[0] == "4" else "Mastercard" if num[0] in "25" else "Kartu"
        t["detail"] = dict(brand=brand, last4=num[-4:], holder=str(c["holder"]).upper()[:40], auth=digits(6))  # nomor penuh & CVV tidak disimpan
    t["paid"] = True
    key = "rs_live_" + secrets.token_urlsafe(24); KEYS.add(key); save_keys()
    now = datetime.now()
    receipt = dict(ref="RS-" + now.strftime("%y%m%d") + "-" + t["id"][:6].upper(), method=t["method"],
                   paid_at=now.strftime("%d/%m/%Y %H:%M:%S"), items=t["items"], subtotal=t["subtotal"], tax=t["tax"],
                   total=t["total"], detail=t["detail"], customer=t["customer"])
    return jsonify(receipt=receipt, key=key)

def need_key(): return request.headers.get("X-API-Key") in KEYS

@app.post("/api/v1/schedule")
@safe
def v1_schedule():
    if not need_key(): return jsonify(error="API key tidak valid"), 401
    s, m = E.solve(request.json["model"]); return jsonify(schedule=s, metrics=m)

@app.post("/api/v1/reschedule")
@safe
def v1_reschedule():
    if not need_key(): return jsonify(error="API key tidak valid"), 401
    b = request.json; ev = b["event"]; t0 = ev.get("at", 0)
    m2 = E.apply_event(b["model"], ev, t0); s, m = E.solve(m2, b["schedule"], t0)
    return jsonify(schedule=s, metrics=m)

if __name__ == "__main__": app.run(debug=True)