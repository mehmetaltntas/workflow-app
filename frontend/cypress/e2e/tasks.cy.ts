/// <reference types="cypress" />

describe('Tasks and Lists', () => {
  let testBoardId: string;

  beforeEach(() => {
    cy.fixture('user').then((user) => {
      cy.loginApi(user.validUser.email, user.validUser.password);
    });

    // Create a test board for task operations
    const boardName = `Task Test Board ${Date.now()}`;
    cy.visit('/boards');
    cy.contains(/yeni pano|new board|oluştur|create/i).click();
    cy.get(
      'input[name="name"], input[placeholder*="pano"], input[placeholder*="board"]'
    ).type(boardName);
    cy.get('button[type="submit"], button')
      .contains(/oluştur|create|kaydet|save/i)
      .click();

    // Navigate to the board
    cy.contains(boardName).click();
    cy.url()
      .should('match', /\/boards\/\d+/)
      .then((url) => {
        const match = url.match(/\/boards\/(\d+)/);
        if (match) {
          testBoardId = match[1];
        }
      });
  });

  describe('Task Lists', () => {
    it('should display default lists or empty state', () => {
      // Board detail page should show lists section
      cy.get(
        '[data-testid="lists-container"], [class*="list"], [class*="column"]'
      ).should('exist');
    });

    it('should create a new list', () => {
      const listName = `Test List ${Date.now()}`;

      // Click add list button
      cy.contains(/yeni liste|new list|liste ekle|add list/i).click();

      // Enter list name
      cy.get(
        'input[name="name"], input[placeholder*="liste"], input[placeholder*="list"]'
      ).type(listName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();

      // List should appear
      cy.contains(listName).should('be.visible');
    });

    it('should rename a list', () => {
      const originalName = `Original List ${Date.now()}`;
      const updatedName = `Updated List ${Date.now()}`;

      // Create a list first
      cy.contains(/yeni liste|new list|liste ekle|add list/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="liste"], input[placeholder*="list"]'
      ).type(originalName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();

      cy.contains(originalName).should('be.visible');

      // Click on list header to edit or find edit button
      cy.contains(originalName)
        .parents('[data-testid="list"], [class*="list"]')
        .find(
          'button[aria-label*="edit"], button[aria-label*="düzenle"], [data-testid="edit-list"]'
        )
        .first()
        .click();

      // Update name
      cy.get(
        'input[name="name"], input[placeholder*="liste"], input[placeholder*="list"]'
      )
        .clear()
        .type(updatedName);
      cy.get('button[type="submit"], button')
        .contains(/güncelle|update|kaydet|save/i)
        .click();

      cy.contains(updatedName).should('be.visible');
    });

    it('should delete a list', () => {
      const listName = `Delete List ${Date.now()}`;

      // Create a list
      cy.contains(/yeni liste|new list|liste ekle|add list/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="liste"], input[placeholder*="list"]'
      ).type(listName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();

      cy.contains(listName).should('be.visible');

      // Delete the list
      cy.contains(listName)
        .parents('[data-testid="list"], [class*="list"]')
        .find(
          'button[aria-label*="delete"], button[aria-label*="sil"], [data-testid="delete-list"]'
        )
        .first()
        .click();

      // Confirm if needed
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="confirm-delete"]').length) {
          cy.contains(/evet|yes|onayla|confirm|sil|delete/i).click();
        }
      });

      cy.contains(listName).should('not.exist');
    });
  });

  describe('Tasks', () => {
    beforeEach(() => {
      // Create a list for tasks
      const listName = `Task Container ${Date.now()}`;
      cy.contains(/yeni liste|new list|liste ekle|add list/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="liste"], input[placeholder*="list"]'
      ).type(listName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();
      cy.contains(listName).should('be.visible');
    });

    it('should create a new task', () => {
      const taskTitle = `Test Task ${Date.now()}`;

      // Find add task button in the list
      cy.get('[data-testid="list"], [class*="list"]')
        .first()
        .find(
          'button[aria-label*="add"], button[aria-label*="ekle"], [data-testid="add-task"]'
        )
        .click();

      // Enter task details
      cy.get(
        'input[name="title"], input[placeholder*="görev"], input[placeholder*="task"]'
      ).type(taskTitle);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();

      // Task should appear
      cy.contains(taskTitle).should('be.visible');
    });

    it('should create a task with description', () => {
      const taskTitle = `Task With Desc ${Date.now()}`;
      const taskDesc = 'This is a test description';

      cy.get('[data-testid="list"], [class*="list"]')
        .first()
        .find(
          'button[aria-label*="add"], button[aria-label*="ekle"], [data-testid="add-task"]'
        )
        .click();

      cy.get(
        'input[name="title"], input[placeholder*="görev"], input[placeholder*="task"]'
      ).type(taskTitle);
      cy.get(
        'textarea[name="description"], textarea[placeholder*="açıklama"], textarea[placeholder*="description"]'
      ).type(taskDesc);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();

      cy.contains(taskTitle).should('be.visible');
    });

    it('should edit a task', () => {
      const originalTitle = `Original Task ${Date.now()}`;
      const updatedTitle = `Updated Task ${Date.now()}`;

      // Create task
      cy.get('[data-testid="list"], [class*="list"]')
        .first()
        .find(
          'button[aria-label*="add"], button[aria-label*="ekle"], [data-testid="add-task"]'
        )
        .click();
      cy.get(
        'input[name="title"], input[placeholder*="görev"], input[placeholder*="task"]'
      ).type(originalTitle);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();

      cy.contains(originalTitle).should('be.visible');

      // Click on task to edit
      cy.contains(originalTitle).click();

      // Edit title
      cy.get(
        'input[name="title"], input[placeholder*="görev"], input[placeholder*="task"]'
      )
        .clear()
        .type(updatedTitle);
      cy.get('button[type="submit"], button')
        .contains(/güncelle|update|kaydet|save/i)
        .click();

      cy.contains(updatedTitle).should('be.visible');
    });

    it('should delete a task', () => {
      const taskTitle = `Delete Task ${Date.now()}`;

      // Create task
      cy.get('[data-testid="list"], [class*="list"]')
        .first()
        .find(
          'button[aria-label*="add"], button[aria-label*="ekle"], [data-testid="add-task"]'
        )
        .click();
      cy.get(
        'input[name="title"], input[placeholder*="görev"], input[placeholder*="task"]'
      ).type(taskTitle);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();

      cy.contains(taskTitle).should('be.visible');

      // Find delete button on task
      cy.contains(taskTitle)
        .parents('[data-testid="task"], [class*="task"]')
        .find(
          'button[aria-label*="delete"], button[aria-label*="sil"], [data-testid="delete-task"]'
        )
        .click();

      // Confirm if needed
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="confirm-delete"]').length) {
          cy.contains(/evet|yes|onayla|confirm|sil|delete/i).click();
        }
      });

      cy.contains(taskTitle).should('not.exist');
    });

    it('should mark task as complete', () => {
      const taskTitle = `Complete Task ${Date.now()}`;

      // Create task
      cy.get('[data-testid="list"], [class*="list"]')
        .first()
        .find(
          'button[aria-label*="add"], button[aria-label*="ekle"], [data-testid="add-task"]'
        )
        .click();
      cy.get(
        'input[name="title"], input[placeholder*="görev"], input[placeholder*="task"]'
      ).type(taskTitle);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();

      cy.contains(taskTitle).should('be.visible');

      // Find and click complete checkbox
      cy.contains(taskTitle)
        .parents('[data-testid="task"], [class*="task"]')
        .find(
          'input[type="checkbox"], button[aria-label*="complete"], [data-testid="complete-task"]'
        )
        .click();

      // Task should be marked as complete (visual indication)
      cy.contains(taskTitle)
        .parents('[data-testid="task"], [class*="task"]')
        .should('have.class', 'completed');
    });
  });

  describe('Drag and Drop', () => {
    beforeEach(() => {
      // Create two lists
      const list1 = `List 1 ${Date.now()}`;
      const list2 = `List 2 ${Date.now()}`;

      cy.contains(/yeni liste|new list|liste ekle|add list/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="liste"], input[placeholder*="list"]'
      ).type(list1);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();
      cy.contains(list1).should('be.visible');

      cy.contains(/yeni liste|new list|liste ekle|add list/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="liste"], input[placeholder*="list"]'
      ).type(list2);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();
      cy.contains(list2).should('be.visible');

      // Create a task in list 1
      const taskTitle = `Drag Task ${Date.now()}`;
      cy.contains(list1)
        .parents('[data-testid="list"], [class*="list"]')
        .find(
          'button[aria-label*="add"], button[aria-label*="ekle"], [data-testid="add-task"]'
        )
        .click();
      cy.get(
        'input[name="title"], input[placeholder*="görev"], input[placeholder*="task"]'
      ).type(taskTitle);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();
      cy.contains(taskTitle).should('be.visible');
    });

    it('should drag task between lists', () => {
      // Note: Drag and drop testing with Cypress requires special handling
      // This is a basic structure - actual implementation depends on the drag library used

      cy.get('[data-testid="task"], [class*="task"]')
        .first()
        .trigger('dragstart');
      cy.get('[data-testid="list"], [class*="list"]')
        .last()
        .trigger('drop');
      cy.get('[data-testid="task"], [class*="task"]')
        .first()
        .trigger('dragend');

      // Verify task moved to second list
      cy.get('[data-testid="list"], [class*="list"]')
        .last()
        .find('[data-testid="task"], [class*="task"]')
        .should('have.length.at.least', 1);
    });
  });

  describe('Subtasks', () => {
    beforeEach(() => {
      // Create a list and task
      const listName = `Subtask List ${Date.now()}`;
      cy.contains(/yeni liste|new list|liste ekle|add list/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="liste"], input[placeholder*="list"]'
      ).type(listName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();

      const taskTitle = `Parent Task ${Date.now()}`;
      cy.contains(listName)
        .parents('[data-testid="list"], [class*="list"]')
        .find(
          'button[aria-label*="add"], button[aria-label*="ekle"], [data-testid="add-task"]'
        )
        .click();
      cy.get(
        'input[name="title"], input[placeholder*="görev"], input[placeholder*="task"]'
      ).type(taskTitle);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();
      cy.contains(taskTitle).should('be.visible');

      // Open task detail
      cy.contains(taskTitle).click();
    });

    it('should add a subtask', () => {
      const subtaskTitle = `Subtask ${Date.now()}`;

      // Find add subtask button
      cy.contains(/alt görev ekle|add subtask/i).click();

      cy.get(
        'input[name="title"], input[placeholder*="alt görev"], input[placeholder*="subtask"]'
      ).type(subtaskTitle);
      cy.get('button[type="submit"], button')
        .contains(/ekle|add|kaydet|save/i)
        .click();

      cy.contains(subtaskTitle).should('be.visible');
    });

    it('should mark subtask as complete', () => {
      const subtaskTitle = `Complete Subtask ${Date.now()}`;

      cy.contains(/alt görev ekle|add subtask/i).click();
      cy.get(
        'input[name="title"], input[placeholder*="alt görev"], input[placeholder*="subtask"]'
      ).type(subtaskTitle);
      cy.get('button[type="submit"], button')
        .contains(/ekle|add|kaydet|save/i)
        .click();

      cy.contains(subtaskTitle).should('be.visible');

      // Toggle subtask completion
      cy.contains(subtaskTitle)
        .parents('[data-testid="subtask"], [class*="subtask"]')
        .find('input[type="checkbox"]')
        .click();

      // Verify completion
      cy.contains(subtaskTitle)
        .parents('[data-testid="subtask"], [class*="subtask"]')
        .find('input[type="checkbox"]')
        .should('be.checked');
    });

    it('should delete a subtask', () => {
      const subtaskTitle = `Delete Subtask ${Date.now()}`;

      cy.contains(/alt görev ekle|add subtask/i).click();
      cy.get(
        'input[name="title"], input[placeholder*="alt görev"], input[placeholder*="subtask"]'
      ).type(subtaskTitle);
      cy.get('button[type="submit"], button')
        .contains(/ekle|add|kaydet|save/i)
        .click();

      cy.contains(subtaskTitle).should('be.visible');

      // Delete subtask
      cy.contains(subtaskTitle)
        .parents('[data-testid="subtask"], [class*="subtask"]')
        .find(
          'button[aria-label*="delete"], button[aria-label*="sil"], [data-testid="delete-subtask"]'
        )
        .click();

      cy.contains(subtaskTitle).should('not.exist');
    });
  });
});
