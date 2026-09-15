# Stok Takip Programı — gerçek bir .exe nasıl alınır

> ⚠️ **ÖNEMLİ:** Bu klasördeki `index.html` dosyasına çift tıklayıp
> doğrudan tarayıcıda (Chrome/Edge) AÇMA. Öyle açarsan normal bir web
> sayfası gibi görünür. Gerçek masaüstü uygulaması deneyimi için
> aşağıdaki adımlarla üretilen `.exe` dosyasını çalıştırman gerekiyor.

## YÖNTEM 1 — GitHub ile otomatik derleme (kurulum gerektirmez, önerilen)

1. **github.com** adresine git, ücretsiz bir hesap oluştur (yoksa).
2. Sağ üstten **"+" → "New repository"** ile yeni bir depo oluştur.
   İsim olarak örneğin `stok-takip-programi` yaz, "Create repository" de.
3. Açılan depo sayfasında **"uploading an existing file"** linkine tıkla.
4. Bu klasördeki **tüm dosya ve klasörleri** (index.html, main.js,
   preload.js, package.json, icon.png, icon.ico, `.github` klasörü dahil
   hepsini) oraya sürükleyip bırak. "Commit changes" butonuna bas.

   > `.github` klasörü gizli olduğu için sürükle-bırakta bazen atlanıyor.
   > Eğer Actions sekmesinde "Get started with GitHub Actions" ekranı
   > çıkarsa, "Add file → Create new file" ile `.github/workflows/build.yml`
   > dosyasını elle oluşturup bu klasördeki içeriğini yapıştır.

5. Üstteki **"Actions"** sekmesine tıkla. Bir işlem otomatik başlar
   (birkaç dakika sürer).
6. İşlem bitince, altındaki **"Artifacts"** bölümünden:
   - `stok-takip-windows-portable` → kurulum gerektirmez, içindeki
     `.exe`'ye çift tıkla, hemen çalışır.
   - `stok-takip-windows-installer` → klasik kurulum dosyası.

## YÖNTEM 2 — Kendi bilgisayarında derleme (Node.js gerektirir)

1. [Node.js](https://nodejs.org) kur (LTS sürüm).
2. Bu klasörde terminal aç, `npm install` çalıştır.
3. Test için: `npm start`
4. Gerçek exe için: `npm run build` (kurulum) veya `npm run package`
   (portable klasör).

## Lisanslama

Uygulama ilk kurulduğunda otomatik olarak **1 yıllık** ücretsiz kullanım
süresi başlar. Süre dolduğunda uygulama kilitlenir ve bir **lisans
anahtarı** ister. Lisans anahtarları da yıllık geçerlidir.

### Yeni lisans anahtarı üretmek için

`lisans-uret.js` dosyası uygulamanın bir parçası DEĞİLDİR (pakete dahil
edilmez) — sadece senin yeni anahtar üretmen içindir:

```
node lisans-uret.js        → 1 yıl geçerli anahtar üretir
node lisans-uret.js 30     → 30 gün geçerli anahtar üretir
```

Üretilen anahtarı (örn. `STOK-N7PWCJHR-BD123876`) müşteriye ver. O da
**Ayarlar → Lisans** bölümüne yapıştırıp etkinleştirebilir.

**Güvenlik notu:** Sistem saati geri alınarak deneme süresinin
sıfırlanmasına karşı koruma var (uygulama en son gördüğü tarihi
"su işareti" olarak hatırlar, geri gitmez). Bu basit ama pratik bir
offline lisans sistemidir — sunucu doğrulaması olmadığı için mutlak
güvenli bir DRM değildir.

## Özellikler

- Ürün yönetimi: isim, kategori, birim (adet/kg/lt/paket vb.), alış/satış
  fiyatı, kritik stok eşiği, tedarikçi bağlantısı
- Tedarikçi yönetimi: ekle/düzenle/sil, ürünlerle ilişkilendirme
- Stok hareketleri: giriş/çıkış, tarih (GG.AA.YYYY yazılabilir + takvimden
  seçilebilir), miktar, birim fiyat, not — düzenlenebilir/silinebilir
- Kritik stok uyarıları: sidebar listesi + masaüstü bildirimi + e-posta
- Kâr marjı hesaplama, toplam stok değeri
- Yazdırma (gerçek PDF önizleme ile), CSV dışa aktarım
- Yedekleme: manuel + otomatik e-posta + geri yükleme öncesi güvenlik
  kopyası
- Giriş sistemi: kullanıcı adı/şifre + kurtarma koduyla şifre sıfırlama
- Koyu/Açık tema, özel başlık çubuğu, sistem tepsisi simgesi
