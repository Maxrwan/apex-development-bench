# Development Bench decisions

1. **Separate sibling directory.** All new files live under `apex-development-bench`; the original project is read-only, including its outputs, virtual environment and Git state. Full original-tree hashes/stat metadata are captured before/after. Runtime has no original-project imports.
2. **Dependency-free local frontend + static server.** Plain ES modules and Canvas with Python standard-library localhost hosting avoid new environment dependencies and continuous IPOPT load on an M1 Air. Actual APEX/TVLQR data are exported once from verified existing artifacts.
3. **Exact current architecture.** Offline reference → APEX local trajectory planning → availability buffer → active TVLQR/P → plant. Exhaustion fallback is Task005 LQR/PI. Neither Pure Pursuit nor a fictional TVLQR safety-arbitration layer is introduced.
4. **Replay is frozen.** Original solver telemetry/physical delays, no future-packet leakage, no exhausted horizon extrapolation. Editing model parameters is limited to the separate genuine live plant sandbox.
5. **Plant adapters tested against original equations.** Synthetic parameters, canonical state order and input semantics are preserved; spline geometry coefficients are exported. No arbitrary replacement dynamics or tire fitting.
6. **Expose failures and maturity.** Rejected aggressive reference and exhausted-trajectory fallback remain visible. Task007C C1–C4, identification, estimation, opponents and defensive tactics stay unimplemented/next/planned.
7. **Bounded work.** 5 ms fixed view/live step; 30 Hz render, 10 Hz readouts, 5 Hz 15 s plots; four-second live runs, lazy one-dataset cache and stop-on-hidden-tab behavior.
