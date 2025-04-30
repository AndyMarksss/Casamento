/* ============================= *
 * 0.  utilitário local-escopo   *
 * ============================= */
function $(sel, ctx = document) { return ctx.querySelector(sel) }

/* ============================= *
 * 1.  CONTAGEM REGRESSIVA       *
 * ============================= */
function countdown() {
    const el = $('#countdown');
    if (!el) return;
    const target = new Date('2025-09-28T12:00:00');

    const tick = () => {
        const diff = target - new Date();
        if (diff <= 0) { el.textContent = 'É hoje! Celebre conosco!'; return; }
        const d = Math.floor(diff / 8.64e7);
        const h = Math.floor(diff / 3.6e6) % 24;
        const m = Math.floor(diff / 6e4) % 60;
        const s = Math.floor(diff / 1e3) % 60;
        el.textContent = `${d} dias, ${h}h ${m}m ${s}s até o grande dia`;
    };
    tick(); setInterval(tick, 1000);
}
document.addEventListener('DOMContentLoaded', countdown);

/* ============================= *
 * 2.  MENU  MOBILE              *
 * ============================= */
const nav = $('#navbar'), burger = $('.hamburger-menu'), overlay = $('#menuOverlay');
if (nav) {
    const toggleNav = (forceClose = false) => {
        const willOpen = forceClose ? false : !nav.classList.contains('open');
        nav.classList.toggle('open', willOpen);
        overlay?.classList.toggle('show', willOpen);
        document.body.classList.toggle('no-scroll', willOpen);
    };
    document.querySelectorAll('.nav-links a')
        .forEach(a => a.addEventListener('click', () => toggleNav(true)));
    overlay?.addEventListener('click', () => toggleNav(true));
    burger?.addEventListener('click', e => { e.stopPropagation(); toggleNav() });
    document.addEventListener('click', e => {
        if (!nav.classList.contains('open')) return;
        if (nav.contains(e.target) || burger.contains(e.target)) return;
        toggleNav(true);
    });
}

/* ============================================================= *
 * 3.  FORMULÁRIO DE MENSAGENS  |  Cloudinary  +  Google Sheets   *
 * ============================================================= */
const CLOUD_URL = 'https://api.cloudinary.com/v1_1/dz5bh3k5q/image/upload';
const UP_PRESET = 'guestbook_photos';
const API_URL = 'https://script.google.com/macros/s/AKfycbwOiTUlF72gJNh08lVzUGhftcAsqeIQKns6x0RI5WwLn-uXr1sL7VkFo2GHKfWCBghurw/exec';

document.addEventListener('DOMContentLoaded', () => {
    const form = $('#msgForm'); if (!form) return;  // página sem form?
    const status = $('#status');
    const fileEl = $('#photo');
    const nameEl = $('#file-name');

    /* — mostra nome do arquivo — */
    fileEl?.addEventListener('change', e => {
        nameEl.textContent = e.target.files.length ? e.target.files[0].name
            : 'Nenhum arquivo';
    });

    form.addEventListener('submit', async e => {
        e.preventDefault();
        if (!form.checkValidity()) { form.reportValidity(); return; }

        status.textContent = 'Enviando…';
        const { nome, relacao, mensagem } = form;
        let photoURL = '';

        try {
            /* ---------- Upload opcional ---------- */
            if (fileEl.files[0]) {
                const fd = new FormData();
                fd.append('file', fileEl.files[0]);
                fd.append('upload_preset', UP_PRESET);
                const r = await fetch(CLOUD_URL, { method: 'POST', body: fd });
                const j = await r.json();
                if (!r.ok) throw new Error(j.error?.message || 'Falha no upload');
                photoURL = j.secure_url;
            }

            /* ---------- Envia à planilha ---------- */
            await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify({
                    nome: nome.value.trim(),
                    relacao: relacao.value.trim(),
                    mensagem: mensagem.value.trim(),
                    photoURL
                })
            });

            /* ---------- Sucesso ---------- */
            status.textContent = '';
            form.reset(); nameEl.textContent = 'Nenhum arquivo';
            form.classList.add('sent');          // ⭐ mostra bloco “obrigado”
            // Se quiser voltar automaticamente após X s:
            // setTimeout(()=>form.classList.remove('sent'),8000);

        } catch (err) {
            console.error(err);
            status.textContent = 'Ops! Não foi possível enviar. Tente novamente.';
        }
    });
});

/* ============================================================= *
 * 4.  CARREGA MURAL  (só se existir <div id="board">)           *
 * ============================================================= */
const BOARD = $('#board');
if (BOARD) {
    fetch(API_URL)
        .then(r => r.json())
        .then(rows => {
            rows.forEach(d => {
                const note = document.createElement('article');
                note.className = 'postit';
                note.style.setProperty('--r', Math.random() * 8 - 4);
                note.innerHTML = `
          <h3>${d.nome}</h3>
          <small>${d.relacao} • ${d.date}</small>
          <p>${d.mensagem}</p>`;
                if (d.foto) {
                    note.innerHTML += `<img src="${d.foto}" loading="lazy">`;
                }
                BOARD.appendChild(note);
            });
        })
        .catch(console.error);
}

/* ============================= *
 * 5.  ANIMAÇÃO DO BOTÃO         *
 * ============================= */
const btn = $('.send-btn');
btn?.addEventListener('click', () => {
    btn.classList.remove('play'); void btn.offsetWidth; btn.classList.add('play');
});
