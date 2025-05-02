/* ============================= */
/* 1. VARIÁVEIS GLOBAIS         */
/* ============================= */
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQk9gTXvSZs4l_FKWuM3Xv_igDiBFx_PBn0thUy1xQd7i_m54fwBYZIPj5XEwTEi1xdk3-3weZkXScn/pub?gid=0&single=true&output=csv';

// Array que conterá todos os itens vindos da planilha
let allItems = [];

// Variáveis de estado para filtros e categorias
let categoriaAtiva = "todos";
let subcategoriaAtiva = null;
let statusFiltro = null;
let precoOrdem = null;
let filtroMaisDesejados = false;
let filtroPresentesRecebidos = false;

/* ============================= */
/* 2. BUSCA E PARSE DO CSV       */
/* ============================= */
fetch(csvUrl)
    .then(response => response.text())
    .then(csvText => {
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        allItems = parsed.data;

        // Se estivermos em gifts.html (itemsGrid existe) ────────────
        const itemsGrid = document.getElementById('itemsGrid');
        if (itemsGrid) {
            renderCards(allItems);
            gerarCategoriasComSubcategorias();
            setupCategoryFilters();
            setupTopoCategoryButtons();
            atualizarTituloCategoria(allItems.length);
            atualizarEstadoFiltro();
            setupStatusAndSortButtons();
            setupMaisDesejadosFilter();
            setupPresentesRecebidosFilter();
        }

        // Se estivermos na Home (homeItemsGrid existe) ─────────────
        const homeGrid = document.getElementById('homeItemsGrid');
        if (homeGrid) {
            const featuredItems = allItems.filter(item =>
                item["Mais desejado"]?.trim().toLowerCase() === "sim"
            );
            function rotateFeatured() {
                const count = window.innerWidth <= 768 ? 2 : 5;
                homeGrid.classList.add('fade-out');
                setTimeout(() => {
                    const sample = featuredItems.sort(() => Math.random() - 0.5).slice(0, count);
                    homeGrid.innerHTML = '';
                    sample.forEach(item => {
                        const statusClass = item["Status"]?.toLowerCase().trim() === "já temos" ? "ja-temos" : "nao-temos";
                        const card = document.createElement('div');
                        card.classList.add('item-card');
                        card.dataset.category = item["Categoria"]?.toLowerCase().trim() || '';
                        card.dataset.subcategory = item["Subcategoria"]?.toLowerCase().trim() || '';
                        card.dataset.status = item["Status"]?.toLowerCase().trim() || '';
                        const valorNumerico = parseFloat(item["Valor"]?.replace(/\./g, '').replace(',', '.')) || 0;
                        card.dataset.price = valorNumerico;
                        if (item["Mais desejado"]?.trim().toLowerCase() === "sim") card.classList.add('card-mais-desejado');
                        if (statusClass === 'ja-temos') card.classList.add('card-ja-temos');
                        card.innerHTML = `
              <img src="${item["Imagem"]}" alt="${item["Nome do Item"]}" />
              <div class="item-info">
                <h3 class="item-name">${item["Nome do Item"]}</h3>
                <span class="status ${statusClass}">${item["Status"]}</span>
                <p class="item-price">R$ ${item["Valor"]}</p>
                <p class="item-date">${item["Data de atualização"]}</p>
                ${item["Link"] ? `<a class="item-link" href="${item["Link"]}" target="_blank" rel="noopener noreferrer">
                  <i class="fas fa-external-link-alt"></i> Link
                </a>` : ``}
              </div>
            `;
                        homeGrid.appendChild(card);
                    });
                    homeGrid.classList.remove('fade-out');
                    homeGrid.classList.add('fade-in');
                    setTimeout(() => homeGrid.classList.remove('fade-in'), 500);
                }, 500);
            }
            rotateFeatured();
            window.addEventListener('resize', rotateFeatured);
            setInterval(rotateFeatured, 5000);
        }
    })
    .catch(err => console.error('Erro ao carregar CSV:', err));

