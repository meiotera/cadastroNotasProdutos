const form = document.getElementById('formProduto');
const codigoInput = document.getElementById('codigo');
const nomeProdutoInput = document.getElementById('nomeProduto'); // Novo input
const listaProdutos = document.getElementById('listaProdutos');
const notasInput = document.getElementById('notas');
const notasProdutos = document.getElementById('notasProdutos');
const notasEmitidasDiv = document.getElementById('notasEmitidas');
const btnRestaurarBackup = document.getElementById('restaurarBackup');
const btnLimpar = document.getElementById('limparDados');
const btnLimparInterface = document.getElementById('limparInterfaceBtn');

let produtosNotas = JSON.parse(localStorage.getItem('produtosNotas')) || [];
let produtosNotasBackup =
  JSON.parse(localStorage.getItem('produtosNotasBackup')) || [];
let notasEmitidas = JSON.parse(localStorage.getItem('notasEmitidas')) || [];

function salvarDados() {
  localStorage.setItem('produtosNotas', JSON.stringify(produtosNotas));
  localStorage.setItem(
    'produtosNotasBackup',
    JSON.stringify(produtosNotasBackup),
  );
  localStorage.setItem('notasEmitidas', JSON.stringify(notasEmitidas));
}

codigoInput.addEventListener('blur', () => {
  const codigoValor = codigoInput.value.trim();
  if (!codigoValor) {
    return;
  }

  // Modificado para buscar no backup
  const produtoExistente = produtosNotasBackup.find(
    (p) => p.codigo === codigoValor,
  );

  if (produtoExistente && produtoExistente.notas.length > 0) {
    notasInput.value = produtoExistente.notas.join(' ');
    if (produtoExistente.nome) {
      nomeProdutoInput.value = produtoExistente.nome;
    } else {
      nomeProdutoInput.value = ''; // Limpa se não houver nome no backup
    }
  } else {
    // Se o produto não for encontrado no backup ou não tiver notas, limpa ambos os campos
    notasInput.value = '';
    nomeProdutoInput.value = '';
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const codigo = codigoInput.value.trim();
  const nome = nomeProdutoInput.value.trim(); // Captura o nome do produto
  const notas = notasInput.value
    .split(' ')
    .map((n) => n.trim())
    .filter(Boolean);

  if (!codigo || !nome || notas.length === 0) return; // Adiciona verificação para o nome
  const indiceProdutoExistenteEmProdutosNotas = produtosNotas.findIndex(
    (p) => p.codigo === codigo,
  );

  const indiceProdutoExistenteEmBackup = produtosNotasBackup.findIndex(
    (p) => p.codigo === codigo,
  );

  if (indiceProdutoExistenteEmProdutosNotas > -1) {
    // Produto existe em produtosNotas (UPDATING)
    produtosNotas[indiceProdutoExistenteEmProdutosNotas].notas = notas;
    produtosNotas[indiceProdutoExistenteEmProdutosNotas].nome = nome; // Atualiza o nome

    // Atualiza no backup SOMENTE SE JÁ EXISTIR LÁ
    if (indiceProdutoExistenteEmBackup > -1) {
      produtosNotasBackup[indiceProdutoExistenteEmBackup].notas = notas;
      produtosNotasBackup[indiceProdutoExistenteEmBackup].nome = nome; // Atualiza o nome no backup
    }
    // Se não existe no backup, não faz nada com o backup durante uma atualização.
  } else {
    // Produto é NOVO para produtosNotas (ADDING)
    const novoProduto = { codigo, nome, notas }; // Inclui o nome ao criar novo produto
    produtosNotas.push(novoProduto);

    // Adiciona ao backup SOMENTE SE NÃO EXISTIR LÁ AINDA
    if (indiceProdutoExistenteEmBackup === -1) {
      produtosNotasBackup.push({ ...novoProduto }); // Inclui o nome ao adicionar no backup
    }
  }

  salvarDados();

  form.reset();
  renderizarTudo(codigo); // Passa o código do produto submetido para filtrar a exibição
});

// 📤 Emitir nota
function emitirNota(notaSelecionada) {
  const produtosComNota = produtosNotas.filter((p) =>
    p.notas.includes(notaSelecionada),
  );

  if (produtosComNota.length === 0) return;

  const codigosAlvo = [...new Set(produtosComNota.map((p) => p.codigo))];

  const numeroNota = prompt(
    `Informe o número da Nota Fiscal para os códigos: ${codigosAlvo.join(
      ', ',
    )}:`,
  );
  if (!numeroNota) return;

  const todasNotasRelacionadas = [
    ...new Set(
      produtosNotas
        .filter((p) => codigosAlvo.includes(p.codigo))
        .flatMap((p) => p.notas),
    ),
  ];

  notasEmitidas.push({
    numeroNota,
    produtos: codigosAlvo,
    notas: todasNotasRelacionadas,
  });

  produtosNotas = produtosNotas
    .map((p) =>
      codigosAlvo.includes(p.codigo)
        ? {
            ...p,
            notas: p.notas.filter((n) => !todasNotasRelacionadas.includes(n)),
          }
        : p,
    )
    .filter((p) => p.notas.length > 0);

  salvarDados();
  renderizarTudo();
}

// 🗑️ Limpar tudo
btnLimpar.addEventListener('click', () => {
  if (
    confirm(
      'Tem certeza que deseja apagar TODOS os dados (incluindo o backup)?',
    )
  ) {
    produtosNotas = [];
    produtosNotasBackup = [];
    notasEmitidas = [];
    salvarDados();
    renderizarTudo();
  }
});

// ✨ Limpar apenas a interface (frontend)
btnLimparInterface.addEventListener('click', () => {
  // Apaga os dados de produtosNotas e notasEmitidas, mas mantém o backup
  produtosNotas = [];
  notasEmitidas = []; // Limpa também as notas emitidas para consistência da interface

  salvarDados(); // Salva o estado (produtosNotas e notasEmitidas vazios, backup intacto)
  renderizarTudo(); // Re-renderiza a interface para mostrar as listas vazias

  // Reseta o formulário
  form.reset();
  // Opcional: focar no primeiro campo do formulário
  codigoInput.focus();
});

// 🔄 Renderizar tudo
function renderizarTudo(codigoFiltro = null) {
  // Adiciona parâmetro opcional para filtrar
  renderizarProdutos(codigoFiltro); // Passa o filtro para renderizarProdutos
  renderizarNotas(); // Mantém a exibição global para as outras seções
  renderizarNotasEmitidas(); // Mantém a exibição global
}

function copiarTexto(texto, elementoClicado) {
  // 1. Verificar se a API de Clipboard está disponível
  if (!navigator.clipboard) {
    alert(
      'Seu navegador não suporta a funcionalidade de copiar para a área de transferência de forma segura, ou a página não está sendo servida via HTTPS.',
    );
    return;
  }

  navigator.clipboard
    .writeText(texto)
    .then(() => {
      // Adicionar classe 'copiado' ao elemento clicado para feedback visual
      if (elementoClicado) {
        elementoClicado.classList.add('copiado');
        // Remover a classe após um tempo
        setTimeout(() => {
          elementoClicado.classList.remove('copiado');
        }, 1500); // Remove a classe após 1.5 segundos
      }
      // console.log('Texto copiado:', texto); // Opcional: log para debug
    })
    .catch((err) => {
      console.error('Falha ao copiar o texto:', err);
      let mensagemErro = 'Falha ao copiar o texto.';
      if (err.name === 'NotAllowedError') {
        mensagemErro +=
          ' A permissão para escrever na área de transferência foi negada.';
      } else if (document.visibilityState !== 'visible') {
        mensagemErro +=
          ' A página não está ativa. Clique na página e tente novamente.';
      }
      alert(
        mensagemErro +
          ' Verifique as permissões do navegador e se a página está em HTTPS.',
      );
    });
}

function renderizarProdutos(codigoFiltro = null) {
  listaProdutos.innerHTML = '';
  let produtosParaRenderizar = produtosNotas;

  if (codigoFiltro) {
    const produtoFiltrado = produtosNotas.find(
      (p) => p.codigo === codigoFiltro,
    );
    produtosParaRenderizar = produtoFiltrado ? [produtoFiltrado] : [];
  }

  produtosParaRenderizar.forEach((p) => {
    const div = document.createElement('div');
    div.classList.add('card-nota'); // Adiciona classe para consistência visual
    div.innerHTML = `
      <strong class="codigo-clicavel">${p.codigo}</strong>
      <div class="produto-nome-display">${p.nome || 'Nome não informado'}</div>
      ${p.notas
        .map((n) => `<span class="tag codigo-clicavel">${n}</span>`)
        .join('')}
      <button class="botao-remover" title="Remover este item">❌</button>
    `;

    div
      .querySelector('strong.codigo-clicavel') // Este é o elemento clicado
      .addEventListener('click', (e) => copiarTexto(p.codigo, e.target));

    div.querySelectorAll('span.codigo-clicavel').forEach((span) => {
      span.addEventListener('click', (e) =>
        copiarTexto(span.textContent, e.target),
      );
    });

    // Botão de remover item
    div.querySelector('.botao-remover').addEventListener('click', () => {
      if (
        confirm(
          `Deseja remover o produto ${p.codigo} (${p.nome || 'Sem nome'})?`,
        )
      ) {
        const codigoARemover = p.codigo;
        // Encontra o índice real na lista principal produtosNotas
        const originalIndex = produtosNotas.findIndex(
          (item) => item.codigo === codigoARemover,
        );
        if (originalIndex > -1) {
          produtosNotas.splice(originalIndex, 1);

          // Remover também do backup para manter consistência
          const backupIndex = produtosNotasBackup.findIndex(
            (item) => item.codigo === codigoARemover,
          );
          if (backupIndex > -1) {
            produtosNotasBackup.splice(backupIndex, 1);
          }

          salvarDados();
          renderizarTudo();
        }
      }
    });

    listaProdutos.appendChild(div);
  });
}

function renderizarNotas() {
  notasProdutos.innerHTML = '';
  const notasUnicas = [...new Set(produtosNotas.flatMap((p) => p.notas))];

  notasUnicas.sort((a, b) => {
    const produtosRelacionadosA = produtosNotas.filter((p) =>
      p.notas.includes(a),
    ).length;
    const produtosRelacionadosB = produtosNotas.filter((p) =>
      p.notas.includes(b),
    ).length;
    return produtosRelacionadosB - produtosRelacionadosA;
  });
  notasUnicas.forEach((nota) => {
    const produtosRelacionados = produtosNotas
      .filter((p) => p.notas.includes(nota))
      .map((p) => ({ codigo: p.codigo, nome: p.nome })); // Agora mapeia para objeto com código e nome

    const div = document.createElement('div');
    div.classList.add('card-nota');
    div.innerHTML = `
      <strong>Nota: <span class="codigo-clicavel">${nota}</span></strong>
      ${produtosRelacionados
        .map(
          (prod) =>
            `<span class="produto-tag">
              <span class="codigo-clicavel" title="Copiar código ${
                prod.codigo
              }">${prod.codigo}</span>
              <span class="nome-produto-na-nota"> - ${
                prod.nome || 'Sem nome'
              }</span>
            </span>`,
        )
        .join('')}
      <button class="botao-emitir">Separa por Item</button>
    `;

    div
      .querySelector('strong > span.codigo-clicavel') // Elemento clicado é o span dentro do strong
      .addEventListener('click', (e) => copiarTexto(nota, e.target));

    div
      .querySelectorAll('span.produto-tag > span.codigo-clicavel')
      .forEach((span) => {
        span.addEventListener('click', (e) =>
          copiarTexto(span.textContent, e.target),
        );
      });

    div
      .querySelector('.botao-emitir')
      .addEventListener('click', () => emitirNota(nota));
    notasProdutos.appendChild(div);
  });
}

