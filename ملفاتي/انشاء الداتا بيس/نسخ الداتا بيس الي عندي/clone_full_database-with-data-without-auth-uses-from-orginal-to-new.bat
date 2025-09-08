@echo off
setlocal EnableExtensions

REM ============================================================
REM  Supabase Postgres -> Postgres clone (Windows .bat)
REM  Usage:
REM    clone_supabase.bat "<SRC_URL>" "<DEST_URL>" [--schema-only] [--plain]
REM
REM  Examples:
REM    clone_supabase.bat "postgresql://postgres@db.old.supabase.co:5432/postgres?sslmode=require" "postgresql://postgres@db.new.supabase.co:5432/postgres?sslmode=require"
REM    clone_supabase.bat "...old..." "...new..." --schema-only
REM    clone_supabase.bat "...old..." "...new..." --plain
REM
REM  Notes:
REM   - pg_dump, pg_restore, psql must be in PATH (PostgreSQL client tools).
REM   - Passwords are read interactively (hidden) and passed via PGPASSWORD.
REM   - If URLs already include passwords, just press Enter at the prompts.
REM   - Save as ANSI or UTF-8 WITHOUT BOM to avoid CMD parse issues.
REM   - This script EXCLUDES Supabase-managed schemas/tables by default to avoid
REM     permission errors and duplicate-key issues on auth/storage/etc.
REM ============================================================

REM -------- Inputs --------
set "SRC_URL=%~1"
set "DEST_URL=%~2"
set "MODE=%~3"
set "EXTRA=%~4"

if "%SRC_URL%"=="" (
  echo Enter SOURCE Postgres URL (without password if you prefer prompt)
  echo   e.g. postgresql://postgres@db.X.supabase.co:5432/postgres?sslmode=require
  set /p "SRC_URL=> "
)

if "%DEST_URL%"=="" (
  echo Enter DESTINATION Postgres URL (without password if you prefer prompt)
  echo   e.g. postgresql://postgres@db.Y.supabase.co:5432/postgres?sslmode=require
  set /p "DEST_URL=> "
)

set "SCHEMA_ONLY="
if /I "%MODE%"=="--schema-only" set "SCHEMA_ONLY=1"
if /I "%EXTRA%"=="--schema-only" set "SCHEMA_ONLY=1"

set "PLAIN_SQL="
if /I "%MODE%"=="--plain" set "PLAIN_SQL=1"
if /I "%EXTRA%"=="--plain" set "PLAIN_SQL=1"

