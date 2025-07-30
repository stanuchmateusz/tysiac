@echo off

setlocal enabledelayedexpansion

if "%~1"=="" (
    echo "Usage: %0 <assets_directory>"
    exit /b 1
) else if not exist "%~1" (
    echo "Error: Directory "%~1" does not exist."
    exit /b 1
) else (
    set "ASSETS_DIR=%~1"
)

set "OUTPUT_FILE=public\assets\skins.json"
set "TMP_FILE=tmp_skins.txt"

if exist "%OUTPUT_FILE%" del "%OUTPUT_FILE%"
if exist "%TMP_FILE%" del "%TMP_FILE%"

for /d %%D in ("%ASSETS_DIR%\*") do (
    echo %%~nxD>>"%TMP_FILE%"
)

echo [ > "%OUTPUT_FILE%"

set "first=1"
for /f "usebackq delims=" %%N in ("%TMP_FILE%") do (
    if !first! equ 1 (
        set "first=0"
        echo "%%N">> "%OUTPUT_FILE%"
    ) else (
        echo ,"%%N">> "%OUTPUT_FILE%"
    )
)

powershell -Command "(Get-Content %OUTPUT_FILE%) -replace '^(,?)\"(.*)\"$', '$1\"$2\"' | Set-Content %OUTPUT_FILE%"

powershell -Command "(Get-Content %OUTPUT_FILE%) -join '' -replace ',\]', ']' | Set-Content %OUTPUT_FILE%"

powershell -Command "(Get-Content %OUTPUT_FILE%) | ForEach-Object {if ($_ -notmatch '\]$') {$_ + ']'} else {$_}} | Set-Content %OUTPUT_FILE%"

del "%TMP_FILE%"

endlocal