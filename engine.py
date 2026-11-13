import time, math, copy

def slot(busy, ready, d):
    t = ready
    for s, e in sorted(busy):
        if t + d <= s: break
        if e > t: t = e
    return t

def release(model, j):
    return max([m.get("available", 0) + m.get("lead", 0) for m in model.get("materials", []) if m.get("job") == j["id"]] + [0]) + j.get("delay", 0)

def solve(model, prev=None, t0=0):
    t = time.perf_counter()
    M = {m["id"]: m for m in model["machines"]}
    busy = {i: [tuple(d) for d in m.get("down", [])] for i, m in M.items()}
    keep = bool(prev) and model.get("objectives", {}).get("disruption", True)
    P = {(o["job"], o["op"]): o for o in (prev or [])}
    out = []
    for o in P.values():  # operasi yang sudah berjalan dibekukan
        if o["start"] < t0 and o["machine"] in M:
            out.append(dict(o)); busy[o["machine"]].append((o["start"], o["end"]))
    def okey(j):
        ps = [P[(j["id"], i)]["start"] for i in range(len(j["ops"])) if (j["id"], i) in P]
        base = j["due"] - 30 * j.get("priority", 1)
        if not keep: return (0, 0, base)
        return (0 if (not ps and j.get("priority", 1) >= 4) else 1, min(ps) if ps else 1e9, base)
    for j in sorted(model["jobs"], key=okey):
        prevend = release(model, j)
        for i, op in enumerate(j["ops"]):
            k = (j["id"], i)
            if k in P and P[k]["start"] < t0 and P[k]["machine"] in M:
                prevend = P[k]["end"]; continue
            ready = max(prevend, t0); best = None
            for m in M.values():
                if m["type"] != op["type"]: continue
                d = max(1, round(op["time"] / max(m.get("capacity", 1), .1))) + op.get("setup", 0)
                s = slot(busy[m["id"]], ready, d)
                pen = 0
                if keep and k in P:
                    pen = (40 if P[k]["machine"] != m["id"] else 0) + .5 * abs(s - P[k]["start"])
                if best is None or s + d + pen < best[0]: best = (s + d + pen, m["id"], s, s + d)
            if best is None: raise ValueError(f"Tidak ada mesin bertipe {op['type']} untuk job {j['id']}")
            out.append(dict(job=j["id"], op=i, machine=best[1], start=best[2], end=best[3]))
            busy[best[1]].append((best[2], best[3])); prevend = best[3]
    ms = round((time.perf_counter() - t) * 1000, 2)
    return out, metrics(model, out, prev, t0, ms)

def metrics(model, sch, prev, t0=0, ms=0):
    ends = {}
    for o in sch: ends[o["job"]] = max(ends.get(o["job"], 0), o["end"])
    mk = max(o["end"] for o in sch)
    tard = sum(max(0, ends[j["id"]] - j["due"]) for j in model["jobs"] if j["id"] in ends)
    util = sum(o["end"] - o["start"] for o in sch) / (mk * len(model["machines"]))
    stab, changed = 1.0, 0
    if prev:
        P = {(o["job"], o["op"]): o for o in prev if o["start"] >= t0}
        mv = [o for o in sch if (o["job"], o["op"]) in P]
        changed = sum(1 for o in mv if P[(o["job"], o["op"])]["machine"] != o["machine"] or P[(o["job"], o["op"])]["start"] != o["start"])
        stab = 1 - changed / len(mv) if mv else 1.0
    return dict(makespan=mk, tardiness=tard, stability=round(stab, 3), utilization=round(util, 3), speed_ms=ms, changed=changed)

def apply_event(model, ev, t0):
    m = copy.deepcopy(model); t = ev["type"]
    if t in ("breakdown", "absence"):
        for x in m["machines"]:
            if x["id"] == ev["machine"]: x.setdefault("down", []).append([t0, t0 + ev["duration"]])
    elif t == "material_delay":
        for j in m["jobs"]:
            if j["id"] == ev["job"]: j["delay"] = j.get("delay", 0) + ev["delay"]
    elif t == "urgent": m["jobs"].append(ev["job"])
    elif t == "deviation":
        for j in m["jobs"]:
            if j["id"] == ev["job"]:
                for o in j["ops"]: o["time"] = round(o["time"] * ev["factor"])
    return m

