# Requirements Document

## Introduction

Este documento define os requisitos para a funcionalidade de drag and drop no quadro Kanban do gerenciador de tarefas. A funcionalidade permite que usuários arrastem cards de tarefas entre colunas de status (A Fazer, Em Progresso, Concluída) para atualizar o status da tarefa de forma intuitiva e visual.

## Glossary

- **Kanban_Board**: Componente de interface que exibe tarefas organizadas em colunas por status (todo, in_progress, done)
- **Task_Card**: Elemento visual que representa uma tarefa individual dentro de uma coluna do Kanban_Board
- **Drag_Source**: O Task_Card que está sendo arrastado pelo usuário
- **Drop_Target**: A coluna de status de destino onde o Task_Card será solto
- **Drag_Handle**: A área interativa do Task_Card que permite iniciar a operação de arraste
- **Status_Column**: Uma coluna do Kanban_Board que agrupa tarefas por status (A Fazer, Em Progresso, Concluída)
- **Drag_Preview**: Representação visual do Task_Card durante a operação de arraste
- **API_Client**: Módulo responsável por comunicação com o servidor para persistir alterações de status

## Requirements

### Requirement 1: Iniciar Drag

**User Story:** Como um administrador, eu quero arrastar um card de tarefa, para que eu possa mover tarefas entre colunas de status de forma intuitiva.

#### Acceptance Criteria

1. WHEN o usuário com permissão de administrador pressiona o mouse e move por pelo menos 5 pixels sobre um Task_Card, THE Kanban_Board SHALL iniciar uma operação de drag com o Task_Card como Drag_Source
2. WHILE uma operação de drag está ativa, THE Kanban_Board SHALL exibir um Drag_Preview que acompanha a posição do cursor e reproduz o conteúdo visual do Task_Card sendo arrastado (título, prioridade e categoria)
3. WHILE uma operação de drag está ativa, THE Drag_Source SHALL ser exibido com opacidade de 0.5 na posição original para indicar que está sendo movido
4. IF o usuário não possui a role "admin", THEN THE Kanban_Board SHALL impedir a inicialização de operações de drag nos Task_Cards e exibir o cursor padrão (não-arrastar) ao passar o mouse sobre os cards
5. IF o usuário pressiona a tecla Escape durante uma operação de drag ativa, THEN THE Kanban_Board SHALL cancelar a operação de drag, restaurar a opacidade original do Drag_Source e remover o Drag_Preview

### Requirement 2: Indicação Visual de Drop

**User Story:** Como um administrador, eu quero ver feedback visual nas colunas de destino, para que eu saiba onde posso soltar a tarefa.

#### Acceptance Criteria

1. WHILE uma operação de drag está ativa e o cursor está sobre uma Status_Column diferente da origem, THE Status_Column SHALL exibir um destaque visual de drop composto por uma alteração perceptível no fundo ou na borda da coluna, distinguível da aparência padrão sem necessidade de comparação lado a lado
2. WHILE uma operação de drag está ativa e o cursor está sobre a Status_Column de origem, THE Status_Column SHALL manter a aparência padrão sem destaque de drop
3. WHEN o cursor sai de uma Status_Column durante o drag, THE Status_Column SHALL remover o destaque visual de drop em no máximo 100ms após o evento de saída
4. WHEN a operação de drag é finalizada (por drop ou cancelamento), THE Status_Column que exibia destaque SHALL remover o destaque visual de drop em no máximo 100ms

### Requirement 3: Executar Drop e Atualizar Status

**User Story:** Como um administrador, eu quero soltar uma tarefa em outra coluna para alterar seu status, para que eu possa gerenciar o fluxo de trabalho rapidamente.

#### Acceptance Criteria

1. WHEN o usuário solta o Task_Card sobre uma Status_Column diferente da original, THE Kanban_Board SHALL mover o Task_Card para a nova Status_Column em no máximo 100ms (atualização otimista), posicionando o card ao final da lista de cards daquela coluna
2. WHEN o drop é executado com sucesso no frontend, THE API_Client SHALL enviar uma requisição PATCH para atualizar o status da tarefa no servidor com um dos valores válidos: "todo", "in_progress" ou "done"
3. IF a requisição PATCH falhar ou não responder dentro de 5 segundos, THEN THE Kanban_Board SHALL reverter o Task_Card para a Status_Column original e para a mesma posição que ocupava antes do drop
4. IF a requisição PATCH falhar, THEN THE Kanban_Board SHALL exibir uma mensagem de erro indicando que a atualização de status falhou, visível por 5 segundos ou até o usuário dispensá-la manualmente
5. WHEN o usuário solta o Task_Card sobre a mesma Status_Column de origem, THE Kanban_Board SHALL cancelar a operação sem realizar alterações visuais nem requisições ao servidor
6. IF o usuário tentar soltar o Task_Card em uma área fora de qualquer Status_Column válida, THEN THE Kanban_Board SHALL cancelar a operação e reverter o Task_Card para a sua Status_Column original, independentemente de qualquer estado de requisições ao servidor

