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
        // Converte o CSV em array de objetos
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        allItems = parsed.data;

        // Chamadas iniciais, após carregar os dados
        renderCards(allItems);                   // 3. Renderiza todos inicialmente
        gerarCategoriasComSubcategorias();       // 4. Gera menu lateral de categorias
        setupCategoryFilters();                  // 6. Configura cliques na sidebar
        setupTopoCategoryButtons();              // 7. Configura cliques nos cards do topo
        atualizarTituloCategoria(allItems.length);
        atualizarEstadoFiltro();                 // 9. Atualiza a UI inicial
        setupStatusAndSortButtons();             // 11. Configura botões de status/ordem
        setupMaisDesejadosFilter();              // 12. Configura o filtro "Mais Desejados"
        setupPresentesRecebidosFilter();         // 13. Configura o filtro "Presentes Já Recebidos"
    })
    .catch(err => console.error('Erro ao carregar CSV:', err));


/* ============================= */
/* 3. RENDERIZAÇÃO DOS CARDS     */
/* ============================= */
function renderCards(items) {
    const container = document.getElementById('itemsGrid');
    container.innerHTML = ''; // Limpa a área antes de renderizar

    items.forEach(item => {
        // Determina a classe de status (já temos ou não temos)
        let statusClass = item["Status"]?.toLowerCase().trim() === "já temos"
            ? "ja-temos"
            : "nao-temos";

        // Cria o elemento de card
        const card = document.createElement('div');
        card.classList.add('item-card');

        // Define data attributes para filtragens/ordenações futuras
        card.dataset.category = item["Categoria"]?.toLowerCase().trim();
        card.dataset.subcategory = item["Subcategoria"]?.toLowerCase().trim();
        card.dataset.status = item["Status"]?.toLowerCase().trim();

        // Converte valor em número (substitui ponto e vírgula)
        const valorNumerico = parseFloat(
            item["Valor"]?.replace(/\./g, '').replace(',', '.')
        ) || 0;
        card.dataset.price = valorNumerico;

        // Adiciona classe se for "Mais desejado"
        if (item["Mais desejado"] && item["Mais desejado"].trim().toLowerCase() === "sim") {
            card.classList.add("card-mais-desejado");
        }

        // Adiciona classe se for "já temos"
        if (item["Status"] && item["Status"].trim().toLowerCase() === "já temos") {
            card.classList.add("card-ja-temos");
        }

        // Monta o HTML interno do card
        card.innerHTML = `
            <img src="${item["Imagem"]}" alt="${item["Nome do Item"]}" />
            <div class="item-info">
                <h3 class="item-name">${item["Nome do Item"]}</h3>
                <span class="status ${statusClass}">${item["Status"]}</span>
                <p class="item-price">R$ ${item["Valor"]}</p>
                <p class="item-date">${item["Data de atualização"]}</p>
                ${item["Link"]
                ? `<a class="item-link" href="${item["Link"]}" target="_blank" rel="noopener noreferrer">
                          <i class="fas fa-external-link-alt"></i> Link
                       </a>`
                : ""
            }
            </div>
        `;

        container.appendChild(card);
    });

    // Atualiza título e estado de filtros após renderizar
    atualizarTituloCategoria(items.length);
    atualizarEstadoFiltro();
}


