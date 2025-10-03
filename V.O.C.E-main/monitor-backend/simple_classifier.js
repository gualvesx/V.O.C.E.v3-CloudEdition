// simple_classifier.js (VERSÃO APRIMORADA)

// Nosso "banco de dados" de categorias.
const categoryMap = {
  // Redes Sociais
  'facebook.com': 'Rede Social',
  'instagram.com': 'Rede Social',
  'twitter.com': 'Rede Social',
  'linkedin.com': 'Rede Social',
  'tiktok.com': 'Rede Social',
  'whatsapp.com': 'Rede Social',
  'web.whatsapp.com': 'Rede Social', // Adicionado para ser mais específico
  
  // Jogos
  'roblox.com': 'Jogos',
  'poki.com.br': 'Jogos',
  'poki.com': 'Jogos', // Adicionada a variação .com
  'clickjogos.com.br': 'Jogos',
  'store.steampowered.com': 'Jogos',
  'epicgames.com': 'Jogos',

  // Educacional
  'wikipedia.org': 'Educacional',
  'khanacademy.org': 'Educacional',
  'tensorflow.org': 'Educacional', // Adicionado
  'volta.sh': 'Educacional', // Adicionado

  // Notícias
  'g1.globo.com': 'Notícias',
  'uol.com.br': 'Notícias',
  
  // Produtividade
  'github.com': 'Produtividade',
  'trello.com': 'Produtividade',
  'stackoverflow.com': 'Produtividade',
  'docs.google.com': 'Produtividade',
  'powerbi.com': 'Produtividade', // Adicionado

  // Pesquisa
  'google.com': 'Pesquisa',

  // Compras
  'mercadolivre.com.br': 'Compras',
  'amazon.com.br': 'Compras',
};

const classifier = {
  categorizar: async function(domain) {
    if (!domain) return 'Outros';

    // Passo 1: Normaliza o domínio para minúsculas e remove o 'www.' inicial.
    let normalizedDomain = domain.toLowerCase();
    if (normalizedDomain.startsWith('www.')) {
      normalizedDomain = normalizedDomain.substring(4);
    }

    // Passo 2: Tenta uma correspondência exata (método mais rápido e preciso).
    if (categoryMap[normalizedDomain]) {
      return categoryMap[normalizedDomain];
    }

    // Passo 3: Se não houver correspondência exata, tenta uma correspondência de domínio base.
    // Isso serve para subdomínios como 'gemini.google.com' ou 'app.powerbi.com'.
    // Ele procura pela chave em nosso mapa que seja o final do domínio recebido.
    const baseDomainMatch = Object.keys(categoryMap).find(key => 
      normalizedDomain.endsWith('.' + key)
    );
    
    if (baseDomainMatch) {
      return categoryMap[baseDomainMatch];
    }

    // Se nenhuma das tentativas funcionar, classifica como 'Outros'.
    return 'Outros';
  }
};

module.exports = classifier;