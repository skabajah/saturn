import csv

input_file = "2_channels_full.tsv"  # TSV with Status, GROUP, ch_num, NAME
output_file_sk = "sk.m3u"       # current list (skip only SKIP)
output_file_saturn = "saturn.m3u"  # filtered list (skip SKIP + ENG)

with open(input_file, newline="", encoding="utf-8") as tsvfile:
    reader = csv.DictReader(tsvfile, delimiter="\t")
    
    lines_sk = ["#EXTM3U"]
    lines_saturn = ["#EXTM3U"]
    
    for row in reader:
        status = row.get("Status", "").strip().upper()
        ch_num = row.get("ch_num", "").strip()
        name = row.get("NAME", "").strip()
        group = row.get("GROUP", "").strip()
        
        if not ch_num or not name:
            continue
        
        # Generate ch_id from name
        ch_id = name.replace(" ", "_")
        
        # Generate URLs
        stream = f"https://saturn.shadi-kabajah.workers.dev/{ch_id}"
        logo = f"https://skabajah.github.io/saturn/logo/{ch_id}.jpg"
        
        display_name = f"{ch_num}) {name}"
        extinf = f'#EXTINF:-1 tvg-logo="{logo}" group-title="{group}",{display_name}'
        
        # SK list: only skip if Status != KEEP
        if status == "KEEP":
            lines_sk.append(extinf)
            lines_sk.append(stream)
        
        # Saturn list: skip if Status != KEEP OR group == ENG
        if status == "KEEP" and group.upper() != "ENG":
            lines_saturn.append(extinf)
            lines_saturn.append(stream)

# Write the files
with open(output_file_sk, "w", encoding="utf-8") as f:
    f.write("\n".join(lines_sk))

with open(output_file_saturn, "w", encoding="utf-8") as f:
    f.write("\n".join(lines_saturn))

print(f"SK playlist generated: {output_file_sk}")
print(f"Saturn playlist generated: {output_file_saturn}")
