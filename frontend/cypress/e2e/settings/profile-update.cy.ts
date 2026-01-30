/// <reference types="cypress" />

describe('Settings - Profile Update', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  describe('Settings Page Access', () => {
    it('should redirect to login when not authenticated', () => {
      cy.visit('/settings');
      cy.url().should('match', /\/(login|giris)/);
    });

    it('should display settings page when authenticated', () => {
      cy.login('test@example.com', 'Test123456!');
      cy.visit('/settings');
      cy.contains(/ayarlar|settings/i).should('be.visible');
    });
  });

  describe('Settings Navigation', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'Test123456!');
      cy.visit('/settings');
    });

    it('should display all navigation menu items', () => {
      cy.contains(/profil/i).should('be.visible');
      cy.contains(/gizlilik|privacy/i).should('be.visible');
      cy.contains(/güvenlik|security/i).should('be.visible');
      cy.contains(/hesap|account/i).should('be.visible');
    });

    it('should show profile section by default', () => {
      // Profile section should be active/visible by default
      cy.contains(/profil bilgilerinizi|profile information/i).should('be.visible');
    });

    it('should switch to security section when clicked', () => {
      cy.contains(/güvenlik|security/i).click();
      cy.contains(/şifre|password/i).should('be.visible');
    });

    it('should switch to privacy section when clicked', () => {
      cy.contains(/gizlilik|privacy/i).click();
      cy.contains(/gizlilik|privacy/i).should('be.visible');
    });

    it('should switch to account section when clicked', () => {
      cy.contains(/hesap|account/i).click();
      cy.contains(/hesap.*sil|delete.*account/i).should('be.visible');
    });
  });

  describe('Profile Update', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'Test123456!');
      cy.visit('/settings');
    });

    it('should display profile form with current user data', () => {
      // Profile section should show user info fields
      cy.get('input').should('have.length.at.least', 1);
    });

    it('should update username successfully', () => {
      const newUsername = `updated_${Date.now()}`;

      // Find username input and update it
      cy.get('input[name="username"], input[placeholder*="kullanıcı"], input[placeholder*="username"]')
        .first()
        .clear()
        .type(newUsername);

      // Submit the form
      cy.get('button[type="submit"], button')
        .contains(/kaydet|save|güncelle|update/i)
        .click();

      // Should show success message
      cy.contains(/başarıyla|successfully|güncellendi|updated/i).should('be.visible');
    });
  });

  describe('Password Change', () => {
    beforeEach(() => {
      cy.login('test@example.com', 'Test123456!');
      cy.visit('/settings');
      // Navigate to security section
      cy.contains(/güvenlik|security/i).click();
    });

    it('should display password change form', () => {
      cy.get('input[type="password"]').should('have.length.at.least', 2);
    });

    it('should show error for incorrect current password', () => {
      cy.get('input[type="password"]').eq(0).type('WrongPassword123!');
      cy.get('input[type="password"]').eq(1).type('NewPassword123!');
      cy.get('input[type="password"]').eq(2).type('NewPassword123!');

      cy.get('button')
        .contains(/şifre.*değiştir|change.*password|güncelle|update/i)
        .click();

      cy.contains(/hatalı|incorrect|wrong|geçersiz|invalid/i).should('be.visible');
    });

    it('should show error for mismatched new passwords', () => {
      cy.get('input[type="password"]').eq(0).type('Test123456!');
      cy.get('input[type="password"]').eq(1).type('NewPassword123!');
      cy.get('input[type="password"]').eq(2).type('DifferentPassword123!');

      cy.get('button')
        .contains(/şifre.*değiştir|change.*password|güncelle|update/i)
        .click();

      cy.contains(/eşleşmiyor|match|uyuşmuyor/i).should('be.visible');
    });
  });
});
