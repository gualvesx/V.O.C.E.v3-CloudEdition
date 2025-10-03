// python_classifier.js (VERSÃO COM FALLBACK)
const { spawn } = require('child_process');
const path = require('path');

// PASSO 1: Importamos também o nosso classificador simples como "Plano B".
const simpleClassifier = require('./simple_classifier.js');

const classifier = {
  categorizar: function(domain) {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, 'classifier-tf', 'predict.py');
      
      // Tenta executar o script Python (Plano A)
      const pythonProcess = spawn('python', [scriptPath, domain]);

      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => {
        result += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      // Quando o processo terminar...
      pythonProcess.on('close', async (code) => {
        // Se o código de saída for 0, significa que a IA funcionou com sucesso!
        if (code === 0 && result.trim() !== '') {
          console.log(`[IA Python] Sucesso: ${domain} -> ${result.trim()}`);
          resolve(result.trim());
        } else {
          // PASSO 2: Se o código de saída for diferente de 0, a IA FALHOU.
          console.warn(`[IA Python] Falha ao classificar '${domain}'. Acionando fallback...`);
          console.error('Detalhe do erro Python:', error);

          // ACIONA O PLANO B: Usa o classificador simples.
          const fallbackResult = await simpleClassifier.categorizar(domain);
          console.log(`[Fallback Simples] Sucesso: ${domain} -> ${fallbackResult}`);
          resolve(fallbackResult);
        }
      });

      // Gerencia um erro caso o próprio processo 'spawn' falhe (ex: python não encontrado)
      pythonProcess.on('error', async (err) => {
        console.warn(`[IA Python] Erro crítico ao iniciar o processo para '${domain}'. Acionando fallback...`);
        console.error('Detalhe do erro de spawn:', err);
        
        // ACIONA O PLANO B também neste caso.
        const fallbackResult = await simpleClassifier.categorizar(domain);
        console.log(`[Fallback Simples] Sucesso: ${domain} -> ${fallbackResult}`);
        resolve(fallbackResult);
      });
    });
  }
};

module.exports = classifier;