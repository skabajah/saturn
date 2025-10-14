import csv
import os

# --- Configuration ---
input_file = "2_channels_full.tsv"  # TSV with Status, GROUP, ch_num, NAME
output_file_sk = "sk.m3u"       # List 1: KEEP only
output_file_saturn = "saturn.m3u"  # List 2: KEEP and not ENG group

# --- Helper Function for ID Generation (Space to Underscore) ---
def create_channel_id(name):
    """
    Creates a URL-safe channel ID by replacing spaces with underscores.
    Note: If the original name already contains underscores, they are preserved
    for the URL, as they are URL-safe.
    """
    return name.replace(" ", "_")

# --- Main Processing Logic ---

# Check if the input file exists before attempting to read
if not os.path.exists(input_file):
    print(f"Error: Input file '{input_file}' not found.")
    # You might want to exit here or create a mock file for testing
    # return 

try:
    with open(input_file, newline="", encoding="utf-8") as tsvfile:
        # Use DictReader to treat the first row as headers
        reader = csv.DictReader(tsvfile, delimiter="\t")
        
        lines_sk = ["#EXTM3U"]
        lines_saturn = ["#EXTM3U"]
        
        for row in reader:
            # Extract and normalize data for reliable comparison
            status = row.get("Status", "").strip().upper()
            ch_num = row.get("ch_num", "").strip()
            name = row.get("NAME", "").strip()
            group = row.get("GROUP", "").strip()
            
            # Skip entries missing critical data
            if not ch_num or not name:
                continue
            
            # 1. Generate ch_id (Underscores for URL/Logo)
            # This handles spaces -> underscores for URL safety.
            ch_id = create_channel_id(name)
            
            # 2. Generate URLs
            stream = f"https://saturn.shadi-kabajah.workers.dev/{ch_id}"
            logo = f"https://skabajah.github.io/saturn/logo/{ch_id}.jpg"
            
            # 3. Generate Display Name (Spaces for Player UI)
            # CRITICAL FIX: Replace any underscores in the name with spaces for display.
            display_name_formatted = name.replace("_", " ")
            display_name = f"{ch_num}) {display_name_formatted}"
            
            # 4. Generate EXTM3U line
            extinf = f'#EXTINF:-1 tvg-logo="{logo}" group-title="{group}",{display_name}'
            
            # --- Filtering Logic ---
            
            # SK list: only includes channels where Status is KEEP
            if status == "KEEP":
                lines_sk.append(extinf)
                lines_sk.append(stream)
            
            # Saturn list: includes channels where Status is KEEP AND group is NOT ENG
            if status == "KEEP" and group.upper() != "ENG":
                lines_saturn.append(extinf)
                lines_saturn.append(stream)

except FileNotFoundError:
    # This block handles the case where the file check above failed (if it was added)
    # or if the file was found but couldn't be opened for another reason.
    print(f"Failed to open or read the input file: {input_file}")
    # Initialize lists to prevent writing errors if processing failed
    lines_sk = ["#EXTM3U"]
    lines_saturn = ["#EXTM3U"]

# --- Write the files ---
try:
    with open(output_file_sk, "w", encoding="utf-8") as f:
        f.write("\n".join(lines_sk))

    with open(output_file_saturn, "w", encoding="utf-8") as f:
        f.write("\n".join(lines_saturn))

    print(f"SK playlist generated: {output_file_sk}")
    print(f"Saturn playlist generated: {output_file_saturn}")

except Exception as e:
    print(f"An error occurred while writing output files: {e}")
