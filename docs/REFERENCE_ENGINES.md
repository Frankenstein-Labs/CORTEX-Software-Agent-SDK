# Reference engines and Cortex integration boundary

## Decision

Cortex owns orchestration, policies, budgets, task state, workspaces, runtimes, protocol messages, and audit events. External engines are cloned for **audit and adapter development only**. Their source trees are not copied into the Cortex Core and remain outside the tracked repository under `external/`.

The first two reference engines are:

| Engine | Upstream | Local checkout | Locked commit | Role in Cortex |
|---|---|---|---|---|
| OpenHands Software Agent SDK | [OpenHands/software-agent-sdk](https://github.com/OpenHands/software-agent-sdk) | `external/openhands-software-agent-sdk` | `3fc7b221516485e07604e8068de2fdc2d0ef3f09` | First execution engine adapter candidate |
| OpenDesign | [vustudio/opendesign](https://github.com/vustudio/opendesign) | `external/opendesign` | `b4e69ac61b50576298f9f564603e5a4beb27417f` | Design and visual-engine adapter candidate |

Both upstream checkouts contain their own `LICENSE` files. Before redistributing or vendoring any source, the exact license terms and dependency obligations must be reviewed. Cortex therefore tracks provenance and commit identity, not copied vendor source.

## Reproducible checkout

```bash
git clone https://github.com/OpenHands/software-agent-sdk.git external/openhands-software-agent-sdk
git -C external/openhands-software-agent-sdk checkout 3fc7b221516485e07604e8068de2fdc2d0ef3f09

git clone https://github.com/vustudio/opendesign.git external/opendesign
git -C external/opendesign checkout b4e69ac61b50576298f9f564603e5a4beb27417f
```

The `external/` directory is intentionally ignored by Git. It is a local audit cache and must not become an implicit dependency of a Cortex build.

## Adapter rule

Only `packages/engine-adapters` may depend on an external engine. The adapter translates Cortex tasks, policies, budgets, workspaces, and runtime capabilities into engine-specific calls, then normalizes engine events back to the Cortex protocol. Core packages must never import OpenHands or OpenDesign types.

The initial implementation order is:

1. Validate the engine through the neutral `EngineAdapter` contract.
2. Build a deterministic fake adapter for Core and orchestrator tests.
3. Implement OpenHands session, event, cancellation, and pause/resume translation.
4. Implement OpenDesign artifact and visual-analysis translation.
5. Add integration tests against pinned checkouts without making those checkouts part of the Cortex distribution.
