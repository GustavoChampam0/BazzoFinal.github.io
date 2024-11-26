document.addEventListener('DOMContentLoaded', function() {
    const produtosLista = document.getElementById('produtos-lista');
    const pagination = document.getElementById('pagination');
    const applyFiltersButton = document.getElementById('apply-filters');
    const removeFiltersButton = document.getElementById('remove-filters');
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const anuncioContainer = document.getElementById('anuncio-container');

    let currentPage = 1;
    const produtosPorPagina = 20;
    let totalPages = 1;
    let todosProdutos = [];
    let filtrosAtuais = {};

    // Load products from JSON file
    async function carregarProdutos(page = 1) {
        try {
            const produtosJSON = await fetch('./produtosfinais.json').then(res => res.json());
            todosProdutos = Array.isArray(produtosJSON) ? produtosJSON : (produtosJSON.results || []);
            atualizarProdutos(page);
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            produtosLista.innerHTML = '<p>Erro ao carregar os produtos. Tente novamente mais tarde.</p>';
        }
    }

    // Apply filters to products
    function aplicarFiltros(produtos) {
        return produtos.filter(produto => {
            let condicaoPreco = true;
            let condicaoBusca = true;
            let condicaoCategoria = true;

            if (filtrosAtuais.price) {
                if (filtrosAtuais.price === '3500-INF') {
                    condicaoPreco = produto.price >= 3500;
                } else {
                    const [min, max] = filtrosAtuais.price.split('-').map(Number);
                    condicaoPreco = produto.price >= min && produto.price <= max;
                }
            }

            if (filtrosAtuais.query) {
                const query = filtrosAtuais.query.toLowerCase();
                condicaoBusca = produto.title.toLowerCase().includes(query);
            }

            if (filtrosAtuais.categories && filtrosAtuais.categories.length > 0) {
                condicaoCategoria = filtrosAtuais.categories.some(cat => produto.category && produto.category.includes(cat));
            }

            return condicaoPreco && condicaoBusca && condicaoCategoria;
        });
    }

    // Update products list based on current filters and page
    function atualizarProdutos(page) {
        const produtosFiltrados = aplicarFiltros(todosProdutos);
        totalPages = Math.ceil(produtosFiltrados.length / produtosPorPagina);

        // Sort products: featured products first, then shuffle the rest
        const produtosComDestaque = produtosFiltrados.filter(produto => produto.destaque === true);
        const produtosSemDestaque = produtosFiltrados.filter(produto => !produto.destaque).sort(() => 0.5 - Math.random());

        // Combine featured products at the top with shuffled products below
        const produtosOrdenados = [...produtosComDestaque, ...produtosSemDestaque];
        const produtosPagina = produtosOrdenados.slice((page - 1) * produtosPorPagina, page * produtosPorPagina);

        if (produtosPagina.length > 0) {
            exibirProdutos(produtosPagina);
            gerarPaginacao();
        } else {
            produtosLista.innerHTML = '<p>Nenhum produto encontrado.</p>';
        }
    }

    // Display products in the product list
    function exibirProdutos(produtos) {
        produtosLista.innerHTML = '';
        produtos.forEach(produto => {
            const produtoElement = document.createElement('div');
            produtoElement.classList.add('produto', 'col-md-4');

            const imgUrl = produto.thumbnail.replace('I.jpg', 'B.jpg');

            produtoElement.innerHTML = `
                <img loading="lazy" src="${imgUrl}" alt="${produto.title}">
                <h3>${produto.title}</h3>
                <p>${produto.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                <a href="${produto.permalink}" class="btn btn-primary" target="_blank">Comprar pelo Mercado Livre e Shops</a>
            `;
            produtosLista.appendChild(produtoElement);
        });
    }

    // Generate pagination controls
    function gerarPaginacao() {
        pagination.innerHTML = '';
        let paginationHTML = '';

        const inicioPagina = Math.max(1, currentPage - 4);
        const fimPagina = Math.min(totalPages, currentPage + 5);

        for (let i = inicioPagina; i <= fimPagina; i++) {
            paginationHTML += `<li class="page-item ${i === currentPage ? 'active' : ''}">
                                    <a class="page-link" href="#">${i}</a></li>`;
        }

        if (currentPage < totalPages) {
            paginationHTML += `<li class="page-item">
                                    <a class="page-link" href="#">Seguinte</a>
                               </li>`;
        }

        pagination.innerHTML = paginationHTML;

        document.querySelectorAll('.page-link').forEach(link => {
            link.addEventListener('click', function(event) {
                event.preventDefault();
                const selectedPage = parseInt(this.innerText);

                currentPage = isNaN(selectedPage) ? Math.min(totalPages, currentPage + 1) : selectedPage;

                atualizarProdutos(currentPage);
            });
        });
    }

    // Apply filters when the 'Apply Filters' button is clicked
    if (applyFiltersButton) {
        applyFiltersButton.addEventListener('click', function() {
            const selectedPrice = document.querySelector('input[name="price"]:checked');
            filtrosAtuais.price = selectedPrice ? selectedPrice.value : "";

            const selectedCategories = Array.from(document.querySelectorAll('input[name="category"]:checked'))
                .map(checkbox => checkbox.value);
            filtrosAtuais.categories = selectedCategories;

            currentPage = 1;
            atualizarProdutos(currentPage);
        });
    }

    // Remove all filters when the 'Remove Filters' button is clicked
    if (removeFiltersButton) {
        removeFiltersButton.addEventListener('click', function() {
            filtrosAtuais = {};
            currentPage = 1;
            document.querySelectorAll('input[name="price"]').forEach(input => { input.checked = false; });
            document.querySelectorAll('input[name="category"]').forEach(input => { input.checked = false; });
            atualizarProdutos(currentPage);
        });
    }

    // Handle search form submission
    if (searchForm) {
        searchForm.addEventListener('submit', function(event) {
            event.preventDefault();
            filtrosAtuais.query = searchInput.value.trim();
            currentPage = 1;
            atualizarProdutos(currentPage);
        });
    }

    // Load featured ads
    async function carregarAnunciosDestaque() {
        try {
            const response = await fetch('./produtosfinais.json');
            if (!response.ok) throw new Error('Erro ao carregar o arquivo produtosfinais.json');

            const produtos = await response.json();
            if (Array.isArray(produtos)) {
                exibirAnuncios(produtos);
            } else {
                console.error('Estrutura inesperada no JSON:', produtos);
            }
        } catch (error) {
            console.error('Erro ao carregar anúncios:', error);
            anuncioContainer.innerHTML = '<p>Erro ao carregar os anúncios em destaque. Tente novamente mais tarde.</p>';
        }
    }

    // Display featured ads
    function exibirAnuncios(produtos) {
        anuncioContainer.innerHTML = '';
        const produtosAleatorios = produtos.sort(() => 0.5 - Math.random()).slice(0, 2);

        produtosAleatorios.forEach(produto => {
            const anuncioDiv = document.createElement('div');
            anuncioDiv.classList.add('anuncio');

            anuncioDiv.innerHTML = `
                <img src="${produto.thumbnail}" alt="${produto.title}">
                <h6>${produto.title}</h6>
                <p>R$ ${produto.price.toFixed(2)}</p>
                <a href="${produto.permalink}" class="btn btn-primary btn-sm" target="_blank">Ver Mais</a>
            `;
            anuncioContainer.appendChild(anuncioDiv);
        });
    }

    carregarProdutos();
    carregarAnunciosDestaque();
});
