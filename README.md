# V.O.C.E - Visualização e Observação do Comportamento do Estudante

**Autor:** Gustavo, Sidney e Ana  
**Orientador:** Leonardo e Anderson  
**Instituição:** Senai 
**Curso:** Dev 2B  

---

## 1. Introdução e Justificativa

Em laboratórios de informática, a gestão do foco dos alunos é um desafio constante para os professores. Ferramentas de monitorização existem, mas muitas vezes carecem de automação, inteligência e uma visão consolidada da atividade. O projeto **V.O.C.E** (Visualização e Observação do Comportamento do Estudante) foi desenvolvido como uma solução completa para este problema.

O sistema utiliza uma extensão de navegador para recolher dados de uso de forma não intrusiva, um backend robusto para processar e armazenar essa informação, e um classificador de Inteligência Artificial para categorizar os sites visitados, fornecendo ao professor uma visão clara e em tempo real sobre o comportamento dos alunos.

## 2. Funcionalidades Principais

-   **Monitorização Automática:** A extensão de navegador monitoriza o tempo de atividade em cada site visitado.
-   **Identificação do Utilizador:** Através da tecnologia de Host Nativo, a extensão deteta automaticamente o nome de utilizador do sistema operativo, associando a atividade à máquina correta sem configuração manual.
-   **Classificação com IA:** Um modelo de Rede Neural Convolucional (CNN) treinado com TensorFlow e Python analisa as URLs e classifica-as em categorias (ex: `Rede Social`, `Jogos`, `Educacional`).
-   **Dashboard Interativo:** Uma interface web construída com Node.js e EJS permite ao professor visualizar os dados através de gráficos e tabelas, aplicar filtros e analisar a atividade em tempo real.
-   **Armazenamento Centralizado:** Todos os dados são armazenados de forma segura numa base de dados MariaDB (MySQL), permitindo análises históricas.
-   **Compatibilidade Multi-navegador:** A solução é projetada para ser compatível com os principais navegadores do mercado, como Google Chrome, Microsoft Edge e Mozilla Firefox, com configurações específicas para cada um.

## 3. Histórias de Usuário (Épicos)

Esta secção descreve as necessidades gerais do projeto do ponto de vista do utilizador final (o professor ou administrador do laboratório).

| ID Épico | Como um(a)... (Persona) | Eu quero... (Necessidade) | Para que eu possa... (Resultado) |
| :--- | :--- | :--- | :--- |
| **EPIC-01** | Professor(a) | Visualizar a atividade de navegação dos alunos em tempo real | Garantir que eles estão focados nas tarefas da aula e não em distrações. |
| **EPIC-02** | Professor(a) | Ter uma forma automática e fiável de identificar qual aluno está a usar cada computador | Associar a atividade de navegação à pessoa correta sem precisar de configurar manualmente cada máquina. |
| **EPIC-03** | Administrador(a) do Laboratório | Gerir e analisar dados de uso dos computadores ao longo do tempo | Identificar padrões de uso, sites mais acedidos e otimizar os recursos do laboratório. |
| **EPIC-04** | Professor(a) | Ter uma interface gráfica intuitiva para consultar os dados recolhidos | Analisar as informações de forma rápida através de gráficos e filtros, sem precisar de aceder diretamente à base de dados. |
| **EPIC-05** | Administrador(a) do Sistema | Instalar e configurar a solução de monitorização de forma centralizada e imutável | Garantir que a extensão de monitorização está sempre ativa e que os alunos não a podem desativar ou remover. |
| **EPIC-06** | Professor(a) | Exportar ou consolidar os dados de atividade recolhidos | Ter um registo formal que pode ser enviado para plataformas como o Power BI para análises mais aprofundadas e relatórios institucionais. |


## 4. Tecnologias Utilizadas

Este projeto foi construído com uma stack de tecnologias modernas e robustas, escolhidas para garantir eficiência, escalabilidade e uma implementação profissional.

-   **Backend:** Node.js, Express.js, EJS
-   **Frontend (Extensão):** JavaScript (WebExtensions API), HTML5, CSS3
-   **Inteligência Artificial:** Python, TensorFlow (Keras), Scikit-learn, Pandas
-   **Base de Dados:** MariaDB (MySQL)
-   **Comunicação e Ferramentas:** Host Nativo (Native Messaging), XAMPP

---

## 5. Guia de Instalação e Configuração

Siga estes passos para configurar e executar o projeto no seu ambiente de desenvolvimento.

### 5.1. Pré-requisitos

-   **Node.js:** Versão 18 (LTS) recomendada.
-   **Python:** Versão 3.9 ou superior.
-   **XAMPP:** Com o serviço **MySQL (MariaDB)** a ser executado.
-   **Navegador:** Google Chrome ou Mozilla Firefox.

### 5.2. Configuração da Base de Dados (MariaDB)

1.  Inicie o serviço **MySQL** no seu painel de controlo do XAMPP.
2.  Aceda ao seu gestor de base de dados (ex: phpMyAdmin).
3.  Crie uma nova base de dados chamada `voce`.
4.  Execute os seguintes comandos SQL para criar as tabelas:
    ```sql
    CREATE TABLE IF NOT EXISTS logs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        aluno_id VARCHAR(255) NOT NULL,
        url VARCHAR(2048) NOT NULL,
        duration INT NOT NULL,
        timestamp VARCHAR(255) NOT NULL,
        categoria VARCHAR(255)
    );

    CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        nome_completo VARCHAR(255),
        turma VARCHAR(255)
    );
    ```

### 5.3. Configuração do Backend

1.  **Navegue até à pasta `monitor-backend`** no seu terminal.
2.  **Crie o ficheiro `.env`** e adicione as suas credenciais da base de dados.
    ```
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=
    DB_DATABASE=voce
    ```
3.  **Instale as dependências Node.js e Python:**
    ```bash
    npm install
    pip install tensorflow scikit-learn pandas
    ```
4.  **Treine o modelo de IA** (este passo pode demorar alguns minutos):
    ```bash
    python classifier-tf/train.py
    ```
5.  **Inicie o servidor:**
    ```bash
    npm start
    ```
    O terminal deverá indicar que o servidor está a ser executado em `http://localhost:3000`.

### 5.4. Configuração do Host Nativo

Esta configuração é feita uma vez na máquina onde a extensão será executada.

#### Para o Google Chrome / Edge:
1.  Verifique se o caminho no ficheiro `tcc_native_host/registrar.reg` está correto.
2.  Dê um duplo clique em `registrar.reg` para adicioná-lo ao Registo do Windows.

#### Para o Mozilla Firefox:
1.  Edite o ficheiro `tcc_native_host/host_manifest.json` com o ID correto da sua extensão no Firefox.
2.  Copie o `host_manifest.json` para a pasta `%APPDATA%\Mozilla\NativeMessagingHosts`.
3.  Renomeie o ficheiro copiado para **`com.meutcc.monitor.json`**.

### 5.5. Instalação da Extensão

1.  Abra o seu navegador (Chrome ou Firefox).
2.  Vá para a página de gestão de extensões (`chrome://extensions` ou `about:debugging`).
3.  Ative o "Modo de Desenvolvedor".
4.  Clique em "Carregar sem compactação" (Chrome) ou "Carregar Pacote Temporário" (Firefox) e selecione a pasta `monitor-extensao`.

## 6. Utilização

-   **Monitorização:** Os dados são recolhidos automaticamente assim que a extensão é instalada.
-   **Dashboard:** Aceda à interface de visualização no seu navegador através do endereço: **`http://localhost:3000/dashboard`**.
