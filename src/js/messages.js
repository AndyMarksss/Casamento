/* ============ CONFIG ============ */
const BOARD = document.getElementById('board');
const LOADER = document.getElementById('loader');
const LIGHTBOX = document.getElementById('lightbox');
const LB_IMG = LIGHTBOX.querySelector('img');

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
    // ▸ O back‑end já devolve apenas mensagens aprovadas 👍

    LOADER.remove();

    if (!msgs.length) {
        BOARD.innerHTML = '<p>Sem mensagens por enquanto…</p>';
        return;
    }

    /* ordena por data (mais nova primeiro) — opcional */
    msgs.sort((a, b) => new Date(b.date) - new Date(a.date));

    msgs.forEach(d => {
        const note = document.createElement('article');
        note.className = 'postit';
        note.style.setProperty('--r', (Math.random() * 8 - 4).toFixed(2)); // –4° … +4°

        note.innerHTML = `
            <h3>${d.nome}</h3>
            <small>${d.relacao} • ${d.date}</small>
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

/* ============ 3. LIGHTBOX ============ */
function openLightbox(src) {
    LB_IMG.src = src;
    LIGHTBOX.classList.add('show');
}
LIGHTBOX.addEventListener('click', () => LIGHTBOX.classList.remove('show'));
