// Sayfadan ihale bilgilerini çek
function getIhaleData() {
  const data = {};

  const allText = document.body.innerText;

  // Sayfa başlığı - ilk satırdaki ana başlık
  // "Bursa Banka Alacakları İcra Dairesi, 2024/1867 Talimat"
  // "Dikili (Sulh Hukuk Mah.) Satış Memurluğu, 2025/29 Satış"
  const titleMatch = allText.match(/([^\n]+(?:İcra Dairesi|Satış Memurluğu|Müdürlüğü)[^\n]*)/);
  if (titleMatch) {
    data.title = titleMatch[1].trim();
  } else {
    data.title = document.title || 'İhale';
  }

  const bitisMatch = allText.match(/Art[ıi]rma Biti[sş] Tarih ve Saati\s*[:：]\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/i);
  if (bitisMatch) data.bitisTarihi = bitisMatch[1];

  const baslaMatch = allText.match(/Art[ıi]rma Ba[sş]lang[ıi][cç] Tarih ve Saati\s*[:：]\s*(\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2})/i);
  if (baslaMatch) data.baslangicTarihi = baslaMatch[1];

  const bedelMatch = allText.match(/Muhammen Bedel\s*[:：]\s*([\d.,]+\s*TL)/i);
  if (bedelMatch) data.muhammenBedel = bedelMatch[1];

  const teminatMatch = allText.match(/Teminat Miktar[ıi]\s*[:：]\s*([\d.,]+\s*TL)/i);
  if (teminatMatch) data.teminatMiktari = teminatMatch[1];

  const yerMatch = allText.match(/[İI]hale Yeri\s*[:：]\s*([^\n]+)/i);
  if (yerMatch) data.ihaleYeri = yerMatch[1].trim();

  data.url = window.location.href;
  return data;
}

// Akıllı başlık: "Bursa Banka Alacakları - 714.000,00 TL - 10/03/2026"
function buildSmartTitle(data) {
  const parts = [];

  // Başlıktan kısa yer adı çıkar (ilk virgül veya paranteze kadar)
  if (data.title) {
    const shortName = data.title.split(/[,(]/)[0].trim();
    parts.push(shortName);
  }

  if (data.muhammenBedel) parts.push(data.muhammenBedel);

  if (data.bitisTarihi) {
    parts.push(data.bitisTarihi.split(' ')[0]);
  }

  return parts.length > 0 ? parts.join(' - ') : data.title;
}

// Popup'tan mesaj geldiğinde veriyi gönder
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getIhaleData') {
    sendResponse(getIhaleData());
  }
  return true;
});

// --- Yardımcı fonksiyonlar ---

function parseTarih(tarihStr) {
  const match = tarihStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})/);
  if (!match) return null;
  const [, gun, ay, yil, saat, dakika] = match;
  return new Date(parseInt(yil), parseInt(ay) - 1, parseInt(gun), parseInt(saat), parseInt(dakika));
}

function formatTarih(date) {
  const gun = String(date.getDate()).padStart(2, '0');
  const ay = String(date.getMonth() + 1).padStart(2, '0');
  const yil = date.getFullYear();
  const saat = String(date.getHours()).padStart(2, '0');
  const dakika = String(date.getMinutes()).padStart(2, '0');
  return `${gun}/${ay}/${yil} ${saat}:${dakika}`;
}

function toCalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  return `${y}${m}${d}T${h}${min}00`;
}

function el(tag, attrs, children) {
  const elem = document.createElement(tag);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'style' && typeof val === 'object') {
        Object.assign(elem.style, val);
      } else if (key.startsWith('on')) {
        elem.addEventListener(key.slice(2), val);
      } else {
        elem.setAttribute(key, val);
      }
    }
  }
  if (children) {
    for (const child of Array.isArray(children) ? children : [children]) {
      if (typeof child === 'string') {
        elem.appendChild(document.createTextNode(child));
      } else if (child) {
        elem.appendChild(child);
      }
    }
  }
  return elem;
}

