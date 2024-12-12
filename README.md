# Nik's Getränke App

Eine Webanwendung zur Verwaltung von Getränkebestellungen mit Frontend und Backend.

## Systemanforderungen

- Node.js (v14 oder höher)
- Python (v3.8 oder höher)
- pip (Python Package Manager)

## Installation

### Backend

1. Ins Backend-Verzeichnis wechseln:
```bash
cd backend
```

2. Python Virtual Environment erstellen und aktivieren:
```bash
python -m venv venv
source venv/bin/activate  # Unter Windows: venv\Scripts\activate
```

3. Dependencies installieren:
```bash
pip install -r requirements.txt
```

4. Server starten:
```bash
python main.py
```

Der Backend-Server läuft dann auf http://localhost:5000

### Frontend

1. Ins Frontend-Verzeichnis wechseln:
```bash
cd frontend
```

2. Dependencies installieren:
```bash
npm install
```

3. Development Server starten:
```bash
npm start
```

Die Anwendung läuft dann auf http://localhost:3000

## Deployment

### Backend Deployment

1. Stellen Sie sicher, dass Python und pip auf dem Server installiert sind
2. Kopieren Sie den Backend-Code auf den Server
3. Installieren Sie die Dependencies
4. Starten Sie den Server mit gunicorn oder einem ähnlichen WSGI-Server

### Frontend Deployment

1. Erstellen Sie einen Production Build:
```bash
cd frontend
npm run build
```

2. Kopieren Sie den Inhalt des `build`-Verzeichnisses auf Ihren Webserver

## Konfiguration

- Backend-Port und Host können in `backend/main.py` angepasst werden
- Frontend API-URL kann in `frontend/src/config.js` angepasst werden

## Datensicherung

Die Daten werden in JSON-Dateien im `backend/data/` Verzeichnis gespeichert:
- `drinks.json`: Getränkeliste
- `orders.json`: Bestellungen
- `statistics.json`: Statistiken

Sichern Sie diese Dateien regelmäßig.
