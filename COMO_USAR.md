# 📖 Guia de Edição, Hospedagem e Configuração do Cardápio Digital

Este projeto foi construído para ser **leve, instantâneo no celular, 100% gratuito para hospedar** e pronto para **QR Code** e adesivos **NFC**.

---

## 1. ✏️ Como Alterar Preços, Adicionar ou Remover Pratos

Existem **2 opções muito simples**:

### Opção A: Alteração Direta no Arquivo `menu-data.json` (Mais Rápido e Seguro)
Você pode abrir o arquivo `menu-data.json` em qualquer editor ou diretamente no GitHub:
- Para mudar um preço: altere `"price": 79.90` para o novo valor.
- Para marcar como esgotado: mude `"available": true` para `"available": false` (o prato desaparece automaticamente da visualização).
- Para adicionar um prato novo: copie um bloco `{ ... }` de prato e cole alterando o nome, foto e descrição.
- Para alterar o WhatsApp ou Instagram: altere `"whatsapp": "5511999998888"` e `"instagram": "https://instagram.com/seurestaurante"`.

### Opção B: Conectar a uma Planilha do Google (Google Sheets)
Se você preferir mudar pratos e preços direto pelo app do **Google Planilhas** no seu celular:
1. Crie uma planilha no Google Sheets com as seguintes colunas na 1ª linha:
   `Categoria | Nome | Descricao | Preco | FotoURL | Destaque | Disponivel`
2. No Google Planilhas, vá em **Arquivo > Compartilhar > Publicar na Web**.
3. Escolha o formato **Valores separados por vírgula (.csv)** e clique em **Publicar**.
4. Copie o link gerado e cole no campo `"googleSheetCsvUrl": ""` dentro do `menu-data.json`.
5. Pronto! Sempre que você editar na planilha, o cardápio no celular atualizará os itens.

---

## 2. 🚀 Como Hospedar Grátis com Certificado SSL (Vercel ou GitHub Pages)

O certificado SSL (`https://`) é obrigatório para que celulares leiam o QR Code e o NFC sem emitir alertas de segurança.

### Método 1: Vercel (Recomendado - 2 minutos)
1. Crie uma conta gratuita em [vercel.com](https://vercel.com).
2. Arraste a pasta `cardapio-digital` para dentro da Vercel ou conecte ao seu GitHub.
3. Clique em **Deploy**.
4. Você receberá um link gratuito e super veloz, por exemplo: `https://meu-cardapio.vercel.app`.

### Método 2: GitHub Pages
1. Crie um repositório no GitHub (ex: `cardapio`).
2. Suba os arquivos (`index.html`, `app.js`, `menu-data.json`).
3. Vá em **Settings > Pages > Branch main / root > Save**.
4. Seu cardápio estará online em `https://seu-usuario.github.io/cardapio/`.

---

## 3. 📱 Como Usar no QR Code e no Adesivo NFC

### No QR Code:
1. No próprio cardápio, clique no botão **QR Code** no topo.
2. Ele gera o QR Code apontando diretamente para o link onde o cardápio está rodando.
3. Você pode clicar em **Imprimir** ou salvar a imagem para fazer os displays acrílicos das mesas ou adesivos.

### No Adesivo NFC (NFC Sticker):
1. Compre adesivos ou tags NFC do tipo **NTAG213** ou **NTAG215** (muito baratos no Mercado Livre ou Shopee).
2. Baixe o app gratuito **NFC Tools** (disponível para Android e iPhone).
3. Abra o app, clique em **Escrever (Write) > Adicionar um registro (Add record) > URL / URI**.
4. Digite ou cole o link do seu cardápio (ex: `https://meu-cardapio.vercel.app`).
5. Aproxime o celular do adesivo NFC e toque em **Escrever (Write)**.
6. Pronto! Agora qualquer cliente que aproximar o celular da tag terá o cardápio aberto instantaneamente na tela.
