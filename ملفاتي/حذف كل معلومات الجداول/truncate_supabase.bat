@echo off
chcp 65001 >nul

setlocal

:: طلب اسم المشروع (database ID)
set /p project_id=Write the new data base name: (like: jaaztbshqrcgtvwvevtv) 

:: إعداد الاتصال
set USER=postgres.%project_id%
set PASSWORD=Wisam1996okkeh
set HOST=aws-0-eu-central-1.pooler.supabase.com
set PORT=5432
set DBNAME=postgres

:: تنفيذ أمر TRUNCATE لكل الجداول
echo Data is being cleared from all tables for the project. %project_id% ...
psql "postgresql://%USER%:%PASSWORD%@%HOST%:%PORT%/%DBNAME%?sslmode=require" -c "DO $$ DECLARE r RECORD; BEGIN FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP EXECUTE 'TRUNCATE TABLE public.' || quote_ident(r.tablename) || ' CASCADE'; END LOOP; END $$;"

echo.
echo ✅ Data from all tables has been successfully cleared.
pause
