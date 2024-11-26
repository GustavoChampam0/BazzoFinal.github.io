const itensPerguntasRespostas = document.querySelectorAll('.itens');

itensPerguntasRespostas.forEach(function(itens) {
    itens.addEventListener('click', function() {
        const estaAtiva = itens.classList.contains('ativo');

        // Remove a classe 'ativo' de todas as perguntas para garantir que apenas uma pergunta fique ativa de cada vez
        itensPerguntasRespostas.forEach(function(itens) {
            itens.classList.remove('ativo');
        });

        // Se a pergunta não estava ativa, adiciona a classe 'ativo'
        if (!estaAtiva) {
            itens.classList.add('ativo');
        }
    });
});