### Requirement 4: Cancelar Drag

**User Story:** Como um administrador, eu quero poder cancelar uma operação de drag, para que eu não altere o status acidentalmente.

#### Acceptance Criteria

1. WHEN o usuário pressiona a tecla Escape durante uma operação de drag ativa, THE Kanban_Board SHALL cancelar a operação, definir um flag interno drag_cancelled como verdadeiro, e restaurar o Task_Card à mesma Status_Column e à mesma posição na lista em que se encontrava antes do início do drag, removendo qualquer indicação visual de drag ativo (opacidade reduzida, placeholders)
2. WHEN o usuário solta o Task_Card fora de qualquer uma das três Status_Columns (todo, in_progress, done), THE Kanban_Board SHALL cancelar a operação, definir um flag interno drag_cancelled como verdadeiro, e restaurar o Task_Card à mesma Status_Column e à mesma posição na lista em que se encontrava antes do início do drag, removendo qualquer indicação visual de drag ativo
3. IF uma operação de drag é cancelada (por tecla Escape ou drop fora de coluna válida), THEN THE Kanban_Board SHALL manter o status original do Task_Card sem enviar qualquer requisição de atualização ao servidor
4. WHILE uma operação de drag está ativa, THE Kanban_Board SHALL exibir uma indicação visual no Task_Card sendo arrastado (opacidade reduzida ou contorno destacado) que o diferencie dos demais cards
5. IF a tecla Escape é pressionada e nenhuma operação de drag está ativa, THEN THE Kanban_Board SHALL ignorar o evento sem realizar ações de restauração nem definir flag de cancelamento

### Requirement 5: Acessibilidade do Drag and Drop

**User Story:** Como um usuário com necessidades de acessibilidade, eu quero que o drag and drop seja acessível, para que eu possa usar a funcionalidade com tecnologias assistivas.

#### Acceptance Criteria

1. THE Drag_Handle SHALL possuir o atributo aria-roledescription com o valor "arrastar tarefa" e um aria-label contendo o título da tarefa, para identificação por leitores de tela
2. WHILE uma operação de drag está ativa, THE Kanban_Board SHALL anunciar via uma região aria-live com politeness "assertive" a posição atual da tarefa, incluindo o nome da tarefa e a coluna de destino sobre a qual está posicionada
3. THE Task_Card SHALL manter os botões de navegação de status (setas) como alternativa ao drag and drop, onde cada botão possui aria-label indicando a ação e o status de destino (por exemplo, "Mover para Em Progresso") e é acessível via teclado com Tab e ativável com Enter ou Espaço
4. WHEN o Drag_Handle recebe foco de teclado, THE Drag_Handle SHALL permitir iniciar a operação de arrastar com a tecla Enter ou Espaço, navegar entre colunas com as teclas ArrowLeft e ArrowRight, e confirmar o destino com Enter (completando a operação de drop na coluna selecionada) ou cancelar com Escape
5. WHEN uma operação de drag é concluída ou cancelada, THE Kanban_Board SHALL anunciar via aria-live o resultado final da operação indicando se a tarefa foi movida para uma nova coluna ou se a operação foi cancelada, dentro de 500ms após a conclusão

### Requirement 6: Compatibilidade com Dispositivos Touch

**User Story:** Como um usuário de dispositivo móvel ou tablet, eu quero arrastar cards com gestos de toque, para que eu possa usar a funcionalidade em dispositivos touch.

#### Acceptance Criteria

1. WHEN o usuário mantém o toque sobre um Task_Card por no mínimo 500 milissegundos em dispositivo touch, THE Kanban_Board SHALL iniciar a operação de drag e exibir feedback visual indicando que o card foi selecionado para arraste
2. WHILE uma operação de drag está ativa em dispositivo touch, THE Kanban_Board SHALL atualizar a posição do Drag_Preview para acompanhar a posição do toque do usuário a cada frame de renderização
3. WHILE o usuário toca um Task_Card em dispositivo touch, IF o movimento do toque percorre mais de 10 pixels no eixo vertical antes de completar 500 milissegundos de toque, THEN THE Kanban_Board SHALL interpretar o gesto como scroll e cancelar qualquer iniciação de drag
4. IF o usuário libera o toque sobre um Task_Card antes de completar 500 milissegundos de pressão contínua, THEN THE Kanban_Board SHALL cancelar a iniciação de drag e não alterar o estado do card
