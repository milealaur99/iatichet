[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Setări Render API și Service ID
$render_api_key = "rnd_BmrYGfHYw6zmfXdYpOQRVNjfH3BE"
$service_id = "srv-cs6mkk5svqrc73dn9l60"  # ID-ul corect pentru frontend-ul tău
$env_group_id = "evg-cs805edumphs73afr7hg"  # Specific Environment Group ID
$env_var_key = "REACT_APP_BACKEND_URL"    # Specific Environment Variable Key

# Funcție pentru afișarea mesajelor în consola PowerShell
function Log {
    param ([string]$message)
    Write-Host "$message" -ForegroundColor Green
}

function ErrorLog {
    param ([string]$message)
    Write-Host "$message" -ForegroundColor Red
}

# 🔥 Pornește backend-ul cu Docker Compose
Log "🔥 Pornesc backend-ul cu Docker Compose..."
docker-compose up -d backend

# 🔌 Pornește Ngrok pentru a expune backend-ul
Log "🔌 Pornesc Ngrok pe portul 5000..."
Start-Process -NoNewWindow -FilePath "ngrok" -ArgumentList "http 5000"

# Așteaptă pentru ca Ngrok să pornească
Start-Sleep -Seconds 5

# 🔗 Obține URL-ul generat de Ngrok
Log "🔗 Obțin URL-ul Ngrok..."
$headers = @{
    "ngrok-skip-browser-warning" = "true"
}
$response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -Headers $headers
$ngrok_url = $response.tunnels[0].public_url

# Verifică dacă URL-ul a fost obținut corect
if (-not $ngrok_url) {
    ErrorLog "❌ Nu am reușit să obțin URL-ul de la Ngrok. Verifică dacă Ngrok rulează."
    exit 1
}

Log "🔗 URL-ul generat de Ngrok este: $ngrok_url"

# 🌍 Actualizează variabila de mediu pe Render.com
Log "🌍 Actualizez variabila de mediu pe Render.com pentru frontend-ul tău..."

# Setarea header-urilor
$headers=@{
    "accept" = "application/json"
    "Authorization" = "Bearer $render_api_key"
    "content-type" = "application/json"
}

# Structurarea datelor pentru cerere (adăugare câmp value corect)
$body = "{""value"":""$ngrok_url""}"

# Trimite cererea pentru actualizarea variabilei de mediu
$response = Invoke-WebRequest -Uri "https://api.render.com/v1/env-groups/$env_group_id/env-vars/$env_var_key" -Method PUT -Headers $headers -ContentType 'application/json' -Body $body

if ($response.StatusCode -ne 200) {
    ErrorLog "❌ Eroare la actualizarea variabilei de mediu pe Render.com!"
    exit 1
}

Log "✅ Variabila de mediu a fost actualizată cu succes pe Render.com!"

# 🟢 Trigger deployment for frontend service
Log "🟢 Pornesc frontend-ul pe Render.com..."

# Body pentru trigger deploy
$deploy_body = '{"clearCache":"do_not_clear"}'

$deploy_response = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$service_id/deploys" -Method POST -Headers $headers -ContentType 'application/json' -Body $deploy_body

if ($deploy_response.StatusCode -ne 201) {
    ErrorLog "❌ Eroare la pornirea frontend-ului pe Render.com!"
    exit 1
}

Log "✅ Frontend-ul a fost pornit cu succes pe Render.com!"

# 🎉 Finalizare
Log "🎉 Totul este gata! Frontend-ul este acum conectat la backend-ul local expus prin Ngrok!"
