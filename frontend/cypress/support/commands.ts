/// <reference types="cypress" />

// Custom command declarations
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with email and password
       * @example cy.login('test@example.com', 'password123')
       */
      login(email: string, password: string): Chainable<void>;

      /**
       * Custom command to register a new user
       * @example cy.register('testuser', 'test@example.com', 'password123')
       */
      register(
        username: string,
        email: string,
        password: string
      ): Chainable<void>;

      /**
       * Custom command to login via API (faster for setup)
       * @example cy.loginApi('test@example.com', 'password123')
       */
      loginApi(email: string, password: string): Chainable<void>;

      /**
       * Custom command to logout
       * @example cy.logout()
       */
      logout(): Chainable<void>;

      /**
       * Custom command to create a board via API
       * @example cy.createBoard('My Board')
       */
      createBoard(name: string): Chainable<void>;

      /**
       * Custom command to get auth token from localStorage
       * @example cy.getAuthToken().then(token => ...)
       */
      getAuthToken(): Chainable<string | null>;
    }
  }
}

// Login via UI
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.get('input[type="email"]').type(email);
  cy.get('input[type="password"]').type(password);
  cy.get('button[type="submit"]').click();
  cy.url().should('include', '/boards');
});

// Register via UI
Cypress.Commands.add(
  'register',
  (username: string, email: string, password: string) => {
    cy.visit('/register');
    cy.get('input[name="username"]').type(username);
    cy.get('input[type="email"]').type(email);
    cy.get('input[type="password"]').first().type(password);
    cy.get('input[name="confirmPassword"], input[type="password"]')
      .last()
      .type(password);
    cy.get('button[type="submit"]').click();
  }
);

// Login via API (faster for test setup)
Cypress.Commands.add('loginApi', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/auth/login`,
    body: {
      email,
      password,
    },
  }).then((response) => {
    expect(response.status).to.eq(200);
    const { token, refreshToken } = response.body;
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('refreshToken', refreshToken);
  });
});

// Logout
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('token');
    win.localStorage.removeItem('refreshToken');
  });
  cy.visit('/login');
});

// Create board via API
Cypress.Commands.add('createBoard', (name: string) => {
  cy.getAuthToken().then((token) => {
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/boards`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: {
        name,
      },
    }).then((response) => {
      expect(response.status).to.eq(201);
    });
  });
});

// Get auth token from localStorage
Cypress.Commands.add('getAuthToken', () => {
  cy.window().then((win) => {
    return win.localStorage.getItem('token');
  });
});

export {};
