// ================================================================
//         Orquestrador de Classificação - V.O.C.E TCC
// ================================================================

const { spawn } = require('child_process');
const path = require('path');
const simpleClassifier = require('./simple_classifier.js');

const classifier = {
  categorizar: async function(domain) {
    const simpleResult = await simpleClassifier.categorizar(domain);
    if (simpleResult !== 'Outros') {
      console.log(`[Classificador Simples] Sucesso: ${domain} -> ${simpleResult}`);
      return simpleResult;
    }

    console.log(`[IA Python] Acionando IA para '${domain}' (não encontrado no dataset)...`);
    
    return new Promise((resolve) => {
      const scriptPath = path.join(__dirname, 'classifier-tf', 'predict.py');
      const pythonProcess = spawn('python', [scriptPath, domain]);
      let result = '';
      let error = '';

      pythonProcess.stdout.on('data', (data) => { result += data.toString(); });
      pythonProcess.stderr.on('data', (data) => { error += data.toString(); });

      pythonProcess.on('close', (code) => {
        if (code === 0 && result.trim() !== '') {
          const category = result.trim();
          console.log(`[IA Python] Sucesso: ${domain} -> ${category}`);
          resolve(category);
        } else {
          console.error(`[IA Python] Falha ao classificar '${domain}':`, error);
          resolve('Outros');
        }
      });
      pythonProcess.on('error', (err) => {
        console.error(`[IA Python] Erro crítico ao iniciar o processo para '${domain}':`, err);
        resolve('Outros');
      });
    });
  }
};

module.exports = classifier;

