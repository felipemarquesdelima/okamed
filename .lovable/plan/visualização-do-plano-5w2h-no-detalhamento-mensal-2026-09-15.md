# Visualização do plano 5W2H no detalhamento mensal

## Objetivo
Exibir o plano 5W2H no mesmo pop-up aberto pelo botão **Ver** da coluna **Análise**, sem alterar os filtros, gráficos, permissões ou cadastros.

## Implementação
- Carregar os planos 5W2H vinculados às ordens já filtradas no painel.
- Associar cada análise crítica ao seu serviço e ao respectivo plano no mês.
- Manter o botão **Ver** e ampliar seu pop-up para mostrar:
  - análise crítica por serviço;
  - percentual atingido, meta e status do plano;
  - O quê, Por quê, Onde, Quando, Quem, Como e custo previsto.
- Quando não houver 5W2H para um serviço, mostrar apenas sua análise crítica.
- Preservar a consulta para todos os usuários autenticados, conforme as permissões atuais.

## Validação
- Conferir meses com e sem plano 5W2H.
- Verificar o pop-up em telas grandes e pequenas.
- Executar os testes existentes.

## Detalhes técnicos
A consulta usará os identificadores das ordens já carregadas, evitando misturar planos de outros hospitais, períodos ou tipos de serviço. Nenhuma alteração será feita no banco de dados.
