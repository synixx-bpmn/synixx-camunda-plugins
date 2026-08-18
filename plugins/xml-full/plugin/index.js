// Camunda-Modeler-Plugin-Manifest (Synixx-Werkzeugfamilie).
// Quelle + Build: scripts/build-cm-plugins.mjs im Synixx-Repo; README.md nebenan.
'use strict';

// Camunda-Modeler-Plugin-Manifest: BPMN-XML-Vollansicht (einklappbarer Baum).
// Bundle bauen via `npm run build:cm-plugins`.

module.exports = {
    name: 'Synixx: BPMN-XML-Vollansicht',
    style: 'style.css',
    script: 'client.bundle.js',
};
