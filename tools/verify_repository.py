"""Verify every original file and Git status against the before-build snapshot."""
import hashlib,json,os,subprocess,time
from pathlib import Path
bench=Path(__file__).resolve().parents[1]
before=json.loads((bench/'validation/repository-before.json').read_text());repo=Path(before['repository'])
current={};start=time.time()
for root,dirs,files in os.walk(repo):
 for name in files:
  p=Path(root)/name;s=p.lstat();entry={'size':s.st_size,'mtime_ns':s.st_mtime_ns,'mode':s.st_mode}
  if p.is_symlink():entry['link']=os.readlink(p)
  elif p.is_file():
   h=hashlib.sha256()
   with p.open('rb') as f:
    for b in iter(lambda:f.read(1024*1024),b''):h.update(b)
   entry['sha256']=h.hexdigest()
  current[str(p.relative_to(repo))]=entry
added=sorted(set(current)-set(before['files']));removed=sorted(set(before['files'])-set(current));changed=[p for p in current.keys()&before['files'].keys() if current[p]!=before['files'][p]]
status=subprocess.check_output(['git','--no-optional-locks','status','--porcelain=v1','--untracked-files=all'],cwd=repo,text=True)
report=dict(repository=str(repo),bench=str(bench),date='2026-10-06',files_verified=len(current),content_and_mtime_checks=True,includes_git_and_original_environment=True,added=added,removed=removed,changed=changed,git_status_identical=status==before['git_status'],original_repository_unchanged=not(added or removed or changed) and status==before['git_status'],verification_seconds=time.time()-start)
(bench/'validation/repository-preservation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2));raise SystemExit(0 if report['original_repository_unchanged'] else 1)
