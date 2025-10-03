# native_host.py
import sys
import json
import os
import struct

# Função para enviar uma mensagem para a extensão
def send_message(message):
    # Codifica a mensagem em UTF-8
    encoded_message = json.dumps(message).encode('utf-8')
    # Escreve o tamanho da mensagem (4 bytes) e depois a mensagem em si
    # Este é o protocolo que o Chrome exige
    sys.stdout.buffer.write(struct.pack('@I', len(encoded_message)))
    sys.stdout.buffer.write(encoded_message)
    sys.stdout.buffer.flush()

try:
    # Pega o nome de usuário do Sistema Operacional
    # os.getlogin() é uma forma robusta de fazer isso
    username = os.getlogin()
    # Envia a mensagem de sucesso de volta para a extensão
    send_message({'status': 'success', 'username': username})
except Exception as e:
    # Em caso de erro, envia uma mensagem de erro
    send_message({'status': 'error', 'message': str(e)})