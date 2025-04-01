
// ==============================
// 1. VARIÁVEIS GLOBAIS
// ==============================
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQk9gTXvSZs4l_FKWuM3Xv_igDiBFx_PBn0thUy1xQd7i_m54fwBYZIPj5XEwTEi1xdk3-3weZkXScn/pub?gid=0&single=true&output=csv';
let allItems = [];
let categoriaAtiva = "todos";
let subcategoriaAtiva = null;
let statusFiltro = null;
let precoOrdem = null;

// ==============================
// 2. BUSCA E PARSE DO CSV
// ==============================
fetch(csvUrl)
    .then(response => response.text())
    .then(csvText => {
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        allItems = parsed.data;

        renderCards(allItems);
        gerarCategoriasComSubcategorias();
        setupCategoryFilters();
        setupTopoCategoryButtons();
        atualizarTituloCategoria(allItems.length);
        atualizarEstadoFiltro();
        setupStatusAndSortButtons();
    })
    .catch(err => console.error('Erro ao carregar CSV:', err));

// ==============================
// 3. RENDERIZAÇÃO DOS CARDS
// ==============================
function renderCards(items) {
    const container = document.getElementById('itemsGrid');
    container.innerHTML = '';

    items.forEach(item => {
        let statusClass = item["Status"] === "Já temos" ? "ja-temos" : "nao-temos";

        const card = document.createElement('div');
        card.classList.add('item-card');

        card.innerHTML = `
            <img src="${item["Imagem"]}" alt="${item["Nome do Item"]}" />
            <div class="item-info">
                <h3 class="item-name">${item["Nome do Item"]}</h3>
                <span class="status ${statusClass}">${item["Status"]}</span>
                <p class="item-price">R$ ${item["Valor"]}</p>
                <a class="item-link" href="${item["Link"]}" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-external-link-alt"></i> Link
                </a>
            </div>
        `;
        container.appendChild(card);
    });
    atualizarTituloCategoria(items.length);
    atualizarEstadoFiltro();
}

// ==============================
// 4. GERAÇÃO DAS CATEGORIAS E SUBCATEGORIAS
// ==============================
function gerarCategoriasComSubcategorias() {
    const lista = document.querySelector('.categories-list');
    lista.innerHTML = '';

    const categoriasMap = {};

    allItems.forEach(item => {
        const categoria = item["Categoria"]?.toLowerCase().trim();
        const sub = item["Subcategoria"]?.toLowerCase().trim();
        if (!categoria) return;
        if (!categoriasMap[categoria]) categoriasMap[categoria] = new Set();
        if (sub) categoriasMap[categoria].add(sub);
    });

    const categoriasOrdenadas = Object.keys(categoriasMap).sort();

    categoriasOrdenadas.forEach(cat => {
        const li = document.createElement('li');
        li.classList.add('sidebar-category');
        li.setAttribute('data-category', cat);

        li.innerHTML = `
            <a href="#" class="category-toggle">
                <i class="fas fa-chevron-right toggle-icon"></i>
                <span class="category-label">${capitalizar(cat)}</span>
            </a>
            <ul class="subcategoria-list"></ul>
        `;

        const ulSub = li.querySelector('.subcategoria-list');
        const subOrdenadas = Array.from(categoriasMap[cat]).sort();

        subOrdenadas.forEach(sub => {
            const subLi = document.createElement('li');
            subLi.classList.add('sidebar-subcategoria');
            subLi.setAttribute('data-subcategoria', sub);
            subLi.innerHTML = `<a href="#">${capitalizar(sub)}</a>`;
            ulSub.appendChild(subLi);
        });

        lista.appendChild(li);
    });
}

// ==============================
// 5. UTILITÁRIO: CAPITALIZAR
// ==============================
function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ==============================
// 6. FILTRO PELA SIDEBAR
// ==============================
function setupCategoryFilters() {
    document.querySelectorAll('.categories-list').forEach(menu => {
        menu.addEventListener('click', e => {
            const target = e.target.closest('a');
            if (!target) return;

            e.preventDefault();
            const li = target.parentElement;
            const categoria = li.dataset.category;
            const subcategoria = li.dataset.subcategoria;

            // Resetar filtros ao trocar categoria/subcategoria
            statusFiltro = null;
            precoOrdem = null;
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));

            if (subcategoria) {
                subcategoriaAtiva = subcategoria;
                const filtrados = allItems.filter(item =>
                    item["Categoria"]?.toLowerCase().trim() === categoriaAtiva &&
                    item["Subcategoria"]?.toLowerCase().trim() === subcategoriaAtiva
                );
                renderCards(filtrados);
                return;
            }

            if (categoria) {
                if (categoriaAtiva === categoria && !subcategoriaAtiva) {
                    categoriaAtiva = "todos";
                    subcategoriaAtiva = null;
                    renderCards(allItems);
                } else {
                    categoriaAtiva = categoria;
                    subcategoriaAtiva = null;
                    const filtrados = allItems.filter(item => item["Categoria"]?.toLowerCase().trim() === categoria);
                    renderCards(filtrados);
                }
            }
        });
    });
}

// ==============================
// 7. FILTRO PELO TOPO
// ==============================
function setupTopoCategoryButtons() {
    const botoesTopo = document.querySelectorAll('.category-card');
    botoesTopo.forEach(botao => {
        botao.addEventListener('click', () => {
            const categoria = botao.dataset.category;

            // Resetar filtros ao trocar de categoria
            statusFiltro = null;
            precoOrdem = null;
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));

            if (categoria === "todos") {
                categoriaAtiva = "todos";
                subcategoriaAtiva = null;
                renderCards(allItems);
                return;
            }

            if (categoriaAtiva === categoria && !subcategoriaAtiva) {
                categoriaAtiva = "todos";
                subcategoriaAtiva = null;
                renderCards(allItems);
                return;
            }

            categoriaAtiva = categoria;
            subcategoriaAtiva = null;
            const filtrados = allItems.filter(item => item["Categoria"]?.toLowerCase().trim() === categoria);
            renderCards(filtrados);
        });
    });
}

