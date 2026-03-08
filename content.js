// Sayfadan ihale bilgilerini çek
function getIhaleData() {
  const data = {};

  // Sayfa başlığından ihale adını al
  // Önce sayfadaki breadcrumb veya başlık bilgisini dene
  const titleMatch = document.body.innerText.match(/(\S+\s*\(.*?\)\s*Satış Memurluğu[^\n]*)/);
  if (titleMatch) {
    data.title = titleMatch[1].trim();
  } else {
    // Fallback: document title kullan
    data.title = document.title || 'İhale';
  }

  // Tüm satırları tara - tablo veya label-value yapısı
  const allText = document.body.innerText;

  // Artırma Bitiş Tarih ve Saati
  const bitisMatch = allText.match(/Art[ıi]rma Biti[sş] Tarih ve Saati\s*[:：]\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/i);
  if (bitisMatch) {
    data.bitisTarihi = bitisMatch[1];
  }

  // Artırma Başlangıç Tarih ve Saati
  const baslaMatch = allText.match(/Art[ıi]rma Ba[sş]lang[ıi][cç] Tarih ve Saati\s*[:：]\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/i);
  if (baslaMatch) {
    data.baslangicTarihi = baslaMatch[1];
  }

  // Muhammen Bedel
  const bedelMatch = allText.match(/Muhammen Bedel\s*[:：]\s*([\d.,]+\s*TL)/i);
  if (bedelMatch) {
    data.muhammenBedel = bedelMatch[1];
  }

  // İhale Yeri
  const yerMatch = allText.match(/[İI]hale Yeri\s*[:：]\s*([^\n]+)/i);
  if (yerMatch) {
    data.ihaleYeri = yerMatch[1].trim();
  }

  // Sayfa URL'si
  data.url = window.location.href;

  return data;
}

// Popup'tan mesaj geldiğinde veriyi gönder
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getIhaleData') {
    const data = getIhaleData();
    sendResponse(data);
  }
  return true;
});
