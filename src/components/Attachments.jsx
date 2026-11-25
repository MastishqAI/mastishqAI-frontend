import { useEffect, useRef, useState } from "react";
import api from "../api";

const MAX_FILES = 5;

// Shrinks photos before upload (phone cameras make 5-10 MB images; 1600px is plenty to read text and keeps the AI read cheap).
export function prepareImage(blobOrFile, name) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blobOrFile);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      const g = c.getContext("2d");
      g.fillStyle = "#fff"; g.fillRect(0, 0, c.width, c.height);      // transparent PNGs would turn black in a JPEG
      g.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      c.toBlob((b) => (b ? resolve(new File([b], name, { type: "image/jpeg" })) : reject(new Error("Couldn't prepare that image."))), "image/jpeg", 0.85);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Couldn't open that image.")); };
    img.src = url;
  });
}

function Scanner({ onShot, onClose, onFallback }) {
  const video = useRef(null);
  const stream = useRef(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let live = true;
    if (!navigator.mediaDevices?.getUserMedia) { onFallback(); return; }
    navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then((s) => { if (!live) return s.getTracks().forEach((t) => t.stop()); stream.current = s; video.current.srcObject = s; video.current.play(); })
      .catch(() => setErr("We couldn't use your camera. Allow camera access in your browser, or choose a photo instead."));
    return () => { live = false; stream.current?.getTracks().forEach((t) => t.stop()); };
  }, []);

  const snap = () => {
    const v = video.current;
    if (!v?.videoWidth) return;
    const c = document.createElement("canvas");
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0);
    c.toBlob((b) => b && onShot(b), "image/jpeg", 0.9);
  };

  return (
    <div className="scan-back" onClick={onClose}>
      <div className="scan-box" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Scan a page">
        <h3>Scan a page</h3>
        {err ? <p className="scan-err">{err}</p> : <video ref={video} playsInline muted />}
        <p className="scan-tip">Hold the page flat, in good light, so the text fills the frame.</p>
        <div className="scan-actions">
          <button type="button" className="btn outline" onClick={onClose}>Cancel</button>
          {err ? <button type="button" className="btn" onClick={onFallback}>Choose a photo</button> : <button type="button" className="btn" onClick={snap}>Capture</button>}
        </div>
      </div>
    </div>
  );
}

