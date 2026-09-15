# Plano: 5W2H automático na Nova OS

## Escopo
Alterar somente o pop-up **Dados de OS → Nova OS** e adicionar o armazenamento necessário dos planos. A edição individual, painel, filtros, gráficos, login, permissões, demais telas e dados existentes permanecem como estão.

## Implementação
1. **Meta e cálculo por serviço**
   - Carregar a meta geral vigente, atualmente 90%, dentro do cadastro.
   - Calcular em tempo real `OS finalizadas ÷ OS abertas × 100` para cada linha.
   - Tratar zero OS abertas como 0%.

2. **Plano de ação condicional**
   - Manter a análise crítica individual e exibir logo abaixo dela o bloco **Plano de ação 5W2H obrigatório** somente quando o percentual ficar abaixo da meta.
   - Mostrar automaticamente hospital, ano/mês, tipo, percentual, meta e status “Aberto”.
   - Solicitar: o quê, por quê, onde, quando, responsável, como e custo opcional.
   - Preencher “Onde?” com o hospital selecionado, permitindo edição.
   - Recolher o bloco quando a meta for alcançada, preservando os textos digitados.

3. **Validação e salvamento integral**
   - Validar todos os campos obrigatórios por serviço abaixo da meta e indicar pelo nome qual serviço precisa de correção.
   - Preservar a prevenção de tipos duplicados no formulário e de OS já existente no mesmo hospital/período.
   - Salvar todas as OS e seus planos em uma única operação transacional; qualquer erro cancela o conjunto inteiro.

4. **Armazenamento e acesso**
   - Armazenar cada plano vinculado à respectiva OS, incluindo os dados 5W2H, status, responsável, prazo, custo, criador e datas.
   - Aplicar acesso existente: administrador gerencia todos; controlador gerencia somente hospitais atribuídos; cliente consulta.
   - Preservar integralmente os registros atuais.

5. **Apresentação e verificação**
   - Reutilizar os componentes, cores, tipografia e comportamento responsivo atuais.
   - Verificar linhas acima e abaixo da meta, preservação ao recolher/reabrir, mensagens de validação, duplicidade e salvamento completo.

## Detalhes técnicos
- A criação em lote será feita por uma função transacional no banco, garantindo que OS e planos sejam confirmados ou cancelados juntos.
- A nova tabela terá vínculo único com a OS, regras de acesso por papel e hospital e atualização automática da data de alteração.
- A interface enviará os planos aninhados às respectivas linhas sem alterar o fluxo de edição existente.
