@echo off
setlocal
cd /d "%~dp0"
if not exist "css\style.css" (
  echo GAGAL: css\style.css tidak ditemukan.
  pause
  exit /b 1
)
if not exist "css\cli-lab.css" (
  echo GAGAL: css\cli-lab.css tidak ditemukan.
  pause
  exit /b 1
)
set /a count=0
for %%F in (
 "bootstrap-blue.css" "cli-polish.css" "cli-sprint4a.css" "cli-sprint4b.css"
 "portal-polish.css" "responsive.css" "sprint4a.css" "sprint6-cli.css"
 "sprint6.css" "sprint7.css" "sprint8.css" "supabase-portal.css" "ui-polish.css"
) do (
 if exist "css\%%~F" (
  del "css\%%~F"
  if not exist "css\%%~F" (
   echo Dihapus: css\%%~F
   set /a count+=1
  ) else (
   echo GAGAL menghapus: css\%%~F
  )
 )
)
echo.
echo Selesai! CSS RoutingLab aktif sekarang hanya style.css dan cli-lab.css.
echo File lain di proyek tidak disentuh.
pause
