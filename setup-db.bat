@echo off
echo ============================================================
echo  Smart Finance - Setup PostgreSQL Database
echo ============================================================

REM Su dung duong dan PostgreSQL da tim thay tren may
SET PSQL=E:\PostgresSQL\18\bin\psql.exe
SET PGPORT=5433

IF NOT EXIST "%PSQL%" (
  echo [ERROR] Khong tim thay PostgreSQL tai %PSQL%
  pause
  exit /b 1
)

echo [OK] Tim thay PostgreSQL: %PSQL% (Port: %PGPORT%)
echo.

REM Yeu cau password postgres
SET /p PG_PASSWORD=Nhap mat khau cua tui PostgreSQL (user postgres): 
SET PGPASSWORD=%PG_PASSWORD%

echo.
echo [1/3] Tao database smart_finance...
"%PSQL%" -U postgres -p %PGPORT% -c "CREATE DATABASE smart_finance;" 2>NUL
IF ERRORLEVEL 1 (
  echo Thong cao: Chay tiep tuc (Cac ban co the can nhap dung mat khau).
)

echo [2/3] Khoi tao schema va du lieu mau...
"%PSQL%" -U postgres -p %PGPORT% -d smart_finance -f "%~dp0backend\init.sql"
IF ERRORLEVEL 1 (
  echo [ERROR] Khoi tao du lieu that bai! Vui long kiem tra lai Password.
  pause
  exit /b 1
)

echo.
echo [3/3] Hoan thanh!
echo.
echo ============================================================
echo  Database da san sang!
echo ============================================================
echo.
pause
