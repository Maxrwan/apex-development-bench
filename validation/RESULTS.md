# Bench v0 validation

Verified 6 October 2026 in the Codex in-app browser, using 1440×1050 and 390×844 viewport tests.

- Launch, play, pause, stable paused time, reset, exact 5 ms step, integer-tick seek and 2× playback passed.
- Six genuine recordings load and advance. The 150 ms case retains 291 skipped planner releases; the 450 ms case displays real latched LQR/PI fallback and no valid MPC horizon.
- Nonlinear horizon/preview/control nodes, real IPOPT diagnostics, objective groups, TVLQR gains and corrections are visible from actual records. The raw horizon node selector operates.
- Live constant/step steering, kinematic/dynamic model views, linear/smooth grip, meaningful mass edits, model rebuild/reset, defaults and telemetry toggles passed. A mass change from 2 to 3 kg changes the rounded live dynamic vy at 4 s from 0.008 to 0.002 m/s.
- Architecture module inspection, source links, capability classifications and roadmap are present. Planned opponent/defensive/identification/estimation features stay disabled.
- The mobile document width equals its 390 px viewport; no horizontal document overflow. Track is visible. Desktop, diagnostics and mobile screenshots were visually inspected.
- Browser console: no errors or warnings during verified final workflows.
- Independent model tests: 48 Python-oracle checkpoints; maximum state error 1.1868284133242923e-13. Same initial conditions produce identical live states; parameters change real equations; model domains reject invalid speed/input.
- 7,855 replay chronology checks: no future active packet, no exhausted-horizon extrapolation, no co-driver diagnostics before application/completion.
- Original repository: 24,392 files verified by SHA-256, size, modification time, mode and symlink target, including Git and original environment. Added/removed/changed lists are empty; complete Git status is identical, including pre-existing changes.

Reports: math-tests.json, browser-tests.json, repository-preservation.json. Browser validation used the available native browser; no browser or numerical dependency was installed into the original project. The Bench is hybrid: genuine recorded APEX/TVLQR, independently calculated live plant models. This is not a live optimizer, physical APEX validation, fair interchangeable-controller benchmark or a safety certificate.
