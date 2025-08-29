// main.js

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

function createWindow() { /* ...código para criar a janela, sem alterações... */ }
app.whenReady().then(createWindow);

// NOVO: Handler para abrir a caixa de diálogo e selecionar a logo
async function handleSelectLogo() {
    const { canceled, filePaths } = await dialog.showOpenDialog({
        properties: ['openFile'],
        filters: [
            { name: 'Images', extensions: ['jpg', 'png', 'gif', 'avif', 'jpeg', 'svg', 'webp'] }
        ]
    });
    if (!canceled) {
        return filePaths[0];
    }
}

// ATUALIZADO: Handler principal que agora faz as 3 modificações
async function handleDeploy(event, originalLink, newColor, logoPath) {
    const siteProjectPath = path.join(__dirname, 'codigo_para_deploy');
    const publicPath = path.join(siteProjectPath, 'public');
    const htmlFilePath = path.join(publicPath, 'index.html');
    const targetLogoName = 'logo' + path.extname(logoPath); // Ex: logo.png
    const targetLogoPath = path.join(publicPath, targetLogoName);

    let originalHtmlContent;

    try {
        // 1. Copiar a nova logo para a pasta 'public'
        fs.copyFileSync(logoPath, targetLogoPath);
        
        // 2. Ler o HTML
        originalHtmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        let modifiedHtml = originalHtmlContent;

        // 3. Modificar a LOGO no HTML
        modifiedHtml = modifiedHtml.replace(
            /(<img src=")[^"]*(" alt="Logo" class="loading-logo">)/,
            `$1${targetLogoName}$2`
        );

        // 4. Modificar o LINK no HTML
        modifiedHtml = modifiedHtml.replace(
            /const LINK_BET = ".*";/,
            `const LINK_BET = "${originalLink}";`
        );

        // 5. Modificar a COR no HTML
        modifiedHtml = modifiedHtml.replace(
            /background-color: #[0-9a-fA-F]{6};/,
            `background-color: ${newColor};`
        );

        // 6. Salvar o HTML totalmente modificado
        fs.writeFileSync(htmlFilePath, modifiedHtml, 'utf8');

        // 7. Executar o Deploy
        const deployOutput = await new Promise((resolve, reject) => {
            exec('firebase deploy --only hosting', { cwd: siteProjectPath }, (error, stdout, stderr) => {
                if (error) reject(new Error(`Erro no Firebase CLI: ${stderr || error.message}`));
                else resolve(stdout);
            });
        });
        
        // 8. Extrair a URL
        const urlMatch = deployOutput.match(/Hosting URL: (https:\/\/.*)/);
        if (!urlMatch || !urlMatch[1]) throw new Error('URL de hosting não encontrada.');
        
        return { success: true, url: urlMatch[1].trim() };

    } catch (error) {
        console.error('Falha no processo:', error);
        return { success: false, error: error.message };
    } finally {
        // 9. Limpeza: Restaurar o HTML original e apagar a logo copiada
        if (originalHtmlContent) {
            fs.writeFileSync(htmlFilePath, originalHtmlContent, 'utf8');
        }
        if (fs.existsSync(targetLogoPath)) {
            fs.unlinkSync(targetLogoPath);
        }
        console.log('Limpeza finalizada. Arquivos restaurados.');
    }
}

// Registrando os handlers
ipcMain.handle('select-logo', handleSelectLogo);
ipcMain.handle('start-deploy', handleDeploy);