/* ============================= */
/* 3. RENDERIZAÇÃO DOS CARDS     */
/* ============================= */
function renderCards(items) {
    const container = document.getElementById('itemsGrid');
    container.innerHTML = '';
    items.forEach(item => {
        const statusClass = item["Status"]?.toLowerCase().trim() === "já temos" ? "ja-temos" : "nao-temos";
        const card = document.createElement('div');
        card.classList.add('item-card');
        card.dataset.category = item["Categoria"]?.toLowerCase().trim();
        card.dataset.subcategory = item["Subcategoria"]?.toLowerCase().trim();
        card.dataset.status = item["Status"]?.toLowerCase().trim();
        const valorNumerico = parseFloat(item["Valor"]?.replace(/\./g, '').replace(',', '.')) || 0;
        card.dataset.price = valorNumerico;
        if (item["Mais desejado"]?.trim().toLowerCase() === "sim") card.classList.add("card-mais-desejado");
        if (item["Status"]?.trim().toLowerCase() === "já temos") card.classList.add("card-ja-temos");
        card.innerHTML = `
      <img src="${item["Imagem"]}" alt="${item["Nome do Item"]}" />
      <div class="item-info">
        <h3 class="item-name">${item["Nome do Item"]}</h3>
        <span class="status ${statusClass}">${item["Status"]}</span>
        <p class="item-price">R$ ${item["Valor"]}</p>
        <p class="item-date">${item["Data de atualização"]}</p>
        ${item["Link"] ? `<a class="item-link" href="${item["Link"]}" target="_blank" rel="noopener noreferrer">
          <i class="fas fa-external-link-alt"></i> Link
        </a>` : ''}
      </div>
    `;
        container.appendChild(card);
    });
    atualizarTituloCategoria(items.length);
    atualizarEstadoFiltro();
}

/* ============================= */
/* 4. GERAÇÃO DE CATEGORIAS E SUB */
/* ============================= */
function gerarCategoriasComSubcategorias() {
    const lista = document.querySelector('.categories-list');
    if (!lista) return;
    lista.innerHTML = '';
    const mapCat = {};
    allItems.forEach(item => {
        const c = item["Categoria"]?.toLowerCase().trim();
        const s = item["Subcategoria"]?.toLowerCase().trim();
        if (!c) return;
        if (!mapCat[c]) mapCat[c] = new Set();
        if (s) mapCat[c].add(s);
    });
    Object.keys(mapCat).sort().forEach(cat => {
        const li = document.createElement('li');
        li.classList.add('sidebar-category');
        li.dataset.category = cat;
        const a = document.createElement('a');
        a.href = '#';
        a.classList.add('category-toggle');
        a.innerHTML = `<i class="fas fa-chevron-right toggle-icon"></i><span class="category-label">${capitalizar(cat)}</span>`;
        li.appendChild(a);
        const ul = document.createElement('ul');
        ul.classList.add('subcategoria-list');
        Array.from(mapCat[cat]).sort().forEach(sub => {
            const sli = document.createElement('li');
            sli.classList.add('sidebar-subcategoria');
            sli.dataset.subcategoria = sub;
            const sa = document.createElement('a');
            sa.href = '#';
            sa.textContent = capitalizar(sub);
            sli.appendChild(sa);
            ul.appendChild(sli);
        });
        if (ul.children.length) li.appendChild(ul);
        else li.querySelector('.toggle-icon').style.display = 'none';
        lista.appendChild(li);
    });
}

/* ============================= */
/* 5. CAPITALIZAR               */
/* ============================= */
function capitalizar(txt) {
    return txt ? txt[0].toUpperCase() + txt.slice(1) : '';
}

