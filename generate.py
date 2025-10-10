import csv

input_file = "channels_full.tsv"  # TSV with Status, GROUP, ch_num, NAME
output_file = "saturn.m3u"

with open(input_file, newline="", encoding="utf-8") as tsvfile:
    reader = csv.DictReader(tsvfile, delimiter="\t")
    
    lines = ["#EXTM3U"]
    
    for row in reader:
        status = row.get("Status", "").strip().upper()
        if status != "KEEP":
            continue
        
        ch_num = row.get("ch_num", "").strip()
        name = row.get("NAME", "").strip()
        group = row.get("GROUP", "").strip()
        
        if not ch_num or not name:
            continue
        
        # Generate ch_id from name
        ch_id = name.replace(" ", "_")
        
        # Generate URLs
        stream = f"https://redirector.shadi-kabajah.workers.dev/{ch_id}"
        logo = f"https://skabajah.github.io/saturn/logo/{ch_id}.jpg"
        
        display_name = f"{ch_num}) {name}"
        extinf = f'#EXTINF:-1 tvg-logo="{logo}" group-title="{group}",{display_name}'
        lines.append(extinf)
        lines.append(stream)

with open(output_file, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"M3U playlist generated: {output_file}")
