import { useState } from "react";
import PixelDiff from "./PixelDiff";

/*  HIDE TAB  */
export function HideControls({ imgData, imgSrc, capacity, onHide, stegoUrl, stegoData }) {
  const [message, setMessage]   = useState("");
  const [password, setPassword] = useState("");
  const [showDiff, setShowDiff] = useState(false);

  const msgBytes = new TextEncoder().encode(message).length;
  const capPct   = capacity ? Math.min(100, Math.round((msgBytes / capacity) * 100)) : 0;
  const capColor = capPct > 80 ? "#ff3b5c" : capPct > 50 ? "#ffd166" : "#00ff88";

  return (
    <>
      {capacity !== null && (
        <div>
          <div className="cap-row">
            <span>Payload Capacity</span>
            <span style={{ color: capColor }}>{msgBytes} / {capacity} bytes ({capPct}%)</span>
          </div>
          <div className="cap-bar-track">
            <div
              className="cap-bar-fill"
              style={{ width: `${capPct}%`, background: capColor, boxShadow: `0 0 8px ${capColor}` }}
            />
          </div>
        </div>
      )}

      <div>
        <div className="field-label">Secret Message</div>
        <textarea
          className="cyber-input"
          rows={4}
          placeholder="Enter text to hide in the image pixels..."
          value={message}
          onChange={e => setMessage(e.target.value)}
        />
      </div>

      <div>
        <div className="field-label">Password (optional — scrambles bit positions)</div>
        <input
          className="cyber-input"
          type="password"
          placeholder="Leave empty for sequential LSB"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      <button className="cyber-btn" onClick={() => onHide(message, password)}>
        ▶ Encode &amp; Inject
      </button>

      {stegoUrl && (
        <div className="reveal-anim" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div className="preview-grid">
            <div className="img-preview">
              <img src={imgSrc} alt="original" />
              <div className="img-label">Original</div>
            </div>
            <div className="img-preview">
              <img src={stegoUrl} alt="stego" />
              <div className="img-label stego">Stego Output</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <a className="download-link" href={stegoUrl} download="stego_output.png">↓ Download Stego PNG</a>
            <button className="diff-toggle" onClick={() => setShowDiff(d => !d)}>
              <span className={`chevron ${showDiff ? "open" : ""}`}>›</span>
              Pixel Diff View
            </button>
          </div>

          {showDiff && (
            <div className="reveal-anim">
              <div className="panel-header">
                <div className="accent-dot orange" />
                Magnified Pixel Diff (32×32 sample) — Green = Modified LSB
              </div>
              <div style={{ padding: 12, background: "#060a0b" }}>
                <PixelDiff original={imgData} modified={stegoData} zoom={6} />
              </div>
              <div className="diff-note">
                Each green cell = 1 pixel where R/G/B LSB was flipped. Changes invisible at normal scale — diff ≤ 1/channel.
              </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}

/*  EXTRACT TAB  */
export function ExtractControls({ onExtract, extracted }) {
  const [password, setPassword] = useState("");

  const hexView = extracted && extracted !== "[no hidden data found]"
    ? [...new TextEncoder().encode(extracted.replace(/\x00/g, ""))]
        .map(b => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ")
    : null;

  return (
    <>
      <div>
        <div className="field-label">Password (if encoded with one)</div>
        <input
          className="cyber-input"
          type="password"
          placeholder="Leave empty if no password was used"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </div>

      <button className="cyber-btn extract-btn" onClick={() => onExtract(password)}>
        ⬡ Decode &amp; Extract
      </button>

      {extracted && (
        <div className="reveal-anim" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div>
            <div className="field-label">Extracted Data</div>
            <div className="extracted-out">{extracted}</div>
          </div>
          {hexView && (
            <div>
              <div className="field-label">Hex View</div>
              <div className="hex-display">{hexView}</div>
            </div>
          )}
        </div>
      )}
    </>
  );
}