// utilitário do seletor
function $(sel, ctx = document) { return ctx.querySelector(sel); }

// MESMA lógica de toggleNav do home.js, mas isolada só para o nav desta página
/*
const nav = $('#navbar'),
    burger = $('.hamburger-menu'),
    overlay = $('#menuOverlay');

if (nav) {
    const toggleNav = (forceClose = false) => {
        const willOpen = forceClose ? false : !nav.classList.contains('open');
        nav.classList.toggle('open', willOpen);
        overlay?.classList.toggle('show', willOpen);
        document.body.classList.toggle('no-scroll', willOpen);
    };

    // fecha ao clicar em qualquer link
    document.querySelectorAll('.nav-links a')
        .forEach(a => a.addEventListener('click', () => toggleNav(true)));

    overlay?.addEventListener('click', () => toggleNav(true));
    burger?.addEventListener('click', e => { e.stopPropagation(); toggleNav(); });

    document.addEventListener('click', e => {
        if (!nav.classList.contains('open')) return;
        if (nav.contains(e.target) || burger.contains(e.target)) return;
        toggleNav(true);
    });
} */
