import pandas as pd

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
    "aljadeed1": "Jadeed",
    "asharq_tv": "Al_Sharq",
    "saudi_thaqafiya": "Thaqafeyah",
    "sbc_tv": "SBC",
    "mbc1_tv_1": "MBC_1",
    "mbc2_tv_1": "MBC_2",
    "mbc4_tv_1": "MBC_4",
    "mbc5_tv_1": "MBC_5",
    "mbcmasr_tv_1": "MBC_Masr",
    "mbcmasr2_tv_1": "MBC_Masr_2",
    "mbcdrama_tv_1": "MBC_Drama",
    "mbc_masr_drama": "MBC_Drama_Egypt",
    "rotana_aflam": "Rotana_Aflam",
    "alarabiya1": "Al_Arabiya",
    "skynews_ar1": "SkyNews_Arabia",
    "palestine1": "PSC",  
    "makan": "Makan"
}



# Step 1: Build DataFrame from M3U
m3u_lines = [line.strip() for line in open(m3u_file, "r", encoding="utf-8") if line.strip()]
data = []

i = 0
while i < len(m3u_lines):
    if m3u_lines[i].startswith("#EXTINF:"):
        h_id = m3u_lines[i].split(",")[-1].strip()
        if i + 1 < len(m3u_lines):
            stream = m3u_lines[i + 1].strip()
            if h_id in h_to_name:
                data.append({
                    "NAME": h_to_name[h_id],        # TSV 2 name
                    "ch_id": h_to_name[h_id],       # use NAME as ch_id in TSV 1
                    "source_stream": stream
                })
        i += 2
    else:
        i += 1

df_m3u = pd.DataFrame(data)
print(f"Mapped M3U channels: {len(df_m3u)}")

# Step 2: Update TSV 1 using ch_id
df_tsv1 = pd.read_csv(tsv1_file, sep="\t")
df_tsv1_updated = df_tsv1.merge(df_m3u[["ch_id", "source_stream"]], on="ch_id", how="left", suffixes=("", "_new"))
df_tsv1_updated["source_stream"] = df_tsv1_updated["source_stream_new"].combine_first(df_tsv1_updated["source_stream"])
df_tsv1_updated = df_tsv1_updated.drop(columns=["source_stream_new"])

df_tsv1_updated.to_csv(tsv1_file, sep="\t", index=False)
print(f"Success: TSV 1 ({tsv1_file}) updated. {df_m3u.shape[0]} channels updated.")

# Step 3: Update TSV 2 (flip SKIP/KEEP)
df_tsv2 = pd.read_csv(tsv2_file, sep="\t")
mask = df_tsv2["NAME"].isin(df_m3u["NAME"])
flip_count = mask.sum()

df_tsv2.loc[mask, "Status"] = df_tsv2.loc[mask, "Status"].str.strip().str.upper().replace({"KEEP":"SKIP", "SKIP":"KEEP"})

df_tsv2["ch_num"] = df_tsv2["ch_num"].astype("Int64")

df_tsv2.to_csv(tsv2_file, sep="\t", index=False)
print(f"Success: TSV 2 ({tsv2_file}) updated. {flip_count} channels flipped SKIP/KEEP.")
