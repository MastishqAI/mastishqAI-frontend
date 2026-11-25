import { useState } from "react";
import { Icon } from "./icons.jsx";

export const REPORT_REASONS = ["Incorrect answer or question", "Unclear wording or typo", "Inappropriate content", "Something else"];

// Report-question modal (Figma 2174:917). onSubmit(reason, note) may return a promise.
export default function ReportDialog({ onSubmit, onClose }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const send = async () => { setBusy(true); try { await onSubmit(reason, note.trim()); } finally { setBusy(false); } };
  return (
    <div className="modal-bg" role="dialog" aria-modal="true" aria-labelledby="report-title" onClick={onClose}>
      <div className="modal report" onClick={(e) => e.stopPropagation()}>
        <div className="rp-head">
          <h3 id="report-title"><Icon.flag size={18} />Report this question</h3>
          <button type="button" className="rp-x" aria-label="Close" onClick={onClose}><Icon.x size={18} /></button>
        </div>
        <p className="rp-intro">Help us improve this question. What seems wrong?</p>
        <fieldset className="reasons">
          <legend>Reason for reporting</legend>
          {REPORT_REASONS.map((r) => (
            <label key={r}><input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} />{r}</label>
          ))}
        </fieldset>
        <label className="rp-lbl" htmlFor="report-note">Additional details (optional)</label>
        <div className="rp-area">
          <textarea id="report-note" maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell us what needs to be corrected..." />
          <span className="rp-count">{note.length} / 300</span>
        </div>
        <p className="rp-help">Your feedback helps us improve the question bank.</p>
        <div className="rp-actions">
          <button type="button" className="rp-cancel" onClick={onClose}>Cancel</button>
          <button type="button" className="rp-submit" disabled={busy} onClick={send}>Submit report</button>
        </div>
      </div>
    </div>
  );
}
