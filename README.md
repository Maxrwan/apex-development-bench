# APEX DEVELOPMENT BENCH v0

A standalone local engineering snapshot of the APEX graduation project's **inspected 6 October 2026 checkout**. The original repository is read-only. The Bench is a separate sibling directory; it does not import from or write to the original source tree at runtime.

## Launch

Double-click `launch.command`, or run:

```sh
cd /Users/marwansaber/Grad_proj/The_Project_PREP/apex-development-bench
/usr/bin/python3 -B server.py
```

Open **http://127.0.0.1:8765**. Stop the server with Ctrl+C. `--port 8766` selects another port. Python 3.9+ and a modern browser are the only runtime dependencies. No npm installation, original virtual environment, network service, GPU, WebGL or framework is required. The launch command uses macOS's existing Python and browser.

## What operates

- Six deterministic, genuine recorded experiments: Grand Prix baseline, conservative progress, injected 150 ms planner delay, rejected aggressive reference, oval disturbance, and 450 ms trajectory-exhaustion fallback.
- APEX raw nonlinear state/control horizons, reference preview, cost components, IPOPT status/iterations/residual/slack and recorded solve/preparation durations where retained in the source recordings.
- Accepted timestamped X/U/K packets, active reserve, TVLQR gain/correction diagnostics, applied commands and separate recorded physical availability.
- Live kinematic/dynamic RK4 models with identical initial conditions and scripted constant/step steering, editable speed, steering, mass and axle stiffness, and linear/smooth-grip tire selection.
- Track/CG/vector views, bounded 15 s plots, play/pause/reset/exact 5 ms step, 0.25/0.5/1/2× playback, overlay toggles and model comparison.
- Source-backed architecture, project inspector and development roadmap.

## Architecture and fidelity

The inspected runtime chain is **offline Planning line + velocity profile → asynchronous 10 Hz APEX nonlinear trajectory planner → timestamped validity buffer → 100 Hz TVLQR lateral / speed-P tracker → independent 200 Hz maximum-step NumPy physical plant → perfect simulated state feedback**. This updates the wording of the request to match the actual implementation. APEX is the primary advanced controller; in the current asynchronous architecture it produces the local nominal trajectory. TVLQR actively tracks that trajectory during the next solve. It is not portrayed as an independently proven safety supervisor or intermittent override.

Planner-side actuation-state prediction and delay estimation prepare the optimization input. TVLQR uses local symbolic-model linearization, terminal DARE and backwards finite-horizon Riccati gains prepared with the packet. The fast callback uses the resulting gain schedule and nominal trajectory. Trajectory exhaustion activates **latched Task005 centerline LQR/PI**, within its documented domain. Failed/late plans never become fictitious valid horizons. Planner misses and actuator misses are different quantities.

Candidate C uses four 0.1 s stages, four RK4 substeps, exact Hessian and warm start, smooth combined grip with explicit normal-load-proportional longitudinal allocation, and a provisional 0.08 m tracker margin. The progress objective defaults to zero; lambda=2 is represented as a separate selected experiment only at conservative synthetic gamma=1.

## Replay versus live calculation

**APEX/TVLQR are genuine recorded replay.** No optimizer is run by the browser, and no live MPC or synthetic solver telemetry is invented. Replay preserves raw numeric records, event timestamps, actuator delays and availability. State display uses piecewise-linear interpolation between recorded plant events on a fixed **5 ms view grid**; heading uses wrapped interpolation. Discrete mode, packet ID and applied controls use zero-order hold. This is a replay sampling interval, not a claim that all recorded plant event intervals were exactly 5 ms. Event steps were partitioned around physical completions in the original simulator.

Raw solver output is exposed only for an available active packet. Buffer states interpolate linearly, controls/gains use ZOH, and no query extrapolates beyond the active horizon. Co-driver diagnostics appear after their recorded application/completion time. Historical solve durations are host measurements, independent of playback speed. Recorded parameters are frozen; playback changes cannot retune them. The Grand Prix windows cover the first rolling-launch lap and a short prefix of the next lap, up to 60 s. Oval windows cover their retained run. Full-source summaries are stored as provenance; displayed running counters refer to the exported window only.