function svgIcon(path, size) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('width', size || '16');
  svg.setAttribute('height', size || '16');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  p.setAttribute('d', path);
  svg.appendChild(p);
  return svg;
}

function addToGoogle(baslik, detay, start, end) {
  const params = new URLSearchParams({
    action: 'TEMPLATE', text: baslik,
    dates: toCalDate(start) + '/' + toCalDate(end),
    details: detay, ctz: 'Europe/Istanbul'
  });
  window.open('https://calendar.google.com/calendar/render?' + params.toString(), '_blank');
}

function addToApple(baslik, detay, start, end, url) {
  const ics = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//IhaleHatirlatici//TR',
    'BEGIN:VEVENT',
    'DTSTART:' + toCalDate(start), 'DTEND:' + toCalDate(end),
    'SUMMARY:' + baslik, 'DESCRIPTION:' + detay.replace(/\n/g, '\\n'),
    'URL:' + url,
    'BEGIN:VALARM', 'TRIGGER:-PT30M', 'ACTION:DISPLAY', 'DESCRIPTION:Hatirlatma', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ihale-hatirlatma.ics';
  a.click();
  URL.revokeObjectURL(a.href);
}

// --- Sayfa içi panel ---

function injectPanel() {
  const data = getIhaleData();
  if (!data.bitisTarihi) return;

  const bitisDate = parseTarih(data.bitisTarihi);
  if (!bitisDate) return;

  // Teminat son tarihi: bitiş tarihinden 1 gün önce saat 23:30
  const teminatDate = new Date(bitisDate);
  teminatDate.setDate(teminatDate.getDate() - 1);
  teminatDate.setHours(23, 30, 0, 0);

  // Teminat hatırlatma: teminat son gününden 1 gün önce sabah 09:00
  const teminatHatirlatma = new Date(teminatDate);
  teminatHatirlatma.setDate(teminatHatirlatma.getDate() - 1);
  teminatHatirlatma.setHours(9, 0, 0, 0);

  // Akıllı başlık
  const smartTitle = buildSmartTitle(data);

  // Styles
  const style = document.createElement('style');
  style.textContent = `
    #ihale-hatirlatici-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 340px;
      background: white;
      border-radius: 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      z-index: 999999;
      overflow: hidden;
    }
    #ihale-hatirlatici-toggle {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 52px;
      height: 52px;
      background: linear-gradient(135deg, #e67e22, #d35400);
      border: none;
      border-radius: 50%;
      color: white;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(230,126,34,0.4);
      z-index: 999998;
      display: none;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    #ihale-hatirlatici-toggle:hover {
      transform: scale(1.08);
      box-shadow: 0 6px 20px rgba(230,126,34,0.5);
    }
  `;
  document.head.appendChild(style);

  // Tarih göstergesi
  const tarihDisplay = el('div', {
    id: 'ih-tarih',
    style: {
      background: '#fff8f0', border: '1px solid #fed7aa',
      padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
      margin: '8px 0', color: '#c2410c', fontWeight: '600', textAlign: 'center'
    }
  });

  const gunInput = el('input', {
    type: 'number', id: 'ih-gun', value: '2', min: '1', max: '30',
    style: {
      width: '44px', padding: '5px', border: '1px solid #e5e7eb',
      borderRadius: '6px', textAlign: 'center', fontSize: '12px',
      outline: 'none'
    }
  });

  const baslikInput = el('input', {
    type: 'text', id: 'ih-baslik', value: smartTitle, placeholder: 'Etkinlik basligi',
    style: {
      width: '100%', padding: '8px 10px', border: '1px solid #e5e7eb',
      borderRadius: '8px', fontSize: '12px', margin: '6px 0', fontFamily: 'inherit',
      boxSizing: 'border-box', outline: 'none', transition: 'border 0.2s'
    }
  });

  function updateTarih() {
    const gun = parseInt(gunInput.value) || 2;
    const h = new Date(bitisDate);
    h.setDate(h.getDate() - gun);
    tarihDisplay.textContent = formatTarih(h);
  }
  gunInput.addEventListener('input', updateTarih);

  function getHatirlatma() {
    const gun = parseInt(gunInput.value) || 2;
    const h = new Date(bitisDate);
    h.setDate(h.getDate() - gun);
    return h;
  }

  function buildDetay(extra) {
    let d = 'Ihale Bitis: ' + data.bitisTarihi;
    if (data.muhammenBedel) d += '\nBedel: ' + data.muhammenBedel;
    if (data.teminatMiktari) d += '\nTeminat: ' + data.teminatMiktari;
    if (data.title) d += '\n' + data.title;
    if (extra) d += '\n' + extra;
    d += '\n' + data.url;
    return d;
  }

  // Chevron
  const chevron = el('span', {
    style: { display: 'inline-block', transition: 'transform 0.3s', fontSize: '12px' }
  }, '\u25BC');

  // Kapat butonu
  const closeBtn = el('button', {
    style: {
      background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white',
      fontSize: '16px', cursor: 'pointer', padding: '2px 8px',
      borderRadius: '6px', lineHeight: '1'
    },
    onclick: (e) => {
      e.stopPropagation();
      panel.style.display = 'none';
      toggleBtn.style.display = 'block';
    }
  }, '\u2715');

  // Toggle butonu
  const toggleBtn = el('button', { id: 'ihale-hatirlatici-toggle', title: 'Takvime Ekle', onclick: () => {
    panel.style.display = 'block';
    toggleBtn.style.display = 'none';
  }});
  toggleBtn.textContent = '\uD83D\uDCC5';

  // Buton oluşturucu
  function makeBtn(label, iconPath, bg, hoverBg, onClick) {
    const icon = svgIcon(iconPath, '15');
    icon.style.flexShrink = '0';
    return el('button', {
      style: {
        flex: '1', padding: '10px 12px', border: 'none', borderRadius: '10px',
        fontSize: '12px', fontWeight: '600', cursor: 'pointer', color: 'white',
        background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: '6px', transition: 'background 0.2s, transform 0.1s'
      },
      onmouseenter: (e) => { e.currentTarget.style.background = hoverBg; },
      onmouseleave: (e) => { e.currentTarget.style.background = bg; },
      onmousedown: (e) => { e.currentTarget.style.transform = 'scale(0.97)'; },
      onmouseup: (e) => { e.currentTarget.style.transform = 'scale(1)'; },
      onclick: onClick
    }, [icon, label]);
  }

  const applePath = 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0';
  const googlePath = 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z';

  // İhale hatırlatma butonları
  const ihaleApple = makeBtn('Apple', applePath, '#1c1c1e', '#333', () => {
    const h = getHatirlatma();
    const end = new Date(h); end.setHours(end.getHours() + 1);
    addToApple(baslikInput.value.trim() || smartTitle, buildDetay(), h, end, data.url);
  });

  const ihaleGoogle = makeBtn('Google', googlePath, '#ea580c', '#c2410c', () => {
    const h = getHatirlatma();
    const end = new Date(h); end.setHours(end.getHours() + 1);
    addToGoogle(baslikInput.value.trim() || smartTitle, buildDetay(), h, end);
  });

  // Teminat hatırlatma butonları
  const shortName = data.title ? data.title.split(/[,(]/)[0].trim() : smartTitle;
  const teminatBaslik = 'TEMINAT: ' + shortName;

  const teminatApple = makeBtn('Apple', applePath, '#1c1c1e', '#333', () => {
    const end = new Date(teminatHatirlatma); end.setHours(end.getHours() + 1);
    addToApple(teminatBaslik, buildDetay('Son teminat: ' + formatTarih(teminatDate)), teminatHatirlatma, end, data.url);
  });

  const teminatGoogle = makeBtn('Google', googlePath, '#ea580c', '#c2410c', () => {
    const end = new Date(teminatHatirlatma); end.setHours(end.getHours() + 1);
    addToGoogle(teminatBaslik, buildDetay('Son teminat: ' + formatTarih(teminatDate)), teminatHatirlatma, end);
  });

  // Yardımcılar
  const infoRow = (label, value, color) => {
    const row = el('div', { style: {
      display: 'flex', justifyContent: 'space-between', fontSize: '12px',
      padding: '5px 0', color: '#6b7280'
    }});
    row.appendChild(el('span', {}, label));
    row.appendChild(el('strong', { style: { color: color || '#111827' } }, value));
    return row;
  };

  function section(title, color, children) {
    const label = el('div', { style: {
      fontSize: '11px', fontWeight: '700', color: color,
      textTransform: 'uppercase', letterSpacing: '0.5px',
      marginBottom: '8px', marginTop: '4px'
    }}, title);
    return el('div', { style: { marginBottom: '14px' } }, [label, ...children]);
  }

  // Body
  const body = el('div', { style: { padding: '14px 16px' } }, [
    infoRow('Bitis Tarihi', data.bitisTarihi),
    data.muhammenBedel ? infoRow('Muhammen Bedel', data.muhammenBedel) : null,
    data.teminatMiktari ? infoRow('Teminat', data.teminatMiktari) : null,
    infoRow('Teminat Son Tarih', formatTarih(teminatDate), '#dc2626'),

    el('div', { style: { borderTop: '1px solid #f3f4f6', margin: '10px 0' } }),

    baslikInput,

    section('Ihale Hatirlatma', '#ea580c', [
      el('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#6b7280', marginBottom: '6px' } }, [
        el('span', {}, 'Bitis tarihinden'), gunInput, el('span', {}, 'gun once')
      ]),
      tarihDisplay,
      el('div', { style: { display: 'flex', gap: '8px', marginTop: '8px' } }, [ihaleApple, ihaleGoogle])
    ]),

    section('Teminat Hatirlatma', '#dc2626', [
      el('div', { style: {
        background: '#fef2f2', border: '1px solid #fecaca',
        padding: '8px 12px', borderRadius: '8px', fontSize: '12px',
        color: '#dc2626', fontWeight: '600', textAlign: 'center', marginBottom: '8px'
      }}, formatTarih(teminatHatirlatma) + ' (1 gun once)'),
      el('div', { style: { display: 'flex', gap: '8px' } }, [teminatApple, teminatGoogle])
    ])
  ]);

  // Header - tıkla küçült/aç
  const headerTitle = el('div', {
    style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', flex: '1' },
    onclick: () => {
      const isCollapsed = body.style.display === 'none';
      body.style.display = isCollapsed ? 'block' : 'none';
      chevron.style.transform = isCollapsed ? 'rotate(0deg)' : 'rotate(-90deg)';
    }
  }, [el('span', {}, 'Takvime Ekle'), chevron]);

  const header = el('div', {
    style: {
      background: 'linear-gradient(135deg, #ea580c, #c2410c)', color: 'white',
      padding: '14px 16px', display: 'flex', justifyContent: 'space-between',
      alignItems: 'center', fontSize: '14px', fontWeight: '700'
    }
  }, [headerTitle, closeBtn]);

  const panel = el('div', { id: 'ihale-hatirlatici-panel' }, [header, body]);

  document.body.appendChild(panel);
  document.body.appendChild(toggleBtn);

  updateTarih();
}

// Sayfa AJAX ile içerik yüklüyor, DOM değişikliğini bekle
function waitForIhaleData() {
  if (document.getElementById('ihale-hatirlatici-panel')) return;

  const data = getIhaleData();
  if (data.bitisTarihi) {
    injectPanel();
    return;
  }

  let attempts = 0;
  const maxAttempts = 30;

  const timer = setInterval(() => {
    attempts++;
    if (document.getElementById('ihale-hatirlatici-panel')) {
      clearInterval(timer);
      return;
    }
    const d = getIhaleData();
    if (d.bitisTarihi) {
      clearInterval(timer);
      injectPanel();
    } else if (attempts >= maxAttempts) {
      clearInterval(timer);
    }
  }, 1000);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', waitForIhaleData);
} else {
  waitForIhaleData();
}
