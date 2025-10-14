import csv

# Paths
m3u_file = "/Users/skabajah/Downloads/extract/4_m3u.m3u"
tsv1_file = "/Users/skabajah/Downloads/GitHub/saturn/1_channels.tsv"
tsv2_file = "/Users/skabajah/Downloads/GitHub/saturn/2_channels_full.tsv"

# Mapping: M3U h_id -> TSV 2 NAME
h_to_name = {
    "cbc": "CBC",
    "nahar_tv1": "Nahar",
    "sadaelbalad": "Sada",
    "dmc_live_tv": "DMC",
    "ontv1": "ON_E",
    "alhayat_1": "Hayat",
    "elmehwar": "Mehwar",
    "almashhad": "Mashhad",
    "lbc_1": "LBC",
    "otv_lb1": "OTV",
    "aljadeed1": "Jadeed"
}

# Step 1: Parse M3U file
m3u_streams = {}
with open(m3u_file, "r", encoding="utf-8") as f:
    lines = [line.strip() for line in f if line.strip()]
    i = 0
    while i < len(lines):
        if lines[i].startswith("#EXTINF:"):
            h_id = lines[i].split(",")[-1].strip()
            if i + 1 < len(lines) and h_id in h_to_name:
                tsv_name = h_to_name[h_id]
                stream = lines[i + 1].strip()
                m3u_streams[tsv_name] = stream
            i += 2
        else:
            i += 1

# Step 2: Update 1_channels.tsv with streams
updated_rows_1 = []
with open(tsv1_file, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter="\t")
    fieldnames_1 = reader.fieldnames
    for row in reader:
        ch_id = row["ch_id"].strip()
        if ch_id in m3u_streams:
            row["source_stream"] = m3u_streams[ch_id]
        updated_rows_1.append(row)

with open(tsv1_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames_1, delimiter="\t")
    writer.writeheader()
    writer.writerows(updated_rows_1)

print(f"Success: TSV 1 ({tsv1_file}) updated.")

# Step 3: Flip SKIP/KEEP in TSV 2 only for mapped channels
mapped_names = set(h_to_name.values())
flipped_rows_2 = []
with open(tsv2_file, newline="", encoding="utf-8") as f:
    reader = csv.DictReader(f, delimiter="\t")
    fieldnames_2 = reader.fieldnames
    for row in reader:
        name = row["NAME"].strip()
        if name in mapped_names:
            status = row["Status"].strip().upper()
            if status == "KEEP":
                row["Status"] = "SKIP"
            elif status == "SKIP":
                row["Status"] = "KEEP"
        flipped_rows_2.append(row)

with open(tsv2_file, "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=fieldnames_2, delimiter="\t")
    writer.writeheader()
    writer.writerows(flipped_rows_2)

print(f"Success: TSV 2 ({tsv2_file}) updated.")
