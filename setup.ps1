# CodeNest Installation and Setup Script
# Run this script from the project root directory

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   CodeNest Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js $nodeVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check npm installation
Write-Host "Checking npm installation..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✓ npm $npmVersion is installed" -ForegroundColor Green
} catch {
    Write-Host "✗ npm is not installed!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Installing Dependencies" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Install root dependencies
Write-Host "Installing root dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install root dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Root dependencies installed" -ForegroundColor Green
Write-Host ""

# Install server dependencies
Write-Host "Installing server dependencies..." -ForegroundColor Yellow
Set-Location server
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install server dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✓ Server dependencies installed" -ForegroundColor Green
Set-Location ..
Write-Host ""

# Install client dependencies
Write-Host "Installing client dependencies..." -ForegroundColor Yellow
Set-Location client
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install client dependencies" -ForegroundColor Red
    Set-Location ..
    exit 1
}
Write-Host "✓ Client dependencies installed" -ForegroundColor Green
Set-Location ..
Write-Host ""

# Check if .env exists
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Environment Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

if (Test-Path "server\.env") {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
} else {
    Write-Host "Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item "server\.env.example" "server\.env"
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: You need to configure your .env file!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Edit server\.env and add:" -ForegroundColor Yellow
    Write-Host "  1. MongoDB URI (from MongoDB Atlas)" -ForegroundColor Yellow
    Write-Host "  2. JWT Secret (any random string)" -ForegroundColor Yellow
    Write-Host "  3. Gemini API Key (from Google AI Studio)" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "See SETUP.md for detailed instructions" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Setup Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Configure server\.env with your credentials" -ForegroundColor White
Write-Host "  2. Run: npm run dev" -ForegroundColor White
Write-Host "  3. Open: http://localhost:3000" -ForegroundColor White
Write-Host ""
Write-Host "For detailed setup instructions, see SETUP.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Happy coding with CodeNest! 🚀" -ForegroundColor Green
