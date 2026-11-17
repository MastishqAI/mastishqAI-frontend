import { useEffect, useRef, useState } from "react";
import api from "../api";

const MAX_FILES = 5;

// Shrinks photos before upload (phone cameras make 5-10 MB images; 1600px is plenty to read text and keeps the AI read cheap).
function prepareImage(blobOrFile, name) {
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

// "Upload file" + "Scan a page". Each file is read by the server as soon as it is added; `files` holds what was read.
export default function Attachments({ files, setFiles, onError }) {
  const pick = useRef(null);
  const photo = useRef(null);
  const [busy, setBusy] = useState(0);
  const [scan, setScan] = useState(false);

  const send = async (file) => {
    if (files.length + busy >= MAX_FILES) return onError(`You can add up to ${MAX_FILES} files.`);
    setBusy((n) => n + 1); onError("");
    try {
      const f = file.type.startsWith("image/") ? await prepareImage(file, file.name || "scan.jpg") : file;
      if (f.size > 8 * 1024 * 1024) throw new Error("That file is over 8 MB. Please use a smaller file or fewer pages.");
      const fd = new FormData(); fd.append("file", f);
      const r = await api.post("/materials", fd);
      setFiles((x) => [...x, r.material]);
    } catch (e) { onError(e.message); }
    finally { setBusy((n) => n - 1); }
  };

  const onPick = (e) => { [...e.target.files].forEach(send); e.target.value = ""; };
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
      <input ref={photo} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />

      {(files.length > 0 || busy > 0) && (
        <ul className="att-list">
          {files.map((m) => (
            <li key={m.id}><span className="att-name">{m.name}</span><small>{m.pages} {m.pages === 1 ? "page" : "pages"} read</small><button type="button" aria-label={`Remove ${m.name}`} onClick={() => remove(m)}>×</button></li>
          ))}
          {busy > 0 && <li className="att-busy"><span className="att-name">Reading {busy === 1 ? "your file" : `${busy} files`}…</span><small>a few seconds</small></li>}
        </ul>
      )}
      <p className="att-hint">The quiz will use your topic, your description and these files together. Files stay private to you and are deleted after 90 days.</p>

      {scan && <Scanner onClose={() => setScan(false)} onShot={(b) => { setScan(false); send(new File([b], `scan-${files.length + 1}.jpg`, { type: "image/jpeg" })); }} onFallback={() => { setScan(false); photo.current.click(); }} />}
    </>
  );
}
