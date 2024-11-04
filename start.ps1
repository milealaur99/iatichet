[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# Setări Render API și Service ID
$render_api_key = "rnd_BmrYGfHYw6zmfXdYpOQRVNjfH3BE"
$service_id = "srv-cs6mkk5svqrc73dn9l60"
$env_group_id = "evg-cs805edumphs73afr7hg"
$env_var_key = "REACT_APP_BACKEND_URL"

# Funcții pentru afișarea mesajelor dinamice
function Log {
    param ([string]$message)
    Write-Host "✅ $message" -ForegroundColor Green
    Write-Host ""
}

function InfoLog {
    param ([string]$message)
    Write-Host "🔄 $message" -ForegroundColor Yellow
    Write-Host ""
}

function ErrorLog {
    param ([string]$message)
    Write-Host "❌ $message" -ForegroundColor Red
    Write-Host ""
}

function Loading {
    param ([string]$message)
    Write-Host "⏳ $message" -ForegroundColor Cyan
    Write-Host ""
}

# Check if Docker Compose is installed
function CheckDockerCompose {
    try {
        docker-compose --version
    } catch {
        ErrorLog "Docker Compose is not installed. Installing Docker Compose..."
        brew install docker-compose
    }
}

# Check if Ngrok is installed
function CheckNgrok {
    try {
        ngrok version
    } catch {
        ErrorLog "Ngrok is not installed. Installing Ngrok..."
        brew install ngrok
    }
}

# Add Ngrok authtoken if not authenticated
function AuthenticateNgrok {
    try {
        $ngrok_version = ngrok version
        if ($ngrok_version -notmatch "authenticated") {
            InfoLog "Ngrok is not authenticated. Adding authtoken..."
            ngrok config add-authtoken "2nWnlou7c6TWCiPmvlabD7STo9S_5qUF9NaFkfkdrvCs4wV8K"
            Log "Ngrok authenticated successfully."
        } else {
            Log "Ngrok is already authenticated."
        }
    } catch {
        ErrorLog "Error checking Ngrok authentication. Trying to add authtoken..."
        ngrok config add-authtoken "2nWnlou7c6TWCiPmvlabD7STo9S_5qUF9NaFkfkdrvCs4wV8K"
        Log "Ngrok authenticated successfully."
    }
}

# Ensure Docker Compose and Ngrok are installed
CheckDockerCompose
CheckNgrok

# Authenticate Ngrok if needed
AuthenticateNgrok

# Start backend with Docker Compose
Log "🔥 Starting backend with Docker Compose..."
docker-compose up -d backend

# Start Ngrok
Log "🔌 Starting Ngrok on port 5000..."
Start-Process -FilePath "ngrok" -ArgumentList "http 5000" -NoNewWindow -PassThru | Out-Null
Start-Sleep -Seconds 5

# Get Ngrok URL
Log "🔗 Fetching Ngrok URL..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels"
    $ngrok_url = $response.tunnels[0].public_url
    Log "Ngrok URL: $ngrok_url"
} catch {
    ErrorLog "Could not get the Ngrok URL. Please check if Ngrok is running."
    exit 1
}

# Update environment variable on Render.com
Loading "🌍 Updating environment variable on Render.com for your frontend..."
$headers = @{
    "accept" = "application/json"
    "Authorization" = "Bearer $render_api_key"
    "content-type" = "application/json"
}
$body = "{""value"":""$ngrok_url""}"
$response = Invoke-WebRequest -Uri "https://api.render.com/v1/env-groups/$env_group_id/env-vars/$env_var_key" -Method PUT -Headers $headers -ContentType 'application/json' -Body $body

if ($response.StatusCode -ne 200) {
    ErrorLog "Error updating the environment variable on Render.com!"
    exit 1
}
Log "Environment variable updated successfully on Render.com!"

# Trigger deployment
InfoLog "🟢 Starting frontend deployment on Render.com..."
$deploy_body = '{"clearCache":"do_not_clear"}'
$deploy_response = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$service_id/deploys" -Method POST -Headers $headers -ContentType 'application/json' -Body $deploy_body

if (-not $deploy_response) {
    ErrorLog "Invalid response from Render API."
    exit 1
}

# Extract deploy ID and handle cases where it might be null
try {
    $deploy_id = $deploy_response.Content | ConvertFrom-Json | Select-Object -ExpandProperty id
    if (-not $deploy_id) {
        throw "Missing deploy ID!"
    }
    InfoLog "Deployment ID: $deploy_id"
} catch {
    ErrorLog "Error extracting deployment ID: $_"
    exit 1
}

# Polling the deployment status
Loading "Waiting for deployment to complete..."
$deploy_status = ""
$deploy_complete = $false
do {
    Start-Sleep -Seconds 10
    $status_response = Invoke-WebRequest -Uri "https://api.render.com/v1/services/$service_id/deploys/$deploy_id" -Method GET -Headers $headers
    $deploy_response = $status_response.Content | ConvertFrom-Json
    $deploy_status = $deploy_response.status

    # Check and display status
    switch ($deploy_status) {
        "created" { InfoLog "🚀 Deployment has been created." }
        "build_in_progress" { InfoLog "🏗️ Build is in progress." }
        "update_in_progress" { InfoLog "🔄 Update is in progress." }
        "live" { 
            Log "✅ Service is live." 
            $deploy_complete = $true 
        }
        "deactivated" { 
            ErrorLog "🛑 Service is deactivated." 
            $deploy_complete = $true 
        }
        "build_failed" { 
            ErrorLog "Build failed." 
            $deploy_complete = $true 
        }
        "update_failed" { 
            ErrorLog "Update failed." 
            $deploy_complete = $true 
        }
        "canceled" { 
            ErrorLog "Deployment was canceled." 
            $deploy_complete = $true 
        }
        "pre_deploy_in_progress" { InfoLog "Pre-deployment in progress." }
        "pre_deploy_failed" { 
            ErrorLog "Pre-deployment failed." 
            $deploy_complete = $true 
        }
        default { InfoLog "🔄 Current status: $deploy_status" }
    }
} while (-not $deploy_complete)

# Final log
if ($deploy_status -eq "live") {
    Log "Deployment completed successfully!"
} else {
    ErrorLog "Deployment failed!"
}

Log "🎉 Everything is set! Frontend is now connected to the backend exposed via Ngrok!"
