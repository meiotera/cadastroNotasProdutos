const form = document.getElementById('formProduto');
const codigoInput = document.getElementById('codigo');
const listaProdutos = document.getElementById('listaProdutos');
const notasInput = document.getElementById('notas');
const notasProdutos = document.getElementById('notasProdutos');
const notasEmitidasDiv = document.getElementById('notasEmitidas');
const btnRestaurarBackup = document.getElementById('restaurarBackup');
const btnLimpar = document.getElementById('limparDados');

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
    // Produto existe, adiciona apenas as novas notas que não estão lá
    const notasAtuais = produtosNotas[indiceProdutoExistente].notas;
    const novasNotasParaAdicionar = notas.filter(
      (n) => !notasAtuais.includes(n),
    );
    produtosNotas[indiceProdutoExistente].notas.push(
      ...novasNotasParaAdicionar,
    );

    // Atualiza o backup também
    const indiceBackup = produtosNotasBackup.findIndex(
      (p) => p.codigo === codigo,
    );
    if (indiceBackup > -1) {
      const notasAtuaisBackup = produtosNotasBackup[indiceBackup].notas;
      const novasNotasParaAdicionarBackup = notas.filter(
        (n) => !notasAtuaisBackup.includes(n),
      );
      produtosNotasBackup[indiceBackup].notas.push(
        ...novasNotasParaAdicionarBackup,
      );
    } else {
      // Se por algum motivo não estiver no backup, adiciona com as notas combinadas
      produtosNotasBackup.push({
        codigo,
        notas: [...notasAtuais, ...novasNotasParaAdicionar],
      });
    }
  } else {
    // Produto novo
    const novoProduto = { codigo, notas };
    produtosNotas.push(novoProduto);
    produtosNotasBackup.push({ ...novoProduto }); // Cria uma cópia para o backup
  }

  salvarDados();

  form.reset();
  renderizarTudo();
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

// 🔄 Renderizar tudo
function renderizarTudo() {
  renderizarProdutos();
  renderizarNotas();
  renderizarNotasEmitidas();
}

function copiarTexto(texto, elementoClicado) {
  navigator.clipboard
    .writeText(texto)
    .then(() => {
      // Adicionar classe 'copiado' ao elemento clicado
      if (elementoClicado) {
        elementoClicado.classList.add('copiado');
      }
    })
    .catch((err) => {
      console.error('Falha ao copiar o texto:', err);
      alert('Falha ao copiar o texto.');
    });
}

function renderizarProdutos() {
  listaProdutos.innerHTML = '';
  produtosNotas.forEach((p, index) => {
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
        produtosNotas.splice(index, 1);
        salvarDados();
        renderizarTudo();
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

renderizarTudo();
