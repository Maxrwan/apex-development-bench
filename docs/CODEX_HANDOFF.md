# APEX Development Bench v0 handoff

Created 2026-10-06 as an isolated sibling application. The original graduation repository remains read-only. Its original uncommitted modifications are part of the before-manifest; do not treat them as Bench changes.

Runtime: `python3 -B server.py`, http://127.0.0.1:8765. `launch.command` is a macOS launcher. No scientific Python dependency is required at runtime. Source imports for optional export/oracle generation resolve to `vendor/apex` only.

Implemented: six genuine APEX/TVLQR replay experiments; exact 5 ms playback stepping, time seek/speeds; nonlinear prediction/control/preview and real cost/solver diagnostics where retained; physically available packet/gain replay; real fallback; bounded telemetry; live kinematic/dynamic constant/step-steering comparison with meaningful synthetic parameters and two dynamic tire laws; source-backed architecture, inspector and roadmap.

Do not turn replay parameters into live knobs. Do not call TVLQR an independently proven safety supervisor. Current chain is offline Planning → APEX trajectory planner → buffer → TVLQR/P → independent physical plant. Candidate C N4/dt0.1; TVLQR100 Hz; plant200 Hz maximum step. Future systems remain disabled.

Known limits and validation details are in README.md, CAPABILITY_MATRIX.md, validation/math-tests.json, validation/browser-tests.json and validation/repository-preservation.json. Synthetic values do not identify the real APEX car. No live IPOPT, no controller comparison claiming interchangeable roles, no full near-limit formulation diagnosis, no estimation/opponents/defensive behavior. Existing source and equations remain frozen in vendor for provenance.

Future extensions belong inside this Bench only unless the user explicitly authorizes changes to the original project. Update snapshot evidence before representing new project capabilities.
