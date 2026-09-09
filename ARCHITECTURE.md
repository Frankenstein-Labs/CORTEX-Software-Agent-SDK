# Architecture cible de Cortex AI Engine

## Principe directeur

Cortex possède l’orchestration, les graphes, la mémoire, les politiques, les budgets, les artefacts, les abstractions de workspace/runtime et le bus d’événements. Les moteurs externes sont des fournisseurs remplaçables derrière des adaptateurs. Cette séparation empêche OpenHands ou un moteur de design de devenir le propriétaire de l’architecture.

```text
CORTEX AI ENGINE
        |
        v
CORTEX ORCHESTRATOR
   |        |        |
TaskGraph AgentGraph Memory
        \   |   /
          Agent Pool
               |
       Engine Adapters
       /              \
OpenHands          Design
       \              /
          Cortex Runtime
      /       |        \
 Terminal  Browser  Workspace
          /   |   \
       Git  Sandbox Cloud
```

## Modules possédés par Cortex

| Module | Responsabilité |
|---|---|
| `orchestrator` | Coordonne les tâches, agents, budgets, approbations et états terminaux. |
| `task-graph` | Représente les dépendances, reprises, branches, échecs et résultats. |
| `agent-graph` | Décrit les agents actifs, leurs rôles, capacités et relations. |
| `agent-pool` | Fournit Architect, Developer, Designer, Researcher, Tester, Reviewer, Security, Debugger, DevOps et Explorer. |
| `event-bus` | Publie, filtre, persiste et rejoue les événements versionnés. |
| `protocol` | Définit les messages inter-agents et les événements de cycle de vie. |
| `memory` | Sépare mémoire de tâche, mémoire de workspace, mémoire de session et mémoire long terme. |
| `artifacts` | Enregistre code, fichiers, designs, captures, rapports et provenance. |
| `policies` | Autorise ou refuse outils, chemins, réseaux, secrets, budgets et opérations destructives. |
| `workspace` | Abstrait local, cloud, Git, worktree et sandbox. |
| `runtime` | Abstrait hôte local, conteneur, VM et runtime distant. |
| `engine-adapters` | Encapsule OpenHands, OpenDesign et futurs moteurs. |

## Interfaces fondamentales

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

Workspace
  readFile(path)
  writeFile(path, bytes)
  deleteFile(path)
  listFiles(path)
  createDirectory(path)
  move(source, target)
  copy(source, target)
  exists(path)

Runtime
  exec(command, options)
  readFile(path)
  writeFile(path, bytes)
  startProcess(spec)
  stopProcess(id)
  openBrowser(url)
  screenshot(target)
  git(args)
  getStatus()

EventBus
  publish(event)
  subscribe(filter, handler)
  unsubscribe(subscriptionId)
  stream(filter)
```

Les interfaces doivent porter un `tenantId` ou `workspaceId`, un `traceId`, une identité d’agent, une policy effective, un budget restant et une version de protocole. Les implémentations ne doivent pas laisser ces contrôles à la bonne volonté du moteur externe.

## Flux de tâche

1. Le client crée une `TaskCreated` avec objectifs, contraintes, workspace et budget.
2. Le planner construit un graphe de sous-tâches et demande les capacités nécessaires.
3. L’orchestrateur affecte les tâches à l’Agent Pool.
4. L’agent sélectionne un `EngineAdapter` et un `Runtime` compatibles.
5. Les actions et observations sont publiées sur l’Event Bus.
6. Les artefacts sont enregistrés avec provenance et empreinte.
7. Le Reviewer et le Tester produisent des événements de revue et de test.
8. L’orchestrateur clôture, reprend ou escalade la tâche selon les policies et les résultats.

## Sécurité

Le runtime doit appliquer une liste d’allowlist de commandes, chemins et domaines. Les secrets doivent être injectés au dernier moment et exclus des journaux. Les opérations Git, réseau, navigateur et filesystem doivent produire des événements auditables. Toute opération destructive ou à fort impact doit être modélisée comme une demande d’approbation, et non comme un effet implicite d’un prompt.

## Arborescence proposée

```text
packages/
  core/
  orchestrator/
  task-graph/
  agent-graph/
  agent-pool/
  protocol/
  event-bus/
  memory/
  artifacts/
  policies/
  workspace/
  runtime/
  browser/
  tools/terminal/
  engine-adapters/openhands/
  engine-adapters/design/
tests/
  contract/
  integration/
docs/
external/
```

## Phases d’implémentation

| Phase | Livrable vérifiable |
|---|---|
| 1. Audit | Présent document, rapports d’audit, licences et dépôts externes isolés. |
| 2. Core types | Identifiants, résultats, erreurs, capacités et contrats versionnés. |
| 3. Protocol/Event Bus | Messages typés, publication, abonnement, stream et replay déterministe. |
| 4. Workspace | `LocalWorkspace` puis interfaces Git, worktree, sandbox et cloud. |
| 5. Runtime | Exécution contrôlée, processus, statut, annulation et journalisation. |
| 6. Agent Pool | Rôles spécialisés et handoff explicite entre agents. |
| 7. Planner | Graphe de tâches, budgets, reprise et politiques d’échec. |
| 8. Orchestrator | Exécution end-to-end avec un moteur simulé uniquement pour les tests de contrat. |
| 9. OpenHands Adapter | Session réelle, traduction d’événements, annulation, pause/reprise et tests d’intégration. |
| 10. Design Adapter | Analyse UI, artefacts design, génération contrôlée et comparaison de captures. |
| 11. Browser/MCP | Capabilities déclarées, sandbox, permissions et timeouts. |
| 12. Security/Integration | Tests adversariaux, tests de charge, reprise et revue complète. |

Chaque phase doit suivre le cycle **auditer, implémenter, tester, corriger, documenter**. Aucune phase ne doit être marquée terminée sans preuve de test reproductible.

## Références

[1]: https://github.com/OpenHands/software-agent-sdk "OpenHands software-agent-sdk repository"
[2]: https://github.com/vustudio/opendesign "vustudio OpenDesign repository"
[3]: https://modelcontextprotocol.io/ "Model Context Protocol specification"