/* ============================= */
/* 6. FILTRO CLICS SIDEBAR      */
/* ============================= */
function setupCategoryFilters() {
    const lista = document.querySelector('.categories-list');
    if (!lista) return;
    lista.addEventListener('click', e => {
        const a = e.target.closest('a');
        if (!a) return;
        e.preventDefault();
        const li = a.closest('li');
        const isCat = li.classList.contains('sidebar-category');
        const isSub = li.classList.contains('sidebar-subcategoria');
        let novaCat = categoriaAtiva, novaSub = subcategoriaAtiva;
        if (isCat) {
            const c = li.dataset.category;
            if (categoriaAtiva === c && !subcategoriaAtiva) {
                novaCat = 'todos';
                novaSub = null;
            } else {
                novaCat = c;
                novaSub = null;
            }
        } else if (isSub) {
            const s = li.dataset.subcategoria;
            const parent = li.closest('.sidebar-category').dataset.category;
            if (parent) {
                if (subcategoriaAtiva !== s) {
                    novaCat = parent;
                    novaSub = s;
                }
            }
        }
        if (novaCat !== categoriaAtiva || novaSub !== subcategoriaAtiva) {
            categoriaAtiva = novaCat;
            subcategoriaAtiva = novaSub;
            statusFiltro = precoOrdem = null;
            document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
            aplicarFiltro();
        } else if (isCat) {
            li.classList.toggle('expanded');
            atualizarEstadoFiltro();
        }
    });
}

/* ============================= */
/* 7. FILTRO CLICS TOPO         */
/* ============================= */
function setupTopoCategoryButtons() {
    document.querySelectorAll('.category-card').forEach(btn => {
        btn.addEventListener('click', () => {
            const cat = btn.dataset.category;
            if (cat === 'todos') {
                filtroMaisDesejados = filtroPresentesRecebidos = false;
                statusFiltro = precoOrdem = null;
                document.querySelectorAll('.sort-btn').forEach(b => { b.classList.remove('active'); b.style.display = ''; });
            }
            if (categoriaAtiva !== cat || subcategoriaAtiva !== null || categoriaAtiva === cat) {
                if (categoriaAtiva === cat && !subcategoriaAtiva && cat !== 'todos') {
                    categoriaAtiva = 'todos';
                    subcategoriaAtiva = null;
                } else {
                    categoriaAtiva = cat;
                    subcategoriaAtiva = null;
                }
                statusFiltro = precoOrdem = null;
                document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
                aplicarFiltro();
            }
        });
    });
}

/* ============================= */
/* 8. ATUALIZAÇÃO DO TÍTULO      */
/* ============================= */
function atualizarTituloCategoria(qtd = 0) {
    const el = document.getElementById('tituloCategoria');
    if (!el) return;
    let html = `<span class="titulo-main">Todos os Itens</span> <span class="titulo-count">(${qtd})</span>`;
    if (categoriaAtiva !== 'todos' && !subcategoriaAtiva) {
        html = `<span class="titulo-main">${capitalizar(categoriaAtiva)}</span> <span class="titulo-count">(${qtd})</span>`;
    }
    if (categoriaAtiva !== 'todos' && subcategoriaAtiva) {
        html = `<span class="titulo-main muted">${capitalizar(categoriaAtiva)}</span> &gt; <span class="titulo-sub">${capitalizar(subcategoriaAtiva)}</span> <span class="titulo-count">(${qtd})</span>`;
    }
    if (filtroMaisDesejados) {
        html = `<span class="titulo-main">Todos os Itens</span> &gt; <span class="titulo-sub">Mais Desejados</span> <span class="titulo-count">(${qtd})</span>`;
    } else if (filtroPresentesRecebidos) {
        html = `<span class="titulo-main">Todos os Itens</span> &gt; <span class="titulo-sub">Presentes Recebidos</span> <span class="titulo-count">(${qtd})</span>`;
    }
    el.innerHTML = html;
}

