# generate_m3u_full.py
import csv

input_file = "channels_full.tsv"
output_file = "channels.m3u"

with open(input_file, newline="", encoding="utf-8") as tsvfile:
    reader = csv.DictReader(tsvfile, delimiter="\t")
    
    lines = ["#EXTM3U"]
    
    for row in reader:
        status = row.get("Status", "").strip().upper()
        if status != "KEEP":  # keep only rows marked KEEP
            continue
        
        ch_num = row.get("ch_num", "").strip()
        name = row.get("NAME", "").strip()
        group = row.get("GROUP", "").strip()
        stream = row.get("STREAM", "").strip()
        logo = row.get("LOGO", "").strip()
        
        if not ch_num or not name or not stream:
            continue
        
        display_name = f"{ch_num}) {name}"
        
        extinf = f'#EXTINF:-1 tvg-logo="{logo}" group-title="{group}",{display_name}'
        lines.append(extinf)
        lines.append(stream)

with open(output_file, "w", encoding="utf-8") as f:
    f.write("\n".join(lines))

print(f"M3U playlist generated: {output_file}")
