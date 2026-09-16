# Plano: dispensa de análise crítica e 5W2H para administradores

## Escopo
Alterar somente o cadastro de novas OS para que administradores possam salvar sem análise crítica e sem plano 5W2H. Controladores continuarão sujeitos às exigências atuais.

## Implementação
1. **Formulário conforme o perfil**
   - Identificar o perfil administrador já recebido pela tela.
   - Para administradores, apresentar análise crítica e 5W2H como opcionais.
   - Para controladores, manter os campos e mensagens obrigatórios atuais.

2. **Validação e salvamento seguro**
   - Permitir análise crítica vazia somente para administradores.
   - Permitir que administradores salvem serviços abaixo da meta sem criar um plano 5W2H.
   - Se um administrador começar a preencher um plano, exigir o conjunto completo antes de gravá-lo, evitando planos incompletos.
   - Manter o salvamento transacional e todas as regras de duplicidade e permissão existentes.

3. **Proteção no banco de dados**
   - Aplicar a exceção com base no perfil autenticado no banco, sem confiar apenas na interface.
   - Manter análise crítica e 5W2H obrigatórios para controladores, inclusive em chamadas diretas.
   - Gravar análise crítica vazia como ausência de conteúdo e criar o plano somente quando estiver completo.

4. **Verificação**
   - Validar o formulário para administrador e controlador.
   - Confirmar que um administrador salva sem os dois campos e que um controlador continua bloqueado.
