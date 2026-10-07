Write-Host "Starting backend and frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Megha K\OneDrive\Desktop\Website\EcommerceApp\backend'; npm run dev"
Start-Sleep -Seconds 2
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Megha K\OneDrive\Desktop\Website\EcommerceApp\frontend'; npm run dev"
Write-Host "Both servers launched in separate windows." -ForegroundColor Green
Write-Host "Open the Vite URL when it appears." -ForegroundColor Yellow