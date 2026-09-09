# Audit comparatif OpenDesign

## Conclusion

Les deux dépôts portant le nom OpenDesign ne sont pas équivalents. `vustudio/opendesign` est le candidat le plus complet observé pour fournir des capacités de design et de génération d’interface. Il contient une surface applicative large, des applications web/desktop/daemon, un répertoire `craft`, un ensemble très étendu de design systems et des outils de packaging/runtime. `coolcmyk/opendesign` est plus compact et présente une vision AI-native claire, avec un schéma de document et une architecture de workspace prometteuse, mais il doit être considéré comme expérimental jusqu’à validation de ses implémentations et de son niveau d’activité.

## Comparaison

| Critère | `vustudio/opendesign` | `coolcmyk/opendesign` |
|---|---|---|
| Licence déclarée | Apache-2.0 | MIT |
| Surface du dépôt | Large : web, desktop, daemon, packaged, assets, craft, design systems | Compacte : API, web et package `odoc-schema` |
| Design systems | Très nombreux répertoires de systèmes et styles | Spécification d’ingestion de tokens, composants et bibliothèques |
| Modèle de document | À examiner dans l’implémentation du dépôt | Schéma explicite : texte, forme, image, graphique, instance de composant |
| Collaboration/realtime | À valider dans le code et les dépendances | Documente WebSockets et Yjs/Automerge comme direction |
| Génération conversationnelle | Présence d’assets, prompts et boucle d’application à approfondir | Décrite explicitement dans `README.md` et `DESIGN.md` |
| Packaging/runtime | Outils dédiés et namespaces de runtime observés | Non démontré au même niveau dans l’audit initial |
| Maturité d’intégration | Meilleure base technique, mais surface plus large et plus coûteuse à isoler | Plus facile à isoler, mais capacité réelle encore à démontrer |

## Décision d’intégration

Le choix recommandé est **`vustudio/opendesign` comme candidat principal à l’adaptateur design**, sans copie du dépôt dans Cortex. L’intégration doit commencer par une façade `DesignEngineAdapter` qui consomme uniquement des contrats Cortex et qui représente OpenDesign comme un fournisseur de capacités.

`coolcmyk/opendesign` doit rester un candidat de comparaison et une source possible pour un schéma d’artefact design. Il ne doit pas être déclaré moteur de production avant : une démonstration reproductible de génération, une suite de tests, une vérification des dépendances et une analyse d’activité du dépôt.

## Interface proposée

```text
DesignEngineAdapter
  initialize(config)
  getCapabilities()
  analyzeUI(input)
  inspectPage(pageRef)
  inspectScreenshot(imageRef)
  proposeDesign(requirements, constraints)
  generateLayout(spec)
  generateComponent(spec)
  generatePage(spec)
  generateApplicationUI(spec)
  reviewDesign(artifact)
  compareScreenshots(expected, actual)
  suggestImprovements(artifact, findings)
  shutdown()
```

Les sorties doivent être des `DesignArtifact`, `FileArtifact`, `ScreenshotArtifact` ou des messages structurés du Protocol Cortex. Les fichiers de design externes ne doivent pas devenir l’unique représentation de l’état : Cortex doit conserver provenance, version, permissions, budget et relation avec les tâches de développement.

## Risques juridiques et techniques

Apache-2.0 et MIT sont permissives, mais elles n’éliminent pas les obligations de notices, les questions de marques, les licences transitives et les licences d’assets. Le répertoire de design systems de `vustudio/opendesign` mérite une revue séparée, car les noms de marques et les ressources visuelles peuvent porter des conditions distinctes.

La taille de `vustudio/opendesign` augmente le risque de couplage involontaire. Cortex doit importer des contrats ou utiliser un processus isolé, plutôt que des modules internes directement. Le modèle documenté de `coolcmyk/opendesign` est utile pour concevoir le format `DesignArtifact`, mais ses capacités annoncées ne doivent pas être confondues avec des fonctionnalités déjà testées.

## Références

[1]: https://github.com/vustudio/opendesign "vustudio OpenDesign repository"
[2]: https://github.com/coolcmyk/opendesign "coolcmyk OpenDesign repository"
[3]: https://www.apache.org/licenses/LICENSE-2.0 "Apache License 2.0"
[4]: https://opensource.org/license/mit "MIT License"
