import { useState, useRef, useCallback } from "react";
import "./index.css";
import { hideMessage, extractMessage, getCapacity } from "./util";
import { HideControls, ExtractControls } from "./components/Controls";

// GlitchText component for the logo, which applies a CSS glitch effect
function GlitchText({ children }) {
  return <span className="glitch-wrapper" data-text={children}>{children}</span>;
}

export default function App() {
  // vars
  const [tab, setTab] = useState("hide");
  const [imgSrc, setImgSrc] = useState(null);
  const [imgData, setImgData] = useState(null);
  const [capacity, setCapacity] = useState(null);
  const [status, setStatus] = useState(null);
  const [stegoUrl, setStegoUrl] = useState(null);
  const [stegoData, setStegoData] = useState(null);
  const [extracted, setExtracted] = useState("");
  const [glitching, setGlitching] = useState(false);

  // use Refs for file input and canvas
  const fileRef = useRef();
  const canvasRef = useRef();

  // Function to trigger a glitch effect on the logo by toggling the "glitching" state
  const triggerGlitch = () => {
    setGlitching(true);
    setTimeout(() => setGlitching(false), 600);
  };

  // loads the image to the file input 
  const loadImage = useCallback((file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx  = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, img.width, img.height);
      // Set the image data and source, calculate capacity, and reset stego/extracted data and status 
      setImgData(data);
      setImgSrc(url);
      setCapacity(getCapacity(img.width, img.height));
      setStegoUrl(null);
      setStegoData(null);
      setExtracted("");
      setStatus({ type: "info", msg: `Image loaded — ${img.width}×${img.height}px` });
    };
    img.src = url;
  }, []);

  // Handle file drop on the drop zone by preventing default behavior
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) loadImage(file);
  }, [loadImage]);

  // hide button handler looks at the difference between the original image data and the modified data with the hidden message
  function doHide(message, password) {
    if (!imgData) return setStatus({ type: "err", msg: "No image loaded" });
    if (!message.trim()) return setStatus({ type: "err", msg: "No message to hide" });
    try {
      triggerGlitch();
      const modified = hideMessage(imgData, message, password);
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const newImageData = new ImageData(modified, imgData.width, imgData.height);
      ctx.putImageData(newImageData, 0, 0);
      const url = canvas.toDataURL("image/png");
      setStegoUrl(url);
      setStegoData(modified);
      setStatus({ type: "ok", msg: `Hidden ${message.length} chars in ${imgData.width}×${imgData.height} image` });
    } catch (e) {
      setStatus({ type: "err", msg: e.message });
    }
  }

  // extract button handler reads the hidden message from the image data using the same password and updates the extracted state and status
  function doExtract(password) {
    if (!imgData) return setStatus({ type: "err", msg: "No image loaded" });
    try {
      triggerGlitch();
      const msg = extractMessage(imgData, password);
      setExtracted(msg || "[no hidden data found]");
      setStatus({ type: "ok", msg: msg ? `Extracted ${msg.length} chars` : "No data found" });
    } catch (e) {
      setStatus({ type: "err", msg: e.message });
    }
  }

  // html
  return (
    <>
      <div className="scanlines" />
      <div className="grid-bg" />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="app-wrapper">
        {/* Header */}
        <div className="header">
          <div>
            <div className={`logo ${glitching ? "glitching" : ""}`}>
              <GlitchText>BLACK</GlitchText>
              <em><GlitchText>PIXEL</GlitchText></em>
              <span style={{ color: "#5a7a88", fontSize: "0.9rem", marginLeft: 8 }}>v1.0</span>
            </div>
            <div className="logo-sub">LSB Steganography Engine — RGB Channel Injection</div>
          </div>
          <div className="online-badge">
            <div className="accent-dot" />
            <span>System Online</span>
          </div>
        </div>

        {/* Main panel */}
        <div className="panel">
          <div className="corner-bracket tl" />
          <div className="corner-bracket br" />

          <div className="tab-row">
            {[
              { id: "hide",    label: "// Hide Data" },
              { id: "extract", label: "// Extract Data" },
            ].map(t => (
              <button
                key={t.id}
                className={`tab-btn ${tab === t.id ? "active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="panel-body">

            {/* Drop Zone */}
            <div>
              <div className="field-label">Cover Image (PNG preferred)</div>
              <div
                className="drop-zone"
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileRef.current.click()}
              >
                <div className="drop-zone-corner tl" />
                <div className="drop-zone-corner tr" />
                <div className="drop-zone-corner bl" />
                <div className="drop-zone-corner br" />
                {imgSrc ? (
                  <img src={imgSrc} alt="cover" />
                ) : (
                  <>
                    <div className="drop-zone-icon">▦</div>
                    <div className="drop-zone-hint">Drop image or click to upload</div>
                    <div className="drop-zone-types">PNG · JPG · WEBP</div>
                  </>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={e => loadImage(e.target.files[0])}
              />
            </div>

            {tab === "hide" ? (
              <HideControls
                imgData={imgData}
                imgSrc={imgSrc}
                capacity={capacity}
                onHide={doHide}
                stegoUrl={stegoUrl}
                stegoData={stegoData}
              />
            ) : (
              <ExtractControls
                onExtract={doExtract}
                extracted={extracted}
              />
            )}
            
            {status && (
              <div className={`status-bar status-${status.type}`}>
                <span style={{ opacity: 0.7 }}>
                  {status.type === "ok" ? "✓" : status.type === "err" ? "X" : "ℹ"}
                </span>
                {status.msg}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="footer-tags">
          {["LSB-R/G/B Sequential", "Delimiter: 4× Null Byte", "Output: Lossless PNG"].map((t, i) => (
            <span key={i}><span className="hex-icon">⬡</span>{t}</span>
          ))}
        </div>
      </div>
    </>
  );
}