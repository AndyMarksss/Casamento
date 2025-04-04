// ==============================
// 1. VARIÁVEIS GLOBAIS
// ==============================
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQk9gTXvSZs4l_FKWuM3Xv_igDiBFx_PBn0thUy1xQd7i_m54fwBYZIPj5XEwTEi1xdk3-3weZkXScn/pub?gid=0&single=true&output=csv';
let allItems = [];
let categoriaAtiva = "todos"; // Inicia com "todos"
let subcategoriaAtiva = null;
let statusFiltro = null;
let precoOrdem = null;
let filtroMaisDesejados = false;
let filtroPresentesRecebidos = false;

// ==============================
// 2. BUSCA E PARSE DO CSV
// ==============================
fetch(csvUrl)
    .then(response => response.text())
    .then(csvText => {
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        allItems = parsed.data;

        // Chamadas iniciais
        renderCards(allItems); // Renderiza todos inicialmente
        gerarCategoriasComSubcategorias();
        setupCategoryFilters(); // Configura cliques na sidebar
        setupTopoCategoryButtons(); // Configura cliques nos cards do topo
        atualizarTituloCategoria(allItems.length);
        atualizarEstadoFiltro(); // Atualiza a UI inicial
        setupStatusAndSortButtons(); // Configura botões de status/ordem
        setupMaisDesejadosFilter(); // Configura o filtro "Mais Desejados"
        setupPresentesRecebidosFilter(); // Configura o filtro "Presentes Já Recebidos"
    })
    .catch(err => console.error('Erro ao carregar CSV:', err));

// ==============================
// 3. RENDERIZAÇÃO DOS CARDS
// ==============================
function renderCards(items) {
    const container = document.getElementById('itemsGrid');
    container.innerHTML = ''; // Limpa antes de renderizar

    items.forEach(item => {
        let statusClass = item["Status"]?.toLowerCase().trim() === "já temos" ? "ja-temos" : "nao-temos";

        const card = document.createElement('div');
        card.classList.add('item-card');
        // Adiciona data attributes para fácil filtragem/ordenação se necessário depois
        card.dataset.category = item["Categoria"]?.toLowerCase().trim();
        card.dataset.subcategory = item["Subcategoria"]?.toLowerCase().trim();
        card.dataset.status = item["Status"]?.toLowerCase().trim();
        const valorNumerico = parseFloat(item["Valor"]?.replace(/\./g, '').replace(',', '.')) || 0;
        card.dataset.price = valorNumerico;

        // Adiciona classe para borda vermelha se "Mais desejado" for "sim"
        if (item["Mais desejado"] && item["Mais desejado"].trim().toLowerCase() === "sim") {
            card.classList.add("card-mais-desejado");
        }

        // Adiciona classe para borda verde se o status for "já temos"
        if (item["Status"] && item["Status"].trim().toLowerCase() === "já temos") {
            card.classList.add("card-ja-temos");
        }

        card.innerHTML = `
            <img src="${item["Imagem"]}" alt="${item["Nome do Item"]}" />
            <div class="item-info">
                <h3 class="item-name">${item["Nome do Item"]}</h3>
                <span class="status ${statusClass}">${item["Status"]}</span>
                <p class="item-price">R$ ${item["Valor"]}</p>
                ${item["Link"] ? `<a class="item-link" href="${item["Link"]}" target="_blank" rel="noopener noreferrer">
                    <i class="fas fa-external-link-alt"></i> Link
                </a>` : ''}
            </div>
        `;
        container.appendChild(card);
    });

    // Chama as funções de atualização após renderizar
    atualizarTituloCategoria(items.length);
    atualizarEstadoFiltro(); // Atualiza a UI após renderizar
}


// ==============================
// 4. GERAÇÃO DAS CATEGORIAS E SUBCATEGORIAS NA SIDEBAR
// ==============================
function gerarCategoriasComSubcategorias() {
    const lista = document.querySelector('.categories-list');
    if (!lista) return; // Proteção caso o elemento não exista
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

        // Link principal da categoria
        const linkCat = document.createElement('a');
        linkCat.href = "#";
        linkCat.classList.add('category-toggle'); // Para o evento de clique
        linkCat.innerHTML = `
            <i class="fas fa-chevron-right toggle-icon"></i>
            <span class="category-label">${capitalizar(cat)}</span>
        `;
        li.appendChild(linkCat);

        // Lista de subcategorias (ul)
        const ulSub = document.createElement('ul');
        ulSub.classList.add('subcategoria-list');

        const subOrdenadas = Array.from(categoriasMap[cat]).sort();
        subOrdenadas.forEach(sub => {
            const subLi = document.createElement('li');
            subLi.classList.add('sidebar-subcategoria');
            subLi.setAttribute('data-subcategoria', sub);
            // Link da subcategoria
            const linkSub = document.createElement('a');
            linkSub.href = "#";
            linkSub.textContent = capitalizar(sub);
            subLi.appendChild(linkSub); // Adiciona o link ao li
            ulSub.appendChild(subLi); // Adiciona o li à lista ul
        });

        // Só adiciona a lista de subcategorias se houver alguma
        if (subOrdenadas.length > 0) {
            li.appendChild(ulSub);
        } else {
            // Se não houver subcategorias, remove o ícone de toggle
            const icon = linkCat.querySelector('.toggle-icon');
            if (icon) icon.style.display = 'none'; // Ou remove o elemento
        }

        lista.appendChild(li);
    });
}

