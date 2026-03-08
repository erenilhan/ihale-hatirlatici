# İhale Takvim Hatırlatıcı - Chrome Eklentisi

UYAP E-Satış portalındaki ihale detay sayfalarından bitiş tarihini otomatik okuyarak, belirlediğiniz gün kadar önce Apple Calendar veya Google Calendar'a hatırlatma etkinliği eklemenizi sağlayan Chrome eklentisi.

## Özellikler

- Sayfadan ihale bitiş tarihi, muhammen bedel gibi bilgileri otomatik çeker
- Kaç gün önce hatırlatma istediğinizi seçebilirsiniz (varsayılan: 2 gün)
- Etkinlik başlığını ve notları özelleştirebilirsiniz
- **Apple Calendar** desteği (.ics dosyası ile)
- **Google Calendar** desteği (tarayıcıda açılır)
- Etkinliğe otomatik 30 dakika öncesi alarm eklenir (Apple Calendar)

## Kurulum

1. Bu repoyu klonlayın veya indirin
2. Chrome'da `chrome://extensions` adresine gidin
3. Sağ üstten **Geliştirici modu**'nu açın
4. **Paketlenmemiş öğe yükle** butonuna tıklayın
5. İndirdiğiniz klasörü seçin

## Kullanım

1. [UYAP E-Satış](https://esatis.uyap.gov.tr) portalına giriş yapın
2. Herhangi bir ihale detay sayfasını açın
3. Tarayıcı araç çubuğundaki eklenti ikonuna tıklayın
4. İhale bilgileri otomatik olarak yüklenir
5. Başlık ve notları düzenleyin, hatırlatma gün sayısını ayarlayın
6. **Apple Calendar** veya **Google Calendar** butonuna tıklayın

## Dosya Yapısı

```
ihale/
├── manifest.json    # Chrome extension tanımı
├── content.js       # Sayfadan ihale verisi çeken script
├── popup.html       # Popup arayüzü
├── popup.js         # Takvim ekleme mantığı
└── icons/           # Eklenti ikonları
```

## Gereksinimler

- Google Chrome veya Chromium tabanlı tarayıcı
- UYAP E-Satış portalına erişim (oturum açma gereklidir)

## Gizlilik

Bu eklenti hiçbir kişisel veri toplamaz veya dışarıya göndermez. Tüm işlemler tarayıcınızda yerel olarak gerçekleşir.
