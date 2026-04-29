import { useState, useEffect, useRef } from "react";
import { Camera, MapPin, Send, X, CheckCircle, AlertCircle, Loader } from "lucide-react";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { awardPoints } from "../lib/auth.js";

const SEVERITY_PTS = { low: 15, medium: 20, high: 30 };
const MAX_DIST_KM  = 10; // max distance from quest zone

const LITTER_TYPES = [
  { id: "plastic_bottles", label: "Bottles",  emoji: "🍶" },
  { id: "plastic_bags",    label: "Bags",     emoji: "🛍️" },
  { id: "foam",            label: "Foam",     emoji: "🔲" },
  { id: "rope",            label: "Rope",     emoji: "🧵" },
  { id: "organic",         label: "Organic",  emoji: "🌿" },
  { id: "mixed",           label: "Mixed",    emoji: "♻️" },
  { id: "algae_bloom",     label: "Algae",    emoji: "🟢" },
];

// Haversine distance in km
function distanceKm(lat1, lng1, lat2, lng2) {
  const R  = 6371;
  const dL = (lat2 - lat1) * Math.PI / 180;
  const dG = (lng2 - lng1) * Math.PI / 180;
  const a  = Math.sin(dL / 2) ** 2 +
             Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
             Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function compressToBase64(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement("canvas");
      const scale  = Math.min(1, 1200 / Math.max(img.width, img.height));
      canvas.width  = img.width  * scale;
      canvas.height = img.height * scale;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error("Compression failed"));
        const reader = new FileReader();
        reader.onload = e => resolve({
          base64: e.target.result.split(",")[1],
          blob,
        });
        reader.readAsDataURL(blob);
      }, "image/jpeg", 0.75);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

const STEPS = ["📷 Photo", "📍 Location check", "🤖 AI check", "✅ Done"];

