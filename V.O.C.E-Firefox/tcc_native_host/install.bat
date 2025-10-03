@echo off
:: ###############################################################
:: ##    Instalador Dinâmico do Host Nativo - V.O.C.E TCC       ##
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
:: 2. Configuração e Coleta de Informações
:: ---------------------------------------------------------------
set HOST_NAME=com.meutcc.monitor
set INSTALL_DIR=%PROGRAMDATA%\TccMonitorHost
set FIREFOX_EXTENSION_ID=monitor-tcc@meuprojeto.com

echo.
echo =================================================================
echo  Instalador do Host Nativo para a Extensao V.O.C.E
echo =================================================================
echo.
echo Para continuar, voce precisa do ID da sua extensao do Chrome.
echo 1. Abra o Chrome e va para a pagina de extensoes: chrome://extensions
echo 2. Ative o "Modo de desenvolvedor" no canto superior direito.
echo 3. Encontre a extensao "Monitor de Atividade V.O.C.E" e copie o ID.
echo    (E uma longa sequencia de letras).
echo.
set /p CHROME_EXTENSION_ID="Digite o ID da extensao do Chrome e pressione Enter: "

if "%CHROME_EXTENSION_ID%"=="" (
    echo ID da extensao nao pode ser vazio. Instalacao abortada.
    pause
    exit /b
)

:: ---------------------------------------------------------------
:: 3. Instalação
:: ---------------------------------------------------------------
echo.
echo --- Iniciando a instalacao ---

echo.
echo [1/4] Criando diretorio de instalacao em %INSTALL_DIR%...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"

echo.
echo [2/4] Copiando arquivos do aplicativo...
copy "native_host.py" "%INSTALL_DIR%"
copy "run_host.bat" "%INSTALL_DIR%"

echo.
echo [3/4] Gerando o arquivo de manifesto 'host_manifest.json' dinamicamente...
set MANIFEST_PATH=%INSTALL_DIR%\host_manifest.json
set RUN_HOST_PATH=%INSTALL_DIR%\run_host.bat
(
  echo {
  echo   "name": "%HOST_NAME%",
  echo   "description": "Host nativo para o TCC de monitoramento",
  echo   "path": "%RUN_HOST_PATH:\=\\%",
  echo   "type": "stdio",
  echo   "allowed_origins": [
  echo     "chrome-extension://%CHROME_EXTENSION_ID%/"
  echo   ],
  echo   "allowed_extensions": [
  echo     "%FIREFOX_EXTENSION_ID%"
  echo   ]
  echo }
) > "%MANIFEST_PATH%"
echo Manifesto criado com sucesso!

echo.
echo [4/4] Configurando as chaves do Registro para Chrome e Firefox...
set REG_KEY_CHROME="HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\%HOST_NAME%"
reg add %REG_KEY_CHROME% /ve /t REG_SZ /d "%MANIFEST_PATH%" /f > nul
echo Chave do Chrome configurada.

set REG_KEY_FIREFOX="HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\%HOST_NAME%"
reg add %REG_KEY_FIREFOX% /ve /t REG_SZ /d "%MANIFEST_PATH%" /f > nul
echo Chave do Firefox configurada.

echo.
echo --- Instalacao concluida com sucesso! ---
echo O host nativo foi instalado e configurado para a extensao com ID: %CHROME_EXTENSION_ID%
echo.
pause
