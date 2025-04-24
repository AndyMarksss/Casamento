
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