function renderizarNotasEmitidas() {
  notasEmitidasDiv.innerHTML = '';

  notasEmitidas.forEach((item) => {
    const div = document.createElement('div');
    div.classList.add('card-nota');
    // CORREÇÃO: Envolver item.numeroNota em um span clicável
    div.innerHTML = `
      <strong>Nota Fiscal Nº <span class="codigo-clicavel" title="Copiar Número da Nota ${
        item.numeroNota
      }">${item.numeroNota}</span></strong>
      <div><strong>Produtos:</strong> ${item.produtos // Adiciona a classe codigo-clicavel e title para os produtos
        .map(
          (p) =>
            `<span class="produto-tag codigo-clicavel" title="Copiar Código do Produto ${p}">${p}</span>`,
        )
        .join('')}</div>
    `;
    // Adicionar event listener para copiar o número da nota fiscal
    const spanNumeroNota = div.querySelector('strong > span.codigo-clicavel'); // Seletor corrigido e simplificado
    if (spanNumeroNota) {
      spanNumeroNota.addEventListener('click', (e) =>
        copiarTexto(item.numeroNota, e.target),
      );
    }
    // Adicionar event listeners para copiar os códigos dos produtos
    const spansProdutos = div.querySelectorAll(
      'div > span.produto-tag.codigo-clicavel',
    );
    spansProdutos.forEach((spanProduto) => {
      const codigoProduto = spanProduto.textContent; // O texto do span é o código do produto
      spanProduto.addEventListener('click', (e) =>
        copiarTexto(codigoProduto, e.target),
      );
    });

    notasEmitidasDiv.appendChild(div);
  });
}

btnRestaurarBackup.addEventListener('click', () => {
  produtosNotas = JSON.parse(JSON.stringify(produtosNotasBackup));
  salvarDados();
  renderizarTudo();
  alert('Backup restaurado com sucesso!');
});

// renderizarTudo(); // Removido para não carregar dados automaticamente na inicialização
