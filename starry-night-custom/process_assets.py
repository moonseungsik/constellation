import os
import re
import json
import math
from PIL import Image
from astroquery.vizier import Vizier

# 1. Setup paths
project_dir = r"C:\Users\astrocamp\.gemini\antigravity-ide\scratch\starry-night-custom"
images_out_dir = os.path.join(project_dir, "images")
os.makedirs(images_out_dir, exist_ok=True)

user_images_dir = r"C:\Users\astrocamp\OneDrive\바탕 화면\constellation images"
sn_podium_dir = r"C:\Program Files (x86)\Starry Night Podium 7\Podium"
sn_sky_data_dir = os.path.join(sn_podium_dir, "Sky Data")
sn_const_images_dir = os.path.join(sn_sky_data_dir, "Const Images", "Default - High Resolution")

iau_to_fullname = {
    "And": "Andromeda", "Ant": "Antlia", "Aps": "Apus", "Aql": "Aquila", "Ara": "Ara",
    "Ari": "Aries", "Aur": "Auriga", "Boo": "Bootes", "Cae": "Caelum", "Cam": "Camelopardalis",
    "Cnc": "Cancer", "CVn": "Canes Venatici", "CMa": "Canis Major", "CMi": "Canis Minor",
    "Cap": "Capricornus", "Car": "Carina", "Cas": "Cassiopeia", "Cen": "Centaurus",
    "Cep": "Cepheus", "Cet": "Cetus", "Cha": "Chamaeleon", "Cir": "Circinus",
    "Col": "Columba", "Com": "Coma Berenices", "CrA": "Corona Australis", "CrB": "Corona Borealis",
    "Crv": "Corvus", "Crt": "Crater", "Cru": "Crux", "Cyg": "Cygnus", "Del": "Delphinus",
    "Dor": "Dorado", "Dra": "Draco", "Equ": "Equuleus", "Eri": "Eridanus", "For": "Fornax",
    "Gem": "Gemini", "Gru": "Grus", "Her": "Hercules", "Hor": "Horologium", "Hya": "Hydra",
    "Hyi": "Hydrus", "Ind": "Indus", "Lac": "Lacerta", "Leo": "Leo", "LMi": "Leo Minor",
    "Lep": "Lepus", "Lib": "Libra", "Lup": "Lupus", "Lyn": "Lynx", "Lyr": "Lyra",
    "Men": "Mensa", "Mic": "Microscopium", "Mon": "Monoceros", "Mus": "Musca", "Nor": "Norma",
    "Oct": "Octans", "Oph": "Ophiuchus", "Ori": "Orion", "Pav": "Pavo", "Peg": "Pegasus",
    "Per": "Perseus", "Phe": "Phoenix", "Pic": "Pictor", "Psc": "Pisces", "PsA": "Piscis Austrinus",
    "Pup": "Puppis", "Pyx": "Pyxis", "Ret": "Reticulum", "Sge": "Sagitta", "Sgr": "Sagittarius",
    "Sco": "Scorpius", "Scl": "Sculptor", "Sct": "Scutum", "Ser": "Serpens Caput",
    "Sex": "Sextans", "Tau": "Taurus", "Tel": "Telescopium", "Tri": "Triangulum",
    "TrA": "Triangulum Australe", "Tuc": "Tucana", "UMa": "Ursa Major", "UMi": "Ursa Minor",
    "Vel": "Vela", "Vir": "Virgo", "Vol": "Volans", "Vul": "Vulpecula"
}