export function PhotoUpload({ questId, team, quest }) {
  const { user, refreshProfile } = useAuth() || {};
  const [photo,      setPhoto]      = useState(null);
  const [preview,    setPreview]    = useState(null);
  const [gps,        setGps]        = useState(null);
  const [litterType, setLitterType] = useState("mixed");
  const severity = "medium";
  const [step,       setStep]       = useState(0); // 0=idle,1=loc,2=ai,3=done
  const [result,     setResult]     = useState(null);
  const [error,      setError]      = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.warn("GPS:", err.message),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
    setStep(0);
  }

  function clearPhoto() {
    setPhoto(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
    setStep(0);
  }

  async function handleSubmit() {
    if (!photo || !gps) return;
    if (!supabase) { setError("Supabase not configured."); return; }

    setError(null);

    // ── Step 1: GPS proximity check ──────────────────────────────────────────
    setStep(1);
    const testMode = localStorage.getItem("wq_test_mode") === "1";
    const zoneData = team === "A" ? quest?.quest_a : quest?.quest_b;
    if (!testMode && zoneData?.lat && zoneData?.lng) {
      const dist = distanceKm(gps.lat, gps.lng, zoneData.lat, zoneData.lng);
      if (dist > MAX_DIST_KM) {
        setError(`You're ${dist.toFixed(1)} km from the ${zoneData.zone} quest zone. Get within ${MAX_DIST_KM} km to submit.`);
        setStep(0);
        return;
      }
    }

    // ── Step 2: AI photo classification ──────────────────────────────────────
    setStep(2);
    let aiResult = null;
    try {
      const { base64, blob } = await compressToBase64(photo);

      const { data, error: fnErr } = await supabase.functions.invoke("classify-photo", {
        body: { imageBase64: base64 },
      });

      if (fnErr) throw new Error(fnErr.message);
      aiResult = data;

      if (!aiResult?.is_valid_pollution) {
        const reason = aiResult?.rejection_reason?.replace(/_/g, " ") || "no pollution detected";
        setError(`Photo rejected: ${reason}. Make sure your photo clearly shows pollution near water.`);
        setStep(0);
        return;
      }

      // ── Step 3: Upload + save ─────────────────────────────────────────────
      setStep(3);
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
      const { error: uploadErr } = await supabase.storage
        .from("pollution-photos")
        .upload(filename, blob, { contentType: "image/jpeg" });
      if (uploadErr) throw new Error(uploadErr.message);

      const { data: { publicUrl } } = supabase.storage
        .from("pollution-photos")
        .getPublicUrl(filename);

      const points = SEVERITY_PTS[aiResult.severity || severity] || SEVERITY_PTS[severity];
      const finalPts = aiResult.confidence > 0.8 ? points + 5 : points;

      await supabase.from("pollution_photos").insert({
        quest_id:    questId,
        user_id:     user?.id || "anonymous",
        team,
        gps_lat:     gps.lat,
        gps_lng:     gps.lng,
        litter_type: aiResult.litter_type || litterType,
        severity:    aiResult.severity    || severity,
        item_count:  aiResult.item_count_estimate || 0,
        confidence:  aiResult.confidence  || 0,
        is_valid:    true,
        points:      finalPts,
        photo_url:   publicUrl,
      });

      if (user) {
        await awardPoints(user.id, questId, "photo_upload", finalPts).catch(() => {});
        refreshProfile?.();
      }

      setResult({ points: finalPts, litter_type: aiResult.litter_type || litterType, severity: aiResult.severity || severity, confidence: aiResult.confidence });
      clearPhoto();
    } catch (err) {
      setError(err.message);
      setStep(0);
    }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="max-w-lg mx-auto bg-teal-light border border-teal rounded-2xl p-8 text-center">
        <CheckCircle className="w-12 h-12 text-teal mx-auto mb-3" />
        <p className="text-teal-dark font-bold text-3xl mb-1">+{result.points} points!</p>
        <p className="text-sm text-teal-dark capitalize mb-1">
          {result.litter_type?.replace(/_/g, " ")} — {result.severity} severity
        </p>
        {result.confidence > 0.8 && (
          <p className="text-xs text-teal">+5 AI confidence bonus included</p>
        )}
        {user && <p className="text-xs text-teal mt-1">Added to your profile</p>}
        <button
          onClick={() => setResult(null)}
          className="mt-6 bg-teal text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-teal-dark"
        >
          Report another
        </button>
      </div>
    );
  }

  const isSubmitting = step > 0;
  const testMode = localStorage.getItem("wq_test_mode") === "1";

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {testMode && (
        <div className="bg-amber-50 border border-amber rounded-xl px-3 py-2 text-xs text-amber-800 font-medium">
          🧪 Test mode active — GPS check bypassed
        </div>
      )}
      {/* Progress indicator during submission */}
      {isSubmitting && (
        <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
          <div className="flex flex-col gap-2">
            {STEPS.slice(1).map((s, i) => {
              const idx = i + 1;
              return (
                <div key={s} className={`flex items-center gap-3 text-sm
                  ${step > idx ? "text-teal font-medium" : step === idx ? "text-gray-900 font-semibold" : "text-gray-400"}`}>
                  {step > idx
                    ? <CheckCircle className="w-4 h-4 text-teal flex-shrink-0" />
                    : step === idx
                    ? <Loader className="w-4 h-4 animate-spin flex-shrink-0" />
                    : <div className="w-4 h-4 rounded-full border-2 border-gray-200 flex-shrink-0" />}
                  {s}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Camera */}
      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        onChange={handleFile} className="hidden" />

      {!preview ? (
        <button
          onClick={() => inputRef.current.click()}
          disabled={isSubmitting}
          className="w-full h-48 md:h-56 border-2 border-dashed border-teal rounded-2xl
            flex flex-col items-center justify-center gap-3 text-teal
            hover:bg-teal-light transition-colors cursor-pointer disabled:opacity-50"
        >
          <Camera className="w-12 h-12" />
          <span className="font-semibold">Tap to photograph pollution</span>
          <span className="text-sm text-gray-400">Opens camera on mobile</span>
        </button>
      ) : (
        <div className="relative">
          <img src={preview} className="w-full rounded-2xl object-cover max-h-64" alt="preview" />
          {!isSubmitting && (
            <button onClick={clearPhoto}
              className="absolute top-2 right-2 bg-white rounded-full w-8 h-8 shadow
                flex items-center justify-center text-gray-600 hover:bg-gray-50">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* GPS */}
      <div className={`flex items-center gap-2 text-sm ${gps ? "text-teal" : "text-gray-400"}`}>
        <MapPin className="w-4 h-4 flex-shrink-0" />
        {gps
          ? `📍 ${gps.lat.toFixed(4)}°N, ${gps.lng.toFixed(4)}°E`
          : "Getting your location… (required)"}
      </div>

      {/* Quest zone info */}
      {quest && (
        <div className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
          Your zone: <span className="font-medium text-gray-700">
            {team === "A" ? quest.quest_a?.zone : quest.quest_b?.zone}
          </span> — must be within {MAX_DIST_KM} km
        </div>
      )}

      {/* Litter type */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">What type of pollution?</p>
        <div className="flex flex-wrap gap-2">
          {LITTER_TYPES.map(t => (
            <button key={t.id} onClick={() => setLitterType(t.id)} disabled={isSubmitting}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors
                ${litterType === t.id
                  ? "bg-teal text-white border-teal"
                  : "bg-white text-gray-700 border-gray-200 hover:border-teal"}`}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Severity hint */}
      <p className="text-xs text-gray-400">AI will determine final severity — your selection is a hint.</p>

      {/* Not logged in */}
      {!user && (
        <div className="flex items-start gap-2 bg-amber-50 border border-amber rounded-xl p-3 text-sm text-amber-800">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          Sign in to earn points for your submission.
        </div>
      )}

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!photo || !gps || isSubmitting}
        className="w-full bg-teal text-white font-semibold py-3 rounded-xl
          disabled:opacity-40 min-h-[44px] flex items-center justify-center gap-2
          hover:bg-teal-dark transition-colors"
      >
        {isSubmitting
          ? <><Loader className="w-4 h-4 animate-spin" /> Checking…</>
          : <><Send className="w-4 h-4" /> Submit Report</>}
      </button>
    </div>
  );
}
