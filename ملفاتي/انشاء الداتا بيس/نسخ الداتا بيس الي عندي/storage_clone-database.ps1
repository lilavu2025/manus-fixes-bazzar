Write-Host "=== Supabase Storage Clone (SOURCE -> DEST) ===" -ForegroundColor Cyan

# ---- Inputs ----
$SRC_URL  = Read-Host "SOURCE Supabase URL (https://xxxx.supabase.co)"
$DEST_URL = Read-Host "DESTINATION Supabase URL (https://yyyy.supabase.co)"
$SRC_SRK  = Read-Host "SOURCE Service Role Key"
$DEST_SRK = Read-Host "DEST Service Role Key"

$SRC_EP   = Read-Host "SOURCE S3 Endpoint (https://<REF>.supabase.co/storage/v1/s3)"
$SRC_REG  = Read-Host "SOURCE Region (e.g. eu-central-1)"
$SRC_KEY  = Read-Host "SOURCE Access Key ID"
$SRC_SEC  = Read-Host "SOURCE Access Secret"

$DEST_EP  = Read-Host "DEST S3 Endpoint (https://<REF>.supabase.co/storage/v1/s3)"
$DEST_REG = Read-Host "DEST Region (e.g. eu-central-1)"
$DEST_KEY = Read-Host "DEST Access Key ID"
$DEST_SEC = Read-Host "DEST Access Secret"

$mirrorAns = Read-Host "Mirror mode (delete extras in DEST)? [Y/n]"
$DELETE = if ($mirrorAns -match '^[Nn]$') { @() } else { @("--delete") }

# ---- REST headers ----
$hSrc  = @{ apikey = $SRC_SRK;  Authorization = "Bearer $SRC_SRK" }
$hDest = @{ apikey = $DEST_SRK; Authorization = "Bearer $DEST_SRK" }

# ---- List buckets from SOURCE ----
Write-Host "Listing SOURCE buckets..." -ForegroundColor Yellow
$srcBuckets = Invoke-RestMethod -Uri "$SRC_URL/storage/v1/bucket" -Headers $hSrc
if (-not $srcBuckets) { throw "No buckets in SOURCE." }

Write-Host "Listing DEST buckets..." -ForegroundColor Yellow
$destBuckets = Invoke-RestMethod -Uri "$DEST_URL/storage/v1/bucket" -Headers $hDest
$destNames = @{}
foreach ($b in $destBuckets) { $destNames[$b.name] = $true }

# ---- Sync loop ----
foreach ($b in $srcBuckets) {
  $name = $b.name
  $pub  = $b.public

  Write-Host "---- Bucket: $name (public=$pub) ----" -ForegroundColor Green

  # Create bucket in DEST if missing
  if (-not $destNames.ContainsKey($name)) {
    Write-Host "Creating bucket in DEST: $name"
    try {
      Invoke-RestMethod -Method POST -Uri "$DEST_URL/storage/v1/bucket" `
        -Headers $hDest -ContentType "application/json" `
        -Body (@{ name=$name; public=$pub } | ConvertTo-Json)
    } catch {
      Write-Host "  (already exists or error ignored)"
    }
  }

  # Download from SOURCE
  $env:AWS_ACCESS_KEY_ID     = $SRC_KEY
  $env:AWS_SECRET_ACCESS_KEY = $SRC_SEC
  $env:AWS_DEFAULT_REGION    = $SRC_REG
  $local = Join-Path $PSScriptRoot ("tmp_" + $name)
  New-Item -ItemType Directory -Force -Path $local | Out-Null
  aws s3 sync ("s3://$name") $local --endpoint-url $SRC_EP --exact-timestamps

  # Upload to DEST
  $env:AWS_ACCESS_KEY_ID     = $DEST_KEY
  $env:AWS_SECRET_ACCESS_KEY = $DEST_SEC
  $env:AWS_DEFAULT_REGION    = $DEST_REG
  if ($DELETE.Count -gt 0) {
	  aws s3 sync $local ("s3://$name") --endpoint-url $DEST_EP --exact-timestamps --delete
	} else {
	  aws s3 sync $local ("s3://$name") --endpoint-url $DEST_EP --exact-timestamps
	}

}

Write-Host "=== DONE ===" -ForegroundColor Cyan
Read-Host "Press Enter to close..."