// ==============================
// 5. UTILITÁRIO: CAPITALIZAR
// ==============================
function capitalizar(texto) {
    if (!texto) return "";
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// ==============================
// 6. SETUP DOS CLIQUES NA SIDEBAR (CATEGORIAS E SUBCATEGORIAS)
// ==============================
function setupCategoryFilters() {
    const listaCategorias = document.querySelector('.categories-list');
    if (!listaCategorias) return;

    listaCategorias.addEventListener('click', e => {
        const linkClicado = e.target.closest('a'); // Pega o link clicado
        if (!linkClicado) return; // Sai se não clicou num link

        e.preventDefault(); // Previne navegação padrão do link #

        const liPai = linkClicado.closest('li'); // Encontra o <li> pai do link
        if (!liPai) return;

        // Verifica se é um link de categoria principal ou subcategoria
        const isCategoriaPrincipal = liPai.classList.contains('sidebar-category');
        const isSubcategoria = liPai.classList.contains('sidebar-subcategoria');

        let novaCategoria = categoriaAtiva;
        let novaSubcategoria = subcategoriaAtiva;

        if (isCategoriaPrincipal) {
            const categoriaSelecionada = liPai.dataset.category;
            // Se clicou na categoria já ativa (e sem subcat), desativa (vai para "todos")
            if (categoriaAtiva === categoriaSelecionada && !subcategoriaAtiva) {
                novaCategoria = "todos";
                novaSubcategoria = null;
            } else {
                // Ativa a categoria clicada e limpa subcategoria
                novaCategoria = categoriaSelecionada;
                novaSubcategoria = null;
            }
        } else if (isSubcategoria) {
            const subcategoriaSelecionada = liPai.dataset.subcategoria;
            const liCategoriaMae = liPai.closest('.sidebar-category'); // Encontra a categoria mãe
            const categoriaMae = liCategoriaMae?.dataset.category;

            if (categoriaMae) {
                // Se clicou na subcategoria já ativa, mantém (ou pode desativar se preferir)
                if (subcategoriaAtiva === subcategoriaSelecionada) {
                    // Opcional: Desativar subcategoria voltando para a categoria pai
                    // novaSubcategoria = null;
                } else {
                    // Ativa a categoria mãe e a subcategoria clicada
                    novaCategoria = categoriaMae;
                    novaSubcategoria = subcategoriaSelecionada;
                }
            }
        }

        // Atualiza o estado global se houve mudança
        if (novaCategoria !== categoriaAtiva || novaSubcategoria !== subcategoriaAtiva) {
            categoriaAtiva = novaCategoria;
            subcategoriaAtiva = novaSubcategoria;

            // Resetar filtros de status e preço ao mudar categoria/subcategoria
            statusFiltro = null;
            precoOrdem = null;
            document.querySelectorAll('.sort-btn').forEach(btn => btn.classList.remove('active'));

            aplicarFiltro(); // Aplica o filtro e re-renderiza
        }
        // Se clicou no link da categoria principal, apenas expande/recolhe
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

// ==============================
// 7. SETUP DOS CLIQUES NOS CARDS DE CATEGORIA DO TOPO
// ==============================
function setupTopoCategoryButtons() {
    const botoesTopo = document.querySelectorAll('.category-card');
    botoesTopo.forEach(botao => {
        botao.addEventListener('click', () => {
            const categoriaSelecionada = botao.dataset.category;
            if (categoriaAtiva !== categoriaSelecionada || subcategoriaAtiva !== null || categoriaAtiva === categoriaSelecionada) {
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

// ==============================
// 8. ATUALIZAÇÃO DO TÍTULO DA CATEGORIA SELECIONADA
// ==============================
function atualizarTituloCategoria(qtd = 0) {
    const tituloElement = document.getElementById('tituloCategoria');
    if (!tituloElement) return;
    let texto = `<span class="titulo-main">Todos os Itens</span> <span class="titulo-count">(${qtd})</span>`;
    if (categoriaAtiva && categoriaAtiva !== "todos" && !subcategoriaAtiva) {
        texto = `<span class="titulo-main">${capitalizar(categoriaAtiva)}</span> <span class="titulo-count">(${qtd})</span>`;
    } else if (categoriaAtiva && categoriaAtiva !== "todos" && subcategoriaAtiva) {
        texto = `<span class="titulo-main muted">${capitalizar(categoriaAtiva)}</span> &gt; <span class="titulo-sub">${capitalizar(subcategoriaAtiva)}</span> <span class="titulo-count">(${qtd})</span>`;
    }
    tituloElement.innerHTML = texto;
}

// ==============================
// 9. ATUALIZAÇÃO VISUAL DE TODOS OS FILTROS ATIVOS (SIDEBAR, TOPO, MENU)
// ==============================
function atualizarEstadoFiltro() {
    document.querySelectorAll('.sidebar-category').forEach(el => {
        const cat = el.dataset.category;
        const isAtiva = cat === categoriaAtiva;
        const temSubcategoriaAtiva = subcategoriaAtiva !== null;
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
    document.querySelectorAll('.sidebar-subcategoria').forEach(el => {
        const sub = el.dataset.subcategoria;
        const categoriaPai = el.closest('.sidebar-category')?.dataset.category;
        el.classList.toggle('active', sub === subcategoriaAtiva && categoriaPai === categoriaAtiva);
    });
    document.querySelectorAll('.category-card').forEach(el => {
        const cat = el.dataset.category;
        el.classList.toggle('active', cat === categoriaAtiva && !subcategoriaAtiva);
    });
    const menuTodosItensLink = document.getElementById('menuTodosItens');
    if (menuTodosItensLink) {
        const isTodosMenuActive = categoriaAtiva === "todos" && !subcategoriaAtiva;
        menuTodosItensLink.classList.toggle('active', isTodosMenuActive);
    }
    // Atualiza o link "Mais Desejados"
    const linkMaisDesejados = document.getElementById("menuMaisDesejados");
    if (linkMaisDesejados) {
        linkMaisDesejados.classList.toggle("active", filtroMaisDesejados);
    }
    // Atualiza o link "Presentes Já Recebidos"
    const linkPresentesRecebidos = document.getElementById("menuPresentesRecebidos");
    if (linkPresentesRecebidos) {
        linkPresentesRecebidos.classList.toggle("active", filtroPresentesRecebidos);
    }
}

// ==============================
// 10. APLICAR FILTROS E ORDENAÇÃO AOS ITENS VISÍVEIS
// ==============================
function aplicarFiltro() {
    let itensFiltrados = [...allItems];
    if (categoriaAtiva && categoriaAtiva !== "todos") {
        itensFiltrados = itensFiltrados.filter(item => item["Categoria"]?.toLowerCase().trim() === categoriaAtiva);
    }
    if (categoriaAtiva && categoriaAtiva !== "todos" && subcategoriaAtiva) {
        itensFiltrados = itensFiltrados.filter(item => item["Subcategoria"]?.toLowerCase().trim() === subcategoriaAtiva);
    }
    // Se o filtro "Presentes Já Recebidos" estiver ativo, filtra por "já temos"
    if (filtroPresentesRecebidos) {
        itensFiltrados = itensFiltrados.filter(item => item["Status"]?.toLowerCase().trim() === "já temos");
    } else if (statusFiltro) {
        const statusEsperado = statusFiltro === "ja-temos" ? "já temos" : "não temos";
        itensFiltrados = itensFiltrados.filter(item => item["Status"]?.toLowerCase().trim() === statusEsperado);
    }
    if (precoOrdem === "price-asc" || precoOrdem === "price-desc") {
        itensFiltrados.sort((a, b) => {
            const valorA = parseFloat(a["Valor"]?.replace(/\./g, '').replace(',', '.')) || 0;
            const valorB = parseFloat(b["Valor"]?.replace(/\./g, '').replace(',', '.')) || 0;
            return precoOrdem === "price-asc" ? valorA - valorB : valorB - valorA;
        });
    }
    // Filtro de "Mais Desejados"
    if (filtroMaisDesejados) {
        itensFiltrados = itensFiltrados.filter(item =>
            item["Mais desejado"] &&
            item["Mais desejado"].trim().toLowerCase() === "sim"
        );
    }
    renderCards(itensFiltrados);
}

// ==============================
// 11. SETUP DOS BOTÕES DE STATUS E ORDENAÇÃO DE PREÇO
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
// 12. FUNÇÕES PARA FILTRAR "MAIS DESEJADOS"
// ==============================
function filtrarMaisDesejados() {
    // Filtra itens com "Mais desejado" igual a "sim"
    renderCards(allItems.filter(item =>
        item["Mais desejado"] && item["Mais desejado"].trim().toLowerCase() === "sim"
    ));
}

function setupMaisDesejadosFilter() {
    const linkMaisDesejados = document.getElementById("menuMaisDesejados");
    if (!linkMaisDesejados) return;

    linkMaisDesejados.addEventListener("click", e => {
        e.preventDefault();

        // Se estamos ativando o filtro de Mais Desejados,
        // precisamos desativar o de Presentes Recebidos (se estiver ativo)
        if (!filtroMaisDesejados) {
            filtroPresentesRecebidos = false;
            // Remove a classe 'active' do link de Presentes Recebidos
            const linkPresentesRecebidos = document.getElementById("menuPresentesRecebidos");
            if (linkPresentesRecebidos) {
                linkPresentesRecebidos.classList.remove("active");
            }
        }

        // Ativa ou desativa o filtro de Mais Desejados
        filtroMaisDesejados = !filtroMaisDesejados;
        linkMaisDesejados.classList.toggle("active", filtroMaisDesejados);

        // Se Presentes Recebidos estiver desligado, restauramos os botões de status
        // (opcional, caso queira garantir que eles fiquem sempre visíveis quando Presentes Recebidos não estiver ativo)
        if (!filtroPresentesRecebidos) {
            document.querySelectorAll('.sort-btn[data-status]').forEach(btn => {
                btn.style.display = "";
            });
        }

        aplicarFiltro(); // Reaplica todos os filtros
    });
}
// ==============================
// 13. FUNÇÕES PARA FILTRAR "PRESENTES JÁ RECEBIDOS"
// ==============================
function filtrarPresentesRecebidos() {
    // Filtra os itens cujo "Status" seja "já temos"
    renderCards(allItems.filter(item =>
        item["Status"] && item["Status"].trim().toLowerCase() === "já temos"
    ));
}

function setupPresentesRecebidosFilter() {
    const linkPresentesRecebidos = document.getElementById("menuPresentesRecebidos");
    if (!linkPresentesRecebidos) return;

    linkPresentesRecebidos.addEventListener("click", e => {
        e.preventDefault();

        // Se estamos ativando o filtro de Presentes Recebidos,
        // precisamos desativar o de Mais Desejados (se estiver ativo)
        if (!filtroPresentesRecebidos) {
            filtroMaisDesejados = false;
            // Remove a classe 'active' do link de Mais Desejados
            const linkMaisDesejados = document.getElementById("menuMaisDesejados");
            if (linkMaisDesejados) {
                linkMaisDesejados.classList.remove("active");
            }
        }

        // Ativa ou desativa o filtro de Presentes Recebidos
        filtroPresentesRecebidos = !filtroPresentesRecebidos;
        linkPresentesRecebidos.classList.toggle("active", filtroPresentesRecebidos);

        // Oculta ou exibe os botões de status de acordo com o filtro
        document.querySelectorAll('.sort-btn[data-status]').forEach(btn => {
            btn.style.display = filtroPresentesRecebidos ? "none" : "";
        });

        aplicarFiltro(); // Reaplica todos os filtros
    });
}
// ==============================
// 14. MODAL DO PIX
// ==============================
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

document.addEventListener("click", function (event) {
    const modal = document.getElementById("pixModal");
    if (modal && modal.style.display === 'block' && event.target === modal) {
        fecharPixModal();
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const btnCopiar = document.getElementById("copiarChavePix");
    const chaveSpan = document.getElementById("chavePix");
    if (btnCopiar && chaveSpan) {
        btnCopiar.addEventListener("click", () => {
            const chaveTexto = chaveSpan.innerText;
            navigator.clipboard.writeText(chaveTexto).then(() => {
                const originalText = btnCopiar.innerHTML;
                btnCopiar.innerHTML = '<i class="fas fa-check"></i> Copiado!';
                btnCopiar.classList.add("copiado");
                btnCopiar.disabled = true;
                setTimeout(() => {
                    btnCopiar.innerHTML = originalText;
                    btnCopiar.classList.remove("copiado");
                    btnCopiar.disabled = false;
                }, 2000);
            }).catch(err => {
                console.error('Erro ao copiar a chave Pix:', err);
                const statusSpan = document.getElementById("copiarStatus");
                if (statusSpan) statusSpan.textContent = 'Erro ao copiar.';
                setTimeout(() => { if (statusSpan) statusSpan.textContent = ''; }, 2000);
            });
        });
    }
});