**Live model laboratory** adapts `kinematic.py`, `dynamic_bicycle.py`, `linear.py`, `grip.py`, `load_transfer.py`, `force_allocation.py`, and the shared Frenet/RK4 logic. It evaluates the original periodic cubic geometry using exported spline coefficients and numerical arc inversion. It contains no path controller. Constant steering reproduces the Task004 held-input comparison defaults: vx=2 m/s, delta=0.02 rad, radius-15 m 128-waypoint fixture, identical canonical initial state. Step steering changes that same input at 1 s. Both use a_cmd=0, a 5 ms integration step and a bounded 4 s run. Incoming kinematic vy/r remain algebraic; dynamic vy/r remain independent. Bounds, axle-load, grip and Frenet checks reject invalid stages rather than regularizing them. Track crossings are not enforced by these open-loop plant models.

Live parameter changes rebuild both models and reset the experiment; mass/stiffness affect only the dynamic equations, as expected. Kinematics interpret a_cmd=dvx/dt; dynamics interpret a_cmd=Fx/m. APEX replay is **dynamic/smooth-grip only**, with no misleading kinematic controller switch. Model comparison is a synthetic held-input comparison, not evidence of which plant is physically correct. No standalone APEX-versus-TVLQR benchmark is claimed: they serve different roles in this chain.

## Display provenance

- **S / SIMULATED:** source plant state and applied control, or live model output; replay state interpolation is explicit above.
- **O / SOLVER OUTPUT:** recorded IPOPT outputs, predicted X/U, costs and residuals.
- **D / DERIVED:** Frenet-to-global position/heading, sideslip, physical reserve, and actual-minus-available-nominal tracking error.
- The vehicle icon/outline is a **schematic marker**, not measured chassis geometry. Front/rear CG distances are 0.15 m; outline width is illustrative. Velocity arrows use 24 px/(m/s) in the body inset and velocity ×0.2 s on the track. Track ruler and positions are quantitative. There is no fabricated opponent, sensor, tire telemetry, throttle/brake fraction or Pure Pursuit geometry.

## Limits and maturity

All physics values and circuits are synthetic. The generic real vehicle parameter template remains unknown/null. Perfect state, no perception, identification, estimator, energy model, opponent prediction, opponent-aware local planner or defensive tactics. Pure Pursuit is not implemented. A successful IPOPT solve does not make aggressive racing behavior acceptable: the rejected gamma=2.5/lambda=2 case remains clearly rejected. TVLQR stays default, and adaptive switching remains deferred.

Task007C-R completed reproducibility work; the original C1–C4 near-limit diagnosis is **next, unexecuted**, not retroactively completed. The legacy introductory README paragraph is stale relative to newer source and handoffs; the Bench uses the verified implementation and latest handoff.

The older oval recordings did not retain raw nonlinear preview/control matrices or objective components. For those cases the horizon page identifies **accepted packets only** and omits unavailable reference/cost data. Active-set flags are not recorded, so constraints are presented as actual configured bounds, residual and margin slack, without invented activity flags. APEX computation is not editable or live in v0. No S-curve generator was found, so no S-curve experiment was added.

## Performance and extension

Fixed 200 Hz model/view ticks are independent of rendering capped at 30 Hz, readouts at 10 Hz and plots at 5 Hz. Paused/hidden windows stop advancement; no timer solves in the background. The 15 s plot window and 4 s live runs bound computation/history. One lazily loaded replay dataset is cached at a time; gzip transport reduces local payloads. Rendering is Canvas/SVG, with no external fonts or assets.

Add future pages through navigation/page containers, metadata in `web/inventory.mjs`, and a separately specified data/model adapter. Keep plant, replay and controller output ownership separate. Update capability evidence and provenance when extending; never mark a disabled future module operational.

## Files and reproduction

- `web/engine.mjs`: deterministic replay, geometry and live model adapter.
- `web/canvas.mjs`: track/horizon/state/telemetry drawing.
- `web/app.mjs`: controls and page composition; `web/inventory.mjs`: verified metadata.
- `data/`: exported real artifacts, exact geometry, model oracle and artifact SHA-256 provenance.
- `vendor/`: copied project source/specification snapshot, never a runtime link to the repository.
- `tools/export_snapshot.py`: optional one-time read-only export using copied source. Python scientific dependencies were already present during export; they are not needed to launch the Bench.
- `tools/test_math.mjs`: numerical parity, determinism, parameter effects and replay-availability validation with Node 20+.
- `validation/`: mathematical report, browser validation evidence/screenshots and full before/after original-repository preservation report.
- `CAPABILITY_MATRIX.md`, `docs/DECISIONS.md`, `docs/CODEX_HANDOFF.md`: capability and architecture handoff.

No dependencies were installed into the original environment; no original file, output, index or Git configuration was intentionally changed. The preservation check compares every original file's SHA-256, size, modification timestamp, mode/symlink target, and the complete original Git status including pre-existing uncommitted work.
