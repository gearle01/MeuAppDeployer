// renderer.js

const originalLinkInput = document.getElementById('original-link');
const colorPicker = document.getElementById('color-picker');
const logoBtn = document.getElementById('logo-btn');
const logoFilenameSpan = document.getElementById('logo-filename');
const deployBtn = document.getElementById('deploy-btn');
const statusDiv = document.getElementById('status');
const resultDiv = document.getElementById('result');
const newLinkP = document.getElementById('new-link');

let selectedLogoPath = null; // Variável para guardar o caminho da logo

// Evento para o botão de selecionar logo
logoBtn.addEventListener('click', async () => {
    const filePath = await window.electronAPI.selectLogo();
    if (filePath) {
        selectedLogoPath = filePath;
        // Mostra apenas o nome do arquivo para o usuário
        logoFilenameSpan.innerText = filePath.split('\\').pop().split('/').pop();
    }
});

// Evento principal para o botão de gerar link
deployBtn.addEventListener('click', async () => {
    const link = originalLinkInput.value;
    const color = colorPicker.value;

    // Validações simples
    if (!link) {
        statusDiv.innerText = 'Erro: Por favor, insira o link original.';
        return;
    }
    if (!selectedLogoPath) {
        statusDiv.innerText = 'Erro: Por favor, selecione um arquivo de logo.';
        return;
    }

    deployBtn.disabled = true;
    deployBtn.innerText = 'Gerando...';
    resultDiv.style.display = 'none';
    statusDiv.innerText = 'Iniciando processo...';

    try {
        const result = await window.electronAPI.startDeploy(link, color, selectedLogoPath);
        
        if (result.success) {
            statusDiv.innerText = 'Sucesso! Seu link está pronto.';
            newLinkP.innerText = result.url;
            resultDiv.style.display = 'block';
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        statusDiv.innerText = `Erro: ${error.message}`;
    } finally {
        deployBtn.disabled = false;
        deployBtn.innerText = '4. Gerar Link';
    }
});