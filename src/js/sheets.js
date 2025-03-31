// URL obtida via "Publicar na Web" no formato CSV
const csvUrl = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQk9gTXvSZs4l_FKWuM3Xv_igDiBFx_PBn0thUy1xQd7i_m54fwBYZIPj5XEwTEi1xdk3-3weZkXScn/pub?gid=0&single=true&output=csv';

// 2. Buscar e parsear o CSV usando PapaParse
fetch(csvUrl)
    .then(response => response.text())
    .then(csvText => {
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        // parsed.data é um array de objetos, cada objeto é uma linha
        renderCards(parsed.data);
    })
    .catch(err => console.error('Erro ao carregar CSV:', err));

// 3. Função para gerar os cards no HTML
function renderCards(items) {
    const container = document.getElementById('itemsGrid');
    container.innerHTML = ''; // Limpa qualquer conteúdo anterior

    items.forEach(item => {
        // Supondo que as colunas se chamem:
        // "Nome do Item", "Status", "Data de atualização", "Valor", "Link", "Imagem"
        // Ajuste para os nomes exatos da sua planilha

        // Determina classe de status para cor
        let statusClass = "nao-temos"; // padrão

        if (item["Status"] === "Já temos") {
            statusClass = "ja-temos";
        } else if (item["Status"] === "Não temos") {
            statusClass = "nao-temos";
        }
        // Se houver outros status, você pode inserir mais else if aqui


        // Cria o elemento de card
        const card = document.createElement('div');
        card.classList.add('item-card');

        // Monta o HTML interno do card
        card.innerHTML = `
      <img src="${item["Imagem"]}" alt="${item["Nome do Item"]}" />
      <div class="item-info">
        <h3 class="item-name">${item["Nome do Item"]}</h3>
        <span class="status ${statusClass}">
          ${item["Status"]}
        </span>
        <p class="item-date">${item["Data de atualização"]}</p>
        <p class="item-price">R$ ${item["Valor"]}</p>
        <a class="item-link" href="${item["Link"]}" target="_blank">
        <i class="fas fa-external-link-alt"></i>Link</a>
      </div>
    `;

        // Anexa o card ao container
        container.appendChild(card);
    });
}