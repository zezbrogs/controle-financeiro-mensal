const fs = require('node:fs');
const path = require('node:path');
const PDFDocument = require('pdfkit');

const root = path.resolve(__dirname, '..');
const outputDir = path.join(root, 'outputs', 'docs');
const outputPath = path.join(outputDir, 'Manual-Controle-Financeiro-Mensal.pdf');

const colors = {
  text: '#172022',
  muted: '#667378',
  primary: '#0f766e',
  primaryDark: '#0f5f59',
  soft: '#e6f7ef',
  surface: '#f4f7f8',
  border: '#d8e1e4',
  danger: '#d63f3f',
  dangerSoft: '#fdeaea',
};

function title(doc, text) {
  doc.fillColor(colors.primaryDark).font('Helvetica-Bold').fontSize(17).text(text);
  doc.moveDown(0.35);
  doc
    .moveTo(doc.page.margins.left, doc.y)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y)
    .strokeColor(colors.soft)
    .lineWidth(2)
    .stroke();
  doc.moveDown(0.8);
}

function text(doc, value) {
  doc.fillColor(colors.text).font('Helvetica').fontSize(10.4).text(value, { lineGap: 3 });
  doc.moveDown(0.55);
}

function bullets(doc, items) {
  doc.fillColor(colors.text).font('Helvetica').fontSize(10.2);
  items.forEach((item) => {
    doc.text(`- ${item}`, { indent: 8, lineGap: 3 });
  });
  doc.moveDown(0.65);
}

function steps(doc, items) {
  doc.fillColor(colors.text).font('Helvetica').fontSize(10.2);
  items.forEach((item, index) => {
    doc.text(`${index + 1}. ${item}`, { indent: 8, lineGap: 3 });
  });
  doc.moveDown(0.65);
}

function note(doc, value, variant = 'info') {
  const x = doc.page.margins.left;
  const y = doc.y;
  const width = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const background = variant === 'danger' ? colors.dangerSoft : colors.soft;
  const accent = variant === 'danger' ? colors.danger : colors.primary;
  const height = doc.heightOfString(value, { width: width - 30, lineGap: 2 }) + 22;

  doc.save();
  doc.roundedRect(x, y, width, height, 8).fill(background);
  doc.rect(x, y, 4, height).fill(accent);
  doc.restore();

  doc
    .fillColor(variant === 'danger' ? '#622020' : '#123c35')
    .font('Helvetica-Bold')
    .fontSize(9.8)
    .text(value, x + 16, y + 11, { width: width - 30, lineGap: 2 });

  doc.y = y + height + 13;
}

function section(doc, heading, body) {
  title(doc, heading);
  body();
}

fs.mkdirSync(outputDir, { recursive: true });

const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 52, left: 56, right: 56, bottom: 58 },
  info: {
    Title: 'Manual - Controle Financeiro Mensal',
    Author: 'Controle Financeiro Mensal',
    Subject: 'Como usar o software de controle financeiro mensal',
  },
});

doc.pipe(fs.createWriteStream(outputPath));

doc.rect(0, 0, doc.page.width, doc.page.height).fill('#ffffff');
doc.roundedRect(56, 74, 72, 72, 18).fill(colors.soft);
doc.fillColor(colors.primary).font('Helvetica-Bold').fontSize(22).text('R$', 78, 99);
doc.fillColor(colors.primary).fontSize(9).text('MANUAL RÁPIDO', 150, 78, { characterSpacing: 1 });
doc.fillColor(colors.text).font('Helvetica-Bold').fontSize(31).text('Controle Financeiro Mensal', 150, 96, {
  width: 365,
  lineGap: 2,
});
doc
  .fillColor(colors.muted)
  .font('Helvetica')
  .fontSize(11.2)
  .text(
    'Um guia simples para registrar entradas, acompanhar contas, fechar o mês e manter backups dos dados.',
    56,
    172,
    { width: 475, lineGap: 4 }
  );

doc.y = 250;
section(doc, '1. Instalar e abrir', () => {
  steps(doc, [
    'Abra o arquivo Instalador-Controle-Financeiro-Mensal.exe.',
    'Siga o assistente de instalação.',
    'Use o atalho criado na área de trabalho ou no menu iniciar.',
  ]);
  note(doc, 'A versão Controle-Financeiro-Mensal.exe também funciona sem instalar, mas pode demorar alguns segundos na primeira abertura.');
});

section(doc, '2. Usar no dia a dia', () => {
  bullets(doc, [
    'Selecione o mês e o ano no topo da tela.',
    'Cadastre receitas como salário, vendas, freelance ou outros recebimentos.',
    'Cadastre despesas como aluguel, internet, mercado, cartão e assinaturas.',
    'Marque cada despesa como paga ou pendente.',
    'Acompanhe os cards do dashboard para saber se o mês está no lucro, no prejuízo ou perto de zerar.',
  ]);
});

section(doc, '3. Entender os resultados', () => {
  bullets(doc, [
    'Saldo atual: receitas menos despesas pagas.',
    'Saldo final previsto: receitas menos todas as despesas do mês.',
    'Economia: percentual do que sobrou em relação ao que entrou.',
    'Gráficos: mostram evolução do saldo, receitas x despesas e categorias que mais gastaram.',
    'Simulador de lucro: calcula se a meta do mês ainda é possível.',
  ]);
});

doc.addPage();
doc.y = 58;

section(doc, '4. Salvar backup JSON', () => {
  steps(doc, [
    'No menu superior, clique em Arquivo > Salvar backup dos dados (.json).',
    'Ou use o atalho Ctrl+S.',
    'Guarde o arquivo em uma pasta segura, pendrive ou nuvem.',
  ]);
  note(doc, 'Esse arquivo guarda receitas, despesas e metas. Ele serve para restaurar os dados depois ou usar em outro computador.');
});

section(doc, '5. Importar backup JSON', () => {
  steps(doc, [
    'No menu superior, clique em Arquivo > Importar backup (.json).',
    'Ou use o atalho Ctrl+O.',
    'Escolha um backup salvo anteriormente.',
    'Confirme a importação.',
  ]);
  note(doc, 'Ao importar, os dados atuais são substituídos pelos dados do arquivo escolhido. Salve um backup antes se quiser preservar o estado atual.', 'danger');
});

section(doc, '6. Recomendações', () => {
  bullets(doc, [
    'Faça um backup JSON ao final de cada mês.',
    'Registre despesas pendentes assim que receber uma conta.',
    'Revise o simulador de lucro antes de assumir novos gastos.',
    'Use as categorias com consistência para que os gráficos fiquem mais úteis.',
    'No fim do mês, confira o saldo previsto e marque como pagas as contas já quitadas.',
  ]);
});

section(doc, '7. Atalhos úteis', () => {
  bullets(doc, [
    'Ctrl+S: salvar backup dos dados.',
    'Ctrl+O: importar backup.',
    'Menu Visualizar: aumentar zoom, diminuir zoom, voltar ao zoom padrão ou usar tela cheia.',
  ]);
});

doc
  .fillColor(colors.muted)
  .font('Helvetica')
  .fontSize(9)
  .text('Manual simples para consulta durante o uso do software.', 56, doc.page.height - 86, {
    align: 'center',
    width: 475,
  });

doc.end();

console.log(`Manual criado em: ${path.relative(root, outputPath)}`);
