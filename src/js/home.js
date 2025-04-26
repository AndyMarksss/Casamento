/* ============================= */
/* 1. CONTAGEM REGRESSIVA */
/* ============================= */
function countdown() {
    const targetDate = new Date('2025-09-28T12:00:00');
    const el = document.getElementById('countdown');
    if (!el) return;

    function update() {
        const now = new Date();
        const diff = targetDate - now;
        if (diff <= 0) {
            el.textContent = 'É hoje! Celebre conosco!';
            clearInterval(timer);
            return;
        }
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const m = Math.floor((diff / (1000 * 60)) % 60);
        const s = Math.floor((diff / 1000) % 60);
        el.textContent = `${d} dias, ${h}h ${m}m ${s}s até o grande dia`;
    }
    update();
    const timer = setInterval(update, 1000);
};

document.addEventListener('DOMContentLoaded', countdown);


/* ============================= */
/* 2. MENU MOBILE */
/* ============================= */
/* Referências únicas */
const nav = document.getElementById('navbar');
const hamburger = document.querySelector('.hamburger-menu');
const overlay = document.getElementById('menuOverlay');   // ✔️

/* Abre / fecha */
function toggleNav(forceClose = false) {
    if (!nav) return;

    const willOpen = forceClose ? false : !nav.classList.contains('open');

    nav.classList.toggle('open', willOpen);
    overlay.classList.toggle('show', willOpen);          // ‼️
    document.body.classList.toggle('no-scroll', willOpen); // ‼️
}

/* fecha ao clicar em um link do menu */
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => toggleNav(true));
});

/* fecha ao clicar no overlay (escuro) */
overlay.addEventListener('click', () => toggleNav(true));   // ‼️

/* impede propagação no hambúrguer para não fechar logo após abrir */
hamburger.addEventListener('click', e => e.stopPropagation());

/* fecha se clicar fora do nav e fora do hambúrguer */
document.addEventListener('click', e => {
    if (!nav.classList.contains('open')) return;
    if (nav.contains(e.target) || hamburger.contains(e.target)) return;
    toggleNav(true);
});



/* ============================= */
/* 3.  */
/* ============================= */