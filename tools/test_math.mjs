import fs from 'node:fs';
import assert from 'node:assert/strict';
import {Track,stepModel,ReplaySession,DT,wrap,LiveSession,DEFAULTS} from '../web/engine.mjs';
const root=new URL('../',import.meta.url);const read=n=>JSON.parse(fs.readFileSync(new URL('data/'+n,root),'utf8'));
const track=new Track(read('live-track.json'));let worst=0;let count=0;
for(const row of read('oracle.json')){const p={speed:row.speed,delta:row.delta,mass:row.mass,stiffness:row.stiffness,tire:row.model==='dynamic-grip'?'grip':'linear'};const kind=row.model==='kinematic'?'kinematic':'dynamic';let x=row.initial;
 for(let i=0;i<800;i++){x=stepModel(x,[row.mode==='constant'||i*DT>=1-1e-12?p.delta:0,0],p,track,kind);const expected=row.checkpoints.find(c=>c.step===i+1);if(expected){const errors=x.map((v,j)=>Math.abs(j===3?wrap(v-expected.state[j]):v-expected.state[j]));worst=Math.max(worst,...errors);assert.ok(Math.max(...errors)<2e-8,JSON.stringify({row,step:i+1,errors}));count++;}}
}
let replayChecks=0;
for(const entry of read('catalog.json').cases){const data=read(entry.file),s=new ReplaySession(data);const first=s.snapshot();s.advance();assert.equal(s.tick*DT,.005);s.seek(0);assert.deepEqual(s.snapshot(),first);
 for(let i=0;i<Math.floor(data.duration/DT);i+=7){s.tick=i;const v=s.snapshot();assert.ok(v.x.every(Number.isFinite));if(v.control)assert.ok((v.control.application_time??v.control.time)<=v.time+1e-10);if(v.p){assert.ok(v.p.actual_completion_time<=v.time+1e-10);assert.ok(v.p.timestamps[0]<=v.time+1e-10);}if(v.nominal)assert.ok(v.time<v.p.horizon_end_time+1e-10);if(v.mode!=='trajectory')assert.equal(v.nominal,null);replayChecks++;}
}
const a=new LiveSession(track,{...DEFAULTS},'constant'),b=new LiveSession(track,{...DEFAULTS},'constant');for(let i=0;i<800;i++){a.advance();b.advance();}assert.deepEqual(a.states,b.states);a.reset();assert.equal(a.tick,0);assert.equal(a.history.length,1);
const c=new LiveSession(track,{...DEFAULTS,mass:2.5},'constant');for(let i=0;i<800;i++)c.advance();assert.ok(Math.abs(c.states.dynamic[5]-b.states.dynamic[5])>1e-4);
assert.throws(()=>stepModel([.4,0,0,0,1,0],[0,0],DEFAULTS,track,'dynamic'),/validity/);
assert.throws(()=>stepModel([2,0,0,0,1,0],[.5,0],DEFAULTS,track,'dynamic'),/bounds/);
const report={python_oracle_checkpoints:count,maximum_absolute_state_error:worst,replay_chronology_checks:replayChecks,determinism:true,parameters_affect_model:true,domain_guards:true};
fs.writeFileSync(new URL('validation/math-tests.json',root),JSON.stringify(report,null,2));console.log(report);
