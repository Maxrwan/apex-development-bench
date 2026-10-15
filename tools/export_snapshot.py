"""One-time read-only export. Run with Python -B and copied vendor sources only."""
import csv
import gzip
import hashlib
import json
import math
import sys
from pathlib import Path

BENCH = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BENCH / 'vendor'))
import numpy as np
from apex.track import ClosedTrack
from apex.track.synthetic import circle_waypoints
from apex.planning_reference.track import load_track
from apex.config import load_vehicle_parameters
from apex.models.vehicle.dynamic_bicycle import DynamicBicycle
from apex.models.vehicle.kinematic import KinematicBicycle
from apex.models.tire.config import RACING_TIRE_PHYSICS

REPO = Path(sys.argv[1])
PARAMS = load_vehicle_parameters(BENCH / 'vendor/vehicles/synthetic_dynamic_test_vehicle.yaml')
CASES = [
 ('grand-prix', 'Grand Prix · reference tracking', 'results/task007b/b0', 60, 'Recorded measured timing; gamma=1, progress reward disabled. First rolling-launch lap.', False),
 ('progress', 'Grand Prix · conservative progress', 'results/task007b/b4_g1_w2', 60, 'Selected synthetic gamma=1, lambda=2 configuration. Selection does not generalize to aggressive references.', False),
 ('latency', 'Grand Prix · 150 ms planner delay', 'results/task007b/support_injected_w2', 60, 'Injected 150 ms planner latency; zero codriver physical delay. Physics continues and skipped planner deadlines are retained.', False),
 ('near-limit', 'Grand Prix · rejected near-limit case', 'results/task007b/b3_g2.5_w2', 60, 'REJECTED: gamma=2.5, lambda=2. Predicted margin slack and low physical clearance. A successful IPOPT status is not acceptance of racing behavior.', True),
 ('disturbance', 'Oval · disturbance rejection', 'results/asynchronous_planner_tracker/disturbance_feedback', 33, 'At 5 s: +0.08 m lateral, -0.04 rad heading. TVLQR follows a replanned nominal trajectory. Recovery includes replanning.', False),
 ('exhaustion', 'Oval · 450 ms / fallback', 'results/asynchronous_planner_tracker/codriver_450ms', 33, 'The 0.4 s active trajectory exhausts; Task005 centerline LQR/PI fallback latches. This is a retained architectural failure, not continuous APEX tracking.', True),
]

def write(name, value):
 raw = json.dumps(value, separators=(',', ':'), allow_nan=False).encode()
 path = BENCH / 'data' / name
 path.write_bytes(raw)
 path.with_suffix(path.suffix + '.gz').write_bytes(gzip.compress(raw, compresslevel=6, mtime=0))

def geometry(track):
 c = track.centerline
 grid = []
 for s in np.linspace(0, track.length, 601):
  g = track.sample(float(s))
  grid.append([float(s), g.x, g.y, g.heading, g.curvature, g.left_width, g.right_width])
 return dict(length=track.length, q=c._q.tolist(), arc=c._arc.tolist(), coefficients=c._spline.c.tolist(), origin=c._origin.tolist(), left=track.left_width(0), right=track.right_width(0), grid=grid)

def parse(value):
 if value == '': return None
 if value in ('True','False'): return value == 'True'
 try: return float(value)
 except ValueError: return value

def rows(path):
 with path.open() as f: return [{k:parse(v) for k,v in r.items()} for r in csv.DictReader(f)]