/* ============================= */
/* 4. GERAÇÃO DAS CATEGORIAS E SUBCATEGORIAS NA SIDEBAR */
/* ============================= */
function gerarCategoriasComSubcategorias() {
    const lista = document.querySelector('.categories-list');
    if (!lista) return;
    lista.innerHTML = '';

    // Mapeia categorias e subcategorias
    const categoriasMap = {};

    allItems.forEach(item => {
        const categoria = item["Categoria"]?.toLowerCase().trim();
        const sub = item["Subcategoria"]?.toLowerCase().trim();
        if (!categoria) return;
        if (!categoriasMap[categoria]) {
            categoriasMap[categoria] = new Set();
        }
        if (sub) {
            categoriasMap[categoria].add(sub);
        }
    });

    // Ordena as categorias alfabeticamente
    const categoriasOrdenadas = Object.keys(categoriasMap).sort();

    // Cria os <li> de cada categoria, e dentro deles, subcategorias
    categoriasOrdenadas.forEach(cat => {
        const li = document.createElement('li');
        li.classList.add('sidebar-category');
        li.setAttribute('data-category', cat);

        // Link principal da categoria
        const linkCat = document.createElement('a');
        linkCat.href = "#";
        linkCat.classList.add('category-toggle');
        linkCat.innerHTML = `
            <i class="fas fa-chevron-right toggle-icon"></i>
            <span class="category-label">${capitalizar(cat)}</span>
        `;
        li.appendChild(linkCat);

        // Lista de subcategorias
        const ulSub = document.createElement('ul');
        ulSub.classList.add('subcategoria-list');

        // Ordena as subcategorias
        const subOrdenadas = Array.from(categoriasMap[cat]).sort();

        // Cria cada <li> de subcategoria
        subOrdenadas.forEach(sub => {
            const subLi = document.createElement('li');
            subLi.classList.add('sidebar-subcategoria');
            subLi.setAttribute('data-subcategoria', sub);

            const linkSub = document.createElement('a');
            linkSub.href = "#";
            linkSub.textContent = capitalizar(sub);

            subLi.appendChild(linkSub);
            ulSub.appendChild(subLi);
        });

        // Se há subcategorias, adiciona a UL no LI da categoria
        if (subOrdenadas.length > 0) {
            li.appendChild(ulSub);
        } else {
            // Caso não tenha subcategorias, remove o ícone de toggle
            const icon = linkCat.querySelector('.toggle-icon');
            if (icon) icon.style.display = 'none';
        }

        lista.appendChild(li);
    });
}


/* ============================= */
/* 5. UTILITÁRIO: CAPITALIZAR    */
/* ============================= */
function capitalizar(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}


/* ============================= */
/* 6. SETUP DOS CLIQUES NA SIDEBAR (CATEGORIAS E SUBCATEGORIAS) */
/* ============================= */
function setupCategoryFilters() {
    const listaCategorias = document.querySelector('.categories-list');
    if (!listaCategorias) return;

    listaCategorias.addEventListener('click', e => {
        const linkClicado = e.target.closest('a');
        if (!linkClicado) return; // sai se não foi clique num link

        e.preventDefault(); // Previne navegação padrão

        const liPai = linkClicado.closest('li');
        if (!liPai) return;

        // Identifica se é categoria principal ou subcategoria
        const isCategoriaPrincipal = liPai.classList.contains('sidebar-category');
        const isSubcategoria = liPai.classList.contains('sidebar-subcategoria');

        let novaCategoria = categoriaAtiva;
        let novaSubcategoria = subcategoriaAtiva;

        // Se for categoria principal...
        if (isCategoriaPrincipal) {
            const categoriaSelecionada = liPai.dataset.category;
            // Se clicou na mesma categoria e sem subcategoria, define "todos"
            if (categoriaAtiva === categoriaSelecionada && !subcategoriaAtiva) {
                novaCategoria = "todos";
                novaSubcategoria = null;
            } else {
                // Caso contrário, ativa a nova categoria
                novaCategoria = categoriaSelecionada;
                novaSubcategoria = null;
            }
        }
        // Se for subcategoria
        else if (isSubcategoria) {
            const subcategoriaSelecionada = liPai.dataset.subcategoria;
            const liCategoriaMae = liPai.closest('.sidebar-category');
            const categoriaMae = liCategoriaMae?.dataset.category;

            if (categoriaMae) {
                // Se clicou na mesma subcategoria, mantemos/alternamos
                if (subcategoriaAtiva === subcategoriaSelecionada) {
                    // Opcional: poderia voltar a "null"
                } else {
                    // Ativa a categoria mãe e a subcategoria
                    novaCategoria = categoriaMae;
                    novaSubcategoria = subcategoriaSelecionada;
                }
            }
        }

        // Se houve mudança de categoria/subcategoria, atualiza e reaplica
        if (novaCategoria !== categoriaAtiva || novaSubcategoria !== subcategoriaAtiva) {
            categoriaAtiva = novaCategoria;
            subcategoriaAtiva = novaSubcategoria;

            // Reseta filtros de status/preço
            statusFiltro = null;
            precoOrdem = null;
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));

            aplicarFiltro();
        }
        // Se clicou numa categoria principal já ativa, apenas expande/recolhe
        else if (isCategoriaPrincipal) {
            const categoriaClicada = liPai.dataset.category;
            if (categoriaAtiva === categoriaClicada && !subcategoriaAtiva) {
                const ulSub = liPai.querySelector('.subcategoria-list');
                if (ulSub) {
                    liPai.classList.toggle('expanded');
                    atualizarEstadoFiltro();
                }
            }
        }
    });
}


