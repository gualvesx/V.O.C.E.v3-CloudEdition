// background.js (VERSÃO FINAL PARA CHROME COM NATIVE MESSAGING)

// --- VARIÁVEIS GLOBAIS ---
let activeTabs = {};
let dataBuffer = [];
// [CORREÇÃO] Garante que a URL está correta para o servidor do Firebase
const BACKEND_URL = 'http://localhost:8080/api/logs'; 
const nativeHostName = 'com.meutcc.monitor';
let osUsername = 'carregando...';

// --- LÓGICA DE IDENTIFICAÇÃO (NATIVE MESSAGING) ---

function getOSUsername() {
  console.log(`Tentando obter nome de usuário via host nativo: ${nativeHostName}`);
  
  chrome.runtime.sendNativeMessage(nativeHostName, { text: "get_username_request" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('ERRO NATIVE MESSAGING:', chrome.runtime.lastError.message);
      osUsername = 'erro_host_nao_encontrado';
      return;
    }
    
    if (response && response.status === 'success') {
      osUsername = response.username;
      console.log('Nome de usuário do SO obtido com sucesso:', osUsername);
    } else {
      console.error('O script do host nativo retornou um erro:', response ? response.message : 'Resposta vazia');
      osUsername = 'erro_script_host';
    }
  });
}

// Chama a função para obter o nome de usuário assim que a extensão inicia
getOSUsername();


// --- LÓGICA PRINCIPAL DA EXTENSÃO ---

async function sendDataToServer() {
  if (dataBuffer.length === 0) {
    return; // Não envia nada se o buffer estiver vazio
  }

  try {
    const response = await fetch(BACKEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataBuffer),
    });

    if (response.ok) {
      console.log('Dados enviados com sucesso para o servidor:', dataBuffer);
      dataBuffer = []; // Limpa o buffer após o envio bem-sucedido
    } else {
      // O erro "Not Found" (404) acontece aqui se a URL estiver errada ou o servidor desligado
      console.error('Falha ao enviar dados para o servidor:', response.statusText);
    }
  } catch (error) {
    console.error('Erro de rede ao enviar dados:', error);
  }
}

// Função para registrar o tempo gasto em uma aba
function recordTime(tabId, url) {
  if (activeTabs[tabId]) {
    const startTime = activeTabs[tabId].startTime;
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const domain = new URL(url).hostname;

    // Apenas registra se o tempo for significativo (ex: > 5 segundos)
    if (durationSeconds > 5) {
      dataBuffer.push({
        aluno_id: osUsername, // <-- USANDO O NOME DE USUÁRIO DO SO OBTIDO!
        url: domain,
        durationSeconds: durationSeconds,
        timestamp: new Date().toISOString()
      });
      console.log(`[${osUsername}] Tempo para ${domain}: ${durationSeconds}s`);
    }
  }
}


// --- LISTENERS DE EVENTOS DO CHROME ---

chrome.tabs.onActivated.addListener(activeInfo => {
  const previousTabId = Object.keys(activeTabs)[0];
  if (previousTabId) {
    chrome.tabs.get(parseInt(previousTabId), (tab) => {
        if (!chrome.runtime.lastError && tab && tab.url && tab.url.startsWith('http')) {
             recordTime(parseInt(previousTabId), tab.url);
        }
        delete activeTabs[previousTabId];
    });
  }

  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (!chrome.runtime.lastError && tab.url && tab.url.startsWith('http')) {
      activeTabs[tab.id] = { startTime: Date.now() };
    }
  });
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (tab.active && changeInfo.url && changeInfo.url.startsWith('http')) {
      // Grava o tempo da URL anterior antes de atualizar
      recordTime(tabId, changeInfo.url);
      // Reinicia o contador para a nova URL
      activeTabs[tabId] = { startTime: Date.now() };
    }
});


// Cria um alarme para enviar os dados periodicamente (a cada 1 minuto para testes)
chrome.alarms.create('sendData', { periodInMinutes: 1 });

// Escuta o alarme
chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === 'sendData') {
    sendDataToServer();
  }
});

