// SPDX-License-Identifier: MIT
// Copyright (c) 2024-2026 SmartBPM, Michael Ricken — Synixx-Werkzeugfamilie.
// Dieses Modul ist Teil der MIT-veröffentlichten Camunda-Modeler-Plugins
// (Repo synixx-camunda-plugins); die MIT-Lizenz gilt für DIESE Datei auch
// innerhalb des Synixx-Gesamtprojekts.
// Interaktive BPMN-Notationsuebersicht.
// Toggle-Pille im Admin-Header oeffnet ein floating Pin-Panel; drinnen ein
// kategorisierter Katalog der BPMN-2.0-Elemente mit Kurzbeschreibung, externen
// Links (OMG, BPMN-Poster, Camunda-Reference) und bidirektionalem Selection-
// Sync mit dem bpmn-js-Modeler.
//
// API: attachBpmnNotation(viewer) → { isPanelOpen, openPanel, closePanel, refresh, setOnClose }

(function () {
    'use strict';

    const STYLE_ID = 'qs-notation-style';

    // --------- Katalog -----------------------------------------------------
    // Schlüssel: matchTypes (bpmn:-prefixe optional) zum Mapping zwischen
    // bpmn-js-Element-Typen und Katalog-Eintraegen.
    const LINKS = {
        omg:     'https://www.omg.org/spec/BPMN/2.0.2/About-BPMN',
        poster:  'https://bpm-conference.org/assets/docs/bpmn-poster/BPMN2_0_Poster_DE.pdf',
        camunda: 'https://camunda.com/de/bpmn/bpmn-2-0-symbol-reference/',
    };
    function camRef(slug) { return 'https://camunda.com/de/bpmn/bpmn-2-0-symbol-reference/#' + slug; }
    // Korrekte Camunda-Anchor-Namen (#events-message, #events-timer, …). Wenn kein
    // spezifischer Anker fuer die Element-Variante existiert (Start/Intermediate/End-
    // Aussenformen), zeigen wir auf den allgemeinen Events-Basics-Anker.
    const CAM_EVENTS_BASE = camRef('events-basic-concepts');
    const CAM_EVENT_TYPES = {
        message:     camRef('events-message'),
        timer:       camRef('events-timer'),
        signal:      camRef('events-signal'),
        error:       camRef('events-error'),
        cancel:      camRef('events-cancel'),
        compensation: camRef('events-compensation'),
        conditional: camRef('events-conditional'),
        escalation:  camRef('events-escalation'),
        link:        camRef('events-link'),
        multiple:    camRef('events-multiple'),
        parallel:    camRef('events-parallel'),
        terminate:   camRef('events-termination'),
    };

    const CATALOG = [
        {
            category: 'Events (Ereignisse) — Aussenform',
            color: '#dcfce7',
            items: [
                // --- None-Varianten (ohne Trigger) ---
                { types: ['StartEvent'], name: 'Start Event (None)', desc: 'Generischer Prozessstart ohne Trigger. Dünner Einzelkreis, leer innen. Wird ausgelöst, wenn der Prozess instanziert wird (z.B. durch externen Aufruf).', cam: CAM_EVENTS_BASE },
                { iconKey: 'intermediateNone', name: 'Intermediate Event (None)', desc: 'Doppelter dünner Kreis, leer. Ohne Trigger ein reiner „Zustandsmarker" im Flow — sehr selten verwendet. Mit Trigger: siehe Catch/Throw unten.', cam: CAM_EVENTS_BASE },
                { types: ['EndEvent'], name: 'End Event (None)', desc: 'Beendet einen Prozesspfad ohne weiteren Effekt. Dicker Einzelkreis, leer. Andere Pfade laufen weiter.', cam: CAM_EVENTS_BASE },
                // --- Intermediate Catch/Throw mit Beispiel-Trigger ---
                { types: ['IntermediateCatchEvent'], name: 'Intermediate Catch Event (mit Trigger)', desc: 'Wartet auf etwas (Empfang, Timer, Signal-Catch, …). Doppelter dünner Kreis, Innen-Symbol LEER (= Catch). Hier am Beispiel Message gezeigt.', cam: CAM_EVENT_TYPES.message },
                { types: ['IntermediateThrowEvent'], name: 'Intermediate Throw Event (mit Trigger)', desc: 'Löst aktiv etwas aus (Nachricht senden, Signal werfen, …). Doppelter dünner Kreis, Innen-Symbol GEFÜLLT (= Throw). Hier am Beispiel Message gezeigt.', cam: CAM_EVENT_TYPES.message },
                // --- Event-SubProcess-Start (Trigger immer erforderlich) ---
                { iconKey: 'eventSubProcStartInterrupting', name: 'Start Event (Event-SubProcess, unterbrechend)', desc: 'Auslöser eines Ereignis-SubProcess; unterbricht den Eltern-Prozess. Dünner SOLID-Einzelkreis. Trigger ZWINGEND erforderlich (None ungültig). Hier: Message als Beispiel.', cam: CAM_EVENT_TYPES.message },
                { iconKey: 'eventSubProcStartNonInterrupting', name: 'Start Event (Event-SubProcess, nicht unterbrechend)', desc: 'Läuft PARALLEL zum Eltern-Prozess. Dünner GESTRICHELTER Einzelkreis. Trigger ZWINGEND erforderlich. Hier: Timer als Beispiel (z.B. „alle 24h zusätzlich tun").', cam: CAM_EVENT_TYPES.timer },
                // --- Boundary-Event (Trigger immer erforderlich) ---
                { iconKey: 'boundaryEventInterrupting', types: ['BoundaryEvent'], name: 'Boundary Event (unterbrechend)', desc: 'An einer Aktivität angeheftet, unterbricht sie beim Eintreten. Doppelter SOLID-Kreis, immer Catch. Trigger ZWINGEND erforderlich. Hier: Message als Beispiel.', cam: CAM_EVENT_TYPES.message },
                { iconKey: 'boundaryEventNonInterrupting', name: 'Boundary Event (nicht unterbrechend)', desc: 'An einer Aktivität angeheftet, läuft PARALLEL ohne sie zu unterbrechen. Doppelter GESTRICHELTER Kreis, immer Catch. Trigger ZWINGEND erforderlich. Hier: Timer als Beispiel.', cam: CAM_EVENT_TYPES.timer },
                // --- Spezialfall ---
                { iconKey: 'endEventTerminate', name: 'Terminate End Event', desc: 'Sonderfall: vollflächig schwarzer Innen-Kreis. Bricht den GESAMTEN Prozess sofort ab — alle parallelen Pfade enden. Im Gegensatz zum None-End-Event, das nur den eigenen Pfad beendet.', cam: CAM_EVENT_TYPES.terminate },
            ],
        },
        {
            category: 'Event-Innensymbole (Trigger-Typen)',
            color: '#bbf7d0',
            items: [
                { iconKey: 'innerSym_message',     name: 'Message',     desc: 'Briefumschlag. Catch (links, leer) wartet auf Nachricht; Throw (rechts, gefüllt) sendet Nachricht. Verfügbar bei Start, Intermediate, Boundary, End.', cam: CAM_EVENT_TYPES.message },
                { iconKey: 'innerSym_timer',       name: 'Timer',       desc: 'Uhrensymbol. Nur Catch (wartet auf Zeit/Intervall/Datum). Verfügbar bei Start, Intermediate-Catch, Boundary. KEIN Throw.', cam: CAM_EVENT_TYPES.timer },
                { iconKey: 'innerSym_signal',      name: 'Signal',      desc: 'Dreieck. Broadcast: jeder kann ein Signal senden, alle Empfänger reagieren. Catch (leer) wartet, Throw (gefüllt) sendet.', cam: CAM_EVENT_TYPES.signal },
                { iconKey: 'innerSym_error',       name: 'Error',       desc: 'Blitz/Z-Form. Geschäftsfehler-Behandlung. Im End/Intermediate-Throw löst Fehler aus; im Boundary-Interrupting/SubProcess-Start fängt er ihn auf.', cam: CAM_EVENT_TYPES.error },
                { iconKey: 'innerSym_cancel',      name: 'Cancel',      desc: 'X. Nur in Transaction-SubProcess: bricht Transaktion ab. Auf Boundary (Catch) oder End (Throw).', cam: CAM_EVENT_TYPES.cancel },
                { iconKey: 'innerSym_compensation', name: 'Compensation', desc: 'Doppel-Linksdreieck. Triggert Kompensations-Aktivitäten. Catch (Boundary) markiert Comp-Handler, Throw (End/Intermediate) löst aus.', cam: CAM_EVENT_TYPES.compensation },
                { iconKey: 'innerSym_conditional', name: 'Conditional', desc: 'Tabellen-Symbol. Wartet auf Bedingung (z.B. boolescher Ausdruck wird true). Nur Catch — bei Start, Intermediate, Boundary.', cam: CAM_EVENT_TYPES.conditional },
                { iconKey: 'innerSym_escalation',  name: 'Escalation',  desc: 'Aufwärtspfeil. Eskalation an die Eltern-Ebene (im Gegensatz zu Error: nicht-fatale Meldung). Catch im Boundary/SubProcess-Start, Throw im End/Intermediate.', cam: CAM_EVENT_TYPES.escalation },
                { iconKey: 'innerSym_link',        name: 'Link',        desc: 'Pfeil-Tag. Ersetzt eine SequenceFlow-Linie (zwei Link-Events mit gleichem Namen). Throw an Quelle, Catch am Ziel — nur Intermediate.', cam: CAM_EVENT_TYPES.link },
                { iconKey: 'innerSym_multiple',    name: 'Multiple',    desc: 'Pentagon. Mehrere Trigger möglich — irgendeiner reicht aus. Catch (Start, Intermediate-Catch, Boundary), Throw (End, Intermediate-Throw — feuert alle Trigger).', cam: CAM_EVENT_TYPES.multiple },
                { iconKey: 'innerSym_parallelMultiple', name: 'Parallel Multiple', desc: 'Großes „+". Wie Multiple, aber ALLE Trigger müssen feuern, bevor das Event eintritt. Nur Catch.', cam: CAM_EVENT_TYPES.parallel },
                { iconKey: 'innerSym_terminate',   name: 'Terminate',   desc: 'Vollflächig schwarzer Innen-Kreis. Nur End-Event. Bricht den gesamten Prozess sofort ab (alle parallelen Pfade enden).', cam: CAM_EVENT_TYPES.terminate },
            ],
        },
        {
            category: 'Activities (Aktivitäten)',
            color: '#bfdbfe',
            items: [
                { types: ['Task'], name: 'Task (generisch)', symbol: '▭', desc: 'Atomare Aktivität ohne Spezialisierung. Rechteck mit abgerundeten Ecken. Wird durch Marker zu spezifischen Tasks (User, Service, ...).', cam: camRef('activities-task') },
                { types: ['UserTask'], name: 'User Task', symbol: '👤', desc: 'Manuelle Aktivität, die ein Mensch über Software (z.B. Formular) ausführt. Marker: kleiner User-Icon oben links.', cam: camRef('activities-task') },
                { types: ['ServiceTask'], name: 'Service Task', symbol: '⚙', desc: 'Automatisierte Aktivität, ausgeführt durch System/Service. Marker: Zahnradsymbol.', cam: camRef('activities-task') },
                { types: ['SendTask'], name: 'Send Task', symbol: '✉', desc: 'Sendet eine Nachricht an einen Empfänger (anderer Pool). Marker: gefüllter Briefumschlag.', cam: camRef('activities-task') },
                { types: ['ReceiveTask'], name: 'Receive Task', symbol: '📨', desc: 'Wartet auf eingehende Nachricht. Marker: leerer Briefumschlag.', cam: camRef('activities-task') },
                { types: ['ManualTask'], name: 'Manual Task', symbol: '✋', desc: 'Manuelle Tätigkeit ohne Systemunterstützung. Marker: Hand-Icon.', cam: camRef('activities-task') },
                { types: ['BusinessRuleTask'], name: 'Business Rule Task', symbol: '📋', desc: 'Wendet eine Entscheidungstabelle / Regelsatz an. Marker: tabellenartiges Icon.', cam: camRef('activities-task') },
                { types: ['ScriptTask'], name: 'Script Task', symbol: '𝓢', desc: 'Führt ein Skript in einer Engine aus. Marker: Schriftrolle.', cam: camRef('activities-task') },
                { types: ['SubProcess'], name: 'SubProcess (eingebettet)', symbol: '▭+', desc: 'Untergeordneter Prozess innerhalb des Parents. Erweiterte Darstellung zeigt interne Schritte, kollabierte Darstellung als Aktivität mit "+"-Marker.', cam: camRef('activities-subprocess') },
                { types: ['Transaction'], name: 'Transaction', symbol: '▭▭', desc: 'SubProcess mit Transaktions-Semantik (alles-oder-nichts). Doppelte Umrandung.', cam: camRef('activities-subprocess') },
                { types: ['CallActivity'], name: 'Call Activity', symbol: '▭', desc: 'Verweis auf einen wiederverwendbaren globalen Prozess oder eine Task-Definition. Dicker Rahmen; ruft sie einen Prozess auf, zeigt sie zugeklappt einen „+"-Marker (Box) unten Mitte.', cam: camRef('activities-call-activity') },
            ],
        },
        {
            category: 'Gateways (Verzweigungen)',
            color: '#fed7aa',
            items: [
                { types: ['ExclusiveGateway'], name: 'Exclusive Gateway (XOR)', symbol: '◇✕', desc: 'Datenbasierte Verzweigung: genau EIN Ausgang wird gewählt, basierend auf Bedingungen. Raute mit optionalem "X"-Marker.', cam: camRef('gateways-data-based-exclusive-gateways') },
                { types: ['InclusiveGateway'], name: 'Inclusive Gateway (OR)', symbol: '◇○', desc: 'Datenbasiert: ein ODER mehrere Ausgänge werden gewählt. Raute mit Kreis-Marker.', cam: camRef('gateways-data-based-inclusive-gateways') },
                { types: ['ParallelGateway'], name: 'Parallel Gateway (AND)', symbol: '◇+', desc: 'Alle ausgehenden Pfade werden gleichzeitig aktiviert. Beim Join: wartet auf alle eingehenden Pfade. Raute mit "+"-Marker.', cam: camRef('gateways-parallel-gateways') },
                { types: ['EventBasedGateway'], name: 'Event-Based Gateway', symbol: '◇⊙', desc: 'Verzweigung basiert auf Ereignis-Eintreten (welches Event zuerst eintritt, gewinnt). Raute mit Pentagon-Marker.', cam: camRef('gateways-event-based-gateways') },
                { types: ['ComplexGateway'], name: 'Complex Gateway', symbol: '◇*', desc: 'Komplexe Synchronisation mit eigener Aktivierungs-Logik. Selten verwendet. Raute mit "*"-Marker.', cam: LINKS.camunda },
            ],
        },
        {
            category: 'Data (Datenobjekte)',
            color: '#e5e7eb',
            items: [
                { types: ['DataObjectReference', 'DataObject'], name: 'Data Object', symbol: '🗎', desc: 'Repräsentiert Daten, die in/aus einer Aktivität fließen. Eselsohr-Symbol. Hat oft mehrere Referenzen auf dasselbe Datenobjekt.', cam: LINKS.camunda },
                { types: ['DataStoreReference'], name: 'Data Store', symbol: '🗃', desc: 'Persistenter Datenspeicher (z.B. Datenbank). Zylinder-Symbol. Lebt länger als der Prozess.', cam: LINKS.camunda },
                { types: ['DataInput'], name: 'Data Input', symbol: '⇒🗎', desc: 'Input-Daten für eine Aktivität/Prozess. Eselsohr mit nach-rechts-Pfeil.', cam: LINKS.camunda },
                { types: ['DataOutput'], name: 'Data Output', symbol: '🗎⇒', desc: 'Output-Daten einer Aktivität/Prozess. Eselsohr mit nach-links-Pfeil.', cam: LINKS.camunda },
            ],
        },
        {
            category: 'Flows (Verbindungen)',
            color: '#fde68a',
            items: [
                { types: ['SequenceFlow'], name: 'Sequence Flow', symbol: '⟶', desc: 'Steuerflusspfeil zwischen Aktivitäten/Events/Gateways INNERHALB eines Pools. Durchgehender Pfeil mit gefüllter Pfeilspitze.', cam: LINKS.camunda },
                { types: ['MessageFlow'], name: 'Message Flow', symbol: '⤳', desc: 'Nachrichtenfluss ZWISCHEN Pools (zwischen Beteiligten). Gestrichelter Pfeil mit Kreis am Anfang, offener Pfeilspitze.', cam: LINKS.camunda },
                { types: ['Association'], name: 'Association', symbol: '⋯', desc: 'Verknüpft Artefakte/DataObjects mit Flow-Elementen. Gepunktete Linie, optional mit Pfeilspitze (für Datenfluss).', cam: LINKS.camunda },
                { name: 'Default Flow', iconKey: 'defaultFlow', symbol: '⟶⟍', desc: 'Standard-Sequenz-Flow bei XOR/OR-Gateway, wenn keine Bedingung zutrifft. Schrägstrich-Markierung am Anfang.', cam: LINKS.camunda },
                { name: 'Conditional Flow', iconKey: 'conditionalFlow', symbol: '⟶◇', desc: 'Sequenz-Flow mit Bedingung (Mini-Raute am Anfang). Nur ohne Gateway sinnvoll.', cam: LINKS.camunda },
            ],
        },
        {
            category: 'Swimlanes (Verantwortlichkeiten)',
            color: '#fbcfe8',
            items: [
                { types: ['Participant'], name: 'Pool (Participant)', symbol: '▭', desc: 'Repräsentiert einen Beteiligten/Organisation. Beinhaltet einen Prozess. Kommunikation zwischen Pools nur via Message Flow.', cam: camRef('participants-pool') },
                { types: ['Lane'], name: 'Lane', symbol: '▤', desc: 'Unterteilung innerhalb eines Pools (Rolle, Abteilung, System). Sequence Flows dürfen Lanes innerhalb des Pools queren.', cam: camRef('participants-lane') },
            ],
        },
        {
            category: 'Artifacts (Anmerkungen)',
            color: '#f3f4f6',
            items: [
                { types: ['Group'], name: 'Group', symbol: '▭', desc: 'Visuelle Gruppierung zusammengehöriger Elemente. Gestrichelter Rahmen mit Strichpunkt-Linie. Hat KEINE Auswirkung auf den Flow.', cam: LINKS.camunda },
                { types: ['TextAnnotation'], name: 'Text Annotation', symbol: '[', desc: 'Freitext-Kommentar im Diagramm. Eckige Klammer + Text. Wird per Association an Elemente gehängt.', cam: LINKS.camunda },
            ],
        },
    ];

    // --------- BPMN-SVG-Icons (spezifikationsnah) -------------------------
    // 36x36 Quadrat fuer Events/Gateways, 52x30 fuer Tasks, 64x24 fuer Pool/Lane.
    // Innere Marker liegen INNERHALB der aeusseren Form (Gateway-Diamond
    // umschliesst X/+/Pentagon, Event-Kreis umschliesst Briefumschlag etc.).
    const C = '#1f2937';   // Outline-Farbe
    const DASH = '2.5 1.8'; // gestrichelte Linie (boundary non-interrupting, event-subprocess non-interrupting)

    // ---- Event-Aussenform-Helfer ----
    // Liefert den Outer-Ring-Stack (1, 2 oder thick) als SVG-Snippet. dashed = gestrichelt.
    function evtRingSingle(dashed) {
        return `<circle cx="18" cy="18" r="14" fill="#fff" stroke="${C}" stroke-width="1.2"${dashed ? ` stroke-dasharray="${DASH}"` : ''}/>`;
    }
    function evtRingDouble(dashed) {
        return evtRingSingle(dashed) +
               `<circle cx="18" cy="18" r="10.5" fill="none" stroke="${C}" stroke-width="1.2"${dashed ? ` stroke-dasharray="${DASH}"` : ''}/>`;
    }
    function evtRingThick() {
        return `<circle cx="18" cy="18" r="14" fill="#fff" stroke="${C}" stroke-width="3"/>`;
    }
    function eventIcon(outerSvg, innerSvg) {
        return `<svg viewBox="0 0 36 36" width="34" height="34" xmlns="http://www.w3.org/2000/svg">${outerSvg}${innerSvg || ''}</svg>`;
    }

    // ---- Inner-Symbol-Bibliothek (Throw = filled, Catch = empty) ----
    function innerMessage(filled) {
        const fill = filled ? C : '#fff';
        const flap = filled ? '#fff' : C;
        return `<g transform="translate(12 14)"><rect x="0" y="0" width="12" height="8" fill="${fill}" stroke="${C}" stroke-width="0.9"/><path d="M0 0 L6 5 L12 0" fill="none" stroke="${flap}" stroke-width="0.9"/></g>`;
    }
    function innerTimer() {
        return `<g stroke="${C}" fill="none" stroke-linecap="round"><circle cx="18" cy="18" r="6.5" stroke-width="0.9"/><line x1="18" y1="12.5" x2="18" y2="14" stroke-width="0.8"/><line x1="23.5" y1="18" x2="22" y2="18" stroke-width="0.8"/><line x1="18" y1="23.5" x2="18" y2="22" stroke-width="0.8"/><line x1="12.5" y1="18" x2="14" y2="18" stroke-width="0.8"/><line x1="18" y1="18" x2="18" y2="14.5" stroke-width="1.1"/><line x1="18" y1="18" x2="21" y2="19.5" stroke-width="1.1"/></g>`;
    }
    function innerSignal(filled) {
        const fill = filled ? C : '#fff';
        return `<polygon points="18,10 26,24 10,24" fill="${fill}" stroke="${C}" stroke-width="1"/>`;
    }
    function innerError(filled) {
        // Blitz: Z-Form. Throw = halb gefuellt (BPMN-Konvention), Catch = leer.
        const fill = filled ? C : '#fff';
        return `<path d="M13 10 L20 17 L16 18 L22 26 L15 19 L19 18 Z" fill="${fill}" stroke="${C}" stroke-width="1" stroke-linejoin="round"/>`;
    }
    function innerCancel() {
        return `<g stroke="${C}" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="12" x2="24" y2="24"/><line x1="24" y1="12" x2="12" y2="24"/></g>`;
    }
    function innerCompensation(filled) {
        const fill = filled ? C : '#fff';
        return `<g><polygon points="18,12 12,18 18,24" fill="${fill}" stroke="${C}" stroke-width="0.9"/><polygon points="25,12 19,18 25,24" fill="${fill}" stroke="${C}" stroke-width="0.9"/></g>`;
    }
    function innerConditional() {
        return `<g transform="translate(11 10)" stroke="${C}" stroke-width="0.8" fill="#fff"><rect x="0" y="0" width="14" height="16"/><line x1="2" y1="4" x2="12" y2="4" stroke-width="0.7"/><line x1="2" y1="7.5" x2="12" y2="7.5" stroke-width="0.7"/><line x1="2" y1="11" x2="12" y2="11" stroke-width="0.7"/><line x1="2" y1="14" x2="12" y2="14" stroke-width="0.7"/></g>`;
    }
    function innerEscalation(filled) {
        const fill = filled ? C : '#fff';
        return `<polygon points="18,10 24,24 18,19 12,24" fill="${fill}" stroke="${C}" stroke-width="1" stroke-linejoin="round"/>`;
    }
    function innerLink(filled) {
        const fill = filled ? C : '#fff';
        return `<polygon points="10,15 21,15 21,12 27,18 21,24 21,21 10,21" fill="${fill}" stroke="${C}" stroke-width="1" stroke-linejoin="round"/>`;
    }
    function innerMultiple(filled) {
        const fill = filled ? C : '#fff';
        return `<polygon points="18,10 26,16 23,25 13,25 10,16" fill="${fill}" stroke="${C}" stroke-width="1" stroke-linejoin="round"/>`;
    }
    function innerParallelMultiple() {
        return `<g stroke="${C}" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="10" x2="18" y2="26"/><line x1="10" y1="18" x2="26" y2="18"/></g>`;
    }
    function innerTerminate() {
        return `<circle cx="18" cy="18" r="6.5" fill="${C}"/>`;
    }

    // ---- Helfer fuer Throw/Catch-Paare in einer Symbol-Zelle ----
    // Liefert zwei kleine Event-Icons in einer flex-row; jedes ist ein Standard-
    // Intermediate-Ring (Doppelkreis) mit dem entsprechenden Innen-Symbol.
    function pairCatchThrow(innerFnLeftCatch, innerFnRightThrow) {
        const left  = eventIcon(evtRingDouble(false), innerFnLeftCatch);
        const right = eventIcon(evtRingDouble(false), innerFnRightThrow);
        return `<div class="qs-notation-pair">${left}${right}</div>`;
    }
    // Einzelnes Icon (z.B. Timer, Conditional, Cancel, Terminate — die nur einen Typ kennen)
    function singleInDouble(innerFn) {
        return eventIcon(evtRingDouble(false), innerFn);
    }
    function svgGateway(innerMarker) {
        return `<svg viewBox="0 0 36 36" width="34" height="34" xmlns="http://www.w3.org/2000/svg">` +
            `<polygon points="18,2 34,18 18,34 2,18" fill="#fff" stroke="${C}" stroke-width="1.5"/>` +
            (innerMarker || '') +
            `</svg>`;
    }
    function svgTask(strokeWidth, innerMarker, extraOuterRect) {
        return `<svg viewBox="0 0 52 30" width="50" height="30" xmlns="http://www.w3.org/2000/svg">` +
            (extraOuterRect || '') +
            `<rect x="2" y="2" width="48" height="26" rx="5" ry="5" fill="#fff" stroke="${C}" stroke-width="${strokeWidth}"/>` +
            (innerMarker || '') +
            `</svg>`;
    }

    // Konkrete Icons
    const BPMN_ICONS = {
        // --- Events: Outer-Form. None-Varianten leer (kein Trigger). Boundary
        //     und Event-SubProcess-Start: spec-bedingt MUSS ein Trigger drin sein,
        //     daher Beispiel-Inner als Hinweis (Message bzw. Timer).
        startEvent:                       eventIcon(evtRingSingle(false)),                       // None Start
        intermediateNone:                 eventIcon(evtRingDouble(false)),                       // None Intermediate
        intermediateCatchEvent:           eventIcon(evtRingDouble(false), innerMessage(false)),  // Catch mit Message-Beispiel
        intermediateThrowEvent:           eventIcon(evtRingDouble(false), innerMessage(true)),   // Throw mit Message-Beispiel
        eventSubProcStartInterrupting:    eventIcon(evtRingSingle(false), innerMessage(false)),  // Trigger erforderlich
        eventSubProcStartNonInterrupting: eventIcon(evtRingSingle(true),  innerTimer()),         // dashed + Trigger erforderlich
        boundaryEventInterrupting:        eventIcon(evtRingDouble(false), innerMessage(false)),  // Trigger erforderlich
        boundaryEventNonInterrupting:     eventIcon(evtRingDouble(true),  innerTimer()),         // dashed + Trigger erforderlich
        endEvent:                         eventIcon(evtRingThick()),                             // None End
        endEventTerminate:                eventIcon(evtRingThick(),       innerTerminate()),     // Terminate-Sonderfall
        // Aliases fuer Default-Lookup ueber types[0]
        boundaryEvent:                    eventIcon(evtRingDouble(false), innerMessage(false)),

        // --- Inner Event Symbols (Throw/Catch-Paare im Doppelkreis als Demo-Form) ---
        innerSym_message:     pairCatchThrow(innerMessage(false), innerMessage(true)),
        innerSym_timer:       singleInDouble(innerTimer),
        innerSym_signal:      pairCatchThrow(innerSignal(false), innerSignal(true)),
        innerSym_error:       pairCatchThrow(innerError(false), innerError(true)),
        innerSym_cancel:      singleInDouble(innerCancel),
        innerSym_compensation: pairCatchThrow(innerCompensation(false), innerCompensation(true)),
        innerSym_conditional: singleInDouble(innerConditional),
        innerSym_escalation:  pairCatchThrow(innerEscalation(false), innerEscalation(true)),
        innerSym_link:        pairCatchThrow(innerLink(false), innerLink(true)),
        innerSym_multiple:    pairCatchThrow(innerMultiple(false), innerMultiple(true)),
        innerSym_parallelMultiple: singleInDouble(innerParallelMultiple),
        // Terminate gibt es spec-bedingt NUR als End-Event → dicker Ring + gefuellt.
        innerSym_terminate:   eventIcon(evtRingThick(), innerTerminate()),
        // --- Gateways (Innen-Marker innerhalb der Raute) ---
        exclusiveGateway: svgGateway(`<path d="M12 12 L24 24 M24 12 L12 24" stroke="${C}" stroke-width="2.5" stroke-linecap="round"/>`),
        inclusiveGateway: svgGateway(`<circle cx="18" cy="18" r="6.5" fill="none" stroke="${C}" stroke-width="2.5"/>`),
        parallelGateway:  svgGateway(`<path d="M18 8 V28 M8 18 H28" stroke="${C}" stroke-width="2.5" stroke-linecap="round"/>`),
        eventBasedGateway: svgGateway(`<circle cx="18" cy="18" r="8.5" fill="none" stroke="${C}" stroke-width="1.2"/><polygon points="18,11 24,15.5 21.7,23 14.3,23 12,15.5" fill="none" stroke="${C}" stroke-width="1.3"/>`),
        complexGateway:   svgGateway(`<path d="M18 8 V28 M8 18 H28 M11 11 L25 25 M25 11 L11 25" stroke="${C}" stroke-width="1.6" stroke-linecap="round"/>`),
        // --- Activities ---
        task:             svgTask('1.5'),
        userTask:         svgTask('1.5', `<circle cx="9" cy="8" r="2.3" fill="none" stroke="${C}" stroke-width="1"/><path d="M5 14 Q9 11 13 14" fill="none" stroke="${C}" stroke-width="1"/>`),
        serviceTask:      svgTask('1.5', `<g transform="translate(5 5)" stroke="${C}" stroke-width="0.8" fill="none"><circle cx="5" cy="5" r="2.6"/><circle cx="5" cy="5" r="1" fill="${C}" stroke="none"/><path d="M5 1 V2.5 M5 7.5 V9 M1 5 H2.5 M7.5 5 H9 M2.2 2.2 L3.2 3.2 M6.8 6.8 L7.8 7.8 M7.8 2.2 L6.8 3.2 M3.2 6.8 L2.2 7.8"/></g>`),
        sendTask:         svgTask('1.5', `<g transform="translate(4 4)"><rect x="0" y="0" width="11" height="7" fill="${C}"/><path d="M0 0 L5.5 4 L11 0" stroke="#fff" stroke-width="0.8" fill="none"/></g>`),
        receiveTask:      svgTask('1.5', `<g transform="translate(4 4)"><rect x="0" y="0" width="11" height="7" fill="#fff" stroke="${C}" stroke-width="1"/><path d="M0 0 L5.5 4 L11 0" stroke="${C}" stroke-width="0.8" fill="none"/></g>`),
        manualTask:       svgTask('1.5', `<path d="M5 9 L8 9 Q9.5 9 9.5 7.5 L9.5 6.5 Q9.5 5.5 10.5 5.5 L11.5 5.5 Q12.5 5.5 12.5 6.5 L12.5 10 Q12.5 11 11.5 11 L5 11 Q4 11 4 10 Q4 9 5 9 Z" fill="none" stroke="${C}" stroke-width="0.8"/>`),
        businessRuleTask: svgTask('1.5', `<g transform="translate(4 4)" stroke="${C}" stroke-width="0.7" fill="none"><rect x="0" y="0" width="13" height="9"/><line x1="0" y1="3" x2="13" y2="3"/><line x1="0" y1="6" x2="13" y2="6"/><line x1="4" y1="0" x2="4" y2="9"/></g>`),
        scriptTask:       svgTask('1.5', `<g transform="translate(4 4)" stroke="${C}" stroke-width="0.8" fill="none"><path d="M0 1 Q3 -1 6 1 Q9 3 12 1 L12 8 Q9 10 6 8 Q3 6 0 8 Z"/><line x1="2" y1="3" x2="8" y2="3"/><line x1="2" y1="5" x2="8" y2="5"/></g>`),
        subProcess:       svgTask('1.5', `<g transform="translate(22 20)" stroke="${C}" stroke-width="1" fill="none"><rect x="0" y="0" width="8" height="6"/><path d="M4 1 V5 M1 3 H7"/></g>`),
        transaction:      svgTask('1.5', null, `<rect x="0.5" y="0.5" width="51" height="29" rx="7" ry="7" fill="none" stroke="${C}" stroke-width="0.8"/>`),
        // Call Activity: dicker Rahmen + zugeklappt-Marker (Box mit „+") unten Mitte —
        // wie bpmn.io eine Call Activity darstellt, die einen wiederverwendbaren
        // Prozess aufruft (collapsed). Marker zentriert am unteren Rand (viewBox 52×30).
        callActivity:     svgTask('3', `<g transform="translate(22 20)" stroke="${C}" stroke-width="1" fill="none"><rect x="0" y="0" width="8" height="6"/><path d="M4 1 V5 M1 3 H7"/></g>`),
        // --- Data ---
        dataObjectReference: `<svg viewBox="0 0 28 36" width="22" height="30" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 L20 2 L26 8 L26 34 L2 34 Z" fill="#fff" stroke="${C}" stroke-width="1.5"/><path d="M20 2 L20 8 L26 8" fill="none" stroke="${C}" stroke-width="1.2"/></svg>`,
        dataStoreReference:  `<svg viewBox="0 0 36 30" width="32" height="28" xmlns="http://www.w3.org/2000/svg"><path d="M4 4 L4 26 A14 3 0 0 0 32 26 L32 4" fill="#fff" stroke="${C}" stroke-width="1.2"/><ellipse cx="18" cy="4" rx="14" ry="3" fill="#fff" stroke="${C}" stroke-width="1.2"/><ellipse cx="18" cy="9" rx="14" ry="3" fill="none" stroke="${C}" stroke-width="0.8"/></svg>`,
        dataInput:           `<svg viewBox="0 0 28 36" width="22" height="30" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 L20 2 L26 8 L26 34 L2 34 Z" fill="#fff" stroke="${C}" stroke-width="1.5"/><path d="M20 2 L20 8 L26 8" fill="none" stroke="${C}" stroke-width="1.2"/><path d="M7 12 L7 16 L14 16 L14 14 L18 17 L14 20 L14 18 L5 18 L5 12 Z" fill="none" stroke="${C}" stroke-width="0.9"/></svg>`,
        dataOutput:          `<svg viewBox="0 0 28 36" width="22" height="30" xmlns="http://www.w3.org/2000/svg"><path d="M2 2 L20 2 L26 8 L26 34 L2 34 Z" fill="#fff" stroke="${C}" stroke-width="1.5"/><path d="M20 2 L20 8 L26 8" fill="none" stroke="${C}" stroke-width="1.2"/><path d="M7 12 L7 16 L14 16 L14 14 L18 17 L14 20 L14 18 L5 18 L5 12 Z" fill="${C}" stroke="${C}" stroke-width="0.9"/></svg>`,
        // --- Swimlanes ---
        participant: `<svg viewBox="0 0 64 24" width="62" height="24" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="62" height="22" fill="#fff" stroke="${C}" stroke-width="1.5"/><rect x="1" y="1" width="14" height="22" fill="#f3f4f6" stroke="${C}" stroke-width="1.5"/></svg>`,
        lane:        `<svg viewBox="0 0 64 18" width="62" height="18" xmlns="http://www.w3.org/2000/svg"><rect x="1" y="1" width="62" height="16" fill="#fff" stroke="${C}" stroke-width="1"/><rect x="1" y="1" width="12" height="16" fill="#f3f4f6" stroke="${C}" stroke-width="1"/></svg>`,
        // --- Artifacts ---
        group:       `<svg viewBox="0 0 52 30" width="50" height="30" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="2" width="48" height="26" rx="3" ry="3" fill="none" stroke="${C}" stroke-width="1.5" stroke-dasharray="5 3 1 3"/></svg>`,
        textAnnotation: `<svg viewBox="0 0 40 28" width="36" height="26" xmlns="http://www.w3.org/2000/svg"><path d="M8 2 L2 2 L2 26 L8 26" fill="none" stroke="${C}" stroke-width="1.5"/><line x1="12" y1="9" x2="38" y2="9" stroke="${C}" stroke-width="0.8"/><line x1="12" y1="15" x2="38" y2="15" stroke="${C}" stroke-width="0.8"/><line x1="12" y1="21" x2="32" y2="21" stroke="${C}" stroke-width="0.8"/></svg>`,
        // --- Flows ---
        sequenceFlow: `<svg viewBox="0 0 52 14" width="50" height="14" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="7" x2="42" y2="7" stroke="${C}" stroke-width="1.5"/><polygon points="42,2 42,12 50,7" fill="${C}"/></svg>`,
        messageFlow:  `<svg viewBox="0 0 52 14" width="50" height="14" xmlns="http://www.w3.org/2000/svg"><circle cx="3" cy="7" r="2" fill="#fff" stroke="${C}" stroke-width="1"/><line x1="5" y1="7" x2="42" y2="7" stroke="${C}" stroke-width="1" stroke-dasharray="4 2"/><polygon points="42,3 42,11 50,7" fill="#fff" stroke="${C}" stroke-width="1"/></svg>`,
        association:  `<svg viewBox="0 0 52 14" width="50" height="14" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="7" x2="50" y2="7" stroke="${C}" stroke-width="1" stroke-dasharray="1 3"/></svg>`,
        defaultFlow:  `<svg viewBox="0 0 52 14" width="50" height="14" xmlns="http://www.w3.org/2000/svg"><line x1="2" y1="7" x2="42" y2="7" stroke="${C}" stroke-width="1.5"/><polygon points="42,2 42,12 50,7" fill="${C}"/><line x1="6" y1="3" x2="11" y2="11" stroke="${C}" stroke-width="1.2"/></svg>`,
        conditionalFlow: `<svg viewBox="0 0 60 14" width="58" height="14" xmlns="http://www.w3.org/2000/svg"><polygon points="2,7 8,3 14,7 8,11" fill="#fff" stroke="${C}" stroke-width="1"/><line x1="14" y1="7" x2="50" y2="7" stroke="${C}" stroke-width="1.5"/><polygon points="50,2 50,12 58,7" fill="${C}"/></svg>`,
    };

    function getIcon(item) {
        if (!item) return '';
        if (item.iconKey && BPMN_ICONS[item.iconKey]) return BPMN_ICONS[item.iconKey];
        if (item.types && item.types[0]) {
            const k = item.types[0].replace(/^bpmn:/i, '');
            if (BPMN_ICONS[k]) return BPMN_ICONS[k];
            const k2 = k.charAt(0).toLowerCase() + k.slice(1);
            if (BPMN_ICONS[k2]) return BPMN_ICONS[k2];
        }
        return '';
    }

    // type-suffix → catalog-item Lookup
    const TYPE_TO_ITEM = (() => {
        const m = {};
        for (const cat of CATALOG) {
            for (const it of cat.items) {
                if (!it.types) continue;
                for (const t of it.types) m[t.toLowerCase()] = it;
            }
        }
        return m;
    })();
    function findItemForBpmnType(bpmnType) {
        if (!bpmnType) return null;
        const t = String(bpmnType).replace(/^bpmn:/i, '').toLowerCase();
        if (TYPE_TO_ITEM[t]) return TYPE_TO_ITEM[t];
        for (const k of Object.keys(TYPE_TO_ITEM)) {
            if (t.indexOf(k) !== -1 || k.indexOf(t) !== -1) return TYPE_TO_ITEM[k];
        }
        return null;
    }
    function findItemByIconKey(key) {
        for (const cat of CATALOG) {
            for (const it of cat.items) {
                if (it.iconKey === key) return it;
            }
        }
        return null;
    }
    function itemKeyOf(it) {
        if (!it) return null;
        return it.iconKey || (it.types && it.types[0]) || null;
    }

    // Smart-Lookup: bekommt das bpmn-js-Element selber, prueft eventDefinitions
    // → leeres Zwischenereignis (kein eventDefinition) → None-Eintrag statt
    // des Throw-Eintrags mit gefuelltem Briefumschlag. Aehnlich fuer Start/End.
    function findItemForBpmnElement(element) {
        if (!element || !element.type) return null;
        const t = String(element.type).replace(/^bpmn:/i, '').toLowerCase();
        const bo = element.businessObject || {};

        // SequenceFlow: bpmn-js typisiert alle drei (normal/conditional/default)
        // als bpmn:SequenceFlow. Differenzierung anhand der Properties:
        //   - Default:     source-Element hat `default`-Referenz auf diesen Flow
        //   - Conditional: bo.conditionExpression vorhanden
        //   - sonst:       normaler Sequence Flow
        if (t === 'sequenceflow') {
            const src = element.source;
            const srcBo = src && src.businessObject;
            if (srcBo && srcBo.default && srcBo.default.id === bo.id) {
                return findItemByIconKey('defaultFlow');
            }
            if (bo.conditionExpression) {
                return findItemByIconKey('conditionalFlow');
            }
            return findItemForBpmnType(element.type);
        }

        const eventDefs = Array.isArray(bo.eventDefinitions) ? bo.eventDefinitions : [];
        // Event ohne eventDefinitions → None-Variante
        if (eventDefs.length === 0) {
            if (t === 'intermediatecatchevent' || t === 'intermediatethrowevent') {
                return findItemByIconKey('intermediateNone');
            }
            // Start/End ohne Trigger → generischer Typ-Eintrag (Start Event None / End Event None).
        }
        // Event MIT Trigger (Message-Start, Timer-Start, Error-End, …): auf das
        // passende Trigger-Symbol der Referenz zeigen. Vorher fiel z.B. ein
        // Message-Start-Event auf „Start Event (None)" (ohne Symbol) durch —
        // irreführend, weil der weiße Briefumschlag ein Trigger IST.
        if (eventDefs.length > 0) {
            const def0 = eventDefs[0];
            const defType = String(def0 && def0.$type || '').replace(/^bpmn:/i, '').toLowerCase();
            // Spezialfall TerminateEventDefinition: eigener End-Event-Eintrag (Vollkreis).
            if (defType === 'terminateeventdefinition' && t === 'endevent') {
                return findItemByIconKey('endEventTerminate');
            }
            // Mehrere eventDefinitions → Multiple (Pentagon).
            if (eventDefs.length > 1) {
                const multi = findItemByIconKey('innerSym_multiple');
                if (multi) return multi;
            }
            // eventDefinition-$type → innerSym_<trigger>. Deckt Start/End/Intermediate/
            // Boundary gleichermaßen ab (die Referenz beschreibt den Trigger, nicht die
            // Grundform); die Grundform-Einträge (Start/End None, Boundary) bleiben für
            // triggerlose Events.
            const EVDEF_TO_INNER = {
                messageeventdefinition: 'innerSym_message',
                timereventdefinition: 'innerSym_timer',
                signaleventdefinition: 'innerSym_signal',
                erroreventdefinition: 'innerSym_error',
                escalationeventdefinition: 'innerSym_escalation',
                conditionaleventdefinition: 'innerSym_conditional',
                linkeventdefinition: 'innerSym_link',
                compensateeventdefinition: 'innerSym_compensation',
                canceleventdefinition: 'innerSym_cancel',
                terminateeventdefinition: 'innerSym_terminate',
            };
            const innerKey = EVDEF_TO_INNER[defType];
            if (innerKey) {
                const it = findItemByIconKey(innerKey);
                if (it) return it;
            }
        }
        return findItemForBpmnType(element.type);
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function ensureStyle() {
        if (document.getElementById(STYLE_ID)) return;
        const s = document.createElement('style');
        s.id = STYLE_ID;
        s.textContent = `
            .qs-notation-panel { width: 720px; height: 600px; }
            .qs-notation-panel.qs-fullscreen {
                width: 95vw !important; height: 95vh !important;
                left: 2.5vw !important; top: 2.5vh !important;
            }
            .qs-notation-body {
                height: 100%; overflow: auto;
                background: var(--qs-panel,#1a1d22);
                color: var(--qs-text,#e6e8eb);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
                font-size: 12px;
                line-height: 1.5;
            }
            .qs-notation-toplinks {
                padding: 10px 12px;
                background: var(--qs-panel-3,#0f172a);
                border-bottom: 1px solid var(--qs-border-soft,#1e293b);
                display: flex; gap: 12px; flex-wrap: wrap;
                font-size: 11px;
            }
            .qs-notation-toplinks a { color: var(--qs-blue-soft,#60a5fa); text-decoration: none; }
            .qs-notation-toplinks a:hover { text-decoration: underline; }
            .qs-notation-cat {
                margin: 12px 8px;
                border-radius: 6px;
                background: var(--qs-panel-3,#111418);
            }
            .qs-notation-cat-head {
                padding: 8px 12px;
                font-weight: 700;
                color: var(--qs-amber,#fbbf24);
                border-bottom: 1px solid var(--qs-border-soft,#1f2937);
                display: flex; align-items: center; gap: 8px;
            }
            .qs-notation-cat-swatch {
                display: inline-block; width: 14px; height: 14px; border-radius: 3px;
                border: 1px solid rgba(255,255,255,0.2);
            }
            .qs-notation-item {
                padding: 8px 12px;
                border-bottom: 1px solid var(--qs-border-soft,#1f2937);
                display: grid;
                grid-template-columns: 90px 1fr auto;
                gap: 10px;
                align-items: center;
            }
            /* Inner-Symbol-Paar: zwei kleine Event-Icons Catch+Throw nebeneinander */
            .qs-notation-pair {
                display: flex; gap: 4px;
                align-items: center; justify-content: center;
            }
            .qs-notation-item:last-child { border-bottom: none; }
            .qs-notation-item:hover { background: rgba(96,165,250,0.05); }
            .qs-notation-symbol {
                font-size: 20px;
                line-height: 1;
                color: var(--qs-amber,#fbbf24);
                text-align: center;
                user-select: none;
                display: flex; align-items: center; justify-content: center;
                min-height: 36px;
                /* SVG-Icons haben weisse Innenflaeche — wir setzen einen sehr
                   dezenten Hintergrund, damit sie nicht im dunklen Body schweben.
                   Ausgewaehlte Eintraege ueberschreiben das. */
                background: #f8fafc;
                border-radius: 4px;
                padding: 4px;
            }
            .qs-notation-symbol svg { display: block; }
            .qs-notation-info > .name {
                color: var(--qs-blue-soft,#93c5fd);
                font-weight: 600;
                margin-bottom: 2px;
            }
            .qs-notation-info > .desc {
                color: var(--qs-text-dim,#cbd5e1);
                font-size: 11.5px;
            }
            .qs-notation-links {
                display: flex; gap: 6px; align-items: center;
                font-size: 10.5px;
            }
            .qs-notation-links a {
                color: var(--qs-text-mute,#94a3b8);
                text-decoration: none;
                padding: 2px 6px;
                border: 1px solid var(--qs-border,#334155);
                border-radius: 4px;
                white-space: nowrap;
            }
            .qs-notation-links a:hover { color: var(--qs-text,#fff); border-color: var(--qs-blue-soft,#60a5fa); }
            /* Aktiv-Markierung (Selection-Sync wie XML-Vollansicht) */
            .qs-notation-item.qs-selected {
                background: var(--qs-xml-sel,rgba(30, 58, 138, 0.30)) !important;
                box-shadow: inset 3px 0 0 #3b82f6;
            }
        `;
        document.head.appendChild(s);
    }

    function renderCatalog() {
        const out = [];
        out.push('<div class="qs-notation-toplinks">');
        out.push('<strong style="color:var(--qs-text-dim,#cbd5e1);">📖 Mehr Info:</strong>');
        out.push(`<a href="${esc(LINKS.omg)}" target="_blank" rel="noopener">OMG BPMN-Spec</a>`);
        out.push(`<a href="${esc(LINKS.poster)}" target="_blank" rel="noopener">BPMN-Poster (DE)</a>`);
        out.push(`<a href="${esc(LINKS.camunda)}" target="_blank" rel="noopener">Camunda Symbol Reference</a>`);
        out.push('</div>');
        for (const cat of CATALOG) {
            out.push(`<div class="qs-notation-cat">`);
            out.push(`<div class="qs-notation-cat-head"><span class="qs-notation-cat-swatch" style="background:${esc(cat.color)};"></span>${esc(cat.category)}</div>`);
            for (const it of cat.items) {
                const dataType = (it.types && it.types[0]) ? ` data-bpmn-type="${esc(it.types[0])}"` : '';
                const itemKey = it.iconKey || (it.types && it.types[0]) || ('item-' + (it.name || '').replace(/\s+/g, '-').toLowerCase());
                const dataKey = ` data-item-key="${esc(itemKey)}"`;
                out.push(`<div class="qs-notation-item"${dataKey}${dataType}>`);
                const iconHtml = getIcon(it);
                out.push(`<div class="qs-notation-symbol">${iconHtml || esc(it.symbol || '·')}</div>`);
                out.push('<div class="qs-notation-info">');
                out.push(`<div class="name">${esc(it.name)}</div>`);
                out.push(`<div class="desc">${esc(it.desc)}</div>`);
                out.push('</div>');
                out.push('<div class="qs-notation-links">');
                if (it.cam) out.push(`<a href="${esc(it.cam)}" target="_blank" rel="noopener" title="Camunda BPMN Symbol Reference">Cam</a>`);
                out.push('</div>');
                out.push('</div>');
            }
            out.push('</div>');
        }
        return out.join('');
    }

    function attachBpmnNotation(viewer) {
        if (!viewer) return null;
        if (viewer.__qsBpmnNotation) return viewer.__qsBpmnNotation;
        ensureStyle();
        try { if (window.qsCommentMedia && window.qsCommentMedia.ensureStyles) window.qsCommentMedia.ensureStyles(); } catch (e) {}

        let panel = null;
        let onCloseCb = null;
        let onStateChangeCb = null;
        let stateChangeTimer = null;
        let suppressStateEcho = false;
        let selectionListenerInstalled = false;
        let lastSelectedItem = null;
        function notifyStateChange() {
            if (suppressStateEcho || !onStateChangeCb) return;
            clearTimeout(stateChangeTimer);
            stateChangeTimer = setTimeout(() => { try { onStateChangeCb(getState()); } catch (e) {} }, 200);
        }
        function getState() {
            return {
                fullscreen: !!(panel && panel.classList.contains('qs-fullscreen')),
            };
        }
        function setState(s, opts) {
            if (!s || !panel) return;
            const silent = opts && opts.silent;
            if (silent) suppressStateEcho = true;
            try {
                if (typeof s.fullscreen === 'boolean') panel.classList.toggle('qs-fullscreen', s.fullscreen);
            } finally {
                if (silent) suppressStateEcho = false;
            }
        }

        function clearItemHighlight() {
            if (lastSelectedItem) {
                lastSelectedItem.classList.remove('qs-selected');
                lastSelectedItem = null;
            }
        }
        function highlightByItem(item, scroll) {
            if (!panel) return;
            const body = panel.querySelector('.qs-notation-body');
            if (!body) return;
            clearItemHighlight();
            const key = itemKeyOf(item);
            if (!key) return;
            const sel = '[data-item-key="' + (window.CSS && CSS.escape ? CSS.escape(key) : key) + '"]';
            const el = body.querySelector(sel);
            if (!el) return;
            el.classList.add('qs-selected');
            lastSelectedItem = el;
            if (scroll) {
                try { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); }
                catch (e) { try { el.scrollIntoView(); } catch (_e) {} }
            }
        }

        function installSelectionListener() {
            if (selectionListenerInstalled) return;
            try {
                const eb = viewer.get('eventBus', false);
                if (!eb) return;
                eb.on('selection.changed', (event) => {
                    if (!panel) return;
                    const sel = (event && event.newSelection) || [];
                    if (sel.length === 0) { clearItemHighlight(); return; }
                    const item = findItemForBpmnElement(sel[0]);
                    if (item) highlightByItem(item, true);
                });
                selectionListenerInstalled = true;
            } catch (e) {}
        }

        function buildPanel() {
            const div = document.createElement('div');
            div.className = 'qs-cm-popup qs-cm-popup-pinned qs-notation-panel';
            div.innerHTML =
                `<div class="qs-cm-popup-header">` +
                  `<span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#93c5fd;"><span data-icon="book-open"></span>BPMN-Notation</span>` +
                  `<div class="qs-cm-popup-actions">` +
                    `<button class="qs-cm-popup-btn" data-act="fullscreen" title="Vollbild ein/aus">⛶</button>` +
                    `<button class="qs-cm-popup-btn" data-act="close" title="Schließen">✕</button>` +
                  `</div>` +
                `</div>` +
                `<div class="qs-cm-popup-body-wrap">` +
                  `<div class="qs-notation-body">${renderCatalog()}</div>` +
                `</div>`;
            document.body.appendChild(div);
            // Links-unten positionieren, damit das Analyse-Hover-Dropdown im Header
            // (rechts oben) nicht ueberdeckt wird.
            div.style.left = '40px';
            div.style.top  = '320px';
            try { window.qsCommentMedia && window.qsCommentMedia.bringToFront && window.qsCommentMedia.bringToFront(div); } catch (e) {}
            div.addEventListener('mousedown', () => {
                try { window.qsCommentMedia && window.qsCommentMedia.bringToFront && window.qsCommentMedia.bringToFront(div); } catch (e) {}
            }, true);

            // Drag
            const header = div.querySelector('.qs-cm-popup-header');
            let dragOff = null;
            header.addEventListener('mousedown', (e) => {
                if (e.target.closest('button')) return;
                const r = div.getBoundingClientRect();
                dragOff = { x: e.clientX - r.left, y: e.clientY - r.top };
                div.style.left = r.left + 'px'; div.style.top = r.top + 'px';
                e.preventDefault();
            });
            function onMove(e) {
                if (!dragOff) return;
                div.style.left = (e.clientX - dragOff.x) + 'px';
                div.style.top  = (e.clientY - dragOff.y) + 'px';
            }
            function onUp() { dragOff = null; }
            document.addEventListener('mousemove', onMove);
            document.addEventListener('mouseup', onUp);
            div.querySelector('[data-act="fullscreen"]').addEventListener('click', (e) => { e.stopPropagation(); div.classList.toggle('qs-fullscreen'); notifyStateChange(); });
            div.querySelector('[data-act="close"]').addEventListener('click', closePanel);
            div.tabIndex = -1;
            div.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });

            function destroy() {
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
                div.remove();
                panel = null;
            }
            div.__qsDestroy = destroy;
            return div;
        }

        function openPanel() {
            if (panel) { try { window.qsCommentMedia && window.qsCommentMedia.bringToFront && window.qsCommentMedia.bringToFront(panel); } catch (e) {} return; }
            panel = buildPanel();
            installSelectionListener();
            // Falls beim Oeffnen schon was selektiert ist: gleich highlighten.
            try {
                const sel = viewer.get('selection', false);
                if (sel) {
                    const cur = sel.get();
                    if (cur && cur.length) {
                        const item = findItemForBpmnElement(cur[0]);
                        if (item) highlightByItem(item, true);
                    }
                }
            } catch (e) {}
        }
        function closePanel() {
            if (panel && panel.__qsDestroy) panel.__qsDestroy();
            panel = null;
            try { if (typeof onCloseCb === 'function') onCloseCb(); } catch (e) {}
        }
        function refresh() { /* katalog ist statisch */ }
        function isPanelOpen() { return !!panel; }
        function setOnClose(fn) { onCloseCb = (typeof fn === 'function') ? fn : null; }

        function setOnStateChange(cb) { onStateChangeCb = (typeof cb === 'function') ? cb : null; }
        const api = { openPanel, closePanel, refresh, isPanelOpen, setOnClose, getState, setState, setOnStateChange };
        viewer.__qsBpmnNotation = api;
        return api;
    }

    window.attachBpmnNotation = attachBpmnNotation;
})();
