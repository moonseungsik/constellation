import os
import re
import sys
import json
import math
import datetime
import socket
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
import streamlit as st
import pandas as pd

# -----------------------------------------------------------------------------
# 1. PATH RESOLUTION & BACKGROUND SERVER SETTINGS
# -----------------------------------------------------------------------------
PROJECT_DIR = os.path.dirname(os.path.abspath(__file__))
JSON_PATH = os.path.join(PROJECT_DIR, "starry_data.json")
APP_JS_PATH = os.path.join(PROJECT_DIR, "app.js")
PORT = 8000

# Simple dynamic HTTP server for API requests and serving static assets
class DynPlanetariumRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PROJECT_DIR, **kwargs)

    def do_POST(self):
        if self.path == '/api/save_calibration':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            
            try:
                calibration_data = json.loads(post_data.decode('utf-8'))
                name = calibration_data.get('name')
                
                if not name:
                    self.send_error_response(400, "Constellation name is missing.")
                    return
                
                # Check path existence
                if not os.path.exists(JSON_PATH):
                    self.send_error_response(404, "starry_data.json not found.")
                    return
                
                with open(JSON_PATH, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                
                # Find and update constellation
                constellations = data.get('constellations', [])
                found = False
                for c in constellations:
                    if c.get('name') == name:
                        c['ra'] = float(calibration_data['ra'])
                        c['dec'] = float(calibration_data['dec'])
                        c['width_deg'] = float(calibration_data['width_deg'])
                        c['height_deg'] = float(calibration_data['height_deg'])
                        c['position_angle'] = float(calibration_data['position_angle'])
                        c['flip_h'] = bool(calibration_data.get('flip_h', False))
                        c['flip_v'] = bool(calibration_data.get('flip_v', False))
                        found = True
                        break
                
                if not found:
                    self.send_error_response(404, f"Constellation '{name}' not found in database.")
                    return
                
                with open(JSON_PATH, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                self.send_response(200)
                self.send_header('Content-type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                response = {"success": True, "message": f"{name} calibration saved successfully!"}
                self.wfile.write(json.dumps(response).encode('utf-8'))
                
            except Exception as e:
                self.send_error_response(500, f"Error updating JSON: {str(e)}")
        else:
            self.send_error_response(404, "Not found")

    def send_error_response(self, code, message):
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response = {"success": False, "message": message}
        self.wfile.write(json.dumps(response).encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def is_port_in_use(port: int) -> bool:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('127.0.0.1', port)) == 0

def start_server_daemon():
    def run_server():
        try:
            server = HTTPServer(('127.0.0.1', PORT), DynPlanetariumRequestHandler)
            server.serve_forever()
        except Exception as e:
            print(f"Server thread error: {e}")

    if not is_port_in_use(PORT):
        thread = threading.Thread(target=run_server, daemon=True)
        thread.start()
        return "Started (Daemon Thread)"
    return "Running (Port 8000 in use)"

# Start server
server_status = start_server_daemon()

# -----------------------------------------------------------------------------
# 2. STREAMLIT APP CONFIGURATION & STYLE INJECTION
# -----------------------------------------------------------------------------
st.set_page_config(
    page_title="Starry Night Custom - 통합 천체 관측 제어 센터",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Premium Styling
st.markdown("""
<style>
/* Background and text styling */
.stApp {
    background-color: #030712;
    color: #f3f4f6;
}
/* Title decoration */
.app-title {
    font-family: 'Outfit', 'Inter', sans-serif;
    background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 800;
    margin-bottom: 2px;
}
/* Subtitle */
.app-subtitle {
    color: #9ca3af;
    font-size: 15px;
    margin-bottom: 24px;
}
/* Custom Metric/Stats Card */
.metric-card {
    background: rgba(17, 24, 39, 0.75);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 16px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
}
/* Styled sidebar background */
[data-testid="stSidebar"] {
    background-color: #0b0f19 !important;
    border-right: 1px solid rgba(255, 255, 255, 0.05) !important;
}
/* Clean customized buttons */
div.stButton > button {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    color: #e5e7eb;
    border-radius: 8px;
    border: 1px solid #374151;
    font-weight: 600;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    width: 100%;
}
div.stButton > button:hover {
    background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%);
    color: #ffffff;
    border-color: transparent;
    box-shadow: 0 0 16px rgba(59, 130, 246, 0.5);
}
/* Table font size adjustment */
.stDataFrame table {
    font-size: 13px !important;
}
/* Status badge styling */
.status-badge-online {
    display: inline-block;
    background-color: rgba(16, 185, 129, 0.15);
    color: #10b981;
    border: 1px solid rgba(16, 185, 129, 0.3);
    border-radius: 20px;
    padding: 2px 10px;
    font-size: 12px;
    font-weight: bold;
}
</style>
""", unsafe_allow_html=True)

# Initialize Session State
if "reload_count" not in st.session_state:
    st.session_state.reload_count = 0

# -----------------------------------------------------------------------------
# 3. HELPER FUNCTIONS: DATA PARSING & ALT-AZ CALCULATIONS
# -----------------------------------------------------------------------------
@st.cache_data
def load_celestial_data():
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        return data
    except Exception as e:
        st.error(f"데이터베이스(starry_data.json)를 불러올 수 없습니다: {e}")
        return {"stars": [], "constellations": []}

def parse_messier_catalog_from_js():
    try:
        if not os.path.exists(APP_JS_PATH):
            return []
        with open(APP_JS_PATH, "r", encoding="utf-8") as f:
            content = f.read()
        
        match = re.search(r'const MESSIER_CATALOG = \[(.*?)\];', content, re.DOTALL)
        if not match:
            return []
        
        array_content = match.group(1)
        # Regex format matches: { id:'M1',   ra:83.633,  dec:22.014,  type:'SNR', ko:'게성운' }
        pattern = r"\{\s*id:\s*'([^']+)'\s*,\s*ra:\s*([0-9.-]+)\s*,\s*dec:\s*([0-9.-]+)\s*,\s*type:\s*'([^']+)'\s*,\s*ko:\s*'([^']+)'\s*\}"
        items = re.findall(pattern, array_content)
        
        dso_types = {
            "SG": "🌀 나선은하",
            "EG": "🥚 타원은하",
            "EN": "💨 가스성운",
            "PN": "🧿 행성상성운",
            "OC": "✨ 산개성단",
            "GC": "🔮 구상성단",
            "SNR": "💥 초신성잔해"
        }
        
        messier_list = []
        for item in items:
            t = item[3]
            messier_list.append({
                "M-ID": item[0],
                "RA (Deg)": float(item[1]),
                "RA (Hours)": round(float(item[1]) / 15.0, 3),
                "Dec (Deg)": float(item[2]),
                "DSO 타입": dso_types.get(t, t),
                "한글명칭": item[4]
            })
        return messier_list
    except Exception as e:
        st.warning(f"메시에 천체 파싱 실패: {e}")
        return []

def save_calibrations_to_json(name, ra, dec, width, height, pa, flip_h, flip_v):
    try:
        with open(JSON_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        found = False
        for c in data.get("constellations", []):
            if c.get("name") == name:
                c["ra"] = float(ra)
                c["dec"] = float(dec)
                c["width_deg"] = float(width)
                c["height_deg"] = float(height)
                c["position_angle"] = float(pa)
                c["flip_h"] = bool(flip_h)
                c["flip_v"] = bool(flip_v)
                found = True
                break
                
        if found:
            with open(JSON_PATH, "w", encoding="utf-8") as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            st.cache_data.clear() # Clear cache on update
            return True
        return False
    except Exception as e:
        st.error(f"보정 데이터 파일 저장 에러: {e}")
        return False

# Local Sidereal Time (LST) Calculation
def get_lst(dt, longitude):
    t_ms = dt.timestamp() * 1000
    julian_date = (t_ms / 86400000.0) + 2440587.5
    d = julian_date - 2451545.0
    
    gmst = 18.697374558 + 24.06570982441908 * d
    gmst = (gmst % 24.0 + 24.0) % 24.0
    
    lst = gmst + longitude / 15.0
    lst = (lst % 24.0 + 24.0) % 24.0
    return lst

# Horizontal Coordinates (Alt/Az) Calculation
def ra_dec_to_alt_az(ra_deg, dec_deg, lst_hours, lat_deg):
    dec_rad = math.radians(dec_deg)
    lat_rad = math.radians(lat_deg)
    
    ha_hours = lst_hours - (ra_deg / 15.0)
    ha_rad = math.radians(ha_hours * 15.0)
    
    sin_alt = math.sin(dec_rad) * math.sin(lat_rad) + math.cos(dec_rad) * math.cos(lat_rad) * math.cos(ha_rad)
    sin_alt = max(-1.0, min(1.0, sin_alt))
    alt_rad = math.asin(sin_alt)
    alt_deg = math.degrees(alt_rad)
    
    cos_alt = math.cos(alt_rad)
    if abs(cos_alt) > 0.0001:
        cos_az = (math.sin(dec_rad) - math.sin(alt_rad) * math.sin(lat_rad)) / (cos_alt * math.cos(lat_rad))
        cos_az = max(-1.0, min(1.0, cos_az))
        sin_az = -math.cos(dec_rad) * math.sin(ha_rad) / cos_alt
        
        az_deg = math.degrees(math.atan2(sin_az, cos_az))
        az_deg = (az_deg + 360.0) % 360.0
    else:
        az_deg = 0.0
        
    return alt_deg, az_deg

# Load Databases
celestial_data = load_celestial_data()
stars_db = celestial_data.get("stars", [])
const_db = celestial_data.get("constellations", [])
messier_db = parse_messier_catalog_from_js()

# -----------------------------------------------------------------------------
# 4. SIDEBAR CONFIGURATION (STATISTICS & STATUS)
# -----------------------------------------------------------------------------
with st.sidebar:
    st.markdown('<h2 style="color: #60a5fa; margin-top: 0;">🛰️ 관측 제어 센터</h2>', unsafe_allow_html=True)
    
    # Server status
    st.markdown(
        f'<div>API 서버 상태: <span class="status-badge-online">🟢 Online</span></div>'
        f'<div style="font-size: 11px; color:#6b7280; margin-top:4px; margin-bottom: 16px;">{server_status}</div>',
        unsafe_allow_html=True
    )
    
    # Unified Database Statistics Card
    st.markdown(
        f"""
        <div class="metric-card">
            <h5 style="margin: 0; color: #a78bfa;">🌌 성도 데이터베이스</h5>
            <div style="margin-top: 8px; font-size: 13px; color: #9ca3af; line-height: 1.6;">
                • 총 항성 개수: <b>{len(stars_db):,}개</b><br>
                • 별자리 개수: <b>{len(const_db)}개</b><br>
                • 태양계 행성: <b>8개 + 달 🌙</b><br>
                • 메시에 DSO: <b>{len(messier_db)}개</b>
            </div>
        </div>
        """,
        unsafe_allow_html=True
    )
    
    st.markdown("### 🗺️ 성도 단축키 안내")
    st.markdown(
        """
        - **마우스 드래그**: 360도 전 방향 시야 이동
        - **휠 스크롤**: 시야각(FOV) 줌인 / 줌아웃
        - **별자리 더블클릭**: 해당 별자리로 카메라 윙- 회전 (Slew) 및 오버레이 노출
        - **별 더블클릭**: 해당 별 중심 포커싱 및 툴팁 팝업
        - **별자리선 근처 마우스 호버**: 해당 별자리선 강조 및 일러스트 페이드인
        """
    )
    
    if st.button("🔄 데이터 전체 새로고침"):
        st.cache_data.clear()
        st.rerun()

# -----------------------------------------------------------------------------
# 5. HEADER DESIGN
# -----------------------------------------------------------------------------
st.markdown('<h1 class="app-title">🌌 Starry Night Custom - 통합 천체 관측 제어 센터</h1>', unsafe_allow_html=True)
st.markdown('<div class="app-subtitle">어린이천문대 성도 엔진과 파이썬 데이터 제어 인터페이스가 결합된 통합 우주 탐색 대시보드</div>', unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# 6. LAYOUT SPLIT (LEFT: PLANETARIUM, RIGHT: CONTROL PANELS)
# -----------------------------------------------------------------------------
col_map, col_controls = st.columns([13, 7])

# 좌측 컬럼: 대화형 성도 뷰어
with col_map:
    st.markdown("### 🖥️ 실시간 대화형 성도 (3D Dome Simulator)")
    # Embed HTML Canvas App with reload query buster
    iframe_src = f"http://127.0.0.1:{PORT}/?v={st.session_state.reload_count}"
    st.iframe(iframe_src, height=800, scrolling=False)
    st.markdown(
        "<div style='font-size:12px; color:#6b7280; text-align:center; margin-top:-10px;'>"
        "※ 성도 내부에서 설정 아이콘을 눌러 별자리 일러스트, 별 이름, 행성 및 DSO 오버레이를 켜고 끌 수 있습니다.</div>",
        unsafe_allow_html=True
    )

# 우측 컬럼: 컨트롤 대시보드 (탭 형식 구성)
with col_controls:
    st.markdown("### 🛠️ 대시보드 컨트롤 패널")
    
    tabs = st.tabs(["🔧 성도 보정 도구", "📊 데이터 브라우저", "🕒 지평좌표 계산기"])
    
    # -------------------------------------------------------------------------
    # TAB 1: 성도 보정 도구 (Calibration Dashboard)
    # -------------------------------------------------------------------------
    with tabs[0]:
        st.markdown("#### 📐 별자리 일러스트 매핑 정밀 보정")
        st.markdown(
            "이곳에서 성도 내부의 별자리 일러스트 크기와 회전각 등을 슬라이더로 직관적으로 교정할 수 있습니다."
        )
        
        if const_db:
            # Constellation selection
            const_names = [c.get("name") for c in const_db]
            const_ko_names = {c.get("name"): c.get("name_ko", c.get("name")) for c in const_db}
            
            selected_name = st.selectbox(
                "보정할 별자리 선택", 
                const_names,
                format_func=lambda x: f"{const_ko_names.get(x)} ({x})"
            )
            
            # Fetch current values
            current_c = next(c for c in const_db if c.get("name") == selected_name)
            
            # Form fields
            ra = st.slider("적경 (RA, Degrees)", 0.0, 360.0, float(current_c.get("ra", 0.0)), step=0.01)
            dec = st.slider("적위 (Dec, Degrees)", -90.0, 90.0, float(current_c.get("dec", 0.0)), step=0.1)
            width = st.slider("가로 크기 (Width, Degrees)", 1.0, 180.0, float(current_c.get("width_deg", 10.0)), step=0.1)
            height = st.slider("세로 크기 (Height, Degrees)", 1.0, 180.0, float(current_c.get("height_deg", 10.0)), step=0.1)
            pa = st.slider("회전 각도 (Position Angle)", 0.0, 360.0, float(current_c.get("position_angle", 0.0)), step=0.5)
            
            col_flips = st.columns(2)
            with col_flips[0]:
                flip_h = st.checkbox("좌우 반전", value=bool(current_c.get("flip_h", False)))
            with col_flips[1]:
                flip_v = st.checkbox("상하 반전", value=bool(current_c.get("flip_v", False)))
                
            st.markdown("<br>", unsafe_allow_html=True)
            if st.button("💾 보정값 파일 저장 및 성도 즉시 동기화", key="save_cal_btn"):
                success = save_calibrations_to_json(selected_name, ra, dec, width, height, pa, flip_h, flip_v)
                if success:
                    st.session_state.reload_count += 1  # Force iframe reload
                    st.success(f"✔️ {const_ko_names.get(selected_name)} 보정 정보가 starry_data.json에 저장되었으며, 성도가 새로고침되었습니다!")
                    st.balloons()
                else:
                    st.error("보정값 저장에 실패했습니다. 파일 쓰기 권한을 확인하세요.")
        else:
            st.info("로드된 별자리 데이터가 없습니다.")

    # -------------------------------------------------------------------------
    # TAB 2: 천체 데이터 브라우저 (Database Browser)
    # -------------------------------------------------------------------------
    with tabs[1]:
        st.markdown("#### 🔍 천체 데이터베이스 조회 및 필터링")
        
        category = st.radio("천체 유형 선택", ["항성 (Stars)", "별자리 (Constellations)", "메시에 천체 (DSO)"], horizontal=True)
        
        if category == "항성 (Stars)":
            search_star = st.text_input("별 이름 검색 (예: 시리우스, Sirius, HIP 등)", "")
            max_mag = st.slider("최대 한계 등급 (어두운 별 필터)", 0.0, 7.0, 6.0, step=0.1)
            
            # Map stars
            stars_list = []
            for s in stars_db:
                stars_list.append({
                    "HIP ID": s.get("hip"),
                    "이름": s.get("name") if s.get("name") else f"HIP {s.get('hip')}",
                    "적경 (RA Deg)": round(s.get("ra", 0.0), 3),
                    "적경 (RA Hours)": round(s.get("ra", 0.0) / 15.0, 2),
                    "적위 (Dec Deg)": round(s.get("dec", 0.0), 2),
                    "밝기 (Vmag)": round(s.get("mag", 0.0), 2)
                })
            
            df_stars = pd.DataFrame(stars_list)
            
            # Filter
            filtered_df = df_stars[df_stars["밝기 (Vmag)"] <= max_mag]
            if search_star:
                filtered_df = filtered_df[
                    filtered_df["이름"].str.contains(search_star, case=False, na=False) |
                    filtered_df["HIP ID"].astype(str).str.contains(search_star, na=False)
                ]
            
            st.write(f"조회된 항성 수: **{len(filtered_df):,}개**")
            st.dataframe(filtered_df.sort_values(by="밝기 (Vmag)"), width='stretch', hide_index=True)

        elif category == "별자리 (Constellations)":
            search_const = st.text_input("별자리명 검색 (한글/영문)", "")
            
            # Map constellations
            const_list = []
            for c in const_db:
                const_list.append({
                    "별자리명 (한글)": c.get("name_ko", c.get("name")),
                    "별자리명 (영문)": c.get("name"),
                    "적경 (RA)": round(c.get("ra", 0.0), 2),
                    "적위 (Dec)": round(c.get("dec", 0.0), 2),
                    "크기 (가로x세로)": f"{round(c.get('width_deg', 0.0), 1)}° x {round(c.get('height_deg', 0.0), 1)}°",
                    "회전각 (PA)": round(c.get("position_angle", 0.0), 1),
                    "별자리선 개수": len(c.get("lines", []))
                })
                
            df_const = pd.DataFrame(const_list)
            
            # Filter
            if search_const:
                df_const = df_const[
                    df_const["별자리명 (한글)"].str.contains(search_const, case=False, na=False) |
                    df_const["별자리명 (영문)"].str.contains(search_const, case=False, na=False)
                ]
                
            st.write(f"조회된 별자리 수: **{len(df_const)}개**")
            st.dataframe(df_const.sort_values(by="별자리명 (한글)"), width='stretch', hide_index=True)

        elif category == "메시에 천체 (DSO)":
            search_dso = st.text_input("DSO 이름/ID 검색 (예: M31, 게성운)", "")
            
            if messier_db:
                df_dso = pd.DataFrame(messier_db)
                
                # Filter
                if search_dso:
                    df_dso = df_dso[
                        df_dso["M-ID"].str.contains(search_dso, case=False, na=False) |
                        df_dso["한글명칭"].str.contains(search_dso, case=False, na=False)
                    ]
                
                st.write(f"조회된 메시에 천체 수: **{len(df_dso)}개**")
                st.dataframe(df_dso, width='stretch', hide_index=True)
            else:
                st.info("메시에 천체 목록을 로드하지 못했거나 app.js 형식을 파싱할 수 없습니다.")

    # -------------------------------------------------------------------------
    # TAB 3: 실시간 지평좌표 계산기 (Local Sky Calculator)
    # -------------------------------------------------------------------------
    with tabs[2]:
        st.markdown("#### 🕒 지정 관측지 기준 실시간 지평좌표 계산기")
        st.markdown(
            "지정한 관측 위치와 관측 일시에 맞춰, 주요 15개 항성의 방위각(Az) 및 고도(Alt)를 파이썬 연산 엔진으로 정밀 계산해 냅니다."
        )
        
        # User observation inputs
        col_loc = st.columns(2)
        with col_loc[0]:
            obs_lat = st.number_input("관측지 위도 (Latitude)", value=37.5665, min_value=-90.0, max_value=90.0, step=0.01, format="%.4f")
        with col_loc[1]:
            obs_lon = st.number_input("관측지 경도 (Longitude)", value=126.9780, min_value=-180.0, max_value=180.0, step=0.01, format="%.4f")
            
        col_time = st.columns(2)
        with col_time[0]:
            obs_date = st.date_input("관측 날짜 (Date)", datetime.date.today())
        with col_time[1]:
            obs_time = st.time_input("관측 시간 (Time)", datetime.datetime.now().time())
            
        # Combine local time
        dt_local = datetime.datetime.combine(obs_date, obs_time)
        
        # Calculate Local Sidereal Time
        lst = get_lst(dt_local, obs_lon)
        st.markdown(
            f"""
            <div style='background-color:#1e1e30; padding:10px; border-radius:8px; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.05);'>
                • Julian Date: <b>{(dt_local.timestamp() * 1000 / 86400000.0 + 2440587.5):.5f}</b><br>
                • 지방항성시 (Local Sidereal Time): <b>{lst:.4f}h</b> ({int(lst):02d}시 {int((lst%1)*60):02d}분 {int(((lst%1)*60%1)*60):02d}초)
            </div>
            """,
            unsafe_allow_html=True
        )
        
        # List of 15 major bright stars
        major_stars = [
            {"hip": 108262, "name": "북극성 (Polaris)"},
            {"hip": 32349, "name": "시리우스 (Sirius)"},
            {"hip": 91262, "name": "베가 (Vega)"},
            {"hip": 69673, "name": "아크투르스 (Arcturus)"},
            {"hip": 11767, "name": "카펠라 (Capella)"},
            {"hip": 24436, "name": "리겔 (Rigel)"},
            {"hip": 27366, "name": "베텔게우스 (Betelgeuse)"},
            {"hip": 97649, "name": "알타이르 (Altair)"},
            {"hip": 102098, "name": "데네브 (Deneb)"},
            {"hip": 22449, "name": "알데바란 (Aldebaran)"},
            {"hip": 80763, "name": "안타레스 (Antares)"},
            {"hip": 65474, "name": "스피카 (Spica)"},
            {"hip": 37826, "name": "폴룩스 (Pollux)"},
            {"hip": 54061, "name": "레굴루스 (Regulus)"},
            {"hip": 113368, "name": "포말하우트 (Fomalhaut)"}
        ]
        
        # Calculate Alt/Az for each
        calc_rows = []
        for star in major_stars:
            # Find star coordinates in DB
            db_match = next((s for s in stars_db if s.get("hip") == star["hip"]), None)
            if db_match:
                ra = db_match.get("ra", 0.0)
                dec = db_match.get("dec", 0.0)
                mag = db_match.get("mag", 0.0)
                
                alt, az = ra_dec_to_alt_az(ra, dec, lst, obs_lat)
                
                visible = "🟢 관측가능" if alt > 0 else "🔴 수평선 아래"
                visible_styled = f"<span style='color: #10b981; font-weight: bold;'>{visible}</span>" if alt > 0 else f"<span style='color: #ef4444;'>{visible}</span>"
                
                calc_rows.append({
                    "별 이름": star["name"],
                    "밝기(등급)": f"{mag:.1f}",
                    "방위각 (Az)": f"{az:.2f}°",
                    "고도 (Alt)": f"{alt:.2f}°",
                    "관측 여부": visible_styled
                })
                
        if calc_rows:
            df_calc = pd.DataFrame(calc_rows)
            # Render HTML to support color indicators
            st.write("🌌 **주요 항성 지평좌표 연산 결과**")
            st.write(df_calc.to_html(escape=False, index=False), unsafe_allow_html=True)
            st.markdown("<br>", unsafe_allow_html=True)
        else:
            st.info("계산 가능한 항성 데이터가 데이터베이스에 존재하지 않습니다.")
