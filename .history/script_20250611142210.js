const form = document.getElementById('formProduto');
const codigoInput = document.getElementById('codigo');
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

  const produtoExistente = produtosNotas.find((p) => p.codigo === codigoValor);

  if (produtoExistente && produtoExistente.notas.length > 0) {
    notasInput.value = produtoExistente.notas.join(' ');
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const codigo = codigoInput.value.trim();
  const notas = notasInput.value
    .split(' ')
    .map((n) => n.trim())
    .filter(Boolean);

  if (!codigo || notas.length === 0) return;

  const indiceProdutoExistente = produtosNotas.findIndex(
    (p) => p.codigo === codigo,
  );

  if (indiceProdutoExistente > -1) {
    // Produto existe, ATUALIZA as notas para serem APENAS as do input atual
    produtosNotas[indiceProdutoExistente].notas = notas;

    // Atualiza o backup também para refletir essa substituição
    const indiceBackup = produtosNotasBackup.findIndex(
      (p) => p.codigo === codigo,
    );
    if (indiceBackup > -1) {
      // Se o produto existe no backup, atualiza suas notas também
      produtosNotasBackup[indiceBackup].notas = notas;
    } else {
      // Caso raro: produto existe nos dados principais mas não no backup.
      // Adiciona ao backup com as notas atuais (as do input).
      // Isso pode acontecer se o backup ficou dessincronizado.
      produtosNotasBackup.push({ codigo, notas });
    }
  } else {
    // Produto novo
    const novoProduto = { codigo, notas };
    produtosNotas.push(novoProduto);
    produtosNotasBackup.push({ ...novoProduto }); // Cria uma cópia para o backup
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
  if (confirm('Tem certeza que deseja apagar todos os dados?')) {
    produtosNotas = [];
    produtosNotasBackup = [];
    notasEmitidas = [];
    salvarDados();
    renderizarTudo();
  }
});

// ✨ Limpar apenas a interface (frontend)
btnLimparInterface.addEventListener('click', () => {
  // Limpa as listas visuais, mantendo os títulos das seções
  listaProdutos.innerHTML = '';
  notasProdutos.innerHTML = '<h2>🔍 Notas e Produtos Relacionados</h2>';
  notasEmitidasDiv.innerHTML = '<h2>📤 Notas Emitidas</h2>';

  // Reseta o formulário
  form.reset();

  // Opcional: focar no primeiro campo do formulário
  codigoInput.focus();
  // Nenhum dado é salvo ou alterado no localStorage aqui
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
  console.log('[renderizarProdutos] Iniciada. codigoFiltro:', codigoFiltro); // Log 1
  listaProdutos.innerHTML = '';
  let produtosParaRenderizar = produtosNotas;
  // Log 2: Mostra todos os produtos antes de qualquer filtro
  // console.log('[renderizarProdutos] produtosNotas (antes do filtro):', JSON.parse(JSON.stringify(produtosNotas)));

  if (codigoFiltro) {
    console.log('[renderizarProdutos] Filtro de código ATIVO:', codigoFiltro); // Log 3
    // Filtra para mostrar apenas o produto especificado, se existir
    const produtoFiltrado = produtosNotas.find(
      (p) => p.codigo === codigoFiltro,
    );
    console.log(
      '[renderizarProdutos] Produto encontrado pelo filtro:',
      produtoFiltrado,
    ); // Log 4
    produtosParaRenderizar = produtoFiltrado ? [produtoFiltrado] : [];
  } else {
    console.log('[renderizarProdutos] Filtro de código INATIVO.'); // Log 5
  }

  // Log 6: Mostra os produtos que serão efetivamente renderizados
  console.log(
    '[renderizarProdutos] produtosParaRenderizar (após filtro, antes do loop):',
    JSON.parse(JSON.stringify(produtosParaRenderizar)),
  );

  // Itera sobre os produtos a serem renderizados (todos ou o filtrado)
  produtosParaRenderizar.forEach((p) => {
    console.log('[renderizarProdutos] Renderizando na lista:', p.codigo); // Log 7
    const div = document.createElement('div');
    div.classList.add('card-nota'); // Adiciona classe para consistência visual
    div.innerHTML = `
      <strong class="codigo-clicavel">${p.codigo}</strong>
      ${p.notas
        .map((n) => `<span class="tag codigo-clicavel">${n}</span>`)
        .join('')}
      <button class="botao-remover" title="Remover este item">❌</button>
    `;

    // Copiar o código ao clicar
    div
      .querySelector('strong.codigo-clicavel') // Este é o elemento clicado
      .addEventListener('click', (e) => copiarTexto(p.codigo, e.target));

    // Copiar as notas ao clicar
    div.querySelectorAll('span.codigo-clicavel').forEach((span) => {
      span.addEventListener('click', (e) =>
        copiarTexto(span.textContent, e.target),
      );
    });

    // Botão de remover item
    div.querySelector('.botao-remover').addEventListener('click', () => {
      if (confirm(`Deseja remover o produto ${p.codigo}?`)) {
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
          renderizarTudo(); // Re-renderiza tudo (sem filtro) após a remoção
        }
      }
    });

    listaProdutos.appendChild(div);
  });
}

function renderizarNotas() {
  notasProdutos.innerHTML = '<h2>🔍 Notas e Produtos Relacionados</h2>';
  const notasUnicas = [...new Set(produtosNotas.flatMap((p) => p.notas))];

  // Sort notasUnicas by the number of related products in descending order
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
      .map((p) => p.codigo);

    const div = document.createElement('div');
    div.classList.add('card-nota');
    div.innerHTML = `
      <strong>Nota: <span class="codigo-clicavel">${nota}</span></strong>
      ${produtosRelacionados
        .map((p) => `<span class="produto-tag codigo-clicavel">${p}</span>`)
        .join('')}
      <button class="botao-emitir">Separa por Item</button>
    `;

    // Copiar a nota ao clicar
    div
      .querySelector('strong > span.codigo-clicavel') // Elemento clicado é o span dentro do strong
      .addEventListener('click', (e) => copiarTexto(nota, e.target));

    // Copiar códigos dos produtos relacionados ao clicar
    div.querySelectorAll('span.produto-tag.codigo-clicavel').forEach((span) => {
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
  notasEmitidasDiv.innerHTML = '<h2>📤 Notas Emitidas</h2>';
  notasEmitidas.forEach((item) => {
    const div = document.createElement('div');
    div.classList.add('card-nota');
    div.innerHTML = `
      <strong>Nota Fiscal Nº ${item.numeroNota}</strong>    
      <div><strong>Produtos:</strong> ${item.produtos
        .map((p) => `<span class="produto-tag">${p}</span>`)
        .join('')}</div>
    `;
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