/* ============================= */
/* 7. SETUP DOS CLIQUES NOS CARDS DE CATEGORIA DO TOPO */
/* ============================= */
function setupTopoCategoryButtons() {
    const botoesTopo = document.querySelectorAll('.category-card');
    botoesTopo.forEach(botao => {
        botao.addEventListener('click', () => {
            const categoriaSelecionada = botao.dataset.category;

            // Se clicou "todos", zera todos os filtros
            if (categoriaSelecionada === 'todos') {
                filtroMaisDesejados = false;
                filtroPresentesRecebidos = false;
                statusFiltro = null;
                precoOrdem = null;
                // Restaura botões
                document.querySelectorAll('.sort-btn').forEach(b => {
                    b.classList.remove('active');
                    b.style.display = "";
                });
            }

            // Se clicou na mesma categoria e subcategoria é nula, volta a "todos"
            if (
                categoriaAtiva !== categoriaSelecionada ||
                subcategoriaAtiva !== null ||
                categoriaAtiva === categoriaSelecionada
            ) {
                if (categoriaAtiva === categoriaSelecionada && !subcategoriaAtiva && categoriaSelecionada !== 'todos') {
                    categoriaAtiva = "todos";
                    subcategoriaAtiva = null;
                } else {
                    categoriaAtiva = categoriaSelecionada;
                    subcategoriaAtiva = null;
                }
                statusFiltro = null;
                precoOrdem = null;
                document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));
                aplicarFiltro();
            }
        });
    });
}


/* ============================= */
/* 8. ATUALIZAÇÃO DO TÍTULO DA CATEGORIA SELECIONADA */
/* ============================= */
function atualizarTituloCategoria(qtd = 0) {
    const tituloElement = document.getElementById('tituloCategoria');
    if (!tituloElement) return;

    // Valor padrão: "Todos os Itens"
    let texto = `<span class="titulo-main">Todos os Itens</span> <span class="titulo-count">(${qtd})</span>`;

    // Se a categoria estiver ativa e for != "todos" (sem subcat)
    if (categoriaAtiva && categoriaAtiva !== "todos" && !subcategoriaAtiva) {
        texto = `<span class="titulo-main">${capitalizar(categoriaAtiva)}</span> <span class="titulo-count">(${qtd})</span>`;
    }
    // Se tiver categoria e subcategoria
    else if (categoriaAtiva && categoriaAtiva !== "todos" && subcategoriaAtiva) {
        texto = `
            <span class="titulo-main muted">${capitalizar(categoriaAtiva)}</span>
            &gt;
            <span class="titulo-sub">${capitalizar(subcategoriaAtiva)}</span>
            <span class="titulo-count">(${qtd})</span>
        `;
    }

    // Se "Mais Desejados" estiver ativo, sobrescreve
    if (filtroMaisDesejados) {
        texto = `<span class="titulo-main">Todos os Itens</span> &gt; 
                 <span class="titulo-sub">Mais Desejados</span> 
                 <span class="titulo-count">(${qtd})</span>`;
    }
    // Se "Presentes Recebidos" estiver ativo, sobrescreve
    else if (filtroPresentesRecebidos) {
        texto = `<span class="titulo-main">Todos os Itens</span> &gt; 
                 <span class="titulo-sub">Presentes Recebidos</span> 
                 <span class="titulo-count">(${qtd})</span>`;
    }

    tituloElement.innerHTML = texto;
}


