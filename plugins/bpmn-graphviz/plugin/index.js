// Camunda-Modeler-Plugin-Manifest (Synixx-Werkzeugfamilie).
// Quelle + Build: scripts/build-cm-plugins.mjs im Synixx-Repo; README.md nebenan.
'use strict';

// Camunda-Modeler-Plugin-Manifest: BPMN-Strukturgraph via Graphviz.
// Bundle bauen via `npm run build:cm-plugins`.

module.exports = {
    name: 'Synixx: BPMN-Graphviz',
    style: 'style.css',
    script: 'client.bundle.js',
};