constellation_names_ko = {
    "Andromeda": "안드로메다자리", "Antlia": "공기펌프자리", "Apus": "극락조자리", "Aquila": "독수리자리", "Ara": "제단자리",
    "Aries": "양자리", "Auriga": "마차부자리", "Bootes": "목동자리", "Caelum": "조각칼자리", "Camelopardalis": "기린자리",
    "Cancer": "게자리", "Canes Venatici": "사냥개자리", "Canis Major": "큰개자리", "Canis Minor": "작은개자리",
    "Capricornus": "염소자리", "Carina": "용골자리", "Cassiopeia": "카시오페이아자리", "Centaurus": "센타우루스자리",
    "Cepheus": "세페우스자리", "Cetus": "고래자리", "Chamaeleon": "카멜레온자리", "Circinus": "컴파스자리",
    "Columba": "비둘기자리", "Coma Berenices": "머리털자리", "Corona Australis": "남쪽왕관자리", "Corona Borealis": "북쪽왕관자리",
    "Corvus": "까마귀자리", "Crater": "컵자리", "Crux": "남십자자리", "Cygnus": "백조자리", "Delphinus": "돌고래자리",
    "Dorado": "황새치자리", "Draco": "용자리", "Equuleus": "조랑말자리", "Eridanus": "에리다누스자리", "Fornax": "화로자리",
    "Gemini": "쌍둥이자리", "Gru": "두루미자리", "Hercules": "헤라클레스자리", "Horologium": "시계자리", "Hydra": "바다뱀자리",
    "Hydrus": "물뱀자리", "Indus": "인디언자리", "Lacerta": "도마뱀자리", "Leo": "사자자리", "Leo Minor": "작은사자자리",
    "Lepus": "토끼자리", "Libra": "천칭자리", "Lupus": "이리자리", "Lynx": "살괭이자리", "Lyra": "거문고자리",
    "Mensa": "테이블산자리", "Microscopium": "현미경자리", "Monoceros": "외뿔소자리", "Musca": "파리자리", "Norma": "직각자자리",
    "Octans": "팔분의자리", "Ophiuchus": "뱀주인자리", "Orion": "오리온자리", "Pavo": "공작자리", "Pegasus": "페가수스자리",
    "Perseus": "페르세우스자리", "Phoenix": "불사조자리", "Pictor": "화가자리", "Pisces": "물고기자리", "Piscis Austrinus": "남쪽물고기자리",
    "Puppis": "고물자리", "Pyxis": "나침반자리", "Reticulum": "그물자리", "Sagitta": "화살자리", "Sagittarius": "궁수자리",
    "Scorpius": "전갈자리", "Sculptor": "조각가자리", "Scutum": "방패자리", "Serpens Caput": "뱀자리(머리)", "Serpens Cauda": "뱀자리(꼬리)",
    "Sextans": "육분의자리", "Taurus": "황소자리", "Telescopium": "망원경자리", "Triangulum": "삼각형자리",
    "Triangulum Australe": "남쪽삼각형자리", "Tucana": "큰부리새자리", "Ursa Major": "큰곰자리", "Ursa Minor": "작은곰자리",
    "Vela": "돛자리", "Virgo": "처녀자리", "Volans": "날치자리", "Vulpecula": "여우자리"
}

bright_star_names = {
    32349: "시리우스 (Sirius)",
    91262: "베가 (Vega)",
    69673: "아크투르스 (Arcturus)",
    71908: "리겔 켄타우루스 (Rigel Kent)",
    11767: "카펠라 (Capella)",
    24436: "리겔 (Rigel)",
    27366: "베텔게우스 (Betelgeuse)",
    61317: "하다르 (Hadar)",
    97649: "알타이르 (Altair)",
    102098: "데네브 (Deneb)",
    22449: "알데바란 (Aldebaran)",
    80763: "안타레스 (Antares)",
    65474: "스피카 (Spica)",
    37826: "폴룩스 (Pollux)",
    54061: "레굴루스 (Regulus)",
    113368: "포말하우트 (Fomalhaut)",
    108262: "폴라리스 (Polaris, 북극성)"
}

# 1. Parse Astronomical.txt FIRST to collect all HIP numbers used in constellation lines
print("Step 1: Parsing Astronomical.txt to collect constellation line star IDs...")
ast_path = os.path.join(sn_sky_data_dir, "Asterisms", "Astronomical.txt")
with open(ast_path, "r", encoding="latin-1") as f:
    ast_content = f.read()

