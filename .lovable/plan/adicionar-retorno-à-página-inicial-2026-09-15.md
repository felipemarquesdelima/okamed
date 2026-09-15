# Adicionar retorno à página inicial

## Alteração
- Incluir a opção **Página inicial** no início da navegação de gerenciamento, ao lado de Hospitais, Dados de OS e Usuários.
- Ao selecionar essa opção, fechar a área de gerenciamento e retornar ao painel principal.
- Manter as permissões atuais: administradores e controladores continuam vendo somente as opções já permitidas.

## Escopo técnico
- Conectar a navegação interna de gerenciamento ao estado que controla a exibição do painel principal.
- Reutilizar os componentes visuais e estilos existentes, sem alterar dados, filtros, gráficos ou autenticação.
- Verificar o retorno no navegador em tela desktop e no espaço reduzido mostrado na referência.
