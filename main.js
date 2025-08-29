// main.js

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');

// Função para criar a janela do aplicativo
function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    });
    mainWindow.loadFile('index.html');
}

app.whenReady().then(createWindow);

// Handler para abrir a caixa de diálogo e selecionar a logo
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

// Handler principal com a lógica de cópia corrigida
async function handleDeploy(event, originalLink, newColor, logoPath) {
    const siteProjectPath = path.join(__dirname, 'codigo_para_deploy');
    const publicPath = path.join(siteProjectPath, 'public');
    const htmlFilePath = path.join(publicPath, 'index.html');
    
    // --- INÍCIO DA CORREÇÃO ---
    // 1. Definir o diretório de destino correto
    const targetLogoDir = path.join(publicPath, 'mnt', 'data');
    const targetLogoName = 'logo' + path.extname(logoPath);
    const targetLogoPath = path.join(targetLogoDir, targetLogoName);
    // --- FIM DA CORREÇÃO ---

    let originalHtmlContent;

    try {
        // --- INÍCIO DA CORREÇÃO ---
        // 2. Garantir que o diretório de destino existe
        fs.mkdirSync(targetLogoDir, { recursive: true });
        // --- FIM DA CORREÇÃO ---
        
        // 3. Copiar a nova logo para a pasta 'public/mnt/data'
        fs.copyFileSync(logoPath, targetLogoPath);
        
        // 4. Ler o HTML
        originalHtmlContent = fs.readFileSync(htmlFilePath, 'utf8');
        let modifiedHtml = originalHtmlContent;

        // --- INÍCIO DA CORREÇÃO ---
        // 5. Modificar a LOGO no HTML para o caminho correto
        modifiedHtml = modifiedHtml.replace(
            /(<img src=")[^"]*(" alt="Logo" class="loading-logo">)/,
            `$1./mnt/data/${targetLogoName}$2` // Aponta para o novo local
        );
        // --- FIM DA CORREÇÃO ---

        // 6. Modificar o LINK no HTML
        modifiedHtml = modifiedHtml.replace(
            /const LINK_BET = ".*";/,
            `const LINK_BET = "${originalLink}";`
        );

        // 7. Modificar a COR no HTML
        modifiedHtml = modifiedHtml.replace(
            /background-color: #[0-9a-fA-F]{6};/,
            `background-color: ${newColor};`
        );

        // 8. Salvar o HTML totalmente modificado
        fs.writeFileSync(htmlFilePath, modifiedHtml, 'utf8');

        // 9. Executar o Deploy
        const deployOutput = await new Promise((resolve, reject) => {
            exec('firebase deploy --only hosting', { cwd: siteProjectPath }, (error, stdout, stderr) => {
                if (error) reject(new Error(`Erro no Firebase CLI: ${stderr || error.message}`));
                else resolve(stdout);
            });
        });
        
        // 10. Extrair a URL
        const urlMatch = deployOutput.match(/Hosting URL: (https:\/\/.*)/);
        if (!urlMatch || !urlMatch[1]) throw new Error('URL de hosting não encontrada.');
        
        return { success: true, url: urlMatch[1].trim() };

    } catch (error) {
        console.error('Falha no processo:', error);
        return { success: false, error: error.message };
    } finally {
        // 11. Limpeza: Restaurar o HTML original e apagar a logo copiada
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