// ==============================
// 8. ATUALIZAÇÃO DO TÍTULO
// ==============================
function atualizarTituloCategoria(qtd = 0) {
    const titulo = document.getElementById('tituloCategoria');
    let texto = `<span class="titulo-main">Todos os Itens</span> <span class="titulo-count">(${qtd})</span>`;

    if (categoriaAtiva && categoriaAtiva !== "todos" && !subcategoriaAtiva) {
        texto = `<span class="titulo-main">${capitalizar(categoriaAtiva)}</span> <span class="titulo-count">(${qtd})</span>`;
    } else if (categoriaAtiva && subcategoriaAtiva) {
        texto = `<span class="titulo-main muted">${capitalizar(categoriaAtiva)}</span> &gt; <span class="titulo-sub">${capitalizar(subcategoriaAtiva)}</span> <span class="titulo-count">(${qtd})</span>`;
    }

    if (titulo) titulo.innerHTML = texto;
}

// ==============================
// 9. ATUALIZAÇÃO VISUAL DE FILTROS ATIVOS
// ==============================
function atualizarEstadoFiltro() {
    document.querySelectorAll('.sidebar-category').forEach(el => {
        const cat = el.dataset.category;
        el.classList.toggle('active', cat === categoriaAtiva);

        const icon = el.querySelector('.toggle-icon');
        const sub = el.querySelector('.subcategoria-list');
        if (cat === categoriaAtiva) {
            el.classList.add('expanded');
            icon.classList.remove('fa-chevron-right');
            icon.classList.add('fa-chevron-down');
            sub.style.maxHeight = sub.scrollHeight + 'px';
            sub.style.paddingTop = '8px';
            sub.style.paddingBottom = '8px';
        } else {
            el.classList.remove('expanded');
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-right');
            sub.style.maxHeight = '0px';
            sub.style.paddingTop = '0';
            sub.style.paddingBottom = '0';
        }
    });

    document.querySelectorAll('.sidebar-subcategoria').forEach(el => {
        el.classList.toggle('active', el.dataset.subcategoria === subcategoriaAtiva);
    });

    document.querySelectorAll('.category-card').forEach(el => {
        const cat = el.dataset.category;
        const isTodos = categoriaAtiva === "todos" && cat === "todos";
        const isMatch = cat === categoriaAtiva;
        el.classList.toggle('active', isTodos || isMatch);
    });
}

// ==============================
// 10. APLICAR FILTRO NA TELA
// ==============================
function aplicarFiltro() {
    let filtrados = allItems;

    if (categoriaAtiva && categoriaAtiva !== "todos") {
        filtrados = filtrados.filter(item => item["Categoria"]?.toLowerCase().trim() === categoriaAtiva);
    }
    if (subcategoriaAtiva) {
        filtrados = filtrados.filter(item => item["Subcategoria"]?.toLowerCase().trim() === subcategoriaAtiva);
    }

    if (statusFiltro) {
        filtrados = filtrados.filter(item => {
            const status = item["Status"]?.toLowerCase().trim();
            return statusFiltro === "ja-temos"
                ? status === "já temos"
                : status === "não temos";
        });
    }

    // Ordenação por preço (com tratamento de formato brasileiro)
    if (precoOrdem === "price-asc" || precoOrdem === "price-desc") {
        filtrados = [...filtrados].sort((a, b) => {
            const valorA = parseFloat(a["Valor"].replace(/\./g, '').replace(',', '.')) || 0;
            const valorB = parseFloat(b["Valor"].replace(/\./g, '').replace(',', '.')) || 0;

            return precoOrdem === "price-asc"
                ? valorA - valorB
                : valorB - valorA;
        });
    }

    renderCards(filtrados);
}

// ==============================
// 11. BOTÕES DE STATUS E ORDEM
// ==============================
function setupStatusAndSortButtons() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const status = btn.dataset.status;
            const sort = btn.dataset.sort;

            if (status) {
                if (statusFiltro === status) {
                    statusFiltro = null;
                    btn.classList.remove('active');
                } else {
                    statusFiltro = status;
                    document.querySelectorAll('.sort-btn[data-status]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            }

            if (sort) {
                if (precoOrdem === sort) {
                    precoOrdem = null;
                    btn.classList.remove('active');
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

// ==============================
// 12. MODAL DO PIX
// ==============================
// Modal Pix: abrir e fechar
function abrirPixModal() {
    document.getElementById("pixModal").classList.add("show");
}

function fecharPixModal() {
    document.getElementById("pixModal").classList.remove("show");
}

// Fechar ao clicar fora do conteúdo do modal
document.addEventListener("click", function (event) {
    const modal = document.getElementById("pixModal");
    const content = document.getElementById("pixContent");
    if (modal.classList.contains("show") && !content.contains(event.target) && event.target.id !== "abrirPixModal") {
        fecharPixModal();
    }
});

// Copiar chave Pix
document.addEventListener("DOMContentLoaded", () => {
    const btnCopiar = document.getElementById("copiarChavePix");
    const chave = document.getElementById("chavePix");

    if (btnCopiar && chave) {
        btnCopiar.addEventListener("click", () => {
            navigator.clipboard.writeText(chave.innerText).then(() => {
                btnCopiar.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    btnCopiar.innerHTML = '<i class="fas fa-copy"></i>';
                }, 1500);
            });
        });
    }
});
