@echo off
:: ###############################################################
:: ##    Instalador Robusto do Host Nativo - V.O.C.E TCC        ##
:: ##    Instala o Host Nativo E a extensão para Firefox.       ##
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
:: 2. Configuração e Verificações Iniciais
:: ---------------------------------------------------------------
set HOST_NAME=com.meutcc.monitor
set INSTALL_DIR=%PROGRAMDATA%\TccMonitorHost
set FIREFOX_EXTENSION_ID=monitor-tcc@meuprojeto.com
set CHROME_EXTENSION_ID=gibfcbaaebnfmomilkkiidahdnaeilme
set FIREFOX_XPI_NAME=monitor_firefox.xpi

cls
echo =================================================================
echo  Instalador Completo V.O.C.E (Host Nativo + Extensao Firefox)
echo =================================================================
echo.

echo [PASSO 1 de 6] Verificando instalacao do Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo  ERRO CRITICO: Python nao foi encontrado no PATH do sistema.
    echo  Por favor, instale Python (versao 3+) e certifique-se
    echo  de marcar a opcao "Add Python to PATH" durante a instalacao.
    echo.
    pause
    exit /b
)
echo Python encontrado. Sucesso!
echo.

:: ---------------------------------------------------------------
:: 3. Instalação do Host Nativo
:: ---------------------------------------------------------------
echo --- Iniciando a instalacao do Host Nativo ---
echo.

echo [PASSO 2 de 6] Criando diretorio de instalacao...
if not exist "%INSTALL_DIR%" mkdir "%INSTALL_DIR%"
if not exist "%INSTALL_DIR%\" (
    echo ERRO: Nao foi possivel criar o diretorio %INSTALL_DIR%.
    pause
    exit /b
)
echo Diretorio criado: %INSTALL_DIR%
echo.

echo [PASSO 3 de 6] Copiando arquivos do aplicativo...
copy "native_host.py" "%INSTALL_DIR%" > nul
copy "run_host.bat" "%INSTALL_DIR%" > nul
if not exist "%INSTALL_DIR%\native_host.py" (
    echo ERRO: Nao foi possivel copiar os arquivos do host.
    pause
    exit /b
)
echo Arquivos do host copiados com sucesso.
echo.

echo [PASSO 4 de 6] Gerando o arquivo de manifesto 'host_manifest.json'...
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
if not exist "%MANIFEST_PATH%" (
    echo ERRO: Nao foi possivel criar o arquivo de manifesto.
    pause
    exit /b
)
echo Manifesto criado com sucesso.
echo.

echo [PASSO 5 de 6] Configurando o Registro do Windows para o Host...
set REG_KEY_CHROME="HKCU\SOFTWARE\Google\Chrome\NativeMessagingHosts\%HOST_NAME%"
reg add %REG_KEY_CHROME% /ve /t REG_SZ /d "%MANIFEST_PATH%" /f > nul
if %errorlevel% neq 0 ( echo ERRO ao configurar o registro para o Chrome. ) else ( echo Registro do Chrome configurado. )

set REG_KEY_FIREFOX_HOST="HKCU\SOFTWARE\Mozilla\NativeMessagingHosts\%HOST_NAME%"
reg add %REG_KEY_FIREFOX_HOST% /ve /t REG_SZ /d "%MANIFEST_PATH%" /f > nul
if %errorlevel% neq 0 ( echo ERRO ao configurar o registro do host para o Firefox. ) else ( echo Registro do Host para Firefox configurado. )
echo.

:: ---------------------------------------------------------------
:: 4. Instalação Automática da Extensão do Firefox
:: ---------------------------------------------------------------
echo --- Iniciando a instalacao da extensao do Firefox ---
echo.
echo [PASSO 6 de 6] Configurando a instalacao automatica da extensao...

if not exist "%FIREFOX_XPI_NAME%" (
    echo AVISO: Arquivo '%FIREFOX_XPI_NAME%' nao encontrado.
    echo A instalacao automatica da extensao do Firefox foi pulada.
    echo Crie o arquivo .xpi e coloque-o nesta pasta para instalar automaticamente.
    goto EndInstall
)

echo Arquivo '%FIREFOX_XPI_NAME%' encontrado.
copy "%FIREFOX_XPI_NAME%" "%INSTALL_DIR%" > nul
set XPI_PATH=%INSTALL_DIR%\%FIREFOX_XPI_NAME%

if not exist "%XPI_PATH%" (
    echo ERRO: Falha ao copiar o arquivo da extensao.
    goto EndInstall
)

set REG_KEY_FIREFOX_EXT="HKLM\SOFTWARE\Mozilla\Firefox\Extensions"
reg add %REG_KEY_FIREFOX_EXT% /v %FIREFOX_EXTENSION_ID% /t REG_SZ /d "%XPI_PATH%" /f > nul
if %errorlevel% neq 0 (
    echo ERRO: Falha ao criar a chave de registro para a extensao do Firefox.
    echo Tente garantir que o script foi executado como administrador.
) else (
    echo Extensao do Firefox sera instalada na proxima vez que o navegador for aberto.
)
echo.

:EndInstall
echo --- Instalacao concluida com sucesso! ---
echo.
pause

