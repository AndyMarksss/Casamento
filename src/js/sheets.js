// ==============================
// 1. VARIÁVEIS GLOBAIS
// ==============================
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQk9gTXvSZs4l_FKWuM3Xv_igDiBFx_PBn0thUy1xQd7i_m54fwBYZIPj5XEwTEi1xdk3-3weZkXScn/pub?gid=0&single=true&output=csv';
let allItems = [];
let categoriaAtiva = null;
let subcategoriaAtiva = null;

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
        <p class="item-date">${item["Data de atualização"]}</p>
        <p class="item-price">R$ ${item["Valor"]}</p>
        <a class="item-link" href="${item["Link"]}" target="_blank" rel="noopener noreferrer">
          <i class="fas fa-external-link-alt"></i> Link
        </a>
      </div>
    `;

        container.appendChild(card);
    });
}


// ==============================
// 4. GERAR CATEGORIAS E SUBCATEGORIAS DINAMICAMENTE
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

    for (let cat in categoriasMap) {
        const li = document.createElement('li');
        li.classList.add('sidebar-category');
        li.setAttribute('data-category', cat);

        li.innerHTML = `
      <a href="#"><i class="fas fa-angle-right toggle-icon"></i> ${capitalizar(cat)}</a>
      <ul class="subcategoria-list" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease; margin-left: 16px;"></ul>
    `;

        const ulSub = li.querySelector('.subcategoria-list');
        categoriasMap[cat].forEach(sub => {
            const subLi = document.createElement('li');
            subLi.classList.add('sidebar-subcategoria');
            subLi.setAttribute('data-subcategoria', sub);
            subLi.innerHTML = `<a href="#">${capitalizar(sub)}</a>`;
            ulSub.appendChild(subLi);
        });

        lista.appendChild(li);
    }
}

function capitalizar(texto) {
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}


// ==============================
// 5. FILTRO POR CATEGORIA E SUBCATEGORIA
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

            if (categoria) {
                document.querySelectorAll('.sidebar-category').forEach(el => {
                    el.classList.remove('active');
                    const submenu = el.querySelector('.subcategoria-list');
                    const icon = el.querySelector('.toggle-icon');
                    submenu.style.maxHeight = '0';
                    if (icon) icon.classList.remove('fa-angle-down');
                    if (icon) icon.classList.add('fa-angle-right');
                });

                li.classList.add('active');
                categoriaAtiva = categoria;
                subcategoriaAtiva = null;

                const submenu = li.querySelector('.subcategoria-list');
                const icon = li.querySelector('.toggle-icon');
                submenu.style.maxHeight = submenu.scrollHeight + 'px';
                if (icon) icon.classList.remove('fa-angle-right');
                if (icon) icon.classList.add('fa-angle-down');
            }

            if (subcategoria) {
                document.querySelectorAll('.sidebar-subcategoria').forEach(el => {
                    el.classList.remove('active');
                });

                li.classList.add('active');
                subcategoriaAtiva = subcategoria;
            }

            aplicarFiltro();
            marcarBotaoTopo();
        });
    });
}

function setupTopoCategoryButtons() {
    document.querySelectorAll('.category-card').forEach(botao => {
        botao.addEventListener('click', () => {
            const categoria = botao.dataset.category;

            document.querySelectorAll('.category-card').forEach(b => b.classList.remove('active'));
            botao.classList.add('active');

            categoriaAtiva = categoria === 'todos' ? null : categoria;
            subcategoriaAtiva = null;

            aplicarFiltro();
            marcarSidebar();
        });
    });
}

function aplicarFiltro() {
    let filtrados = allItems;

    if (categoriaAtiva) {
        filtrados = filtrados.filter(item => item["Categoria"]?.toLowerCase().trim() === categoriaAtiva);
    }
    if (subcategoriaAtiva) {
        filtrados = filtrados.filter(item => item["Subcategoria"]?.toLowerCase().trim() === subcategoriaAtiva);
    }

    renderCards(filtrados);
}

function marcarBotaoTopo() {
    document.querySelectorAll('.category-card').forEach(btn => {
        if (btn.dataset.category === categoriaAtiva) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });
}

function marcarSidebar() {
    document.querySelectorAll('.sidebar-category').forEach(cat => {
        const submenu = cat.querySelector('.subcategoria-list');
        const icon = cat.querySelector('.toggle-icon');

        if (cat.dataset.category === categoriaAtiva) {
            cat.classList.add('active');
            submenu.style.maxHeight = submenu.scrollHeight + 'px';
            if (icon) icon.classList.remove('fa-angle-right');
            if (icon) icon.classList.add('fa-angle-down');
        } else {
            cat.classList.remove('active');
            submenu.style.maxHeight = '0';
            if (icon) icon.classList.remove('fa-angle-down');
            if (icon) icon.classList.add('fa-angle-right');
        }
    });

    document.querySelectorAll('.sidebar-subcategoria').forEach(sub => {
        if (sub.dataset.subcategoria === subcategoriaAtiva) {
            sub.classList.add('active');
        } else {
            sub.classList.remove('active');
        }
    });
}
