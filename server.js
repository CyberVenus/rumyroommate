/**
 * @deprecated Legacy entrypoint retained for compatibility.
 * Canonical runtime is app.js (`node app.js`).
 *
 * This file intentionally delegates to app.js to avoid split startup paths.
 */

require('./app.js');
