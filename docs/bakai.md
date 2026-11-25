# Bakai · 八解

![Bakai octants](./bakai.svg)

[Interactive Plotly 3D chart](./bakai-plotly.html)

## Axes
- Impact
- Ease
- Independence

## Point semantics in the interactive chart
- **Circle**: issue that does **not** unlock downstream issues.
- **Diamond**: issue that **does** unlock downstream issues.
- **Marker size**: proportional to **Unlocking Power**.

## Notes
- Bit order and trigram order: top = Impact, middle = Ease, bottom = Independence.
- High Impact if score ≥ 6.
- High Ease if score ≥ 6, where Ease = 11 − Cost.
- Independent means no unresolved prerequisites.

- Plot geometry: integer scores 1–10, displayed from 0.5 to 10.5; split at 5.5 for equal octants.
- Mountain: `#874018`; Earth: `#c26d1f`.

## Containment Splitting

Containment Splitting is the decomposition of an issue into a short-term containment or workaround and a long-term root cause fix. Its purpose is to deliver useful results sooner without requiring the full resolution upfront.

### Dependency-driven Splitting

**Candidates:** independent issues with Low Ease and positive Unlocking Power.

- **Fire (101) — Major Fixes**
- **Air (001) — Hollow Fixes**

The goal is to unblock downstream work through a smaller, easier intervention. The original issue's own Impact does not determine eligibility. A split is useful only if containment actually removes or satisfies a dependency earlier than the full fix would.

### Impact-driven Splitting

**Candidates:** High Impact issues that have Low Ease or are Dependent.

- **Fire (101) — Major Fixes**
- **Water (110) — Locked Wins**
- **Mountain (100) — Distant Peaks**

The goal is to mitigate harm while the definitive fix is difficult, time-consuming or blocked. Unlocking Power is not required. For example, temporarily disabling an affected production operation may reduce harm before the underlying defect can be fixed.

### Candidate matrix

| IEI | Element | Category | Dependency-driven | Impact-driven |
|---|---|---|---|---|
| 111 | Heaven | Major Wins | — | — |
| 101 | Fire | Major Fixes | If Unlocking Power > 0 | Yes |
| 011 | Lightning | Quick Fixes | — | — |
| 001 | Air | Hollow Fixes | If Unlocking Power > 0 | — |
| 110 | Water | Locked Wins | — | Yes |
| 100 | Mountain | Distant Peaks | — | Yes |
| 010 | Earth | Deferred Polish | — | — |
| 000 | Swamp | Quagmires | — | — |

Fire belongs naturally to both modalities. A single containment intervention may both mitigate harm and unblock downstream work. These are screening criteria, not mandatory splits or absolute exclusions.

### Reclassification after splitting

1. Identify a viable containment intervention and a definitive root cause fix.
2. Score each resulting issue independently on Impact, Ease and Independence. A rapid, independent containment intervention may move to Heaven or Lightning, depending on its own Impact.
3. Update dependency links to reflect which intervention actually satisfies each prerequisite. Retain dependencies on the root cause fix where containment is insufficient.
4. Recalculate Unlocking Power across the affected dependency graph, avoiding double-counting shared downstream issues.
5. Compare the benefit of earlier containment or unblocking against the additional effort and risk of maintaining a temporary solution. If splitting offers no meaningful benefit, retain the original issue.

Classification informs prioritization; actual execution order must respect unresolved prerequisites.
