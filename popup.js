let ihaleData = null;

// DD/MM/YYYY HH:mm formatını parse et
function parseTarih(tarihStr) {
  const match = tarihStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, gun, ay, yil, saat, dakika] = match;
  return new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun), parseInt(saat), parseInt(dakika));
}

// Tarihi formatla
function formatTarih(date) {
  const gun = String(date.getDate()).padStart(2, '0');
  const ay = String(date.getMonth() + 1).padStart(2, '0');
  const yil = date.getFullYear();
  const saat = String(date.getHours()).padStart(2, '0');
  const dakika = String(date.getMinutes()).padStart(2, '0');
  return `${gun}/${ay}/${yil} ${saat}:${dakika}`;
}

// Google Calendar URL formatı: YYYYMMDDTHHmmSS
function toGCalDate(date) {
  const yil = date.getFullYear();
  const ay = String(date.getMonth() + 1).padStart(2, '0');
  const gun = String(date.getDate()).padStart(2, '0');
  const saat = String(date.getHours()).padStart(2, '0');
  const dakika = String(date.getMinutes()).padStart(2, '0');
  return `${yil}${ay}${gun}T${saat}${dakika}00`;
}

// ICS formatı için tarih
function toICSDate(date) {
  const yil = date.getFullYear();
  const ay = String(date.getMonth() + 1).padStart(2, '0');
  const gun = String(date.getDate()).padStart(2, '0');
  const saat = String(date.getHours()).padStart(2, '0');
  const dakika = String(date.getMinutes()).padStart(2, '0');
  return `${yil}${ay}${gun}T${saat}${dakika}00`;
}

function getHatirlatmaDate() {
  const gun = parseInt(document.getElementById('gun-oncesi').value) || 2;
  const bitisDate = parseTarih(ihaleData.bitisTarihi);
  if (!bitisDate) return null;
  const hatirlatmaDate = new Date(bitisDate);
  hatirlatmaDate.setDate(hatirlatmaDate.getDate() - gun);
  return hatirlatmaDate;
}

function getBaslik() {
  return document.getElementById('etkinlik-baslik').value.trim() || ihaleData.title || 'İhale';
}

function getDetay() {
  let detay = `İhale Bitiş Tarihi: ${ihaleData.bitisTarihi}\n`;
  if (ihaleData.muhammenBedel) detay += `Muhammen Bedel: ${ihaleData.muhammenBedel}\n`;
  if (ihaleData.ihaleYeri) detay += `İhale Yeri: ${ihaleData.ihaleYeri}\n`;
  const not = document.getElementById('etkinlik-not').value.trim();
  if (not) detay += `\n${not}\n`;
  detay += `\nSayfa: ${ihaleData.url || ''}`;
  return detay;
}

function gunOncesiHesapla() {
  if (!ihaleData || !ihaleData.bitisTarihi) return;
  const hatirlatmaDate = getHatirlatmaDate();
  if (hatirlatmaDate) {
    document.getElementById('hatirlatma-tarihi').textContent = formatTarih(hatirlatmaDate);
  }
}

function showSuccess(msg) {
  const el = document.getElementById('success-msg');
  el.textContent = msg;
  el.style.display = 'block';
  setTimeout(() => { el.style.display = 'none'; }, 3000);
}

function googleCalendarEkle() {
  const hatirlatmaDate = getHatirlatmaDate();
  if (!hatirlatmaDate) return;

  const bitis = new Date(hatirlatmaDate);
  bitis.setHours(bitis.getHours() + 1);

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: getBaslik(),
    dates: `${toGCalDate(hatirlatmaDate)}/${toGCalDate(bitis)}`,
    details: getDetay(),
    ctz: 'Europe/Istanbul'
  });

  window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank');
  showSuccess('Google Takvim açıldı!');
}

function appleCalendarEkle() {
  const hatirlatmaDate = getHatirlatmaDate();
  if (!hatirlatmaDate) return;

  const bitis = new Date(hatirlatmaDate);
  bitis.setHours(bitis.getHours() + 1);

  const detay = getDetay().replace(/\n/g, '\\n');

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IhaleHatirlatici//TR',
    'BEGIN:VEVENT',
    `DTSTART:${toICSDate(hatirlatmaDate)}`,
    `DTEND:${toICSDate(bitis)}`,
    `SUMMARY:${getBaslik()}`,
    `DESCRIPTION:${detay}`,
    `URL:${ihaleData.url || ''}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT30M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Hatırlatma',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'ihale-hatirlatma.ics';
  a.click();

  URL.revokeObjectURL(url);
  showSuccess('ICS dosyası indirildi!');
}

// Sayfa yüklendiğinde content script'ten veri çek
document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    chrome.tabs.sendMessage(tab.id, { action: 'getIhaleData' }, (response) => {
      if (chrome.runtime.lastError || !response || !response.bitisTarihi) {
        document.getElementById('error-state').style.display = 'block';
        return;
      }

      ihaleData = response;
      document.getElementById('data-state').style.display = 'block';

      // Başlığı input'a yaz
      document.getElementById('etkinlik-baslik').value = ihaleData.title || '';

      // Bilgileri göster
      document.getElementById('bitis-tarihi').textContent = ihaleData.bitisTarihi;
      if (ihaleData.muhammenBedel) {
        document.getElementById('muhammen-bedel').textContent = ihaleData.muhammenBedel;
      }

      // Detay alanına otomatik doldur
      let notlar = '';
      if (ihaleData.ihaleYeri) notlar += `İhale Yeri: ${ihaleData.ihaleYeri}`;
      document.getElementById('etkinlik-not').value = notlar;

      gunOncesiHesapla();
    });
  });

  document.getElementById('gun-oncesi').addEventListener('input', gunOncesiHesapla);
  document.getElementById('google-btn').addEventListener('click', googleCalendarEkle);
  document.getElementById('apple-btn').addEventListener('click', appleCalendarEkle);
});
