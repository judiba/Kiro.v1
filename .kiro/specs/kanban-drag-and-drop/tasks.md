# Implementation Plan: Kanban Drag and Drop

## Overview

Implementação da funcionalidade de drag and drop no quadro Kanban, permitindo que administradores arrastem Task Cards entre colunas de status. A abordagem utiliza HTML5 Drag and Drop API nativa + Touch Events + navegação por teclado, com atualização otimista e rollback em caso de falha.

## Tasks

- [x] 1. Configurar infraestrutura de testes e dependências
  - [x] 1.1 Instalar dependências de teste e adicionar scripts ao package.json
    - Instalar fast-check, @testing-library/react, @happy-dom/global-registration como devDependencies
    - Adicionar script test: bun test ao package.json
    - Criar arquivo de configuração bunfig.toml com preset para happy-dom

- [x] 2. Implementar hook useDragAndDrop (lógica principal)
  - [x] 2.1 Criar o hook useDragAndDrop com gerenciamento de estado de drag
    - Criar arquivo src/hooks/useDragAndDrop.ts
    - Implementar interfaces DragState, UseDragAndDropOptions, UseDragAndDropReturn, TaskDragProps, ColumnDropProps
    - Implementar lógica de dragstart com verificação de permissão (isAdmin) e threshold de 5px
    - Implementar handlers onDragOver, onDragEnter, onDragLeave, onDrop para colunas
    - Implementar lógica de highlight: destacar coluna apenas se diferente da origem
    - Implementar cancelamento via Escape (flag dragCancelled, restaurar estado)
    - Implementar atualização otimista: mover card imediatamente ao final da coluna destino
    - Implementar chamada PATCH com AbortController e timeout de 5 segundos
    - Implementar rollback em caso de falha/timeout: restaurar task à coluna e posição original
    - Implementar gerenciamento de mensagem de erro (exibir por 5s, dismiss manual)
    - Implementar anúncios ARIA: durante drag (nome tarefa + coluna) e ao finalizar (resultado)

- [x] 3. Implementar hook useTouchDrag (suporte touch)
  - [x] 3.1 Criar o hook useTouchDrag com long press e detecção de scroll
    - Criar arquivo src/hooks/useTouchDrag.ts
    - Implementar long press de 500ms com timer
    - Implementar threshold de 10px vertical para cancelar drag e interpretar como scroll
    - Implementar cancelamento se toque liberado antes de 500ms
    - Implementar atualização de posição do preview a cada frame (requestAnimationFrame)
    - Implementar detecção de coluna sob o ponto de toque via document.elementFromPoint

- [x] 4. Implementar hook useKeyboardDrag (acessibilidade teclado)
  - [x] 4.1 Criar o hook useKeyboardDrag com máquina de estados
    - Criar arquivo src/hooks/useKeyboardDrag.ts
    - Implementar Enter/Espaço para iniciar drag a partir do drag handle com foco
    - Implementar ArrowLeft/ArrowRight para navegar entre colunas
    - Implementar Enter para confirmar drop na coluna selecionada
    - Implementar Escape para cancelar
    - Emitir mensagens de anúncio via callback onAnnounce a cada navegação

- [x] 5. Criar componentes auxiliares
  - [x] 5.1 Criar componente AriaLiveRegion
    - Criar arquivo src/components/AriaLiveRegion.tsx
    - Implementar região invisível com aria-live assertive e role status
    - Receber prop message e renderizar texto para leitores de tela
    - Estilizar com sr-only (visually hidden) via Tailwind
  - [x] 5.2 Criar componente ErrorToast
    - Criar arquivo src/components/ErrorToast.tsx
    - Implementar toast com mensagem de falha ao atualizar status
    - Implementar auto-dismiss após 5 segundos via setTimeout
    - Implementar botão de dismiss manual (X)
    - Posicionar no canto inferior direito com fixed positioning
    - Estilizar com cores de alerta consistentes com Tailwind existente

- [x] 6. Atualizar TaskCard para suporte a drag
  - [x] 6.1 Adicionar drag handle com atributos ARIA ao TaskCard
    - Modificar src/components/TaskCard.tsx
    - Adicionar elemento drag handle (ícone de arrastar) visível para admins
    - Adicionar aria-roledescription arrastar tarefa ao drag handle
    - Adicionar aria-label contendo o título da tarefa
    - Adicionar tabIndex 0 para focabilidade por teclado
    - Aplicar opacidade 0.5 quando task está sendo arrastada (via prop isDragging)
    - Manter botões de navegação de status como alternativa ao DnD com aria-label descritivos
    - Aceitar e aplicar TaskDragProps repassados do hook

- [x] 7. Integrar drag and drop no KanbanBoard
  - [x] 7.1 Atualizar KanbanBoard para integrar todos os hooks e componentes
    - Modificar src/components/KanbanBoard.tsx
    - Importar e usar useDragAndDrop passando tasks, isAdmin e onStatusChange
    - Aplicar getColumnDropProps a cada coluna de status
    - Aplicar getTaskDragProps a cada TaskCard
    - Integrar useTouchDrag para suporte mobile
    - Integrar useKeyboardDrag para navegação por teclado
    - Renderizar AriaLiveRegion com ariaAnnouncement do hook
    - Renderizar ErrorToast quando error não é null
    - Aplicar classes de highlight visual na coluna quando isHighlighted
    - Implementar cursor padrão (não-arrastar) para usuários não-admin

- [x] 8. Atualizar a API com suporte a AbortController
  - [x] 8.1 Criar função updateStatusWithTimeout no módulo API
    - Criar ou modificar src/api.ts
    - Implementar wrapper que usa AbortController com timeout de 5 segundos
    - Em caso de abort (timeout), lançar erro distinguível para o hook tratar como falha
    - Manter compatibilidade com a função updateStatus existente

- [x] 9. Atualizar README.md com documentação da funcionalidade
  - [x] 9.1 Documentar a funcionalidade de drag and drop no README em português
    - Modificar README.md
    - Traduzir toda a documentação existente para português (pt-BR)
    - Adicionar seção sobre Drag and Drop na lista de funcionalidades
    - Documentar suporte a mouse (HTML5 DnD), touch (long press 500ms), e teclado
    - Mencionar atualização otimista com rollback automático em falha
    - Documentar acessibilidade: ARIA live region, aria-roledescription, navegação por teclado
    - Documentar que a funcionalidade está disponível apenas para administradores

- [x] 10. Build e validação final
  - [x] 10.1 Executar build e verificar que a aplicação compila sem erros
    - Rodar bun run build e verificar saída sem erros
    - Verificar que todos os imports estão corretos
    - Verificar que o TypeScript compila sem erros de tipo
