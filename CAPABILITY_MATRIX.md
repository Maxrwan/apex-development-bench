# APEX capability matrix

Inspected 6 October 2026. IMPLEMENTED requires source and existing outputs/tests; PARTIAL describes experimental limits; PLANNED means no working implementation. NEXT identifies the immediate unexecuted continuation.

| Capability | Classification | Verified scope | Source | Bench representation |
|---|---|---|---|---|
| Track geometry & coordinates | IMPLEMENTED | Periodic cubic centerline, arc progress, independent half-widths, Frenet ↔ global mapping. Circle and oval fixtures exist; no S-path generator found. | `src/apex/track/centerline.py` | Replay + live |
| Kinematic bicycle | IMPLEMENTED | Four integrated channels; vy and r reconstructed from instantaneous steering. a_cmd = dvx/dt. | `src/apex/models/vehicle/kinematic.py` | Live RK4 |
| Dynamic bicycle & axle tires | IMPLEMENTED | Six independent states; linear axle reference and smooth combined grip. Explicit load transfer and longitudinal allocation. a_cmd = Fx/m. | `src/apex/models/vehicle/dynamic_bicycle.py` | Replay + live RK4 |
| APEX nonlinear MPC | IMPLEMENTED | CasADi prediction, multiple shooting, IPOPT, warm start, track slack, actuator/grip/domain constraints, optional terminal progress. Candidate C: N4 / 0.1 s. | `src/apex/control/mpc/controller.py` | Genuine replay |
| TVLQR co-driver / tracker | IMPLEMENTED | Planner-side local linearization, terminal DARE, finite-horizon Riccati gains. 100 Hz steering feedback plus speed P; TVLQR remains the default. | `src/apex/control/trajectory/tracker.py` | Genuine replay |
| Asynchronous local planner | IMPLEMENTED | Actuation-state forecast → APEX → timestamped immutable X/U/K → validity buffer. No opponent input. | `src/apex/control/trajectory/planner.py` | Genuine replay |
| Offline Planning reference | IMPLEMENTED | Serialized racing line AND speed; validated loader and temporary synthetic GP fixture generator. No online global racing-line optimizer. | `src/apex/planning_reference/reference.py` | Recorded fixture |
| Latency & fallback simulation | IMPLEMENTED | Zero/injected/measured timing; moving plant, skipped fixed deadlines, separate actuator delays. Exhaustion latches Task005 LQR/PI in its valid domain. | `src/apex/simulation/asynchronous.py` | Genuine replay |
| Baseline LQR / PI | IMPLEMENTED | Curvature feedforward + scheduled LQR + longitudinal PI. Synthetic 1–3 m/s domain; also the exhaustion fallback. | `src/apex/control/baseline/controller.py` | Fallback replay |
| Small linear MPC co-driver | IMPLEMENTED | Task006.4 compared against TVLQR. Implemented experimental alternative; study retained TVLQR as default. | `src/apex/control/local_mpc/tracker.py` | Inspector only |
| Near-limit racing behavior | PARTIAL | Optional progress implemented, lambda=2 selected only at synthetic gamma=1. Aggressive cases were rejected; no adaptive switching. | `docs/TASK007B_RESULTS.md` | Rejected replay retained |
| Task007C formulation diagnosis | NEXT | Reproducibility gate cleared by Task007C-R. Original C1–C4 formulation experiments remain unexecuted. | `docs/CODEX_HANDOFF.md` | Orientation only |
| System identification | PLANNED | Placeholder package only. Generic physical parameters remain unknown; synthetic YAML is not measured APEX data. | `src/apex/identification/__init__.py` | Coming later |
| State estimation | PLANNED | Placeholder package; current studies use perfect simulated state feedback. No working estimator. | `src/apex/estimation/__init__.py` | Coming later |
| Opponent detection | PLANNED | No operational perception or detector found in this checkout. No opponent telemetry is fabricated. | `docs/APEX_ARCHITECTURE.md` | Coming later |
| Opponent-aware planning / prediction | PLANNED | Opponent model and defensive planning packages are placeholders; existing references are opponent-free. | `src/apex/planning/defensive/__init__.py` | Coming later |
| Full defensive racing | PLANNED | Tactical maneuvers and integrated defensive MPC belong to later specified phases. | `docs/PROJECT_ROADMAP.md` | Coming later |
| Pure Pursuit | NOT IMPLEMENTED | No implementation found. It is absent from the runtime and development roadmap. | `docs/PROJECT_ROADMAP.md` | Not included |

The actual current chain is offline Planning line and speed → APEX nonlinear trajectory planner → timestamped validity buffer → TVLQR/P trajectory tracker → independently injectable dynamic plant → perfect state feedback. TVLQR is active in normal trajectory tracking; Task005 LQR/PI is the explicit exhaustion fallback.

Generic physical parameters are unknown. All provided mass/inertia/tire values and fixtures are synthetic. The legacy introductory README text is stale; newer implementation and latest CODEX_HANDOFF.md were inspected. Task007C-R is complete; C1–C4 diagnosis remains unexecuted. No inferred safety certificate, working perception or defensive behavior.