REM -------- Ask for passwords (hidden). Press Enter to skip --------
set "SRC_PWD="
for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "$p=Read-Host -AsSecureString 'SOURCE password (leave empty if embedded in URL)'; if($p.Length -gt 0){ $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($p); [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) }"`) do set "SRC_PWD=%%p"

set "DEST_PWD="
for /f "usebackq delims=" %%p in (`powershell -NoProfile -Command "$p=Read-Host -AsSecureString 'DESTINATION password (leave empty if embedded in URL)'; if($p.Length -gt 0){ $b=[Runtime.InteropServices.Marshal]::SecureStringToBSTR($p); [Runtime.InteropServices.Marshal]::PtrToStringBSTR($b) }"`) do set "DEST_PWD=%%p"

echo.
echo Optional: comma-separated schemas to RESET in DEST before restore
echo   (drops and recreates them; clears leftovers)
echo   e.g. public
echo Leave empty to skip
set /p "SCHEMAS_TO_RESET=> "
echo.

REM -------- Output paths (random tag, locale-safe) --------
set "TS=%RANDOM%%RANDOM%"
set "OUTDIR=%~dp0dump_%TS%"
if not exist "%OUTDIR%" mkdir "%OUTDIR%" >nul 2>&1
set "DUMPFILE=%OUTDIR%\dump.custom"
set "SQLDUMP=%OUTDIR%\dump.sql"
set "SQLDUMP_FILTERED=%OUTDIR%\dump.filtered.sql"

REM -------- Jobs for parallel restore --------
set "JOBS=%NUMBER_OF_PROCESSORS%"
if "%JOBS%"=="" set "JOBS=4"

REM -------- Supabase-managed EXCLUDES (safe defaults) --------
REM Exclude schemas:
REM   auth, storage, realtime, graphql_public, pgbouncer, extensions, supabase_functions
REM Exclude migration tables that create conflicts:
REM   public.schema_migrations, storage.migrations
set "EXCLUDES= --exclude-schema=auth --exclude-schema=storage --exclude-schema=realtime --exclude-schema=graphql_public --exclude-schema=pgbouncer --exclude-schema=extensions --exclude-schema=supabase_functions --exclude-table=schema_migrations --exclude-table=storage.migrations"

echo =================== Settings ====================
echo Source:        %SRC_URL%
echo Destination:   %DEST_URL%
if defined SCHEMA_ONLY (echo Mode:          SCHEMA ONLY) else (echo Mode:          FULL)
if defined PLAIN_SQL (echo Dump format:    PLAIN SQL ^(filtered^) ) else (echo Dump format:    CUSTOM ^(.custom^))
if not "%SCHEMAS_TO_RESET%"=="" echo Reset schemas:  %SCHEMAS_TO_RESET%
echo Dump dir:      %OUTDIR%
echo Parallel jobs: %JOBS%
echo Excludes:      %EXCLUDES%
echo =================================================
echo.

REM -------- Tool check --------
where pg_dump >nul 2>&1 || (echo [ERROR] pg_dump not found in PATH & goto :fail)
where pg_restore >nul 2>&1 || (echo [ERROR] pg_restore not found in PATH & goto :fail)
where psql >nul 2>&1 || (echo [ERROR] psql not found in PATH & goto :fail)

REM -------- Optional: reset schemas in DEST --------
if not "%SCHEMAS_TO_RESET%"=="" (
  set "SCHEMA_LIST=%SCHEMAS_TO_RESET:,= %"
  echo Resetting schemas in DEST...
  set "PGPASSWORD=%DEST_PWD%"
  for %%S in (%SCHEMA_LIST%) do (
    echo   - DROP schema "%%S"
    psql -v ON_ERROR_STOP=1 -d "%DEST_URL%" -c "DROP SCHEMA IF EXISTS \"%%S\" CASCADE;" || goto :fail
    echo   - CREATE schema "%%S"
    psql -v ON_ERROR_STOP=1 -d "%DEST_URL%" -c "CREATE SCHEMA \"%%S\" AUTHORIZATION postgres;" || goto :fail
  )
  set "PGPASSWORD="
  echo Done resetting schemas.
  echo.
)

REM ========================== Dump ==========================
echo Dumping from SOURCE...

set "PGPASSWORD=%SRC_PWD%"
if defined PLAIN_SQL (
  if defined SCHEMA_ONLY (
    pg_dump -d "%SRC_URL%" --format=plain --no-owner --no-acl --schema-only %EXCLUDES% -f "%SQLDUMP%" || goto :fail
  ) else (
    pg_dump -d "%SRC_URL%" --format=plain --no-owner --no-acl %EXCLUDES% -f "%SQLDUMP%" || goto :fail
  )
) else (
  if defined SCHEMA_ONLY (
    pg_dump -d "%SRC_URL%" --format=custom --no-owner --no-acl --schema-only %EXCLUDES% -f "%DUMPFILE%" || goto :fail
  ) else (
    pg_dump -d "%SRC_URL%" --format=custom --no-owner --no-acl %EXCLUDES% -f "%DUMPFILE%" || goto :fail
  )
)
set "PGPASSWORD="

if defined PLAIN_SQL (
  echo Filtering incompatible SET commands...
  REM Remove lines containing SET transaction_timeout (server-version mismatch safe-guard)
  findstr /V /C:"SET transaction_timeout" "%SQLDUMP%" > "%SQLDUMP_FILTERED%"
  if errorlevel 1 (
    REM If findstr finds nothing to remove, just copy as-is
    copy /Y "%SQLDUMP%" "%SQLDUMP_FILTERED%" >nul
  )
  echo Dump created: %SQLDUMP_FILTERED%
) else (
  echo Dump created: %DUMPFILE%
)
echo.

REM ========================= Restore ========================
echo Restoring into DEST...
set "PGPASSWORD=%DEST_PWD%"

if defined PLAIN_SQL (
  psql -v ON_ERROR_STOP=1 -d "%DEST_URL%" -f "%SQLDUMP_FILTERED%" || goto :fail
) else (
  if defined SCHEMA_ONLY (
    pg_restore -d "%DEST_URL%" --clean --if-exists --no-owner --no-privileges --schema-only "%DUMPFILE%" || goto :fail
  ) else (
    pg_restore -d "%DEST_URL%" --clean --if-exists --no-owner --no-privileges --disable-triggers -j %JOBS% "%DUMPFILE%" || goto :fail
  )
)

set "PGPASSWORD="

echo.
echo SUCCESS: Clone completed.
echo Output kept at:
if defined PLAIN_SQL (
  echo   %SQLDUMP%
  echo   %SQLDUMP_FILTERED%
) else (
  echo   %DUMPFILE%
)
echo.
echo Press any key to close...
pause >nul
exit /b 0

:fail
echo.
echo [FAILED] See messages above. Common causes:
echo   - PostgreSQL client tools not in PATH
echo   - Invalid connection URL or credentials
echo   - SSL required (try adding ?sslmode=require to URLs)
echo   - Destination project lacks required extensions
echo   - Try --plain if you hit "unrecognized configuration parameter" errors
echo.
echo Press any key to close...
pause >nul
exit /b 1