line_hip_ids = set()
hip_matches = re.findall(r'HIP(\d+)', ast_content)
for hip in hip_matches:
    line_hip_ids.add(int(hip))

print(f"Found {len(line_hip_ids)} unique stars used in constellation lines.")

# 2. Query Vizier for general stars (Vmag < 6.0) AND all specific stars used in lines
print("\nStep 2: Querying Vizier for stars...")
v = Vizier(row_limit=-1)

# Fetch general bright stars (Vmag < 6.0)
print("Querying bright stars (Vmag < 6.0)...")
vizier_results = v.query_constraints(catalog="I/239/hip_main", Vmag="<6.0")

stars_dict = {}
if vizier_results:
    table = vizier_results[0]
    for row in table:
        try:
            hip_id = int(row['HIP'])
            ra = float(row['RAICRS'])
            dec = float(row['DEICRS'])
            mag = float(row['Vmag'])
            if math.isnan(ra) or math.isnan(dec) or math.isnan(mag):
                continue
            stars_dict[hip_id] = {
                "hip": hip_id,
                "ra": ra,
                "dec": dec,
                "mag": mag,
                "name": bright_star_names.get(hip_id, "")
            }
        except (ValueError, TypeError, KeyError):
            continue
    print(f"Loaded {len(stars_dict)} bright stars.")
else:
    print("Failed to load bright stars from Vizier!")

# Find missing HIP numbers from the constellation lines and query them specifically
missing_hips = line_hip_ids - set(stars_dict.keys())
print(f"Found {len(missing_hips)} stars in constellation lines that are fainter than 6.0 mag. Fetching them specifically...")

if missing_hips:
    missing_list = list(missing_hips)
    batch_size = 100
    fetched_missing_count = 0
    
    for i in range(0, len(missing_list), batch_size):
        batch = missing_list[i:i+batch_size]
        hip_constraint = ",".join(map(str, batch))
        print(f"Querying batch of {len(batch)} missing stars...")
        
        batch_results = v.query_constraints(catalog="I/239/hip_main", HIP=hip_constraint)
        if batch_results:
            table = batch_results[0]
            for row in table:
                try:
                    hip_id = int(row['HIP'])
                    ra = float(row['RAICRS'])
                    dec = float(row['DEICRS'])
                    mag = float(row['Vmag'])
                    if math.isnan(ra) or math.isnan(dec) or math.isnan(mag):
                        continue
                    stars_dict[hip_id] = {
                        "hip": hip_id,
                        "ra": ra,
                        "dec": dec,
                        "mag": mag,
                        "name": bright_star_names.get(hip_id, "")
                    }
                    fetched_missing_count += 1
                except (ValueError, TypeError, KeyError):
                    continue
        else:
            print("Failed to load batch from Vizier.")
            
    print(f"Successfully fetched {fetched_missing_count} additional stars for constellation lines.")

stars_list = list(stars_dict.values())
print(f"Total stars in database: {len(stars_list)}")

# 3. Parse Const Images.sst (Mapping Data)
print("\nStep 3: Parsing Const Images.sst...")
sst_path = os.path.join(sn_sky_data_dir, "Const Images.sst")
constellations_data = {}

with open(sst_path, "r", encoding="latin-1") as f:
    sst_content = f.read()

names_found = re.findall(r'<SN_VALUE\s+name="(\d+)_Name"\s+value="([^"]+)">', sst_content)
for idx_str, const_name in names_found:
    ra_dec_match = re.search(rf'<SN_VALUE\s+name="{idx_str}_RA_Dec_DistanceLY"\s+value="([^"]+)">', sst_content)
    wh_pa_match = re.search(rf'<SN_VALUE\s+name="{idx_str}_Width_Height_PositionAngle"\s+value="([^"]+)">', sst_content)
    
    if ra_dec_match and wh_pa_match:
        ra_dec_vals = [float(x.strip()) for x in ra_dec_match.group(1).split(",")]
        wh_pa_vals = [float(x.strip()) for x in wh_pa_match.group(1).split(",")]
        
        const_data = {
            "name": const_name,
            "name_ko": constellation_names_ko.get(const_name, const_name),
            "ra": ra_dec_vals[0],
            "dec": ra_dec_vals[1],
            "width_deg": wh_pa_vals[0] / 60.0,
            "height_deg": wh_pa_vals[1] / 60.0,
            "position_angle": wh_pa_vals[2],
            "lines": []
        }
        constellations_data[const_name] = const_data

