# Melhorias do TCC por chat e função

Este documento permite continuar o trabalho nos chats já existentes. A organização abaixo é uma divisão de responsabilidades; nenhuma mensagem foi enviada automaticamente a outros chats.

| Chat do projeto | Responsabilidade | Entrega desta atualização |
| --- | --- | --- |
| Ajustar sistema SUS | Fluxos e regras do sistema | Recebimento, disponibilização e entrega de laudos; retificação sem apagar o original; recuperação administrativa de senha. |
| Atualizar banco GitHub | Persistência, índices e manutenção | Coleção de movimentações, nomes de recebedores protegidos, referências entre versões e índices adicionais. |
| Criar layout acolhedor | Interface e acessibilidade | Página de laudo completo, impressão, formulários com rótulos, histórico e estados; Bootstrap servido localmente. |
| Analisar TCC no GitHub | Verificação e evidências | Testes de autorização, concorrência, retificação, recuperação e roteiro com navegador/API/banco isolado. |
| Corrigir Página Netlify | Publicação e continuidade | Procedimento de instalação dos índices, validação da publicação e exercício de recuperação. |
| Chat do artigo | Texto acadêmico e avaliação | Capturas da interface com dados fictícios, literatura relacionada, matriz de evidências e protocolo de avaliação. |

## Como continuar em cada chat

### Ajustar sistema SUS

Mensagem de continuidade: “Continue os fluxos descritos em docs/MELHORIAS_POR_CHAT.md no branch melhorias/tcc-entrega-validacao. Confira distribuição, retificações e recuperação administrativa de senha; preserve a senha inicial por CPF com troca obrigatória, conforme a decisão anterior.”

Arquivos principais: `backend/routes/laudos.js`, `backend/routes/auth.js`, `public/laudo/detalhe.js` e `public/administracao/administracao.js`.

### Atualizar banco GitHub

Mensagem de continuidade: “Revise os modelos Laudo e MovimentacaoLaudo, os índices adicionados e docs/tcc/OPERACAO_E_BACKUP.md. Trabalhe em cópia de teste; não execute migração ou restauração sobre o banco real.”

Arquivos principais: `backend/models/Laudo.js`, `backend/models/MovimentacaoLaudo.js`, `backend/scripts/database-maintenance.js` e `backend/services/database-readiness.js`.

### Criar layout acolhedor

Mensagem de continuidade: “Revise detalhes do laudo, histórico, retificação e recuperação de acesso em desktop e celular. Preserve Bootstrap 5, azul suave, foco visível, rótulos e HTML/CSS/JS separados. Use dados fictícios nas capturas.”

Arquivos principais: `public/laudo/detalhe.html`, `detalhe.css`, `detalhe.js`, `public/assets/app.css`, `tests/ui/laudos.spec.js`.

### Analisar TCC no GitHub

Mensagem de continuidade: “Confira os testes do branch melhorias/tcc-entrega-validacao e complete a matriz docs/tcc/MATRIZ_DE_EVIDENCIAS.md com os resultados efetivamente observados. Não confunda testes com API simulada com teste completo com MongoDB.”

Comandos: `npm test`, `npm run test:integration`, `npm run test:ui` e `npm run test:e2e`.

### Corrigir Página Netlify

Mensagem de continuidade: “Prepare a publicação conforme docs/tcc/OPERACAO_E_BACKUP.md. A atualização exige npm run db:indexes antes de iniciar o servidor. Preserve as chaves existentes e verifique login, agenda e laudos após publicar.”

### Chat do artigo

Mensagem de continuidade: “Atualize o artigo preservando o banner e as notas de rodapé. Use a versão e os checks da atualização, inclua capturas reais da interface com dados fictícios, a matriz de evidências e a avaliação somente após coleta real.”

## Decisões que dependem de participação externa

- Validar com a unidade o significado de recebido, disponível e entregue, incluindo retirada por responsável.
- Definir quais profissionais precisam ler laudos publicados. A política anterior de leitura pela equipe foi preservada; rascunhos continuam privados do autor e pacientes consultam apenas os próprios laudos.
- Executar a avaliação com participantes e registrar respostas reais.
- Executar e registrar um exercício de backup/restauração em ambiente separado.
- Homologar o procedimento de ativação e a conferência de identidade para recuperação de acesso.

Não há alegação de homologação municipal, adoção pela unidade, assinatura digital ou integração com sistemas governamentais.
