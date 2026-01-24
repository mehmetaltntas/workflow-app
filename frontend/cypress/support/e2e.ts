// ***********************************************************
// This file is processed and loaded automatically before
// your test files.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

import './commands';

// Hide fetch/XHR requests from command log
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML =
    '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Global before each to clear state
beforeEach(() => {
  // Clear localStorage before each test
  cy.clearLocalStorage();
});