/* ============================= */
/* 9. ATUALIZAÇÃO VISUAL DE TODOS OS FILTROS ATIVOS (SIDEBAR, TOPO, MENU) */
/* ============================= */
function atualizarEstadoFiltro() {
    // (1) Atualiza cada categoria principal
    document.querySelectorAll('.sidebar-category').forEach(el => {
        const cat = el.dataset.category;
        const isAtiva = (cat === categoriaAtiva);
        const temSubcategoriaAtiva = (subcategoriaAtiva !== null);

        el.classList.toggle('active', isAtiva && !temSubcategoriaAtiva);

        const ulSub = el.querySelector('.subcategoria-list');
        const icon = el.querySelector('.toggle-icon');
        const deveExpandir = isAtiva;

        el.classList.toggle('expanded', deveExpandir);
        if (icon) {
            icon.classList.toggle('fa-chevron-down', deveExpandir);
            icon.classList.toggle('fa-chevron-right', !deveExpandir);
        }
        if (ulSub) {
            if (deveExpandir) {
                ulSub.style.maxHeight = ulSub.scrollHeight + 16 + 'px';
                ulSub.style.paddingTop = '8px';
                ulSub.style.paddingBottom = '8px';
            } else {
                ulSub.style.maxHeight = '0px';
                ulSub.style.paddingTop = '0';
                ulSub.style.paddingBottom = '0';
            }
        }
    });

    // (2) Atualiza subcategorias
    document.querySelectorAll('.sidebar-subcategoria').forEach(el => {
        const sub = el.dataset.subcategoria;
        const categoriaPai = el.closest('.sidebar-category')?.dataset.category;
        el.classList.toggle('active',
            sub === subcategoriaAtiva && categoriaPai === categoriaAtiva
        );
    });

    // (3) Atualiza categorias do topo (cards do topo)
    document.querySelectorAll('.category-card').forEach(el => {
        const cat = el.dataset.category;
        el.classList.toggle('active', cat === categoriaAtiva && !subcategoriaAtiva);
    });

    // (4) Atualiza o menu "Todos os Itens"
    const menuTodosItensLink = document.getElementById('menuTodosItens');
    if (menuTodosItensLink) {
        const isTodosMenuActive = (categoriaAtiva === "todos" && !subcategoriaAtiva);
        menuTodosItensLink.classList.toggle('active', isTodosMenuActive);
    }

    // (5) Atualiza o link "Mais Desejados"
    const linkMaisDesejados = document.getElementById("menuMaisDesejados");
    if (linkMaisDesejados) {
        linkMaisDesejados.classList.toggle("active", filtroMaisDesejados);
    }

    // (6) Atualiza o link "Presentes Já Recebidos"
    const linkPresentesRecebidos = document.getElementById("menuPresentesRecebidos");
    if (linkPresentesRecebidos) {
        linkPresentesRecebidos.classList.toggle('active', filtroPresentesRecebidos);
    }
}


