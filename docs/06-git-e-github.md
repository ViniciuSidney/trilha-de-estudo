# Git e GitHub

## Primeiro registro local

Execute os comandos abaixo dentro da pasta do projeto:

```bash
git init -b main
git add .
git commit -m "chore: registrar base prototype-v0.4"
git tag -a prototype-v0.4 -m "Último protótipo e base oficial do projeto"
git branch dev
```

## Criar o repositório no GitHub

Crie um repositório privado chamado `trilha-de-estudo`, sem adicionar README, `.gitignore` ou licença pelo GitHub, pois esses arquivos já existem localmente.

Depois, conecte o repositório local usando a URL fornecida pelo GitHub:

```bash
git remote add origin URL_DO_REPOSITORIO
git push -u origin main
git push origin prototype-v0.4
git push -u origin dev
```

## Começar o desenvolvimento

```bash
git switch dev
```

Trabalhe na branch `dev`. A `main` deve permanecer como referência estável até que uma nova versão seja revisada.

## Padrão inicial de commits

```text
feat: nova funcionalidade
fix: correção de comportamento
refactor: reorganização sem mudar o resultado
docs: documentação
style: ajuste visual
test: criação ou atualização de testes
chore: manutenção do projeto
```

## Cuidados

- não enviar arquivos `.env`;
- revisar `git status` antes de cada commit;
- não desenvolver diretamente na `main`;
- criar tags apenas para marcos testados;
- descrever mudanças relevantes no `CHANGELOG.md`.
