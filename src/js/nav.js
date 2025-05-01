// Menu Hamburger – lógica de abrir/fechar nav em todas as páginas
const nav = document.getElementById('navbar'),
    burger = document.querySelector('.hamburger-menu'),
    overlay = document.getElementById('menuOverlay');

if (nav && burger && overlay) {
    const toggleNav = (forceClose = false) => {
        const willOpen = !forceClose && !nav.classList.contains('open');
        nav.classList.toggle('open', willOpen);
        overlay.classList.toggle('show', willOpen);
        document.body.classList.toggle('no-scroll', willOpen);
    };

    // Fecha o menu ao clicar em qualquer link de navegação
    document.querySelectorAll('.nav-links a').forEach(link =>
        link.addEventListener('click', () => toggleNav(true))
    );

    // Fecha ao clicar no overlay de fundo
    overlay.addEventListener('click', () => toggleNav(true));

    // Abre/fecha ao clicar no botão hamburger
    burger.addEventListener('click', e => {
        e.stopPropagation();
        toggleNav();
    });

    // Clique fora do nav + burger também fecha o menu
    document.addEventListener('click', e => {
        if (!nav.classList.contains('open')) return;
        if (nav.contains(e.target) || burger.contains(e.target)) return;
        toggleNav(true);
    });
}
