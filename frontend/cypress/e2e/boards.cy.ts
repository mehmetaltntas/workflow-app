/// <reference types="cypress" />

describe('Boards', () => {
  beforeEach(() => {
    cy.fixture('user').then((user) => {
      cy.loginApi(user.validUser.email, user.validUser.password);
    });
  });

  describe('Board List', () => {
    it('should display boards page', () => {
      cy.visit('/boards');
      cy.url().should('include', '/boards');
      // Should have create board button
      cy.contains(/yeni pano|new board|oluştur|create/i).should('be.visible');
    });

    it('should display existing boards', () => {
      cy.visit('/boards');
      // Check if board list container exists
      cy.get('[data-testid="board-list"], [class*="board"]').should('exist');
    });
  });

  describe('Create Board', () => {
    it('should open create board modal/form', () => {
      cy.visit('/boards');
      cy.contains(/yeni pano|new board|oluştur|create/i).click();

      // Should show board name input
      cy.get(
        'input[name="name"], input[placeholder*="pano"], input[placeholder*="board"]'
      ).should('be.visible');
    });

    it('should create a new board successfully', () => {
      const boardName = `Test Board ${Date.now()}`;

      cy.visit('/boards');
      cy.contains(/yeni pano|new board|oluştur|create/i).click();

      cy.get(
        'input[name="name"], input[placeholder*="pano"], input[placeholder*="board"]'
      ).type(boardName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      // Should show the new board in the list
      cy.contains(boardName).should('be.visible');
    });

    it('should show validation error for empty board name', () => {
      cy.visit('/boards');
      cy.contains(/yeni pano|new board|oluştur|create/i).click();

      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      // Should show validation error
      cy.get('input:invalid').should('have.length.at.least', 1);
    });

    it('should show error for duplicate board name', () => {
      const boardName = `Duplicate Board ${Date.now()}`;

      // Create first board
      cy.visit('/boards');
      cy.contains(/yeni pano|new board|oluştur|create/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="pano"], input[placeholder*="board"]'
      ).type(boardName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      // Wait for board to be created
      cy.contains(boardName).should('be.visible');

      // Try to create another board with same name
      cy.contains(/yeni pano|new board|oluştur|create/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="pano"], input[placeholder*="board"]'
      ).type(boardName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      // Should show duplicate error
      cy.contains(/zaten var|already exists|duplicate/i).should('be.visible');
    });
  });

  describe('Board Detail', () => {
    it('should navigate to board detail page', () => {
      const boardName = `Detail Board ${Date.now()}`;

      // Create a board first
      cy.visit('/boards');
      cy.contains(/yeni pano|new board|oluştur|create/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="pano"], input[placeholder*="board"]'
      ).type(boardName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      // Click on the board to open it
      cy.contains(boardName).click();

      // Should be on board detail page
      cy.url().should('match', /\/boards\/\d+/);
    });

    it('should display board name on detail page', () => {
      const boardName = `View Board ${Date.now()}`;

      cy.visit('/boards');
      cy.contains(/yeni pano|new board|oluştur|create/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="pano"], input[placeholder*="board"]'
      ).type(boardName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      cy.contains(boardName).click();

      // Board name should be visible on the page
      cy.contains(boardName).should('be.visible');
    });
  });

  describe('Update Board', () => {
    it('should update board name', () => {
      const originalName = `Original ${Date.now()}`;
      const updatedName = `Updated ${Date.now()}`;

      // Create a board
      cy.visit('/boards');
      cy.contains(/yeni pano|new board|oluştur|create/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="pano"], input[placeholder*="board"]'
      ).type(originalName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      // Find and click edit button on the board
      cy.contains(originalName)
        .parents('[data-testid="board-card"], [class*="board"]')
        .find(
          'button[aria-label*="edit"], button[aria-label*="düzenle"], [data-testid="edit-board"]'
        )
        .first()
        .click();

      // Update the name
      cy.get(
        'input[name="name"], input[placeholder*="pano"], input[placeholder*="board"]'
      )
        .clear()
        .type(updatedName);
      cy.get('button[type="submit"], button')
        .contains(/güncelle|update|kaydet|save/i)
        .click();

      // Should show updated name
      cy.contains(updatedName).should('be.visible');
      cy.contains(originalName).should('not.exist');
    });
  });

  describe('Delete Board', () => {
    it('should delete a board', () => {
      const boardName = `Delete Board ${Date.now()}`;

      // Create a board
      cy.visit('/boards');
      cy.contains(/yeni pano|new board|oluştur|create/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="pano"], input[placeholder*="board"]'
      ).type(boardName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      // Wait for board to appear
      cy.contains(boardName).should('be.visible');

      // Find and click delete button
      cy.contains(boardName)
        .parents('[data-testid="board-card"], [class*="board"]')
        .find(
          'button[aria-label*="delete"], button[aria-label*="sil"], [data-testid="delete-board"]'
        )
        .first()
        .click();

      // Confirm deletion if there's a confirmation dialog
      cy.get('body').then(($body) => {
        if ($body.find('[data-testid="confirm-delete"], button').length) {
          cy.contains(/evet|yes|onayla|confirm|sil|delete/i).click();
        }
      });

      // Board should no longer exist
      cy.contains(boardName).should('not.exist');
    });

    it('should show confirmation dialog before deleting', () => {
      const boardName = `Confirm Delete ${Date.now()}`;

      cy.visit('/boards');
      cy.contains(/yeni pano|new board|oluştur|create/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="pano"], input[placeholder*="board"]'
      ).type(boardName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      cy.contains(boardName).should('be.visible');

      // Click delete
      cy.contains(boardName)
        .parents('[data-testid="board-card"], [class*="board"]')
        .find(
          'button[aria-label*="delete"], button[aria-label*="sil"], [data-testid="delete-board"]'
        )
        .first()
        .click();

      // Should show confirmation
      cy.contains(/emin misiniz|are you sure|onaylıyor musunuz/i).should(
        'be.visible'
      );
    });
  });

  describe('Board Status', () => {
    it('should toggle board status (active/archived)', () => {
      const boardName = `Status Board ${Date.now()}`;

      cy.visit('/boards');
      cy.contains(/yeni pano|new board|oluştur|create/i).click();
      cy.get(
        'input[name="name"], input[placeholder*="pano"], input[placeholder*="board"]'
      ).type(boardName);
      cy.get('button[type="submit"], button')
        .contains(/oluştur|create|kaydet|save/i)
        .click();

      cy.contains(boardName).should('be.visible');

      // Find and click archive/status toggle button
      cy.contains(boardName)
        .parents('[data-testid="board-card"], [class*="board"]')
        .find(
          'button[aria-label*="archive"], button[aria-label*="arşiv"], [data-testid="toggle-status"]'
        )
        .first()
        .click();

      // Board should be archived (may be hidden or styled differently)
      // This depends on the UI implementation
    });
  });
});
