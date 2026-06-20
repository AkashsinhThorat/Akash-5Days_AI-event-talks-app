# 🚀 BigQuery Release Notes Hub

A modern, responsive, and lightweight web application built using Python Flask and plain vanilla HTML, JavaScript, and CSS. The app fetches the Google Cloud BigQuery release notes Atom XML feed, parses the contents into structured, selectable updates, and lets you tweet about them directly.

---

## ✨ Features

- **📡 Live XML Parsing**: Automatically retrieves and parses the Google Cloud BigQuery Atom XML feed (`https://docs.cloud.google.com/feeds/bigquery-release-notes.xml`).
- **🧩 Granular Sub-updates**: Smart-splits aggregated daily updates (grouped dates) into separate, individual cards based on release headers.
- **⚡ In-Memory Caching & Spinner Refresh**: Caches results to ensure instantaneous page loads. Instantly refresh live details using the **Refresh** action button (complete with loading spinner).
- **🎨 Glassmorphism Aesthetic**: Sleek and premium dark mode design utilizing visual highlights, custom typography (Outfit & Plus Jakarta Sans), and vibrant tag colors for different update types.
- **🔍 Instant Search & Category Filter**: Live filter chips to filter by categories: `Features`, `Announcements`, `Issues`, `Deprecations`, and `Others`, coupled with real-time text search.
- **🐦 Direct Twitter/X Sharing**: Tactile selection bar lets you choose individual updates to generate a pre-formatted tweet, including automatic text-truncation (safeguarding the 280-character limit) and hashtag inclusions.
- **🧪 Unit Tested**: Solid XML parsing and HTML sanitization modules backed by automated Python tests.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.11 + Flask (Microframework) + Requests
- **Frontend**: Vanilla HTML5, Custom CSS3, Vanilla ES6+ JavaScript
- **Test Framework**: Python Built-in `unittest`

---

## 📂 Directory Layout

```text
bq-releases-notes/
├── .venv/                      # Python virtual environment containing packages
├── static/                     # Shared web client assets
│   ├── css/
│   │   └── style.css           # Premium glassmorphic design sheets
│   └── js/
│       └── app.js              # State engine, UI actions, search, & share helpers
├── templates/                  # Server-side HTML templates
│   └── index.html              # Main application web layout
├── .gitignore                  # Git tracking exclusion list
├── app.py                      # Main Flask application entrypoint & API endpoints
├── requirements.txt            # Python library declarations
├── run.bat                     # Windows desktop startup script shortcut
├── test_app.py                 # Core unit testing logic
└── README.md                   # Project documentation (this file)
```

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Python 3 installed. You can verify by running:
```powershell
python --version
```

### Installation

1. **Clone or Navigate to the Directory**:
   ```powershell
   cd bq-releases-notes
   ```

2. **Set up Virtual Environment**:
   ```powershell
   python -m venv .venv
   ```

3. **Activate Environment & Install Dependencies**:
   - **Command Prompt (CMD)**:
     ```cmd
     .venv\Scripts\activate.bat
     pip install -r requirements.txt
     ```
   - **PowerShell**:
     ```powershell
     .venv\Scripts\Activate.ps1
     pip install -r requirements.txt
     ```

---

## 🖥️ Running the Application

### Option A: The Easy Way (Windows Shortcut)
Simply double-click the **`run.bat`** file in the project folder. It will launch the virtual environment, start the server, and direct you to the localhost URL.

### Option B: Terminal Start
Run the following command inside your project directory:
```powershell
.venv\Scripts\python.exe app.py
```

Once running, open your web browser and navigate to:
👉 **[http://127.0.0.1:5000](http://127.0.0.1:5000)**

---

## 🧪 Running Automated Tests

A test suite is included to verify the HTML cleanup rules and Atom feed XML parsing structure. To run the tests, execute:
```powershell
.venv\Scripts\python.exe test_app.py
```
