// Camunda-Modeler-Plugin-Manifest (Synixx-Werkzeugfamilie).
// Quelle + Build: scripts/build-cm-plugins.mjs im Synixx-Repo; README.md nebenan.
'use strict';

// Camunda-Modeler-Plugin-Manifest. style.css wird im Renderer geladen,
// client.bundle.js (esbuild-Bundle) registriert das bpmn-js-Modul.
//
// Bundle bauen via `npm run build:cm-plugins`.

module.exports = {
    name: 'Synixx: Kommentare',
    style: 'style.css',
    script: 'client.bundle.js',
};
