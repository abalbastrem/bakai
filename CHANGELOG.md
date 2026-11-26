# Changelog

## 0.4.0 — 2026-11-26

- Adopt Independence / Impact / Ease (IIE) bit and trigram order, with codes descending from 111 to 000.
- Replace the category wheel with the approved white octagon and update the category reference.
- Synchronize Bagraph classifications, volume geometry, legend and documentation without changing the issue data or Unlocking Power.

## 0.3.0 — 2026-11-26

- Replace the example-based SVG with two method illustrations: the category wheel and category reference.
- Add descriptions of all eight categories.
- Rename Water to Locked Potential and Swamp to Costly Quagmires across documentation and Bagraph.
- Keep the dynamic issue dataset and graph calculations unchanged.

## 0.2.0 — 2026-11-25

- Extract the ten example issues into `docs/data/issues.md` and dependencies into `docs/data/dependencies.md` using Mermaid.
- Compute Independence, octants, downstream counts and Unlocking Power dynamically in `docs/bagraph.js`.
- Validate IDs, integer scores, graph references, duplicate edges and circular dependencies.
- Generate the issue table and category legend dynamically while retaining the existing Plotly visualization.
- Document HTTP hosting requirements and the static nature of the SVG snapshot.

## 0.1.1 — 2026-11-25

- Rename the interactive visualization to `bagraph.html` and update references.

## 0.1.0 — 2026-11-25

- Initial theoretical specification of Bakai and its eight categories.
- Impact, Ease, Independence and Unlocking Power.
- Dependency-driven and impact-driven Containment Splitting.
- SVG matrix, interactive Bagraph and static presentation page.

This is an initial draft, subject to review.
