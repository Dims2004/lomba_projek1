import secrets, os, json, re, hmac, hashlib, base64
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory
import engine as E
import pricing as PR

app = Flask(__name__, static_folder="static")
SECRET = os.environ.get("SECRET_KEY", "ganti-lewat-env-vercel").encode()
USED = set()  # id API key yang sudah dipakai (disimpan di memori server, lihat catatan)

def _sig(s): return hmac.new(SECRET, s.encode(), hashlib.sha256).hexdigest()[:32]

def sign(d):
    raw = base64.urlsafe_b64encode(json.dumps(d, separators=(",", ":")).encode()).decode().rstrip("=")
    return raw + "." + _sig(raw)

def unsign(t):
    raw, _, sig = str(t).partition(".")
    if not raw or not hmac.compare_digest(sig, _sig(raw)): raise ValueError("Tagihan tidak valid atau sudah rusak.")
    return json.loads(base64.urlsafe_b64decode(raw + "=" * (-len(raw) % 4)))

def make_key(caps):
    return "rs_live_" + sign({"id": secrets.token_hex(6), "caps": caps})

def check_key(model):
    k = request.headers.get("X-API-Key") or ""
    if not k.startswith("rs_live_"): raise PermissionError("API key tidak valid")
    try: d = unsign(k[8:])
    except Exception: raise PermissionError("API key tidak valid")
    if d["id"] in USED: raise ValueError("API key ini sudah dipakai untuk 1x reschedule. Beli reschedule baru.")
    over = [x for x, v in PR.counts(model).items() if v > d["caps"].get(x, 0)]
    if over: raise ValueError("Model melebihi paket yang dibayar (" + ", ".join(over) + "). Beli reschedule untuk model ini.")
    return d["id"]

def digits(n): return "".join(secrets.choice("0123456789") for _ in range(n))

def luhn(n):
    d = [int(c) for c in n][::-1]
    return (sum(d[0::2]) + sum(sum(divmod(x * 2, 10)) for x in d[1::2])) % 10 == 0

def safe(fn):
    def w(*a, **k):
        try: return fn(*a, **k)
        except PermissionError as e: return jsonify(error=str(e)), 401
        except (ValueError, KeyError, TypeError, IndexError) as e: return jsonify(error=str(e)), 400
        except Exception as e: return jsonify(error="Kesalahan server: " + str(e)), 500
    w.__name__ = fn.__name__
    return w

@app.get("/")
def index(): return send_from_directory("static", "index.html")

for _p in ("/masuk", "/daftar", "/perusahaan", "/app"):
    app.add_url_rule(_p, endpoint="page" + _p.replace("/", "_"), view_func=index)

@app.post("/api/validate")
@safe
def validate():
    err, warn = E.validate(request.json); return jsonify(errors=err, warnings=warn)

@app.post("/api/benchmark")
@safe
def benchmark(): return jsonify(rows=E.benchmark(request.json))

@app.post("/api/pricing")
@safe
def pricing(): return jsonify(PR.price(request.json))

@app.post("/api/pay/init")
@safe
def pay_init():
    b = request.json; method = b["method"]
    if method not in ("va", "qris", "card"): raise ValueError("Metode pembayaran tidak dikenal.")
    p = PR.price(b["model"]); sub = p["total"]; tax = round(sub * .11); tid = secrets.token_hex(8)
    t = dict(id=tid, method=method, items=p["items"], subtotal=sub, tax=tax, total=sub + tax,
             customer=str(b.get("customer", ""))[:60], caps=PR.counts(b["model"]), detail={})
    if method == "va":
        bank = b.get("bank", "BCA"); pre = {"BCA": "39", "BNI": "8808", "BRI": "26215", "Mandiri": "88908"}.get(bank, "39")
        t["detail"] = dict(bank=bank, va=pre + digits(16 - len(pre)))
    elif method == "qris":
        t["detail"] = dict(merchant="RESCHEDULE STUDIO", nmid="ID" + digits(13), rrn=digits(12))
    return jsonify(id=tid, total=t["total"], detail=t["detail"], token=sign(t))

@app.post("/api/pay/confirm")
@safe
def pay_confirm():
    b = request.json; t = unsign(b["token"])
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
    now = datetime.now()
    receipt = dict(ref="RS-" + now.strftime("%y%m%d") + "-" + t["id"][:6].upper(), method=t["method"],
                   paid_at=now.strftime("%d/%m/%Y %H:%M:%S"), items=t["items"], subtotal=t["subtotal"], tax=t["tax"],
                   total=t["total"], detail=t["detail"], customer=t["customer"])
    return jsonify(receipt=receipt, key=make_key(t["caps"]))

@app.post("/api/v1/schedule")
@safe
def v1_schedule():
    m = request.json["model"]; check_key(m)  # jadwal awal: tidak menghabiskan key
    s, mt = E.solve(m); return jsonify(schedule=s, metrics=mt)

@app.post("/api/v1/reschedule")
@safe
def v1_reschedule():
    b = request.json; kid = check_key(b["model"]); ev = b["event"]; t0 = ev.get("at", 0)
    m2 = E.apply_event(b["model"], ev, t0); s, m = E.solve(m2, b["schedule"], t0)
    USED.add(kid)  # 1 API key = 1x reschedule
    return jsonify(schedule=s, metrics=m, billed="1 reschedule")

if __name__ == "__main__": app.run(debug=True)
