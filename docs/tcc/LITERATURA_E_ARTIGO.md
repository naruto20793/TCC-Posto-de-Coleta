# Literatura e atualização do artigo

## Estudos relacionados

SHCOLNIK, Wilson et al. Resultados de exames laboratoriais não acessados em laboratórios privados brasileiros. Jornal Brasileiro de Patologia e Medicina Laboratorial, v. 55, n. 6, 2019. DOI: 10.5935/1676-2444.20190057. Disponível em: https://www.scielo.br/j/jbpml/a/tFhM7FbcSDVMMPMvz88pKWb/?lang=pt. Acesso em: 5 nov. 2026.

O estudo distingue disponibilização, impressão e evidências de acesso aos resultados. Essa distinção ajuda a justificar um controle explícito de entrega no protótipo. Os autores excluíram do levantamento os resultados de pacientes atendidos pelo SUS; seus percentuais não devem ser transferidos para Araranguá nem usados como resultados deste TCC.

OLIVEIRA, Mailson Silva de et al. Usabilidade do sistema eSUS Feedback por gestores de Unidades Básicas de Saúde. Saúde em Debate, v. 49, número especial 1, 2025. DOI: 10.1590/2358-28982025E19981P. Disponível em: https://www.scielo.br/j/sdeb/a/WKRjZjRh7mHHfDDCsz8NZjL/?lang=pt. Acesso em: 5 nov. 2026.

A pesquisa avaliou usabilidade e experiência de usuários de uma ferramenta de gestão da APS, com instrumentos estruturados. Serve como referência para a necessidade de avaliar fatores humanos; o protótipo do TCC deve apresentar seus próprios participantes, tarefas e resultados, sem herdar a avaliação do eSUS Feedback.

## Inclusões no artigo

- Preservar o banner institucional, nomes, e-mails e notas de rodapé que estejam na versão atual do documento.
- Incluir os dois estudos na fundamentação e nas referências em ordem alfabética.
- Acrescentar requisito de distribuição e requisito de retificação à matriz do artigo.
- Diferenciar implementação no branch, aprovação dos checks e publicação no ambiente principal.
- Usar capturas do navegador com dados fictícios. Capturas geradas pelos testes de interface usam API simulada e devem ser identificadas como tal; não são evidência de operação clínica real.
- Relatar a avaliação de usuários somente quando os registros do protocolo forem preenchidos.
- Descrever backup como procedimento preparado até existir evidência da restauração.

## Capturas

Para gerar a partir da interface de teste: definir `TCC_CAPTURE_DIR` para um diretório e executar `npm run test:ui`. As capturas incluem login, início, retirada, retificação e visualização móvel. Não incluir capturas com dados reais de pacientes ou credenciais.

O teste `npm run test:e2e` utiliza API e MongoDB isolados; a passagem do tempo do atendimento é preparada diretamente na fixture e essa condição deve acompanhar a descrição do ensaio.
