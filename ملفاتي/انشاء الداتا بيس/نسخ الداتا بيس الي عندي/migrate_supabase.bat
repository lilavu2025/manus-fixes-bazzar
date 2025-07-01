@echo off
chcp 65001 >nul
setlocal

:: بيانات المشروع القديم
set OLD_PROJECT_ID=gcjqjcuwsofzrgohwleg
set PASSWORD=Wisam1996okkeh

:: طلب إدخال اسم المشروع الجديد
set /p NEW_PROJECT_ID=Write the new data base name: (like: jaaztbshqrcgtvwvevtv) (Supabase Project ID): 

:: تحديد ملف النسخة الاحتياطية
set BACKUP_FILE=old_project_backup.dump

:: تنفيذ pg_dump من المشروع القديم
echo.
echo Backing up the old project...
pg_dump "postgresql://postgres.%OLD_PROJECT_ID%:%PASSWORD%@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require" -Fc -f %BACKUP_FILE%

:: تنفيذ pg_restore للمشروع الجديد
echo.
echo Uploading the version to the new project: %NEW_PROJECT_ID% ...
pg_restore --no-owner --clean --if-exists --dbname="postgresql://postgres.%NEW_PROJECT_ID%:%PASSWORD%@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?sslmode=require" %BACKUP_FILE%

echo.
echo ✅ Transfer successful!
pause
