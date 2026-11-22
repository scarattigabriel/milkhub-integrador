# MilkHub

Sistema web de gestão da bovinocultura leiteira desenvolvido como Trabalho Integrador das disciplinas de Desenvolvimento de Sistemas Web, Engenharia de Software e Banco de Dados I, do curso de Ciência da Computação da Universidade Federal da Fronteira Sul (UFFS), no semestre 2026/2.

Desenvolvido pelos alunos Gabriel Alan Scaratti e Vinicius Ferrari.

## Tecnologias e bibliotecas

- **Frontend:** React, React DOM, Vite e Axios, com HTML e CSS
- **Backend:** Node.js, Express, Sequelize, pg, pg-hstore, bcryptjs, jsonwebtoken, cors e dotenv
- **Execução durante o desenvolvimento:** Nodemon
- **Banco de dados:** PostgreSQL
- **Gerenciador de pacotes:** Yarn 1

As dependências e suas versões estão nos arquivos `package.json` e `yarn.lock` de cada pasta. Utilize Node.js `^20.19.0` ou `>=22.12.0`, conforme a configuração do frontend.

## 1. Obter o projeto

```sh
git clone https://github.com/scarattigabriel/milkhub-integrador.git
cd milkhub-integrador
```

Os comandos seguintes consideram essa pasta como a raiz do projeto.

## 2. Criar o banco

1. No pgAdmin, crie um banco PostgreSQL vazio, por exemplo `milkhub`
2. Abra o Query Tool conectado a esse banco
3. Carregue o arquivo `db/ddl_postgresql.sql` e execute o conteúdo completo

Esse procedimento é necessário apenas na instalação inicial. Se você já utiliza o banco do sistema, não execute o DDL novamente.

## 3. Configurar o backend

Copie `backend/.env.example` para `backend/.env` e preencha as configurações:

```dotenv
DB_NAME=milkhub
DB_USER=postgres
DB_PASSWORD=sua_senha_do_postgres
DB_HOST=localhost
DB_PORT=5432
PORT=3001
JWT_SECRET=
JWT_EXPIRACAO_SEGUNDOS=3600
CORS_ORIGIN=http://localhost:5173
```

Utilize em `DB_NAME` o nome do banco criado no pgAdmin. Ajuste usuário, senha, endereço e porta conforme sua instalação do PostgreSQL. As demais configurações do arquivo de exemplo podem permanecer com os valores padrão.

Para gerar o segredo JWT, execute o comando abaixo e copie o resultado para `JWT_SECRET` no arquivo `.env`:

```sh
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Instale as dependências e cadastre o primeiro gestor:

```sh
cd backend
yarn install
yarn criar-gestor
```

O comando solicita nome, login e senha e salva a senha com hash. Não é necessário executá-lo se já existe um gestor ativo. Os demais usuários podem ser cadastrados pelo gestor dentro do sistema.

Inicie o backend:

```sh
yarn dev
```

A API utiliza `http://localhost:3001`. Mantenha esse terminal aberto.

## 4. Configurar e executar o frontend

Copie `frontend/.env.example` para `frontend/.env` e configure:

```dotenv
VITE_API_URL=http://localhost:3001
```

Em outro terminal, partindo da raiz do projeto:

```sh
cd frontend
yarn install
yarn dev
```

Abra `http://localhost:5173` no navegador e entre com o login e a senha do gestor cadastrado.

Se alterar as portas, mantenha `VITE_API_URL` apontando para a API e `CORS_ORIGIN` correspondente à origem do frontend. Reinicie os respectivos servidores após modificar os arquivos de ambiente.

Os arquivos `.env` contêm informações privadas e não devem ser enviados ao GitHub.
