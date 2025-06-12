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
    notasInput.value = '';
    nomeProdutoInput.value = '';
  }
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const codigo = codigoInput.value.trim();
  const nome = nomeProdutoInput.value.trim();
  const notas = notasInput.value
    .split(' ')
    .map((n) => n.trim())
    .filter(Boolean);

  if (!codigo || !nome || notas.length === 0) return;
  const indiceProdutoExistenteEmProdutosNotas = produtosNotas.findIndex(
    (p) => p.codigo === codigo,
  );

  const indiceProdutoExistenteEmBackup = produtosNotasBackup.findIndex(
    (p) => p.codigo === codigo,
  );

  if (indiceProdutoExistenteEmProdutosNotas > -1) {
    produtosNotas[indiceProdutoExistenteEmProdutosNotas].notas = notas;
    produtosNotas[indiceProdutoExistenteEmProdutosNotas].nome = nome;

    // Atualiza no backup SOMENTE SE JÁ EXISTIR LÁ
    if (indiceProdutoExistenteEmBackup > -1) {
      produtosNotasBackup[indiceProdutoExistenteEmBackup].notas = notas;
      produtosNotasBackup[indiceProdutoExistenteEmBackup].nome = nome;
    }
  } else {
    const novoProduto = { codigo, nome, notas };
    produtosNotas.push(novoProduto);

    // Adiciona ao backup SOMENTE SE NÃO EXISTIR LÁ AINDA
    if (indiceProdutoExistenteEmBackup === -1) {
      produtosNotasBackup.push({ ...novoProduto });
    }
  }

  salvarDados();

  form.reset();
  renderizarTudo(codigo);
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

  const produtosInfoParaNotaEmitida = codigosAlvo.map((codigo) => {
    const produtoNoBackup = produtosNotasBackup.find(
      (p) => p.codigo === codigo,
    );
    let nomeProduto = 'Nome não informado';

    if (produtoNoBackup && produtoNoBackup.nome) {
      nomeProduto = produtoNoBackup.nome;
    } else {
      const produtoEmNotas = produtosNotas.find((p) => p.codigo === codigo);
      if (produtoEmNotas && produtoEmNotas.nome) {
        nomeProduto = produtoEmNotas.nome;
      }
    }
    return {
      codigo: codigo,
      nome: nomeProduto,
    };
  });

  const todasNotasRelacionadas = [
    ...new Set(
      produtosNotas
        .filter((p) => codigosAlvo.includes(p.codigo))
        .flatMap((p) => p.notas),
    ),
  ];

  notasEmitidas.push({
    numeroNota,
    produtos: produtosInfoParaNotaEmitida,
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
  notasEmitidas = [];

  salvarDados();
  renderizarTudo();

  form.reset();

  codigoInput.focus();
});

// 🔄 Renderizar tudo
function renderizarTudo(codigoFiltro = null) {
  renderizarProdutos(codigoFiltro);
  renderizarNotas();
  renderizarNotasEmitidas();
}

function copiarTexto(texto, elementoClicado) {
  if (!navigator.clipboard) {
    alert(
      'Seu navegador não suporta a funcionalidade de copiar para a área de transferência de forma segura, ou a página não está sendo servida via HTTPS.',
    );
    return;
  }

  navigator.clipboard
    .writeText(texto)
    .then(() => {
      if (elementoClicado) {
        elementoClicado.classList.add('copiado');

        setTimeout(() => {
          elementoClicado.classList.remove('copiado');
        }, 1500);
      }
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
    div.classList.add('card-nota');
    div.innerHTML = `
      <strong class="codigo-clicavel">${p.codigo}</strong>
      <div class="produto-nome-display">${p.nome || 'Nome não informado'}</div>
      ${p.notas
        .map((n) => `<span class="tag codigo-clicavel">${n}</span>`)
        .join('')}
      <button class="botao-remover" title="Remover este item">❌</button>
    `;

    div
      .querySelector('strong.codigo-clicavel')
      .addEventListener('click', (e) => copiarTexto(p.codigo, e.target));

    div.querySelectorAll('span.codigo-clicavel').forEach((span) => {
      span.addEventListener('click', (e) =>
        copiarTexto(span.textContent, e.target),
      );
    });

    div.querySelector('.botao-remover').addEventListener('click', () => {
      if (
        confirm(
          `Deseja remover o produto ${p.codigo} (${p.nome || 'Sem nome'})?`,
        )
      ) {
        const codigoARemover = p.codigo;

        const originalIndex = produtosNotas.findIndex(
          (item) => item.codigo === codigoARemover,
        );
        if (originalIndex > -1) {
          produtosNotas.splice(originalIndex, 1);

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
      .map((p) => ({ codigo: p.codigo, nome: p.nome }));

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
      <div><strong>Produtos:</strong> ${item.produtos
        .map((prod) => {
          // Checa se 'prod' é um objeto com 'codigo' (novo formato) ou uma string (formato antigo)
          const isObjectFormat =
            typeof prod === 'object' && prod !== null && prod.codigo;
          const codigo = isObjectFormat ? prod.codigo : prod;
          const nome = isObjectFormat ? prod.nome : '';

          let produtoHtml = `<span class="codigo-clicavel" title="Copiar Código do Produto ${codigo}">${codigo}</span>`;
          if (nome) {
            // Usa a classe 'nome-produto-na-nota' para consistência de estilo
            produtoHtml += `<span class="nome-produto-na-nota"> - ${nome}</span>`;
          }
          return `<span class="produto-tag">${produtoHtml}</span>`;
        })
        .join('')}</div>
    `;
    // Adicionar event listener para copiar o número da nota fiscal
    const spanNumeroNota = div.querySelector('strong > span.codigo-clicavel');
    if (spanNumeroNota) {
      spanNumeroNota.addEventListener('click', (e) =>
        copiarTexto(item.numeroNota, e.target),
      );
    }

    const spansCodigosProdutos = div.querySelectorAll(
      'div > span.produto-tag > span.codigo-clicavel', // Seletor corrigido
    );
    spansCodigosProdutos.forEach((spanCodigoProduto) => {
      // spanCodigoProduto é o elemento correto
      const codigoDoProdutoParaCopiar = spanCodigoProduto.textContent; // Pega apenas o código
      spanCodigoProduto.addEventListener(
        'click',
        (
          e, // Usa spanCodigoProduto
        ) => copiarTexto(codigoDoProdutoParaCopiar, e.target),
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
