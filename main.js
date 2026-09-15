const { app, BrowserWindow, ipcMain, shell, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const nodemailer = require('nodemailer');

app.setName('Stok Takip Programı');
// Windows'ta masaüstü bildirimlerinin (toast) görünebilmesi için bu şart —
// özellikle kurulumsuz (portable) sürümde, bu olmadan Notification() çağrıları
// sessizce hiçbir şey göstermeyebilir.
if (process.platform === 'win32') {
  app.setAppUserModelId('com.esnaf.stoktakip');
}

// Varsayılan Electron menüsünü tamamen kaldırıyoruz — yoksa F5 (yenile),
// F11 (tam ekran), F12 (geliştirici araçları) gibi tuşlar uygulamanın kendi
// klavye kısayollarıyla çakışabilir. Zaten özel bir başlık çubuğumuz var,
// bu menüye ihtiyaç yok.
Menu.setApplicationMenu(null);

let mainWindow;

function createWindow(){
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0E1420',
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });
  mainWindow.loadFile('index.html');

  mainWindow.on('maximize', () => mainWindow.webContents.send('window-state', 'maximized'));
  mainWindow.on('unmaximize', () => mainWindow.webContents.send('window-state', 'normal'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Özel başlık çubuğu (frame:false) için pencere kontrolleri
ipcMain.on('win-minimize', () => { if (mainWindow) mainWindow.minimize(); });
ipcMain.on('win-maximize-toggle', () => {
  if (!mainWindow) return;
  if (mainWindow.isMaximized()) mainWindow.unmaximize();
  else mainWindow.maximize();
});
ipcMain.on('win-close', () => { if (mainWindow) mainWindow.close(); });

// E-posta gönderme: renderer'dan gelen SMTP ayarları ve mesajla nodemailer üzerinden gönderir.
ipcMain.handle('send-email', async (event, { smtp, mail }) => {
  try {
    if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
      return { ok: false, error: 'SMTP ayarları eksik. Sunucu, kullanıcı ve şifre gerekli.' };
    }
    const port = Number(smtp.port) || 465;
    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port,
      secure: port === 465,
      auth: { user: smtp.user, pass: smtp.pass }
    });
    const mailOptions = {
      from: smtp.user,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html
    };
    if (mail.attachment && mail.attachment.filename && mail.attachment.content) {
      mailOptions.attachments = [{
        filename: mail.attachment.filename,
        content: mail.attachment.content
      }];
    }
    await transporter.sendMail(mailOptions);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

// Yazdırma önizlemesi: gelen HTML içeriğini bir PDF'e döker ve bilgisayarın
// varsayılan PDF görüntüleyicisinde açar. window.print() Electron'da OS'nin
// yazdırma penceresini önizlemesiz açtığı için, gerçek bir önizleme deneyimi
// için bu yöntemi kullanıyoruz — PDF görüntüleyici hem önizleme hem yazdırma
// imkanı sunuyor.
ipcMain.handle('print-preview', async (event, { html, filename }) => {
  let printWin;
  let tempHtmlPath;
  try {
    const fullHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      @page { size: A4 portrait; margin: 18mm 14mm; }
      *{ box-sizing:border-box; }
      html, body{ width:100%; }
      body{ font-family: Arial, Helvetica, sans-serif; color:#111; background:#fff; margin:0; padding:24px; }
      table{ width:100%; border-collapse:collapse; }
      th{ text-align:left; font-size:11px; text-transform:uppercase; letter-spacing:0.4px; border-bottom:1.5px solid #000; padding:6px 8px; }
      td{ font-size:12.5px; padding:6px 8px; border-bottom:1px solid #ccc; vertical-align:top; }
      td.num, th.num{ text-align:right; font-variant-numeric:tabular-nums; white-space:nowrap; }
      .print-title{ font-family:Arial,sans-serif; font-size:20px; font-weight:700; margin:0 0 2px; }
      .print-meta{ font-size:12px; color:#444; margin:0 0 18px; }
      .print-total-row td{ font-weight:700; border-top:2px solid #000; border-bottom:none; }
      .print-sub{ font-size:11px; color:#555; }
      .print-footer{ margin-top:22px; font-size:11px; color:#666; }
    </style></head><body>${html}</body></html>`;

    // Data URL yerine geçici bir .html dosyasına yazıp öyle yüklemek daha
    // güvenilir (uzun içerikte data URL bazı sistemlerde bozuk PDF üretebiliyor).
    tempHtmlPath = path.join(os.tmpdir(), `stok-print-${Date.now()}.html`);
    fs.writeFileSync(tempHtmlPath, fullHtml, 'utf-8');

    printWin = new BrowserWindow({
      show: false,
      width: 900,
      height: 1273, // A4 oranına yakın (dikey) — yatay algılanmasını önler
      webPreferences: { offscreen: false }
    });
    await printWin.loadFile(tempHtmlPath);

    const pdfBuffer = await printWin.webContents.printToPDF({
      printBackground: true,
      landscape: false,
      pageSize: 'A4',
      margins: { marginType: 'default' }
    });

    const safeName = (filename || 'stok-yazdir').replace(/[^a-z0-9-_]/gi, '_');
    const tempPath = path.join(os.tmpdir(), `${safeName}-${Date.now()}.pdf`);
    fs.writeFileSync(tempPath, pdfBuffer);

    printWin.close();
    try { fs.unlinkSync(tempHtmlPath); } catch (e) { /* önemli değil */ }

    const openErr = await shell.openPath(tempPath);
    if (openErr) {
      return { ok: false, error: 'PDF oluşturuldu ama açılamadı: ' + openErr };
    }
    return { ok: true, path: tempPath };
  } catch (err) {
    if (printWin && !printWin.isDestroyed()) printWin.close();
    if (tempHtmlPath) { try { fs.unlinkSync(tempHtmlPath); } catch (e) { /* önemli değil */ } }
    return { ok: false, error: err.message };
  }
});

// Dış bağlantıları (WhatsApp vb.) uygulama penceresi yerine sistemin
// varsayılan tarayıcısında/uygulamasında açar.
ipcMain.handle('open-external', async (event, url) => {
  try {
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url)) {
      return { ok: false, error: 'Geçersiz bağlantı.' };
    }
    await shell.openExternal(url);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});
