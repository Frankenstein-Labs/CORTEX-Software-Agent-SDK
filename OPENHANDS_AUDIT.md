# Audit OpenHands et stratégie d’adaptation

## Conclusion

OpenHands doit être intégré comme **moteur d’exécution**, jamais comme propriétaire du Cortex Orchestrator. Le SDK est la cible d’intégration principale. L’application, le CLI et les extensions fournissent des contrats, des exemples et des composants périphériques utiles, mais leur interface utilisateur, leur état applicatif et leurs conventions internes doivent rester hors du Cortex Core.

## Observations par dépôt

| Dépôt | Observations vérifiées | Utilisation recommandée |
|---|---|---|
| `software-agent-sdk` | Monorepo comprenant `openhands-sdk`, `openhands-tools`, `openhands-workspace`, `openhands-agent-server`, `clients/typescript`, `examples` et `tests`. Le dépôt expose les concepts agent, conversation, événements, outils, workspace et serveur. | Dépendance encapsulée dans `packages/engine-adapters/openhands`. |
| `OpenHands` | Application TypeScript/React avec `src/api`, composants, routes, services, tests, outils, Agent Canvas, WebSocket et intégration de runtime. Le README renvoie explicitement au SDK comme source des agents, outils, conversations, workspaces, événements et API serveur. | Ne reprendre que les contrats nécessaires et les mécanismes d’intégration documentés. Ne pas importer l’UI complète. |
| `OpenHands-CLI` | CLI/TUI structuré autour de conversations, stores, cloud, MCP, ACP et contrôleurs. Le modèle `ConversationManager` sépare état réactif, routage de messages et runners ; les trajectoires permettent des tests déterministes. | Source pour une façade CLI Cortex et pour les stratégies de test de sessions. |
| `extensions` | Répertoires `skills`, `plugins`, `marketplaces`, `automations` et `integrations`. La migration documente le passage d’un catalogue MCP expérimental vers un catalogue d’intégrations. | Source pour un registre d’extensions versionné et soumis aux politiques Cortex. |

## Frontière d’adaptation proposée

```text
Cortex Task
    -> Cortex Orchestrator
        -> EngineAdapter
            -> OpenHands SDK / Agent Server
                -> Agent execution
```

L’interface Cortex doit être stable et indépendante :

```text
EngineAdapter
  initialize(config)
  shutdown()
  getCapabilities()
  createSession(task, context)
  execute(sessionId, instruction)
  streamEvents(sessionId)
  cancel(sessionId, reason)
  pause(sessionId)
  resume(sessionId)
  getStatus(sessionId)
```

L’adaptateur traduit les tâches, politiques, budgets et workspaces Cortex vers les primitives OpenHands. Il normalise les événements OpenHands vers l’Event Bus Cortex. Il ne doit pas exposer directement les types internes OpenHands au planner ou aux agents Cortex.

## Contrats à tester

| Contrat | Test minimal |
|---|---|
| Création de session | Une tâche Cortex crée une session isolée et récupérable. |
| Flux d’événements | Les actions, observations, erreurs, demandes d’outil et états de tâche sont convertis sans perte critique. |
| Annulation | Une session active s’arrête et restitue un état terminal cohérent. |
| Pause/reprise | Une session interrompue peut reprendre ou échouer explicitement avec une raison. |
| Workspace | Les opérations utilisent l’abstraction `Workspace`, sans accès direct imposé au filesystem local. |
| Permissions | Les outils refusés par une policy Cortex ne sont pas exécutés par OpenHands. |
| Résilience | Une déconnexion serveur ou un événement inconnu ne fait pas perdre le graphe de tâche. |

## Risques

Les API internes peuvent évoluer plus rapidement que l’interface d’adaptation. Les événements persistés et les sessions doivent donc être versionnés. Le serveur d’agents, les MCP, le navigateur et les outils terminal agrandissent la surface d’attaque. Les secrets et les tokens de session doivent rester dans le runtime sécurisé, jamais dans les messages d’agent ni les artefacts non chiffrés.

## Décision

OpenHands est retenu comme **premier engine adapter**, sous réserve d’un test de contrat minimal et d’une revue complète des dépendances transitives. Aucun code d’interface OpenHands n’est intégré au Cortex Core dans cette phase.

## Références

[1]: https://github.com/OpenHands/software-agent-sdk "OpenHands software-agent-sdk repository"
[2]: https://github.com/OpenHands/OpenHands "OpenHands application repository"
[3]: https://github.com/OpenHands/OpenHands-CLI "OpenHands CLI repository"
[4]: https://github.com/OpenHands/extensions "OpenHands extensions repository"
