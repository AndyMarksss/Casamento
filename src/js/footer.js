/* footer.js */
(() => {
    const footer = document.querySelector('.site-footer-gift');
    if (!footer) return;

    let lastScroll = window.scrollY;

    window.addEventListener('scroll', () => {
        const current = window.scrollY;
        const atBottom = (window.innerHeight + current) >= document.body.scrollHeight;

        if (atBottom) {
            // sempre mostrar no fim da página
            footer.classList.remove('hide');
        } else if (current > lastScroll) {
            // rolou para baixo → esconde
            footer.classList.add('hide');
        } else {
            // rolou para cima → mostra
            footer.classList.remove('hide');
        }

        lastScroll = current;
    });
})();

