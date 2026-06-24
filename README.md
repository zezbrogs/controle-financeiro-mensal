# Controle Financeiro Mensal

Software de controle financeiro mensal com receitas, despesas, saldo previsto, lucro/prejuízo, simulador de lucro, filtros, gráficos e backup local em JSON.

## Funcionalidades

- Dashboard com receita total, despesas, saldo final, lucro/prejuízo e porcentagem de economia.
- Cadastro de receitas e despesas com categoria, data, status e observação.
- Cálculos automáticos de despesas pagas, pendentes, saldo atual, saldo previsto e gasto disponível.
- Gráficos com Recharts: evolução do saldo, comparação receitas/despesas e despesas por categoria.
- Simulador de lucro com meta mensal.
- Navegação por mês e ano, mantendo dados separados por competência.
- Modo claro e escuro.
- Busca, filtro por categoria, filtro por status e filtro por tipo.
- Avisos de contas pendentes próximas do vencimento.
- Maior gasto do mês e categoria que mais consumiu dinheiro.
- Backup em JSON para salvar e restaurar dados.
- Botão para limpar os dados do mês atual.
- Versão web PWA e versão desktop Windows com instalador.

## Como rodar no navegador

```bash
npm install
npm run dev
```

Depois abra o endereço exibido pelo Vite, normalmente:

```text
http://localhost:5173
```

## Build web

```bash
npm run build
```

Os arquivos finais serão gerados em `dist/`.

## Aplicativo para celular sem Play Store

A versão mobile funciona como PWA no Android e no iPhone. O cliente abre o endereço publicado, toca em `Instalar app` e adiciona o aplicativo à tela inicial.

```bash
npm run mobile:build
```

Os arquivos ficam em `dist/` e precisam ser publicados por HTTPS. O workflow `.github/workflows/mobile-pages.yml` publica essa pasta automaticamente no GitHub Pages sempre que uma alteração for enviada para `main` ou `master`.

No Android, o navegador oferece a instalação diretamente. No iPhone, a instalação é feita pelo Safari em `Compartilhar > Adicionar à Tela de Início`.

Os dados continuam locais em cada celular. Para trocar de aparelho, o cliente usa o backup JSON.

## Gerar software para Windows

```bash
npm install
npm run desktop:build
```

O instalador com assistente será criado em:

```text
outputs/desktop/Instalador-Controle-Financeiro-Mensal.exe
```

O executável portátil também será criado em:

```text
outputs/desktop/Controle-Financeiro-Mensal.exe
```

Para uma entrega mais organizada, prefira usar o instalador. Ele cria atalho na área de trabalho e no menu iniciar. O executável portátil continua disponível para quem quiser abrir sem instalar.

## Atualizações automáticas

O aplicativo desktop já está preparado para atualizar pelo GitHub Releases quando for instalado pelo instalador NSIS.

Para gerar uma versão que sabe onde buscar atualizações, informe o usuário e o repositório do GitHub antes do build:

```powershell
$env:GH_OWNER="seu-usuario"
$env:GH_REPO="controle-financeiro-mensal"
npm run desktop:build
```

Para publicar a versão direto no GitHub Releases, crie um token do GitHub com permissão para releases e rode:

```powershell
$env:GH_OWNER="seu-usuario"
$env:GH_REPO="controle-financeiro-mensal"
$env:GH_TOKEN="seu-token"
npm run desktop:publish
```

Para cada atualização, aumente a versão em `package.json`, gere/publique novamente e instale a primeira versão pelo instalador. Depois disso o app verifica atualizações ao abrir e também pelo menu `Ajuda > Verificar atualizações`.

## Backup e importação pelo menu Arquivo

No app desktop, use o menu superior:

- `Arquivo > Salvar backup dos dados (.json)` para baixar um arquivo com todos os lançamentos e metas.
- `Arquivo > Importar backup (.json)` para restaurar ou levar os dados para outro computador.

Atalhos:

- `Ctrl+S`: salvar backup.
- `Ctrl+O`: importar backup.

## Manual em PDF

```bash
npm run manual:pdf
```

O manual será gerado em:

```text
outputs/docs/Manual-Controle-Financeiro-Mensal.pdf
```

## Armazenamento

Os dados ficam no `localStorage` do aplicativo/navegador. O backup JSON é a forma recomendada para transferir ou proteger os dados.
