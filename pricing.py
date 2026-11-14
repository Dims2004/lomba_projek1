"""Harga per reschedule (bayar tiap kali butuh jadwal ulang, bukan langganan bulanan).
Ubah angka di RATE untuk menyesuaikan tarif."""

RATE = dict(base=25000, machine=3000, job=1500, op=500, material=1000, event=5000, objective=4000)

def counts(model):
    return dict(
        machines=len(model["machines"]),
        jobs=len(model["jobs"]),
        ops=sum(len(j["ops"]) for j in model["jobs"]),
        materials=len(model["materials"]),
        events=sum(1 for v in model["events"].values() if v),
        objectives=sum(1 for v in model["objectives"].values() if v),
    )

def price(model):
    c = counts(model)
    extra = max(0, c["objectives"] - 1)
    items = [
        ("Biaya dasar 1x reschedule", RATE["base"]),
        (f"Mesin ({c['machines']})", RATE["machine"] * c["machines"]),
        (f"Job ({c['jobs']})", RATE["job"] * c["jobs"]),
        (f"Operasi / routing ({c['ops']})", RATE["op"] * c["ops"]),
        (f"Material ({c['materials']})", RATE["material"] * c["materials"]),
        (f"Jenis gangguan ({c['events']})", RATE["event"] * c["events"]),
        (f"Objektif tambahan ({extra})", RATE["objective"] * extra),
    ]
    return dict(items=items, total=sum(v for _, v in items), unit="per reschedule",
                sandbox=dict(machines=3, jobs=10, requests=20))