/* ============================= */
/* 10. APLICAR FILTROS E ORDENAÇÃO AOS ITENS VISÍVEIS */
/* ============================= */
function aplicarFiltro() {
    let itensFiltrados = [...allItems];

    // (1) Filtro por categoria principal
    if (categoriaAtiva && categoriaAtiva !== "todos") {
        itensFiltrados = itensFiltrados.filter(item =>
            item["Categoria"]?.toLowerCase().trim() === categoriaAtiva
        );
    }
    // (2) Filtro por subcategoria
    if (categoriaAtiva && categoriaAtiva !== "todos" && subcategoriaAtiva) {
        itensFiltrados = itensFiltrados.filter(item =>
            item["Subcategoria"]?.toLowerCase().trim() === subcategoriaAtiva
        );
    }

    // (3) Filtro "Presentes Já Recebidos" (Status: "já temos")
    if (filtroPresentesRecebidos) {
        itensFiltrados = itensFiltrados.filter(item =>
            item["Status"]?.toLowerCase().trim() === "já temos"
        );
    }
    // Se não é "Presentes Recebidos", mas há statusFiltro...
    else if (statusFiltro) {
        const statusEsperado = (statusFiltro === "ja-temos") ? "já temos" : "não temos";
        itensFiltrados = itensFiltrados.filter(item =>
            item["Status"]?.toLowerCase().trim() === statusEsperado
        );
    }

    // (4) Ordenação por preço
    if (precoOrdem === "price-asc" || precoOrdem === "price-desc") {
        itensFiltrados.sort((a, b) => {
            const valorA = parseFloat(a["Valor"]?.replace(/\./g, '').replace(',', '.')) || 0;
            const valorB = parseFloat(b["Valor"]?.replace(/\./g, '').replace(',', '.')) || 0;
            return (precoOrdem === "price-asc")
                ? (valorA - valorB)
                : (valorB - valorA);
        });
    }

    // (5) Filtro "Mais Desejados"
    if (filtroMaisDesejados) {
        itensFiltrados = itensFiltrados.filter(item =>
            item["Mais desejado"] &&
            item["Mais desejado"].trim().toLowerCase() === "sim"
        );
    }

    // Renderiza somente os itens filtrados
    renderCards(itensFiltrados);
}


/* ============================= */
/* 11. SETUP DOS BOTÕES DE STATUS E ORDENAÇÃO DE PREÇO */
/* ============================= */
function setupStatusAndSortButtons() {
    document.querySelectorAll('.sort-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const status = btn.dataset.status;
            const sort = btn.dataset.sort;

            // Clique em botão de status (já-temos / não-temos)
            if (status) {
                if (statusFiltro === status) {
                    // Desativa o filtro se clicar novamente
                    statusFiltro = null;
                    btn.classList.remove('active');
                } else {
                    // Ativa este status e desativa botões de status opostos
                    statusFiltro = status;
                    document.querySelectorAll('.sort-btn[data-status]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            }

            // Clique em botão de ordenação por preço
            if (sort) {
                if (precoOrdem === sort) {
                    // Desativa se clicar de novo
                    precoOrdem = null;
                    btn.classList.remove('active');
                } else {
                    precoOrdem = sort;
                    document.querySelectorAll('.sort-btn[data-sort]').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                }
            }

            // Reaplica filtros + ordenação
            aplicarFiltro();
        });
    });
}


/* ============================= */
/* 12. FUNÇÕES PARA FILTRAR "MAIS DESEJADOS" */
/* ============================= */
function filtrarMaisDesejados() {
    // Filtra itens com "Mais desejado" = "sim"
    renderCards(allItems.filter(item =>
        item["Mais desejado"] && item["Mais desejado"].trim().toLowerCase() === "sim"
    ));
}

function setupMaisDesejadosFilter() {
    const linkMaisDesejados = document.getElementById("menuMaisDesejados");
    if (!linkMaisDesejados) return;

    linkMaisDesejados.addEventListener("click", e => {
        e.preventDefault();

        // Se ativamos "Mais Desejados", desativamos Presentes Recebidos
        if (!filtroMaisDesejados) {
            filtroPresentesRecebidos = false;
            const linkPresentesRecebidos = document.getElementById("menuPresentesRecebidos");
            if (linkPresentesRecebidos) {
                linkPresentesRecebidos.classList.remove("active");
            }
        }

        // Ativa/Desativa "Mais Desejados"
        filtroMaisDesejados = !filtroMaisDesejados;
        linkMaisDesejados.classList.toggle("active", filtroMaisDesejados);

        if (filtroMaisDesejados) {
            // Oculta “Já Temos” e “Não Temos”
            document.querySelectorAll('.sort-btn[data-status]').forEach(btn => {
                btn.style.display = 'none';
            });
            // Mantém botões de preço
        } else {
            // Restaura status
            document.querySelectorAll('.sort-btn[data-status]').forEach(btn => {
                btn.style.display = "";
            });
        }

        aplicarFiltro();
    });
}


