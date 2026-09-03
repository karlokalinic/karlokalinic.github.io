#!/usr/bin/env python3
from __future__ import annotations
import argparse, json, re
from collections import Counter, defaultdict
from pathlib import Path
import UnityPy

def safe(v,f):
    v=re.sub(r"[^A-Za-z0-9._-]+","_",v or "").strip("._")
    return (v or f)[:120]
def key(r): return f"{r.assets_file.name}:{r.path_id}"
def deref(p):
    if not p or getattr(p,"m_PathID",0)==0: return None
    try: return p.deref()
    except Exception: return None
def v3(v): return [float(v.x),float(v.y),float(v.z)]
def quat(q): return [float(q.x),float(q.y),float(q.z),float(q.w)]
def scene_key(n):
    m=re.fullmatch(r"level(\d+)",n,re.I)
    return int(m.group(1)) if m else 999999

def main():
    ap=argparse.ArgumentParser(); ap.add_argument("bundle",type=Path); ap.add_argument("out",type=Path); a=ap.parse_args()
    out=a.out.resolve(); md=out/"meshes"; md.mkdir(parents=True,exist_ok=True)
    env=UnityPy.load(str(a.bundle.resolve())); objects=list(env.objects); counts=Counter(o.type.name for o in objects)
    names={}; transforms={}; tr_by_go={}; trkey_by_go={}; enabled={}; errors=[]
    for o in objects:
        if o.type.name!="GameObject": continue
        try:
            g=o.parse_as_object(); names[key(o)]=getattr(g,"m_Name","") or f"GameObject-{o.path_id}"
        except Exception as e: errors.append({"type":"GameObject","id":o.path_id,"error":repr(e)})
    for o in objects:
        if o.type.name not in {"MeshRenderer","SkinnedMeshRenderer"}: continue
        try:
            r=o.parse_as_object(); g=deref(r.m_GameObject)
            if g: enabled[key(g)]=bool(getattr(r,"m_Enabled",True))
        except Exception as e: errors.append({"type":o.type.name,"id":o.path_id,"error":repr(e)})
    for o in objects:
        if o.type.name!="Transform": continue
        try:
            t=o.parse_as_object(); g=deref(t.m_GameObject)
            if not g: continue
            gk=key(g); tk=key(o); p=deref(t.m_Father)
            x={"id":tk,"go":gk,"name":names.get(gk,f"GameObject-{g.path_id}"),"assetFile":o.assets_file.name,"parent":key(p) if p else None,"position":v3(t.m_LocalPosition),"rotation":quat(t.m_LocalRotation),"scale":v3(t.m_LocalScale)}
            transforms[tk]=x; tr_by_go[gk]=x; trkey_by_go[gk]=tk
        except Exception as e: errors.append({"type":"Transform","id":o.path_id,"error":repr(e)})
    exported={}; instances=[]
    def add_mesh(mr,gr,kind):
        mk=key(mr)
        if mk not in exported:
            m=mr.parse_as_object(); fn=f"{safe(getattr(m,'m_Name',''),f'mesh-{mr.path_id}')}-{mr.path_id}.obj"
            (md/fn).write_text(m.export(),encoding="utf-8",newline=""); exported[mk]=f"meshes/{fn}"
        gk=key(gr); tk=trkey_by_go.get(gk)
        if not tk: return
        instances.append({"go":gk,"transform":tk,"name":names.get(gk,f"GameObject-{gr.path_id}"),"mesh":exported[mk],"meshKey":mk,"source":kind,"enabled":enabled.get(gk,True),"assetFile":tr_by_go[gk]["assetFile"]})
    for o in objects:
        if o.type.name!="MeshFilter": continue
        try:
            x=o.parse_as_object(); g=deref(x.m_GameObject); m=deref(x.m_Mesh)
            if g and m: add_mesh(m,g,"MeshFilter")
        except Exception as e: errors.append({"type":"MeshFilter","id":o.path_id,"error":repr(e)})
    for o in objects:
        if o.type.name!="SkinnedMeshRenderer": continue
        try:
            x=o.parse_as_object(); g=deref(x.m_GameObject); m=deref(x.m_Mesh)
            if g and m: add_mesh(m,g,"SkinnedMeshRenderer")
        except Exception as e: errors.append({"type":"SkinnedMeshRenderer","id":o.path_id,"error":repr(e)})
    cameras=[]
    for o in objects:
        if o.type.name!="Camera": continue
        try:
            c=o.parse_as_object(); g=deref(c.m_GameObject)
            if not g: continue
            gk=key(g); t=tr_by_go.get(gk)
            if not t: continue
            cameras.append({"go":gk,"transform":t["id"],"name":names.get(gk,"Camera"),"assetFile":t["assetFile"],"enabled":bool(getattr(c,"m_Enabled",True)),"fov":float(getattr(c,"field_of_view",60.0)),"near":float(getattr(c,"near_clip_plane",0.03)),"far":float(getattr(c,"far_clip_plane",1000.0))})
        except Exception as e: errors.append({"type":"Camera","id":o.path_id,"error":repr(e)})
    by=defaultdict(lambda:{"transforms":[],"instances":[],"cameras":[]})
    for t in transforms.values(): by[t["assetFile"]]["transforms"].append(t)
    for i in instances: by[i["assetFile"]]["instances"].append(i)
    for c in cameras: by[c["assetFile"]]["cameras"].append(c)
    level_names=sorted((n for n,d in by.items() if d["instances"] and re.fullmatch(r"level\d+",n,re.I)),key=scene_key)
    if not level_names: raise SystemExit("No levelN serialized scenes found")
    scenes=[{"id":n,"label":n,"transforms":by[n]["transforms"],"instances":by[n]["instances"],"cameras":by[n]["cameras"]} for n in level_names]
    visible=sum(len(s["instances"]) for s in scenes)
    manifest={"format":"predroden-native-scene-v2","source":a.bundle.name,"counts":dict(counts),"meshFiles":len(exported),"meshInstances":visible,"sceneCount":len(scenes),"scenes":scenes,"errors":errors[:100]}
    (out/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,separators=(",",":")),encoding="utf-8")
    print(f"SCENES={len(scenes)} MESH_FILES={len(exported)} LEVEL_INSTANCES={visible} ERRORS={len(errors)}")
    for s in scenes: print(f"{s['id']} transforms={len(s['transforms'])} instances={len(s['instances'])} cameras={len(s['cameras'])}")
    if errors: raise SystemExit(f"Export completed with {len(errors)} errors")
if __name__=="__main__": main()