print(f"Parsed {len(constellations_data)} constellations from SST.")

# 4. Map Constellation Lines
print("\nStep 4: Mapping constellation lines...")
asterism_names = re.findall(r'<SN_VALUE\s+name="(\d+)_AsterismName"\s+value="([^"]+)">', ast_content)

for idx_str, ast_name in asterism_names:
    lines_pattern = rf'<SN_VALUE\s+name="{idx_str}_AsterismLine_\d+"\s+value="([^"]+)">'
    lines_found = re.findall(lines_pattern, ast_content)
    
    const_name = None
    if ast_name in constellations_data:
        const_name = ast_name
    elif ast_name == "Serpens" and "Serpens Caput" in constellations_data:
        const_name = "Serpens Caput"
    
    if const_name:
        lines_list = []
        for line_val in lines_found:
            hip_ids = re.findall(r'HIP(\d+)', line_val)
            if len(hip_ids) == 2:
                lines_list.append([int(hip_ids[0]), int(hip_ids[1])])
        constellations_data[const_name]["lines"] = lines_list

print("Mapped lines to constellations.")

# 5. Process and resize user images
print("\nStep 5: Processing and resizing user custom images...")
processed_count = 0
sn_files = os.listdir(sn_const_images_dir)

for abbrev, fullname in iau_to_fullname.items():
    user_filename = f"{abbrev}.png"
    user_img_path = os.path.join(user_images_dir, user_filename)
    
    if os.path.exists(user_img_path):
        sn_match = None
        for sn_f in sn_files:
            sn_name, sn_ext = os.path.splitext(sn_f)
            if sn_name.lower() == fullname.lower() or (abbrev.lower() == "ser" and "serpens" in sn_name.lower()):
                sn_match = sn_f
                break
        
        if sn_match:
            sn_img_path = os.path.join(sn_const_images_dir, sn_match)
            output_img_path = os.path.join(images_out_dir, f"{fullname}.png")
            
            try:
                with Image.open(user_img_path) as u_img, Image.open(sn_img_path) as sn_img:
                    target_size = sn_img.size
                    u_width, u_height = u_img.size
                    target_width, target_height = target_size
                    
                    ratio = min(target_width / u_width, target_height / u_height)
                    new_width = int(u_width * ratio)
                    new_height = int(u_height * ratio)
                    
                    resized_u_img = u_img.resize((new_width, new_height), Image.Resampling.LANCZOS)
                    
                    final_img = Image.new("RGBA", target_size, (0, 0, 0, 0))
                    
                    paste_x = (target_width - new_width) // 2
                    paste_y = (target_height - new_height) // 2
                    final_img.paste(resized_u_img, (paste_x, paste_y))
                    
                    final_img.save(output_img_path, "PNG")
                    processed_count += 1
                    
                    if fullname in constellations_data:
                        constellations_data[fullname]["image"] = f"images/{fullname}.png"
            except Exception as e:
                print(f"Error processing image for {fullname}: {e}")
        else:
            print(f"No matching Starry Night asset found for {fullname} ({user_filename})")

print(f"Processed {processed_count} constellation illustrations.")

# 6. Save final starry_data.json
print("\nStep 6: Saving unified starry_data.json...")
output_json_path = os.path.join(project_dir, "starry_data.json")

final_data = {
    "stars": stars_list,
    "constellations": list(constellations_data.values())
}

with open(output_json_path, "w", encoding="utf-8") as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"Saved database to {output_json_path}")
print("Asset processing completed successfully!")