/* ============================= */
/* 13. FUNÇÕES PARA FILTRAR "PRESENTES JÁ RECEBIDOS" */
/* ============================= */
function filtrarPresentesRecebidos() {
    // Renderiza apenas itens cujo "Status" = "já temos"
    renderCards(allItems.filter(item =>
        item["Status"] && item["Status"].trim().toLowerCase() === "já temos"
    ));
}

function setupPresentesRecebidosFilter() {
    const linkPresentesRecebidos = document.getElementById("menuPresentesRecebidos");
    if (!linkPresentesRecebidos) return;

    linkPresentesRecebidos.addEventListener("click", e => {
        e.preventDefault();

        // Se ativamos "Presentes Recebidos", desativamos "Mais Desejados"
        if (!filtroPresentesRecebidos) {
            filtroMaisDesejados = false;
            const linkMaisDesejados = document.getElementById("menuMaisDesejados");
            if (linkMaisDesejados) {
                linkMaisDesejados.classList.remove("active");
            }
        }

        // Toggle do filtro
        filtroPresentesRecebidos = !filtroPresentesRecebidos;
        linkPresentesRecebidos.classList.toggle("active", filtroPresentesRecebidos);

        // Se ativo, oculta status e preço
        if (filtroPresentesRecebidos) {
            document.querySelectorAll('.sort-btn[data-status]').forEach(btn => {
                btn.style.display = 'none';
            });
            document.querySelectorAll('.sort-btn[data-sort]').forEach(btn => {
                btn.style.display = 'none';
            });
        } else {
            // Restaura ambos
            document.querySelectorAll('.sort-btn[data-status]').forEach(btn => {
                btn.style.display = "";
            });
            document.querySelectorAll('.sort-btn[data-sort]').forEach(btn => {
                btn.style.display = "";
            });
        }

        aplicarFiltro();
    });
}


/* ============================= */
/* 14. MODAL DO PIX              */
/* ============================= */
function abrirPixModal() {
    const modal = document.getElementById('pixModal');
    if (modal) {
        modal.style.display = 'block';
        modal.classList.add('ativo');
        modal.classList.remove('fechando');
    }
}

function fecharPixModal() {
    const modal = document.getElementById('pixModal');
    if (modal) {
        modal.classList.add('fechando');
        modal.classList.remove('ativo');
        setTimeout(() => {
            if (modal.classList.contains('fechando')) {
                modal.style.display = 'none';
                modal.classList.remove('fechando');
            }
        }, 300);
    }
}

// Clique fora do modal para fechar
document.addEventListener("click", function (event) {
    const modal = document.getElementById("pixModal");
    if (modal && modal.style.display === 'block' && event.target === modal) {
        fecharPixModal();
    }
});

// DOMContentLoaded: inicialização
document.addEventListener("DOMContentLoaded", () => {
    // Botão de copiar chave Pix
    const btnCopiar = document.getElementById("copiarChavePix");
    const chaveSpan = document.getElementById("chavePix");
    if (btnCopiar && chaveSpan) {
        btnCopiar.addEventListener("click", () => {
            const chaveTexto = chaveSpan.innerText;
            navigator.clipboard.writeText(chaveTexto)
                .then(() => {
                    const originalText = btnCopiar.innerHTML;
                    btnCopiar.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                    btnCopiar.classList.add("copiado");
                    btnCopiar.disabled = true;

                    setTimeout(() => {
                        btnCopiar.innerHTML = originalText;
                        btnCopiar.classList.remove("copiado");
                        btnCopiar.disabled = false;
                    }, 2000);
                })
                .catch(err => {
                    console.error('Erro ao copiar a chave Pix:', err);
                    const statusSpan = document.getElementById("copiarStatus");
                    if (statusSpan) {
                        statusSpan.textContent = 'Erro ao copiar.';
                    }
                    setTimeout(() => {
                        if (statusSpan) statusSpan.textContent = '';
                    }, 2000);
                });
        });
    }

    // == NOVO CÓDIGO: CONTAGEM REGRESSIVA ==
    const countdownElement = document.getElementById("countdown");
    if (countdownElement) {
        // Define a data-alvo: 28/09/2025 às 12:00
        const targetDate = new Date("2025-09-28T12:00:00");

        function updateCountdown() {
            const now = new Date();
            const diff = targetDate - now; // em ms

            if (diff <= 0) {
                countdownElement.textContent = "É hoje! Felicidades aos noivos!";
                return;
            }

            // Converte diff em dias/h/min/seg
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((diff / (1000 * 60)) % 60);
            const seconds = Math.floor((diff / 1000) % 60);

            countdownElement.textContent =
                `${days} dias, ${hours}h ${minutes}m ${seconds}s até o grande dia!`;
        }

        updateCountdown();
        setInterval(updateCountdown, 1000);
    }
});


