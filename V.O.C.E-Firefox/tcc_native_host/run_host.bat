@echo off
:: Este script usa o comando 'python' que estiver no PATH do sistema
:: para executar nosso script Python. O %~dp0 aponta para o diretório
:: onde este .bat está, tornando o caminho para o native_host.py relativo.
python "%~dp0\native_host.py"