/* ============================= */
/* 9. ATUALIZA VISUAL FILTROS    */
/* ============================= */
function atualizarEstadoFiltro() {
    // sidebar
    document.querySelectorAll('.sidebar-category').forEach(el => {
        const isActive = el.dataset.category === categoriaAtiva && !subcategoriaAtiva;
        el.classList.toggle('active', isActive);
        el.classList.toggle('expanded', el.dataset.category === categoriaAtiva);
        const ul = el.querySelector('.subcategoria-list');
        const ic = el.querySelector('.toggle-icon');
        if (el.classList.contains('expanded')) {
            ic.classList.replace('fa-chevron-right', 'fa-chevron-down');
            ul.style.maxHeight = ul.scrollHeight + 16 + 'px';
            ul.style.padding = '8px 0';
        } else {
            ic.classList.replace('fa-chevron-down', 'fa-chevron-right');
            ul.style.maxHeight = '0';
            ul.style.padding = '0';
        }
    });
    document.querySelectorAll('.sidebar-subcategoria').forEach(el => {
        el.classList.toggle('active',
            el.dataset.subcategoria === subcategoriaAtiva &&
            el.closest('.sidebar-category').dataset.category === categoriaAtiva
        );
    });
    // topo
    document.querySelectorAll('.category-card').forEach(el => {
        el.classList.toggle('active',
            el.dataset.category === categoriaAtiva && !subcategoriaAtiva
        );
    });
    // menu (desktop/mobile)
    document.querySelectorAll('.menuTodosItens').forEach(el =>
        el.classList.toggle('active', categoriaAtiva === 'todos' && !subcategoriaAtiva)
    );
    document.querySelectorAll('.menuMaisDesejados').forEach(el =>
        el.classList.toggle('active', filtroMaisDesejados)
    );
    document.querySelectorAll('.menuPresentesRecebidos').forEach(el =>
        el.classList.toggle('active', filtroPresentesRecebidos)
    );
}

/* ============================= */
/* 10. APLICAR FILTROS E ORDENA  */
/* ============================= */
function aplicarFiltro() {
    let items = [...allItems];
    if (categoriaAtiva !== 'todos') {
        items = items.filter(i => i["Categoria"]?.toLowerCase().trim() === categoriaAtiva);
    }
    if (subcategoriaAtiva) {
        items = items.filter(i => i["Subcategoria"]?.toLowerCase().trim() === subcategoriaAtiva);
    }
    if (filtroPresentesRecebidos) {
        items = items.filter(i => i["Status"]?.toLowerCase().trim() === 'já temos');
    } else if (statusFiltro) {
        const espera = statusFiltro === 'ja-temos' ? 'já temos' : 'não temos';
        items = items.filter(i => i["Status"]?.toLowerCase().trim() === espera);
    }
    if (precoOrdem) {
        items.sort((a, b) => {
            const va = parseFloat(a["Valor"].replace(/\./g, '').replace(',', '.')) || 0;
            const vb = parseFloat(b["Valor"].replace(/\./g, '').replace(',', '.')) || 0;
            return precoOrdem === 'price-asc' ? va - vb : vb - va;
        });
    }
    if (filtroMaisDesejados) {
        items = items.filter(i => i["Mais desejado"]?.toLowerCase().trim() === 'sim');
    }
    renderCards(items);
}

/* ============================= */
/* 11. SETUP STATUS E SORT       */
/* ============================= */
function setupStatusAndSortButtons() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const status = btn.dataset.status;
            const sort = btn.dataset.sort;
            if (status) {
                if (statusFiltro === status) {
                    statusFiltro = null; btn.classList.remove('active');
                } else {
                    statusFiltro = status;
                    document.querySelectorAll('.sort-btn[data-status]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            }
            if (sort) {
                if (precoOrdem === sort) {
                    precoOrdem = null; btn.classList.remove('active');
                } else {
                    precoOrdem = sort;
                    document.querySelectorAll('.sort-btn[data-sort]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            }
            aplicarFiltro();
        });
    });
}

/* ============================= */
/* 12. MAIS DESEJADOS (setup)    */
/* ============================= */
function setupMaisDesejadosFilter() {
    document.querySelectorAll('.menuMaisDesejados').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            // desativa o outro
            filtroPresentesRecebidos = false;
            // toggle
            filtroMaisDesejados = !filtroMaisDesejados;
            // oculta/exibe status
            document.querySelectorAll('.sort-btn[data-status]').forEach(b => {
                b.style.display = filtroMaisDesejados ? 'none' : '';
            });
            aplicarFiltro();
            atualizarEstadoFiltro();
            // fecha sidebar em mobile
            toggleSidebar(true);
        });
    });
}

