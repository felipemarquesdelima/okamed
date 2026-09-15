# Meta geral nas configurações

## Resultado
- Criar uma aba **Configurações** visível somente para administradores.
- Exibir nela um único campo **Meta geral (%)**, com validação entre 0 e 100.
- Ao salvar, atualizar a meta geral e aplicar o novo percentual a todas as OS já cadastradas.
- Fazer gráficos, tabelas e novos lançamentos usarem automaticamente a meta geral.

## Lançamento e edição de OS
- Remover o campo Meta do formulário de nova OS e da edição individual.
- Manter Percentual, Acum. Crítico, Acum. Geral e Análise Crítica sem mudanças.
- Controladores poderão continuar lançando e editando OS, mas nunca alterar a meta.

## Dados e segurança
- Criar uma configuração única e persistente para a meta geral, iniciada em 90%.
- Permitir leitura da meta pelo painel e alteração apenas por administrador.
- A atualização das OS existentes ocorrerá junto com a alteração da configuração, evitando valores divergentes.
