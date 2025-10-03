@echo off
:: ###############################################################
:: ##   Desinstalador do Host Nativo - V.O.C.E TCC              ##
:: ###############################################################

:: ---------------------------------------------------------------
:: 1. Requisita elevação para administrador
:: ---------------------------------------------------------------
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Solicitando privilegios de administrador...
    goto UACPrompt
) else ( goto gotAdmin )

:UACPrompt
    echo Set UAC = CreateObject^("Shell.Application"^) > "%temp%\getadmin.vbs"
    echo UAC.ShellExecute "%~s0", "", "", "runas", 1 >> "%temp%\getadmin.vbs"
    "%temp%\getadmin.vbs"
    exit /B

:gotAdmin
    if exist "%temp%\getadmin.vbs" ( del "%temp%\getadmin.vbs" )
    pushd "%CD%"
    CD /D "%~dp0"
    
:: ---------------------------------------------------------------
:: 2. Desinstalação
:: ---------------------------------------------------------------
set HOST_NAME=com.meutcc.monitor
set INSTALL_DIR=%PROGRAMDATA%\TccMonitorHost

echo.
echo --- Iniciando a desinstalacao ---

echo.
echo [1/3] Removendo chaves do Registro...
set REG_KEY_CHROME="HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\%HOST_NAME%"
reg delete %REG_KEY_CHROME% /f > nul
echo Chave do Chrome removida.

set REG_KEY_FIREFOX="HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\%HOST_NAME%"
reg delete %REG_KEY_FIREFOX% /f > nul
echo Chave do Firefox removida.

echo.
echo [2/3] Removendo arquivos de instalacao...
if exist "%INSTALL_DIR%" (
    rmdir /s /q "%INSTALL_DIR%"
    echo Diretorio %INSTALL_DIR% removido.
) else (
    echo Diretorio de instalacao nao encontrado.
)

echo.
echo [3/3] Limpeza finalizada.
echo.
echo --- Desinstalacao concluida com sucesso! ---
echo.
pause
