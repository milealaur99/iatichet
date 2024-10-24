#!/bin/bash

# Definire variabile pentru Render API și serviciu
RENDER_API_KEY="rnd_BmrYGfHYw6zmfXdYpOQRVNjfH3BE"
SERVICE_ID="cs6mkk5svqrc73dn9l60"
FRONTEND_SERVICE_ID="cs6mkk5svqrc73dn9l60D"

# Funcție pentru a afișa mesaje profesionale cu emoji
function log {
  echo -e "\e[32m$1\e[0m"
}

function error {
  echo -e "\e[31m$1\e[0m"
}

# 🔥 Pornește backend-ul local
log "🔥 Pornesc backend-ul cu Docker Compose..."
docker-compose up -d backend

# 🔌 Pornește Ngrok în fundal pentru portul 5000
log "🔌 Pornesc Ngrok pe portul 5000 pentru a expune backend-ul..."
ngrok http 5000 --log=stdout > ngrok.log &

# Așteaptă câteva secunde pentru a permite Ngrok să pornească
sleep 5

# 🔗 Obține URL-ul generat de Ngrok
log "🔗 Obțin URL-ul generat de Ngrok..."
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')

# Verifică dacă URL-ul a fost obținut
if [ -z "$NGROK_URL" ]; then
  error "❌ Nu am reușit să obțin URL-ul de la Ngrok. Verifică dacă Ngrok rulează."
  exit 1
fi

log "🔗 URL-ul generat de Ngrok este: $NGROK_URL"

# 🌍 Actualizează variabila de mediu pe Render.com
log "🌍 Actualizez variabila de mediu pe Render.com pentru frontend-ul tău..."
RESPONSE=$(curl -X PATCH "https://api.render.com/v1/services/$SERVICE_ID/env-vars" \
-H "Authorization: Bearer $RENDER_API_KEY" \
-H "Content-Type: application/json" \
-d '[
      {
        "key": "REACT_APP_BACKEND_URL",
        "value": "'$NGROK_URL'"
      }
    ]')

if echo "$RESPONSE" | grep -q 'error'; then
  error "❌ Eroare la actualizarea variabilei de mediu pe Render.com!"
  exit 1
fi

log "✅ Variabila de mediu a fost actualizată cu succes pe Render.com!"

# 🟢 Pornește frontend-ul pe Render.com
log "🟢 Pornește frontend-ul pe Render..."
START_FRONTEND_RESPONSE=$(curl -X POST "https://api.render.com/v1/services/$FRONTEND_SERVICE_ID/deploys" \
-H "Authorization: Bearer $RENDER_API_KEY" \
-H "Content-Type: application/json")

if echo "$START_FRONTEND_RESPONSE" | grep -q 'error'; then
  error "❌ Eroare la pornirea frontend-ului pe Render.com!"
  exit 1
fi

log "✅ Frontend-ul a fost pornit cu succes pe Render.com!"

# 🎉 Toate etapele finalizate cu succes
log "🎉 Totul este gata! Aplicația ta este acum live. Frontend-ul se conectează la backend-ul tău local expus prin Ngrok!"