/* ============================= */
/* 15. FUNÇÃO: toggleSidebar(forceClose) E EVENTOS DO MENU */
/* ============================= */
function toggleSidebar(forceClose = false) {
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;

    if (forceClose) {
        sidebar.classList.remove('open');
    } else {
        sidebar.classList.toggle('open');
    }
}

// Fecha ao clicar em links do menu principal
document.querySelectorAll(".menu a").forEach(link => {
    link.addEventListener("click", () => {
        toggleSidebar(true);
    });
});

// Fecha ao clicar em qualquer link de subcategorias e categorias
document.querySelectorAll(".categories-list a").forEach(link => {
    link.addEventListener("click", () => {
        toggleSidebar(true);
    });
});

// Detecta clique fora da sidebar para fechar
document.addEventListener("click", e => {
    const sidebar = document.querySelector('.sidebar');
    const hamburger = document.querySelector('.hamburger-menu');
    if (!sidebar) return;

    // Só fecha se estiver "aberta"
    if (!sidebar.classList.contains('open')) return;

    // Se clicou dentro da sidebar ou no hamburger, não fecha
    if (sidebar.contains(e.target) || hamburger?.contains(e.target)) {
        return;
    }
    // Caso contrário, força o fechamento
    toggleSidebar(true);
});

/* ---------- EXPANDIR/COLAPSAR FILTROS NO MOBILE ---------- */
function toggleFiltros() {
    const filtrosConteudo = document.querySelector('.filtros-conteudo');
    if (!filtrosConteudo) return;
    filtrosConteudo.classList.toggle('filtros-aberto');
}

/* ---------- CLIQUE NO MENU LATERAL "TODOS OS ITENS" ---------- */
const linkTodosItensLateral = document.getElementById('menuTodosItens');
if (linkTodosItensLateral) {
    linkTodosItensLateral.addEventListener('click', e => {
        e.preventDefault();

        // Limpa todos os filtros
        filtroMaisDesejados = false;
        filtroPresentesRecebidos = false;
        statusFiltro = null;
        precoOrdem = null;

        // Restaura a exibição de todos os botões
        document.querySelectorAll('.sort-btn').forEach(b => {
            b.classList.remove('active');
            b.style.display = "";
        });

        // Define a categoria como "todos"
        categoriaAtiva = "todos";
        subcategoriaAtiva = null;

        // Reaplica e atualiza
        aplicarFiltro();
        atualizarEstadoFiltro();
    });
}

// Função rolar ao topo
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Exibir/ocultar botão "scroll-to-top" + "rodapé"
let lastScrollTop = 0;
window.addEventListener('scroll', () => {
    const scrollBtn = document.querySelector('.scroll-to-top');
    const footer = document.querySelector('.site-footer');
    if (!scrollBtn || !footer) return;

    const st = window.scrollY;

    // Exibe botão "voltar ao topo" se scroll > 200
    if (st > 200) {
        scrollBtn.classList.add('show');
    } else {
        scrollBtn.classList.remove('show');
    }

    // Detecta se rolar para baixo
    if (st > lastScrollTop) {
        // Oculta o rodapé rolando para baixo
        footer.classList.add('hide');
    } else {
        // Exibe o rodapé rolando para cima
        footer.classList.remove('hide');
    }

    lastScrollTop = st;
});