/* ============================= */
/* 13. PRESENTES RECEBIDOS (setup)*/
/* ============================= */
function setupPresentesRecebidosFilter() {
    document.querySelectorAll('.menuPresentesRecebidos').forEach(link => {
        link.addEventListener('click', e => {
            e.preventDefault();
            filtroMaisDesejados = false;
            filtroPresentesRecebidos = !filtroPresentesRecebidos;
            // oculta/exibe status e preço
            document.querySelectorAll('.sort-btn[data-status], .sort-btn[data-sort]').forEach(b => {
                b.style.display = filtroPresentesRecebidos ? 'none' : '';
            });
            aplicarFiltro();
            atualizarEstadoFiltro();
            toggleSidebar(true);
        });
    });
}

/* ============================= */
/* 14. MODAL PIX                 */
/* ============================= */
function abrirPixModal() {
    const m = document.getElementById('pixModal');
    if (m) {
        // remove qualquer exibição inline anterior
        m.style.display = 'block';
        // adiciona a classe que o CSS espera
        m.classList.add('show');
    }
}

function fecharPixModal() {
    const m = document.getElementById('pixModal');
    if (m) {
        m.classList.add('fechando');
        m.classList.remove('ativo');
        setTimeout(() => {
            if (m.classList.contains('fechando')) {
                m.style.display = 'none';
                m.classList.remove('fechando');
            }
        }, 300);
    }
}
document.addEventListener('click', e => {
    const m = document.getElementById('pixModal');
    if (m && m.style.display === 'block' && e.target === m) fecharPixModal();
});
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('copiarChavePix');
    const chave = document.getElementById('chavePix');
    if (btn && chave) {
        btn.addEventListener('click', () => {
            navigator.clipboard.writeText(chave.innerText)
                .then(() => {
                    const orig = btn.innerHTML;
                    btn.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                    btn.classList.add('copiado');
                    btn.disabled = true;
                    setTimeout(() => {
                        btn.innerHTML = orig;
                        btn.classList.remove('copiado');
                        btn.disabled = false;
                    }, 2000);
                })
                .catch(err => {
                    console.error(err);
                    const st = document.getElementById('copiarStatus');
                    if (st) st.textContent = 'Erro ao copiar.';
                    setTimeout(() => st.textContent = '', 2000);
                });
        });
    }
    // contador
    const cd = document.getElementById('countdown');
    if (cd) {
        const target = new Date("2025-09-28T12:00:00");
        function upd() {
            const diff = target - new Date();
            if (diff <= 0) { cd.textContent = "É hoje! Felicidades aos noivos!"; return; }
            const d = Math.floor(diff / 86400000);
            const h = Math.floor((diff / 3600000) % 24);
            const m = Math.floor((diff / 60000) % 60);
            const s = Math.floor((diff / 1000) % 60);
            cd.textContent = `${d} dias, ${h}h ${m}m ${s}s até o grande dia!`;
        }
        upd(); setInterval(upd, 1000);
    }
});

/* ============================= */
/* 15. MENU MOBILE               */
/* ============================= */
function toggleSidebar(forceClose = false) {
    const sb = document.querySelector('.sidebar');
    if (!sb) return;
    if (forceClose) sb.classList.remove('open');
    else sb.classList.toggle('open');
}
document.querySelectorAll('.menu a, .categories-list a').forEach(a => {
    a.addEventListener('click', () => toggleSidebar(true));
});
document.addEventListener('click', e => {
    const sb = document.querySelector('.sidebar');
    const hb = document.querySelector('.hamburger-menu');
    if (!sb || !sb.classList.contains('open')) return;
    if (sb.contains(e.target) || hb.contains(e.target)) return;
    toggleSidebar(true);
});
function toggleFiltros() {
    const fc = document.querySelector('.filtros-conteudo');
    if (fc) fc.classList.toggle('filtros-aberto');
}

