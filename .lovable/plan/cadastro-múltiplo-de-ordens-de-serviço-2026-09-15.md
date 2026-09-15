# Cadastro múltiplo de ordens de serviço

## Alteração
- Reestruturar somente o pop-up “Nova OS”, preservando o formulário atual de edição individual.
- Manter Hospital, Ano e Mês como dados comuns e permitir até quatro linhas, uma por tipo de serviço.
- Cada linha terá tipo, abertas, finalizadas, meta, percentual automático, acumulados e remoção.
- Criar uma área separada de análise crítica, com um texto por serviço.
- Ocultar nas listas os tipos já escolhidos e impedir linhas duplicadas.
- Antes da gravação, consultar as combinações existentes e informar os serviços já lançados.
- Inserir todas as linhas juntas; qualquer conflito ou erro impede a operação inteira.
- Validar limites e formatos no formulário com mensagens claras.

## Preservação
- Não alterar banco de dados, dados existentes, permissões, filtros, gráficos ou outras telas.
- Manter os componentes visuais e a responsividade atuais.

## Verificação
- Conferir inclusão e remoção de linhas, opções disponíveis, cálculo percentual, contador do botão e bloqueio de duplicidade.
- Confirmar que a edição de uma OS existente continua individual e inalterada.
