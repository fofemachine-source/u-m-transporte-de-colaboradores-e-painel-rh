# Transporte de Colaboradores U&M — Parauapebas/PA

Sistema integrado para gestão do transporte de colaboradores da U&M com painel do colaborador para solicitação de embarque/alteração de endereço e painel administrativo do RH para controle de frotas, rotas e gestão da Escala Parvi de sábado.

---

## 🚀 Funcionalidades

### 1. Painel do Colaborador (Portal de Transporte)
- Formulário inteligente de cadastro com geolocalização e seleção de rota sugerida.
- Sugestão automática de linha por endereço, bairro e turma operacional.
- Solicitação de mudança de endereço residencial com recálculo automático de rota.
- Consulta de status de solicitação por matrícula ou protocolo.

### 2. Painel Administrativo (Gestão RH & Frotas)
- **Gestão de Cadastros:** Visualização completa dos colaboradores, status de embarque e ponto definido.
- **Gestão de Linhas & Rotas:** Controle das 12 rotas oficiais da frota Parvi em Parauapebas, com adição de novas linhas e turmas.
- **Escala de Sábado (Parvi):**
  - Tabela simplificada: Nome, Matrícula, Bairro, Rua e Ponto de Embarque.
  - Campo de observações por linha (`OBS:`) e observações gerais da escala.
  - Edição completa: alterar dados de qualquer colaborador, adicionar novos colaboradores com pré-busca e exclusão rápida.
  - Exportação direta formatada para o **WhatsApp da Parvi** e download de planilha **CSV (Excel)**.
- **Relatórios:** Exportação de dados de ocupação de frotas e colaboradores ativos.

---

## 🛠️ Tecnologias Utilizadas
- **React 19** com **TypeScript** e **Vite**
- **Tailwind CSS 4**
- **Lucide Icons**
- **Express.js** (backend opcional + persistência híbrida client-side em `localStorage`)
- **Leaflet** (mapas de trajetos e pontos de embarque em Parauapebas)

---

## 📦 Como Rodar Localmente

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento (porta 3000)
npm run dev

# Compilar para produção
npm run build

# Iniciar build de produção
npm start
```

---

## 🌐 Deploy em 1 Clique (Vercel / Render / Netlify)
Este projeto foi desenvolvido com arquitetura resiliente híbrida:
- Pode ser hospedado como uma **SPA estática** (Vercel, Cloudflare Pages, Netlify, GitHub Pages).
- Ou como uma **aplicação Full-Stack Node.js** (Render, Railway, Fly.io, Google Cloud Run).