# Dataset data retain original event timestamps and original numeric values.
index=[]; provenance={}
for ident, title, source, cap, description, rejected in CASES:
 root=REPO/source; summary=json.loads((root/'summary.json').read_text())
 gp=(root/'fixture/track_source.json').exists()
 if gp:
  track, _, _=load_track(root/'fixture/track_source.json')
  reference=rows(root/'fixture/planning_reference.csv')
  ref=[[r['s_track_m'],r['x_ref_m'],r['y_ref_m'],r['e_y_ref_m'],r['e_psi_ref_rad'],r['v_ref_mps']] for r in reference]
 else:
  track=ClosedTrack.from_waypoints(circle_waypoints(1,count=72)*[7,3],left_width=.3,right_width=.5)
  ref=[[g[0],g[1],g[2],0,0,2] for g in geometry(track)['grid']]
 states=rows(root/'states.csv'); duration=min(cap,states[-1]['time'])
 states=[r for r in states if r['time']<=duration+0.005]
 cols=['time','vx','vy','r','e_psi','s_abs','e_y','delta','a_cmd','plan_id','front_utilization','rear_utilization']
 compact=[[r.get(k) for k in cols]+[r['mode']] for r in states]
 controls=[r for r in rows(root/'controls.csv') if r['time']<=duration]
 events=json.loads((root/'events.json').read_text())
 packets=[p for p in json.loads((root/'trajectory_packets.json').read_text()) if p['planner_release_time']<=duration]
 plans=[p for p in events['plans'] if p['release_time']<=duration]
 predictions={}
 pp=root/'predictions.json'
 if pp.exists():
  for p in json.loads(pp.read_text()):
   if p['release_time']>duration:continue
   v=p['prediction']
   if v:
    predictions[str(p['plan_id'])]={k:v[k] for k in ['states','controls','slacks','preview','preview_progress','prediction_dt','prediction_offsets'] if k in v}
 # Filter event counters to the exported time window; full-run summary stays explicitly separate.
 def event_time(e):return e.get('time',e.get('release_time',0))
 timeline={k:[e for e in v if event_time(e)<=duration] for k,v in events.items() if k!='plans'}
 data=dict(id=ident,title=title,description=description,rejected=rejected,source=source,duration=math.floor(duration/.005+1e-8)*.005,dt=.005,track=geometry(track),reference=ref,state_columns=cols+['mode'],states=compact,controls=controls,plans=plans,packets=packets,predictions=predictions,events=timeline,summary=summary,config=summary['planner_config'])
 # Immutable provenance for each input artifact. Original data are never rewritten.
 sources=['states.csv','controls.csv','summary.json','events.json','trajectory_packets.json']+(['predictions.json'] if pp.exists() else [])
 if gp:sources+=['fixture/track_source.json','fixture/planning_reference.csv']
 provenance[ident]={str(Path(source)/n):hashlib.sha256((root/n).read_bytes()).hexdigest() for n in sources}
 write(ident+'.json',data)
 index.append(dict(id=ident,title=title,description=description,rejected=rejected,duration=data['duration'],file=ident+'.json',source=source))
 print(ident,len(states),'states',len(packets),'packets',round((BENCH/'data'/ (ident+'.json.gz')).stat().st_size/1024),'KiB gzip')

live_track=ClosedTrack.from_waypoints(circle_waypoints(15,count=128),left_width=.6,right_width=.9)
write('live-track.json',geometry(live_track))
# Independent Python model oracle: exact geometry, all stages, both tire selections.
oracle=[]
for mode in ['constant','step']:
 for model_name in ['kinematic','dynamic-linear','dynamic-grip']:
  for speed,delta,mass,stiffness in [(2,.02,2,45),(1.5,.03,2.5,36)]:
   from dataclasses import replace
   p=replace(PARAMS,mass=mass,front_cornering_stiffness=stiffness,rear_cornering_stiffness=stiffness)
   initial_delta=delta if mode=='constant' else 0
   beta=math.atan(.5*math.tan(initial_delta))
   x=np.array([speed,speed*math.tan(beta),speed/.15*math.tan(beta),-beta,1.,0.])
   if model_name=='kinematic':model=KinematicBicycle(p,live_track)
   elif model_name=='dynamic-grip':model=DynamicBicycle(p,live_track,tire_physics=RACING_TIRE_PHYSICS)
   else:model=DynamicBicycle(p,live_track)
   initial=x.tolist();checkpoints=[]
   for step in range(800):
    u=np.array([delta if mode=='constant' or step*.005>=1-1e-12 else 0.,0.])
    x=model.step(x,u,.005)
    if step in [0,199,399,799]:checkpoints.append(dict(step=step+1,state=x.tolist()))
   oracle.append(dict(mode=mode,model=model_name,speed=speed,delta=delta,mass=mass,stiffness=stiffness,initial=initial,checkpoints=checkpoints))
write('oracle.json',oracle)
write('catalog.json',dict(cases=index,parameters=dict(mass=2,yaw_inertia=.025,lf=.15,lr=.15,cg_height=.04,cf=45,cr=45,mu=1,maximum_speed=6,maximum_steering_angle=.4,maximum_acceleration=2,maximum_braking_deceleration=3),snapshot_date='2026-10-06',state_order=['vx','vy','r','e_psi','s_abs','e_y']))
(BENCH/'data/provenance.json').write_text(json.dumps(provenance,indent=2))
