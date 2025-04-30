/* ======================================
   MESSAGES BOARD – front‑end
   • Obtém mensagens do Apps Script
   • Exibe somente as aprovadas
   • Mostra as mais recentes primeiro
   • Agora oculta as horas, exibindo só a data (dd/MM/yyyy)
   ====================================== */

/* ============ CONFIG ============ */
const BOARD = document.getElementById('board');
const LOADER = document.getElementById('loader');
const LIGHTBOX = document.getElementById('lightbox');
const LB_IMG = LIGHTBOX.querySelector('img');

// URL pública do Web App
const API_URL = 'https://script.google.com/macros/s/AKfycbwOiTUlF72gJNh08lVzUGhftcAsqeIQKns6x0RI5WwLn-uXr1sL7VkFo2GHKfWCBghurw/exec';

/* ============ 1. BUSCA MENSAGENS ============ */
fetch(API_URL)
    .then(r => r.json())
    .then(drawBoard)
    .catch(err => {
        LOADER.textContent = 'Ops! Não foi possível carregar 😢';
        console.error(err);
    });

/* ============ 2. MONTA O QUADRO ============ */
function drawBoard(msgs) {
    /*  ▸ Como o back‑end já envia somente as aprovadas,
        não precisamos filtrar nada aqui.              */

    LOADER.remove();

    if (!Array.isArray(msgs) || !msgs.length) {
        BOARD.innerHTML = '<p>Sem mensagens por enquanto…</p>';
        return;
    }

    /*  ▸ 2.1 Ordena — mais recente primeiro  */
    msgs.sort((a, b) => parseDateBR(b.date) - parseDateBR(a.date));

    /*  ▸ 2.2 Gera cada “post‑it” */
    msgs.forEach(d => {
        const note = document.createElement('article');
        note.className = 'postit';
        note.style.setProperty('--r', (Math.random() * 8 - 4).toFixed(2)); // –4° … +4°

        const dateOnly = typeof d.date === 'string' ? d.date.split(' ')[0] : d.date;

        note.innerHTML = `
            <h3>${d.nome}</h3>
            <small>${d.relacao} • ${dateOnly}</small>
            <p>${d.mensagem}</p>`;

        if (d.foto) {
            const img = document.createElement('img');
            img.src = d.foto;
            img.loading = 'lazy';
            img.alt = `Foto enviada por ${d.nome}`;
            img.addEventListener('click', () => openLightbox(img.src));
            note.appendChild(img);
        }
        BOARD.appendChild(note);
    });
}

/* ============ 3. PARSER DE DATA (BR → Date) ============ */
/**
 * Converte strings nos formatos:
 *   • "dd/MM/yyyy"
 *   • "dd/MM/yyyy HH:mm:ss"
 * para objetos Date, preservando a hora.
 */
function parseDateBR(str) {
    if (!str) return new Date(0);
    if (typeof str !== 'string') return new Date(str);

    const [datePart, timePart = ''] = str.trim().split(' ');
    const [dia, mes, ano] = datePart.split('/').map(Number);

    const [hora = 0, min = 0, seg = 0] = timePart.split(':').map(Number);

    return new Date(ano, mes - 1, dia, hora, min, seg);
}

/* ============ 4. LIGHTBOX ============ */
function openLightbox(src) {
    LB_IMG.src = src;
    LIGHTBOX.classList.add('show');
}
LIGHTBOX.addEventListener('click', () => LIGHTBOX.classList.remove('show'));
