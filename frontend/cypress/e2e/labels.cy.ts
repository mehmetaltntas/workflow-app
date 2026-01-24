/// <reference types="cypress" />

describe('Labels', () => {
  let testBoardId: string;

  beforeEach(() => {
    cy.fixture('user').then((user) => {
      cy.loginApi(user.validUser.email, user.validUser.password);
    });

    // Create a test board for label operations
    const boardName = `Label Test Board ${Date.now()}`;
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

  describe('Default Labels', () => {
    it('should have default labels created with board', () => {
      // Open labels panel/modal
      cy.contains(/etiketler|labels/i).click();

      // Should have default labels: Kolay (green), Orta (amber), Zor (red)
      cy.contains('Kolay').should('be.visible');
      cy.contains('Orta').should('be.visible');
      cy.contains('Zor').should('be.visible');
    });
  });

  describe('Create Label', () => {
    it('should open create label form', () => {
      cy.contains(/etiketler|labels/i).click();
      cy.contains(/yeni etiket|new label|etiket ekle|add label/i).click();

      // Should show label form
      cy.get(
        'input[name="name"], input[placeholder*="etiket"], input[placeholder*="label"]'
      ).should('be.visible');
    });

    it('should create a new label', () => {
      const labelName = `Test Label ${Date.now()}`;

      cy.contains(/etiketler|labels/i).click();
      cy.contains(/yeni etiket|new label|etiket ekle|add label/i).click();

      cy.get(
        'input[name="name"], input[placeholder*="etiket"], input[placeholder*="label"]'
      ).type(labelName);

      // Select a color
      cy.get(
        '[data-testid="color-picker"] button, input[type="color"], [class*="color"]'
      )
        .first()
        .click();

      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      // Label should appear in list
      cy.contains(labelName).should('be.visible');
    });

    it('should show error for duplicate label name', () => {
      const labelName = `Duplicate Label ${Date.now()}`;

      cy.contains(/etiketler|labels/i).click();

      // Create first label
      cy.contains(/yeni etiket|new label|etiket ekle|add label/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="etiket"], input[placeholder*="label"]'
      ).type(labelName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      cy.contains(labelName).should('be.visible');

      // Try to create another with same name
      cy.contains(/yeni etiket|new label|etiket ekle|add label/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="etiket"], input[placeholder*="label"]'
      ).type(labelName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      // Should show duplicate error
      cy.contains(/zaten var|already exists|duplicate/i).should('be.visible');
    });

    it('should enforce maximum label limit', () => {
      cy.contains(/etiketler|labels/i).click();

      // Try to create labels until limit is reached (10 total including defaults)
      for (let i = 0; i < 8; i++) {
        cy.get('body').then(($body) => {
          if (
            $body.find(
              'button:contains("yeni etiket"), button:contains("new label"), button:contains("etiket ekle")'
            ).length
          ) {
            cy.contains(/yeni etiket|new label|etiket ekle|add label/i).click();
            cy.get(
              'input[name="name"], input[placeholder*="etiket"], input[placeholder*="label"]'
            ).type(`Label ${i + 1}`);
            cy.get('button[type="submit"], button')
              .contains(/oluştur|create|kaydet|save/i)
              .click();
          }
        });
      }

      // Should show limit error or disable add button
      cy.contains(/maksimum|maximum|limit/i).should('be.visible');
    });
  });

  describe('Update Label', () => {
    it('should update label name', () => {
      const originalName = `Original Label ${Date.now()}`;
      const updatedName = `Updated Label ${Date.now()}`;

      cy.contains(/etiketler|labels/i).click();

      // Create a label
      cy.contains(/yeni etiket|new label|etiket ekle|add label/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="etiket"], input[placeholder*="label"]'
      ).type(originalName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      cy.contains(originalName).should('be.visible');

      // Edit the label
      cy.contains(originalName)
        .parents('[data-testid="label"], [class*="label"]')
        .find(
          'button[aria-label*="edit"], button[aria-label*="düzenle"], [data-testid="edit-label"]'
        )
        .click();

      cy.get(
        'input[name="name"], input[placeholder*="etiket"], input[placeholder*="label"]'
      )
        .clear()
        .type(updatedName);
      cy.get('button[type="submit"], button')
        .contains(/güncelle|update|kaydet|save/i)
        .click();

      cy.contains(updatedName).should('be.visible');
    });

    it('should update label color', () => {
      cy.contains(/etiketler|labels/i).click();

      // Edit an existing label (Kolay)
      cy.contains('Kolay')
        .parents('[data-testid="label"], [class*="label"]')
        .find(
          'button[aria-label*="edit"], button[aria-label*="düzenle"], [data-testid="edit-label"]'
        )
        .click();

      // Change color
      cy.get(
        '[data-testid="color-picker"] button, input[type="color"], [class*="color"]'
      )
        .eq(2)
        .click();

      cy.get('button[type="submit"], button')
        .contains(/güncelle|update|kaydet|save/i)
        .click();

      // Verify color changed (this depends on how colors are displayed)
    });
  });

  describe('Delete Label', () => {
    it('should delete a custom label', () => {
      const labelName = `Delete Label ${Date.now()}`;

      cy.contains(/etiketler|labels/i).click();

      // Create a label
      cy.contains(/yeni etiket|new label|etiket ekle|add label/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="etiket"], input[placeholder*="label"]'
      ).type(labelName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      cy.contains(labelName).should('be.visible');

      // Delete the label
      cy.contains(labelName)
        .parents('[data-testid="label"], [class*="label"]')
        .find(
          'button[aria-label*="delete"], button[aria-label*="sil"], [data-testid="delete-label"]'
        )
        .click();

      // Confirm deletion
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="confirm-delete"]').length) {
          cy.contains(/evet|yes|onayla|confirm|sil|delete/i).click();
        }
      });

      cy.contains(labelName).should('not.exist');
    });

    it('should show confirmation when deleting label used by tasks', () => {
      cy.contains(/etiketler|labels/i).click();

      // Try to delete default label (which might be used)
      cy.contains('Kolay')
        .parents('[data-testid="label"], [class*="label"]')
        .find(
          'button[aria-label*="delete"], button[aria-label*="sil"], [data-testid="delete-label"]'
        )
        .click();

      // Should show warning/confirmation
      cy.contains(
        /emin misiniz|are you sure|kullanılıyor|being used|affected/i
      ).should('be.visible');
    });
  });

  describe('Assign Label to Task', () => {
    beforeEach(() => {
      // Create a list and task
      const listName = `Label Test List ${Date.now()}`;
      cy.contains(/yeni liste|new list|liste ekle|add list/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="liste"], input[placeholder*="list"]'
      ).type(listName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();

      const taskTitle = `Label Test Task ${Date.now()}`;
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
    });

    it('should assign label to task', () => {
      // Open task detail
      cy.get('[data-testid="task"], [class*="task"]').first().click();

      // Find label selector
      cy.contains(/etiket ekle|add label|etiket seç|select label/i).click();

      // Select a label (e.g., Kolay)
      cy.contains('Kolay').click();

      // Label should appear on task
      cy.get('[data-testid="task-detail"], [class*="task-detail"]')
        .find('[data-testid="task-label"], [class*="label"]')
        .should('contain', 'Kolay');
    });

    it('should remove label from task', () => {
      // First assign a label
      cy.get('[data-testid="task"], [class*="task"]').first().click();
      cy.contains(/etiket ekle|add label|etiket seç|select label/i).click();
      cy.contains('Kolay').click();

      // Verify label is assigned
      cy.get('[data-testid="task-detail"], [class*="task-detail"]')
        .find('[data-testid="task-label"], [class*="label"]')
        .should('contain', 'Kolay');

      // Remove the label
      cy.get('[data-testid="task-detail"], [class*="task-detail"]')
        .find('[data-testid="task-label"], [class*="label"]')
        .contains('Kolay')
        .find(
          'button[aria-label*="remove"], button[aria-label*="kaldır"], [data-testid="remove-label"]'
        )
        .click();

      // Label should be removed
      cy.get('[data-testid="task-detail"], [class*="task-detail"]')
        .find('[data-testid="task-label"], [class*="label"]')
        .should('not.contain', 'Kolay');
    });

    it('should assign multiple labels to task', () => {
      cy.get('[data-testid="task"], [class*="task"]').first().click();

      cy.contains(/etiket ekle|add label|etiket seç|select label/i).click();
      cy.contains('Kolay').click();

      cy.contains(/etiket ekle|add label|etiket seç|select label/i).click();
      cy.contains('Orta').click();

      // Both labels should appear
      cy.get('[data-testid="task-detail"], [class*="task-detail"]')
        .find('[data-testid="task-label"], [class*="label"]')
        .should('contain', 'Kolay')
        .and('contain', 'Orta');
    });
  });

  describe('Assign Label to List', () => {
    beforeEach(() => {
      // Create a list
      const listName = `Label List ${Date.now()}`;
      cy.contains(/yeni liste|new list|liste ekle|add list/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="liste"], input[placeholder*="list"]'
      ).type(listName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();
      cy.contains(listName).should('be.visible');
    });

    it('should assign label to list', () => {
      // Find list settings or label button
      cy.get('[data-testid="list"], [class*="list"]')
        .first()
        .find(
          'button[aria-label*="settings"], button[aria-label*="label"], [data-testid="list-labels"]'
        )
        .click();

      // Select a label
      cy.contains('Zor').click();

      // List should show label
      cy.get('[data-testid="list"], [class*="list"]')
        .first()
        .find('[data-testid="list-label"], [class*="label-badge"]')
        .should('contain', 'Zor');
    });
  });

  describe('Label Filtering', () => {
    beforeEach(() => {
      // Create a list with tasks having different labels
      const listName = `Filter Test List ${Date.now()}`;
      cy.contains(/yeni liste|new list|liste ekle|add list/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="liste"], input[placeholder*="list"]'
      ).type(listName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|ekle|add|kaydet|save/i)
        .click();

      // Create tasks with labels
      const tasks = [
        { title: 'Easy Task', label: 'Kolay' },
        { title: 'Medium Task', label: 'Orta' },
        { title: 'Hard Task', label: 'Zor' },
      ];

      tasks.forEach((task) => {
        cy.contains(listName)
          .parents('[data-testid="list"], [class*="list"]')
          .find(
            'button[aria-label*="add"], button[aria-label*="ekle"], [data-testid="add-task"]'
          )
          .click();
        cy.get(
          'input[name="title"], input[placeholder*="görev"], input[placeholder*="task"]'
        ).type(task.title);
        cy.get('button[type="submit"], button')
          .contains(/oluştur|create|ekle|add|kaydet|save/i)
          .click();

        // Assign label
        cy.contains(task.title).click();
        cy.contains(/etiket ekle|add label|etiket seç|select label/i).click();
        cy.contains(task.label).click();
        cy.get('body').type('{esc}'); // Close modal
      });
    });

    it('should filter tasks by label', () => {
      // Find filter control
      cy.contains(/filtrele|filter/i).click();
      cy.contains('Kolay').click();

      // Should only show Easy Task
      cy.contains('Easy Task').should('be.visible');
      cy.contains('Medium Task').should('not.be.visible');
      cy.contains('Hard Task').should('not.be.visible');
    });

    it('should clear label filter', () => {
      // Apply filter
      cy.contains(/filtrele|filter/i).click();
      cy.contains('Kolay').click();

      // Clear filter
      cy.contains(/temizle|clear|tümü|all/i).click();

      // Should show all tasks
      cy.contains('Easy Task').should('be.visible');
      cy.contains('Medium Task').should('be.visible');
      cy.contains('Hard Task').should('be.visible');
    });
  });
});