def downs(m): return [[x["id"], d[0], d[1]] for x in m["machines"] for d in x.get("down", [])]

def validate(model):
    err, warn = [], []
    types = {m["type"] for m in model["machines"]}
    if not model["machines"]: err.append("Belum ada mesin. Tambahkan minimal 1 mesin.")
    if not model["jobs"]: err.append("Belum ada job. Tambahkan minimal 1 job.")
    if len({m["id"] for m in model["machines"]}) != len(model["machines"]): err.append("ID mesin harus unik.")
    if len({j["id"] for j in model["jobs"]}) != len(model["jobs"]): err.append("ID job harus unik.")
    for j in model["jobs"]:
        if not j["ops"]: err.append(f"Job {j['id']} belum punya operasi.")
        for i, o in enumerate(j["ops"]):
            if o["type"] not in types: err.append(f"Job {j['id']} operasi {i+1}: tidak ada mesin bertipe {o['type']}.")
            if o["time"] <= 0: err.append(f"Job {j['id']} operasi {i+1}: waktu proses harus > 0.")
        if j["due"] < sum(o["time"] for o in j["ops"]): warn.append(f"Job {j['id']}: due date lebih kecil dari total waktu proses, pasti terlambat.")
    if not any(model["objectives"].values()): err.append("Pilih minimal 1 tujuan optimasi.")
    if not any(model["events"].values()): warn.append("Belum ada jenis gangguan yang dipilih.")
    return err, warn

def price(model):
    n_o = sum(len(j["ops"]) for j in model["jobs"]); ev = sum(model["events"].values()); ob = sum(model["objectives"].values())
    items = [("Platform dasar", 250000), (f"Mesin ({len(model['machines'])})", 60000 * len(model["machines"])),
             (f"Volume job ({model.get('est_jobs', 100)}/periode)", 25000 * math.ceil(model.get("est_jobs", 100) / 50)),
             (f"Kompleksitas routing ({n_o} operasi)", 8000 * n_o), (f"Material ({len(model['materials'])})", 20000 * len(model["materials"])),
             (f"Jenis gangguan ({ev})", 90000 * ev), (f"Objektif tambahan ({max(0, ob-1)})", 70000 * max(0, ob - 1))]
    return dict(items=items, total=sum(v for _, v in items), sandbox=dict(machines=3, jobs=10, requests=20))

def benchmark(model):
    sch, m0 = solve(model); t0 = round(m0["makespan"] * .3)
    rows = [dict(event="Jadwal awal", t0=0, metrics=m0, naive=None, schedule=sch, down=[])]
    j0, ms = model["jobs"][0], model["machines"]
    urg = dict(j0, id="URGENT", priority=5, due=t0 + 150, ops=[dict(o) for o in j0["ops"]])
    cands = [("breakdown", "Mesin rusak (60 mnt)", dict(machine=ms[0]["id"], duration=60)),
             ("material", "Material terlambat (45 mnt)", dict(type="material_delay", job=j0["id"], delay=45)),
             ("urgent", "Pesanan mendadak", dict(type="urgent", job=urg)),
             ("absence", "Operator absen (40 mnt)", dict(type="absence", machine=ms[-1]["id"], duration=40)),
             ("deviation", "Waktu proses menyimpang (x1.5)", dict(type="deviation", job=j0["id"], factor=1.5))]
    for key, label, e in cands:
        if not model["events"].get(key): continue
        e.setdefault("type", key); m2 = apply_event(model, e, t0)
        s2, mt = solve(m2, sch, t0); sn, _ = solve(m2, None, t0)
        rows.append(dict(event=label, t0=t0, metrics=mt, naive=metrics(m2, sn, sch, t0)["stability"], schedule=s2, down=downs(m2)))
    return rows
