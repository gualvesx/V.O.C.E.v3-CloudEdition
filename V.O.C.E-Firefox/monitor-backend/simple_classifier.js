// ================================================================
//         Classificador Simples por Dataset - V.O.C.E TCC
// ================================================================

const fs = require('fs');
const path = require('path');

const categoryMap = {};

try {
    const datasetPath = path.join(__dirname, 'classifier-tf', 'dataset.csv');
    const csvData = fs.readFileSync(datasetPath, 'utf8');
    const lines = csvData.split(/\r?\n/);
    lines.forEach(line => {
        if (line && line.toLowerCase().trim() !== 'dominio,categoria') {
            const parts = line.split(',');
            if (parts.length === 2) {
                const domain = parts[0].trim().toLowerCase();
                const category = parts[1].trim();
                if(domain && category) {
                    categoryMap[domain] = category;
                }
            }
        }
    });
    console.log(`[Fallback Simples] Dataset carregado com ${Object.keys(categoryMap).length} domínios.`);
} catch (error) {
    console.error('[Fallback Simples] Erro crítico: Não foi possível carregar o dataset.csv.', error);
}

const classifier = {
  categorizar: async function(domain) {
    if (!domain) return 'Outros';
    let normalizedDomain = domain.toLowerCase().replace('www.', '');
    if (categoryMap[normalizedDomain]) {
      return categoryMap[normalizedDomain];
    }
    const baseDomainMatch = Object.keys(categoryMap).find(key => 
      normalizedDomain.endsWith('.' + key)
    );
    if (baseDomainMatch) {
      return categoryMap[baseDomainMatch];
    }
    return 'Outros';
  }
};

module.exports = classifier;

