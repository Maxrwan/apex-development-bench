// Canonical state [vx, vy, r, e_psi, s_abs, e_y], control [delta, a_cmd], SI.
export const DT = 0.005;
export const DEFAULTS = Object.freeze({speed:2,delta:.02,mass:2,stiffness:45,tire:'linear'});
export const wrap = a => {const v=((a+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;return v===-Math.PI?Math.PI:v;};
export function lastAt(rows,t,key=r=>r[0]){let lo=0,hi=rows.length;while(lo<hi){const m=(lo+hi)>>1;if(key(rows[m])<=t+1e-10)lo=m+1;else hi=m;}return lo-1;}
const gaussX=[-.9602898564975363,-.7966664774136267,-.525532409916329,-.1834346424956498,.1834346424956498,.525532409916329,.7966664774136267,.9602898564975363];
const gaussW=[.1012285362903763,.2223810344533745,.3137066458778873,.362683783378362,.362683783378362,.3137066458778873,.2223810344533745,.1012285362903763];
export class Track {
 constructor(data){Object.assign(this,data);}
 poly(i,z,d=0){const c=this.coefficients;return [0,1].map(j=>d===0?((c[0][i][j]*z+c[1][i][j])*z+c[2][i][j])*z+c[3][i][j]:d===1?(3*c[0][i][j]*z+2*c[1][i][j])*z+c[2][i][j]:6*c[0][i][j]*z+2*c[1][i][j]);}
 integral(i,h){let sum=0;for(let k=0;k<8;k++){const v=this.poly(i,h*(gaussX[k]+1)/2,1);sum+=gaussW[k]*Math.hypot(...v);}return sum*h/2;}
 sample(s){const w=((s%this.length)+this.length)%this.length;const i=Math.min(lastAt(this.arc,w,v=>v),this.q.length-2);const target=w-this.arc[i],h=this.q[i+1]-this.q[i];let z=h*target/(this.arc[i+1]-this.arc[i]),lo=0,hi=h;
  for(let n=0;n<14;n++){const err=this.integral(i,z)-target;if(Math.abs(err)<2e-13)break;if(err>0)hi=z;else lo=z;const deriv=Math.hypot(...this.poly(i,z,1)),next=z-err/deriv;z=next>=lo&&next<=hi?next:(lo+hi)/2;}
  const p=this.poly(i,z),v=this.poly(i,z,1),a=this.poly(i,z,2);return {s:w,x:p[0]+this.origin[0],y:p[1]+this.origin[1],heading:wrap(Math.atan2(v[1],v[0])),curvature:(v[0]*a[1]-v[1]*a[0])/Math.hypot(...v)**3,left:this.left,right:this.right};
 }
 pose(x){const g=this.sample(x[4]);return {x:g.x-x[5]*Math.sin(g.heading),y:g.y+x[5]*Math.cos(g.heading),heading:wrap(g.heading+x[3]),g};}
}
function check(x,u,p,kind){if(![...x,...u].every(Number.isFinite))throw Error('Nonfinite state or command');if(x[4]<0)throw Error('Progress left the nonnegative domain');if(x[0]<(kind==='kinematic'?-1e-10:.5-1e-10)||x[0]>6+1e-10)throw Error('Speed outside model validity');if(Math.abs(u[0])>.4||u[1]<-3||u[1]>2)throw Error('Input outside synthetic vehicle bounds');if(p.mass<=0||p.stiffness<=0)throw Error('Invalid synthetic parameters');}
export function diagnostics(x,u,p,track,kind='dynamic'){
 check(x,u,p,kind);const g=track.sample(x[4]),D=1-g.curvature*x[5];if(D<=.001)throw Error('Frenet denominator <= 0.001');
 if(kind==='kinematic'){const beta=Math.atan(.5*Math.tan(u[0]));return {beta,vy:x[0]*Math.tan(beta),r:x[0]/.15*Math.tan(beta),D,g};}
 const af=u[0]-Math.atan2(x[1]+.15*x[2],x[0]),ar=-Math.atan2(x[1]-.15*x[2],x[0]);
 const fz0=p.mass*9.81/2,transfer=p.mass*u[1]*.04/.3,fzf=fz0-transfer,fzr=fz0+transfer;if(Math.min(fzf,fzr)<=1e-9)throw Error('Axle unloading');
 const fx=p.mass*u[1],fxf=fx*fzf/(fzf+fzr),fxr=fx-fxf;
 const force=(alpha,fz,fx)=>{const linear=p.stiffness*fz/fz0*alpha;if(p.tire==='linear')return linear;if(Math.abs(fx)>(1-1e-6)*fz)throw Error('Longitudinal grip domain violated');const cap=Math.sqrt(fz*fz-fx*fx);return cap*Math.tanh(linear/cap);};
 const fyf=force(af,fzf,fxf),fyr=force(ar,fzr,fxr);return {af,ar,fyf,fyr,fzf,fzr,fx,fxf,fxr,D,g,beta:Math.atan2(x[1],x[0]),ax:u[1],ay:(fyf+fyr)/p.mass,frontUtil:Math.hypot(fyf,fxf)/fzf,rearUtil:Math.hypot(fyr,fxr)/fzr};
}
export function derivative(x,u,p,track,kind){const d=diagnostics(x,u,p,track,kind),vy=kind==='kinematic'?d.vy:x[1],r=kind==='kinematic'?d.r:x[2];const ds=(x[0]*Math.cos(x[3])-vy*Math.sin(x[3]))/d.D,ey=x[0]*Math.sin(x[3])+vy*Math.cos(x[3]);return kind==='kinematic'?[u[1],0,0,r-d.g.curvature*ds,ds,ey]:[u[1]+r*vy,(d.fyf+d.fyr)/p.mass-r*x[0],(.15*d.fyf-.15*d.fyr)/.025,r-d.g.curvature*ds,ds,ey];}
export function stepModel(x,u,p,track,kind,dt=DT){if(!Number.isFinite(dt)||dt<=0)throw Error('Invalid timestep');check(x,u,p,kind);const stopping=kind==='kinematic'&&u[1]<0&&-u[1]*dt>=x[0],h=stopping?Math.max(0,x[0]/-u[1]):dt;const shifted=(k,f)=>x.map((v,i)=>v+h*f*k[i]);const k1=derivative(x,u,p,track,kind),k2=derivative(shifted(k1,.5),u,p,track,kind),k3=derivative(shifted(k2,.5),u,p,track,kind),k4=derivative(shifted(k3,1),u,p,track,kind);let y=x.map((v,i)=>v+h*(k1[i]+2*k2[i]+2*k3[i]+k4[i])/6);if(kind==='kinematic'){y[0]=stopping?0:Math.max(0,x[0]+u[1]*dt);const d=diagnostics(y,u,p,track,kind);y[1]=d.vy;y[2]=d.r;}y[3]=wrap(y[3]);diagnostics(y,u,p,track,kind);return y;}
export function initialState(p,mode){const delta=mode==='constant'?p.delta:0,beta=Math.atan(.5*Math.tan(delta));return [p.speed,p.speed*Math.tan(beta),p.speed/.15*Math.tan(beta),-beta,1,0];}
export class LiveSession{
 constructor(track,params,mode){this.track=track;this.params={...params};this.mode=mode;this.reset();}
 reset(){this.tick=0;this.states={kinematic:initialState(this.params,this.mode),dynamic:initialState(this.params,this.mode)};this.history=[this.snapshot()];this.error=null;}
 control(time=this.tick*DT){return [this.mode==='constant'||time>=1-1e-12?this.params.delta:0,0];}
 advance(){if(this.tick>=800||this.error)return false;try{const u=this.control();const next={};for(const kind of ['kinematic','dynamic'])next[kind]=stepModel(this.states[kind],u,this.params,this.track,kind);this.states=next;this.tick++;this.history.push(this.snapshot());if(this.history.length>4001)this.history.shift();return true;}catch(e){this.error=e.message;return false;}}
 snapshot(){return {time:this.tick*DT,kinematic:[...this.states.kinematic],dynamic:[...this.states.dynamic]};}
}
export function samplePacket(p,t){if(!p||t<p.timestamps[0]-1e-10||t>=p.horizon_end_time-1e-10)return null;const i=Math.min(lastAt(p.timestamps,t,v=>v),p.controls.length-1),a=Math.max(0,Math.min(1,(t-p.timestamps[i])/(p.timestamps[i+1]-p.timestamps[i])));const x=p.states[i].map((v,j)=>v*(1-a)+p.states[i+1][j]*a),gi=Math.max(0,lastAt(p.gain_times,t,v=>v));return {x,u:p.controls[i],gain:p.gains[gi],index:i,reserve:p.horizon_end_time-t};}
export class ReplaySession{
 constructor(data){this.data=data;this.track=new Track(data.track);this.tick=0;this.planMap=new Map(data.plans.map(p=>[p.plan_id,p]));this.packetMap=new Map();for(const p of data.packets){if(!this.packetMap.has(p.plan_id))this.packetMap.set(p.plan_id,[]);this.packetMap.get(p.plan_id).push(p);}}
 get duration(){return this.data.duration;}
 advance(){if((this.tick+1)*DT>this.duration+1e-10)return false;this.tick++;return true;}
 seek(t){this.tick=Math.max(0,Math.min(Math.floor(this.duration/DT+1e-8),Math.round(t/DT)));}
 snapshot(t=this.tick*DT){const d=this.data;let i=Math.max(0,lastAt(d.states,t)),a=d.states[i],b=d.states[Math.min(i+1,d.states.length-1)],f=b[0]>a[0]?Math.min(1,Math.max(0,(t-a[0])/(b[0]-a[0]))):0;const x=a.slice(1,7).map((v,j)=>j===3?wrap(v+wrap(b[j+1]-v)*f):v+(b[j+1]-v)*f),u=a.slice(7,9),planId=a[9],mode=a[12];
  const candidates=this.packetMap.get(planId)||[],p=mode==='trajectory'?candidates.filter(p=>p.actual_completion_time<=t+1e-10&&p.timestamps[0]<=t+1e-10).at(-1):null;
  const nominal=samplePacket(p,t),plan=this.planMap.get(planId)||null,prediction=p?d.predictions[String(planId)]||null:null;const ci=lastAt(d.controls,t,r=>r.application_time??r.time),control=ci>=0?d.controls[ci]:null;
  return {time:t,x,u,planId,mode,p,nominal,plan,prediction,control,frontUtil:a[10],rearUtil:a[11],pose:this.track.pose(x),interpolated:f>1e-10};
 }
 counters(t=this.tick*DT){const e=this.data.events;return {misses:(e.misses||[]).filter(v=>(v.time??v.release_time)<=t+1e-10).length,fallbacks:(e.fallbacks||[]).filter(v=>v.time<=t+1e-10).length,handoffs:(e.handoffs||[]).filter(v=>v.time<=t+1e-10&&v.accepted).length};}
}
