# Cortex AI Engine — Audit de phase 1

**Statut : audit initial terminé ; intégration non commencée.** Ce document consigne l’état observé dans les six dépôts clonés le 9 septembre 2026. Les dépôts externes restent sous `external/` et ne sont pas copiés dans le Cortex Core.

## Conclusion exécutive

Le périmètre confirme la faisabilité d’une architecture Cortex indépendante, à condition de traiter OpenHands et les moteurs de design comme des **adaptateurs**. Le dépôt `OpenHands/software-agent-sdk` est la source la plus pertinente pour l’exécution d’agents : il regroupe SDK Python, serveur d’agents, outils, workspaces, événements, tests et client TypeScript. Le dépôt applicatif OpenHands apporte des éléments d’intégration d’interface et de déploiement, mais ne doit pas devenir le cœur de Cortex. Les dépôts CLI et extensions sont des sources d’inspiration ou de compatibilité, non des dépendances architecturales obligatoires.

Pour le design, `vustudio/opendesign` présente la base la plus complète observée : application web/desktop, daemon, artefacts de design, nombreux design systems, ressources et runtime de packaging. `coolcmyk/opendesign` propose un modèle de document et une vision AI-native intéressante, mais son dépôt est plus petit et son niveau d’implémentation doit être vérifié avant toute dépendance.

## Inventaire vérifié

| Dépôt | Commit audité | Licence déclarée | Rôle potentiel | Décision de phase 1 |
|---|---|---|---|---|
| [software-agent-sdk][1] | `3fc7b221516485e07604e8068de2fdc2d0ef3f09` | Fichier `LICENSE` présent ; validation juridique détaillée encore requise | Moteur d’exécution d’agents | Encapsuler derrière `OpenHandsAdapter` |
| [OpenHands app][2] | `bb4ec4420e475dfa71cc2a7cd494d4938b15ca54` | MIT, copyright OpenHands 2025 | Application, Agent Canvas, API clients, intégration | Auditer ; ne pas copier l’interface |
| [OpenHands CLI][3] | `954f2ba646e8d749261a8f2b2b7e3031fa39be9f` | MIT, copyright All Hands AI 2025 | CLI/TUI, sessions, ACP, MCP, cloud | Réutiliser les contrats et idées, pas le cœur |
| [OpenHands extensions][4] | `39fc25a91749fe248db391315c2c4eb2c74655a6` | MIT, copyright OpenHands 2025 | Skills, plugins, marketplaces, intégrations | Source pour un registre Cortex d’extensions |
| [vustudio/opendesign][5] | b4e69ac61b50576298f9f564603e5a4beb27417f | Apache-2.0 | Moteur et ressources de design | Candidat principal à adapter sous réserve de revue des dépendances |
| [coolcmyk/opendesign][6] | b4e69ac61b50576298f9f564603e5a4beb27417f | MIT, copyright OpenDesign contributors 2026 | Modèle de documents/design workspace | Prototype d’adaptateur ou source de schémas |

Les références locales détaillées se trouvent dans `docs/LOCAL_AUDIT_EVIDENCE.txt` et `docs/STRUCTURE_AUDIT.txt`.

## Risques bloquants ou importants

Le statut de licence au niveau du fichier principal ne suffit pas pour une intégration de production. Il faudra inventorier les licences transitives, les assets de design, les modèles, les polices et les composants tiers avant distribution. Les dépôts sont actifs et évolutifs ; les adaptateurs devront donc être versionnés, testés par contrat et isolés des API internes instables.

La sécurité est un axe de conception central. Les outils terminal, navigateur, filesystem, MCP et runtime doivent être soumis à des politiques, budgets, scopes de workspace, journalisation et mécanismes d’annulation. Aucun agent ne doit recevoir un accès implicite au filesystem local ou à des secrets.

## Décision

La phase 1 est suffisamment documentée pour commencer la conception du Cortex Core, mais pas pour intégrer du code externe directement. La prochaine phase doit définir les interfaces natives Cortex : `EngineAdapter`, `Workspace`, `Runtime`, `EventBus`, `TaskGraph`, `AgentGraph`, `Memory`, `Policy` et `ArtifactStore`. Chaque adaptateur sera ensuite testé contre ces interfaces sans transférer la propriété de l’architecture au moteur externe.

## Références

[1]: https://github.com/OpenHands/software-agent-sdk "OpenHands software-agent-sdk repository"
[2]: https://github.com/OpenHands/OpenHands "OpenHands application repository"
[3]: https://github.com/OpenHands/OpenHands-CLI "OpenHands CLI repository"
[4]: https://github.com/OpenHands/extensions "OpenHands extensions repository"
[5]: https://github.com/vustudio/opendesign "vustudio OpenDesign repository"
[6]: https://github.com/coolcmyk/opendesign "coolcmyk OpenDesign repository"
