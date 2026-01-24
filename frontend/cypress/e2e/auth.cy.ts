/// <reference types="cypress" />

describe('Authentication', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
  });

  describe('User Registration', () => {
    it('should display registration form', () => {
      cy.visit('/register');
      cy.get('input[name="username"]').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('have.length.at.least', 1);
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show validation errors for empty form', () => {
      cy.visit('/register');
      cy.get('button[type="submit"]').click();
      // Should show validation messages
      cy.get('input:invalid').should('have.length.at.least', 1);
    });

    it('should show error for password mismatch', () => {
      cy.visit('/register');
      cy.get('input[name="username"]').type('testuser');
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').first().type('Password123!');
      cy.get('input[name="confirmPassword"], input[type="password"]')
        .last()
        .type('DifferentPassword123!');
      cy.get('button[type="submit"]').click();
      // Should show password mismatch error
      cy.contains(/şifre.*eşleşmiyor|password.*match/i).should('be.visible');
    });

    it('should register a new user successfully', () => {
      const uniqueEmail = `testuser_${Date.now()}@example.com`;
      const uniqueUsername = `testuser_${Date.now()}`;

      cy.visit('/register');
      cy.get('input[name="username"]').type(uniqueUsername);
      cy.get('input[type="email"]').type(uniqueEmail);
      cy.get('input[type="password"]').first().type('Test123456!');
      cy.get('input[name="confirmPassword"], input[type="password"]')
        .last()
        .type('Test123456!');
      cy.get('button[type="submit"]').click();

      // Should redirect to login or boards page
      cy.url().should('match', /(login|boards)/);
    });

    it('should show error for duplicate email', () => {
      cy.fixture('user').then((user) => {
        // First, try to register with existing email
        cy.visit('/register');
        cy.get('input[name="username"]').type('newusername');
        cy.get('input[type="email"]').type(user.validUser.email);
        cy.get('input[type="password"]').first().type(user.validUser.password);
        cy.get('input[name="confirmPassword"], input[type="password"]')
          .last()
          .type(user.validUser.password);
        cy.get('button[type="submit"]').click();

        // Should show error about existing email
        cy.contains(/kayıtlı|exists|already/i).should('be.visible');
      });
    });

    it('should navigate to login page', () => {
      cy.visit('/register');
      cy.contains(/giriş|login|sign in/i).click();
      cy.url().should('include', '/login');
    });
  });

  describe('User Login', () => {
    it('should display login form', () => {
      cy.visit('/login');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.fixture('user').then((user) => {
        cy.visit('/login');
        cy.get('input[type="email"]').type(user.invalidUser.email);
        cy.get('input[type="password"]').type(user.invalidUser.password);
        cy.get('button[type="submit"]').click();

        // Should show error message
        cy.contains(/hatalı|geçersiz|invalid|incorrect/i).should('be.visible');
      });
    });

    it('should login successfully with valid credentials', () => {
      cy.fixture('user').then((user) => {
        cy.visit('/login');
        cy.get('input[type="email"]').type(user.validUser.email);
        cy.get('input[type="password"]').type(user.validUser.password);
        cy.get('button[type="submit"]').click();

        // Should redirect to boards page
        cy.url().should('include', '/boards');
        // Should have token in localStorage
        cy.window().its('localStorage.token').should('exist');
      });
    });

    it('should navigate to registration page', () => {
      cy.visit('/login');
      cy.contains(/kayıt|register|sign up/i).click();
      cy.url().should('include', '/register');
    });

    it('should navigate to forgot password page', () => {
      cy.visit('/login');
      cy.contains(/şifremi unuttum|forgot password/i).click();
      cy.url().should('include', '/forgot-password');
    });
  });

  describe('User Logout', () => {
    beforeEach(() => {
      cy.fixture('user').then((user) => {
        cy.loginApi(user.validUser.email, user.validUser.password);
      });
    });

    it('should logout successfully', () => {
      cy.visit('/boards');
      // Find and click logout button
      cy.get('[data-testid="logout-button"], button')
        .contains(/çıkış|logout|sign out/i)
        .click();

      // Should redirect to login page
      cy.url().should('include', '/login');
      // Token should be removed
      cy.window().its('localStorage.token').should('not.exist');
    });
  });

  describe('Password Reset', () => {
    it('should display forgot password form', () => {
      cy.visit('/forgot-password');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('button[type="submit"]').should('be.visible');
    });

    it('should send reset code for valid email', () => {
      cy.fixture('user').then((user) => {
        cy.visit('/forgot-password');
        cy.get('input[type="email"]').type(user.validUser.email);
        cy.get('button[type="submit"]').click();

        // Should show success message or code input
        cy.contains(/kod gönderildi|code sent|email sent|doğrulama/i).should(
          'be.visible'
        );
      });
    });

    it('should handle invalid email gracefully', () => {
      cy.visit('/forgot-password');
      cy.get('input[type="email"]').type('nonexistent@example.com');
      cy.get('button[type="submit"]').click();

      // Should still show same message (security - don't reveal if email exists)
      cy.contains(/kod gönderildi|code sent|email sent|kontrol edin/i).should(
        'be.visible'
      );
    });

    it('should navigate back to login', () => {
      cy.visit('/forgot-password');
      cy.contains(/giriş|login|back/i).click();
      cy.url().should('include', '/login');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route without auth', () => {
      cy.visit('/boards');
      cy.url().should('include', '/login');
    });

    it('should redirect to login when accessing board detail without auth', () => {
      cy.visit('/boards/1');
      cy.url().should('include', '/login');
    });

    it('should allow access to protected routes when authenticated', () => {
      cy.fixture('user').then((user) => {
        cy.loginApi(user.validUser.email, user.validUser.password);
        cy.visit('/boards');
        cy.url().should('include', '/boards');
      });
    });
  });
});