const sizeText = (b = 0) => (b >= 1048576 ? `${(b / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const kindOf = (name = "", mime = "") => (/pdf/i.test(mime) || /\.pdf$/i.test(name) ? ["PDF", "pdf"] : /png/i.test(mime) || /\.png$/i.test(name) ? ["PNG", "img"] : ["JPG", "img"]);

// "Upload file" + "Scan a page". Files are read one after another; each row shows waiting, scanning with progress, then what was found.
export default function Attachments({ files, setFiles, onError, onScanning }) {
  const pick = useRef(null);
  const photo = useRef(null);
  const [queue, setQueue] = useState([]);
  const [scan, setScan] = useState(false);
  const chain = useRef(Promise.resolve());
  const counts = useRef({ files: 0, queued: 0 });
  counts.current.files = files.length;
  useEffect(() => { onScanning?.(queue.length); }, [queue.length]);

  const run = async (key, file, source) => {
    setQueue((q) => q.map((i) => (i.key === key ? { ...i, status: "scanning", pct: 4 } : i)));
    let timer;
    const set = (pct) => setQueue((q) => q.map((i) => (i.key === key ? { ...i, pct: Math.max(i.pct, pct) } : i)));
    try {
      const f = file.type.startsWith("image/") ? await prepareImage(file, file.name || "scan.jpg") : file;
      if (f.size > 8 * 1024 * 1024) throw new Error("That file is over 8 MB. Please use a smaller file or fewer pages.");
      const fd = new FormData(); fd.append("file", f);
      const r = await api.post("/materials", fd, { onUploadProgress: (e) => { if (e.total) { set(Math.round((e.loaded / e.total) * 55)); if (e.loaded >= e.total && !timer) timer = setInterval(() => set(Math.min(95, 60 + Math.random() * 35)), 500); } } });
      setFiles((x) => [...x, { ...r.material, source }]);
    } catch (e) { onError(e.message); }
    finally { clearInterval(timer); setQueue((q) => q.filter((i) => i.key !== key)); counts.current.queued -= 1; }
  };

  const add = (file, source = "upload") => {
    if (counts.current.files + counts.current.queued >= MAX_FILES) return onError(`You can add up to ${MAX_FILES} files.`);
    onError("");
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    counts.current.queued += 1;
    setQueue((q) => [...q, { key, name: file.name || "scan.jpg", size: file.size, mime: file.type, source, status: "waiting", pct: 0 }]);
    chain.current = chain.current.then(() => run(key, file, source));      // one at a time, so "Waiting to scan" is real
  };

  const onPick = (e) => { [...e.target.files].forEach((f) => add(f)); e.target.value = ""; };
  const remove = async (m) => {
    setFiles((x) => x.filter((y) => y.id !== m.id));
    try { await api.delete(`/materials/${m.id}`); } catch { /* already gone is fine */ }
  };

  return (
    <>
      <div className="drops">
        <div className="drop" role="button" tabIndex={0} onClick={() => pick.current.click()} onKeyDown={(e) => e.key === "Enter" && pick.current.click()}><b>Upload file</b><span>PDF · JPG · PNG</span></div>
        <div className="drop" role="button" tabIndex={0} onClick={() => setScan(true)} onKeyDown={(e) => e.key === "Enter" && setScan(true)}><b>Scan a page</b><span>Use your camera</span></div>
      </div>
      <input ref={pick} type="file" accept="application/pdf,image/png,image/jpeg" multiple hidden onChange={onPick} />
      <input ref={photo} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { [...e.target.files].forEach((f) => add(f, "camera")); e.target.value = ""; }} />

      {(files.length > 0 || queue.length > 0) && (
        <ul className="mat-list">
          {files.map((m) => {
            const [label, tone] = kindOf(m.name, m.mime);
            return (
              <li key={m.id} className="done">
                <span className={`ft ${tone}`}>{label}</span>
                <div className="info"><b title={m.name}>{m.name}</b><small>{sizeText(m.size)} · {m.source === "camera" ? "scanned with camera" : `${m.pages} ${m.pages === 1 ? "page" : "pages"}`}</small></div>
                <span className="ok"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5" /></svg> Scanned{m.topics?.length ? ` · ${m.topics.length} topic${m.topics.length > 1 ? "s" : ""} found` : ""}</span>
                <button type="button" className="x" aria-label={`Remove ${m.name}`} onClick={() => remove(m)}>×</button>
              </li>
            );
          })}
          {queue.map((q) => {
            const [label, tone] = kindOf(q.name, q.mime);
            return (
              <li key={q.key}>
                <span className={`ft ${tone}`}>{label}</span>
                <div className="info"><b title={q.name}>{q.name}</b><small>{sizeText(q.size)} · {q.source === "camera" ? "scanned with camera" : "uploading"}</small></div>
                {q.status === "scanning"
                  ? <span className="prog"><em>Scanning… {Math.round(q.pct)}%</em><i><u style={{ width: `${q.pct}%` }} /></i></span>
                  : <span className="wait">Waiting to scan</span>}
              </li>
            );
          })}
        </ul>
      )}
      <p className="att-hint">The quiz will use your topic, your description and these files together. Files stay private to you and are deleted after 90 days.</p>

      {scan && <Scanner onClose={() => setScan(false)} onShot={(b) => { setScan(false); add(new File([b], `scan-${Date.now() % 10000}.jpg`, { type: "image/jpeg" }), "camera"); }} onFallback={() => { setScan(false); photo.current.click(); }} />}
    </>
  );
}
