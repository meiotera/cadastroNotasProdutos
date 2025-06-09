const form = document.getElementById('formProduto');
const listaProdutos = document.getElementById('listaProdutos');
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

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const codigo = document.getElementById('codigo').value.trim();
  const notas = document
    .getElementById('notas')
    .value.split(' ')
    .map((n) => n.trim())
    .filter(Boolean);

  if (!codigo || notas.length === 0) return;

  const novoProduto = { codigo, notas };

  produtosNotas.push(novoProduto);
  produtosNotasBackup.push(novoProduto);
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

function copiarTexto(texto) {
  navigator.clipboard
    .writeText(texto)
    .then(() => {
      alert(`Copiado para a área de transferência: ${texto}`);
    })
    .catch(() => {
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
      .querySelector('strong.codigo-clicavel')
      .addEventListener('click', () => copiarTexto(p.codigo));

    // Copiar as notas ao clicar
    div.querySelectorAll('span.codigo-clicavel').forEach((span) => {
      span.addEventListener('click', () => copiarTexto(span.textContent));
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
      .querySelector('span.codigo-clicavel')
      .addEventListener('click', () => copiarTexto(nota));

    // Copiar códigos dos produtos relacionados ao clicar
    div.querySelectorAll('span.produto-tag.codigo-clicavel').forEach((span) => {
      span.addEventListener('click', () => copiarTexto(span.textContent));
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
