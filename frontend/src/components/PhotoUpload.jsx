import { useState, useEffect, useRef } from "react";
import { Camera, MapPin, Send, X, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { awardPoints } from "../lib/auth.js";

const SEVERITY_PTS = { low: 15, medium: 20, high: 30 };

const LITTER_TYPES = [
  { id: "plastic_bottles", label: "Bottles",  emoji: "🍶" },
  { id: "plastic_bags",    label: "Bags",     emoji: "🛍️" },
  { id: "foam",            label: "Foam",     emoji: "🔲" },
  { id: "rope",            label: "Rope",     emoji: "🧵" },
  { id: "organic",         label: "Organic",  emoji: "🌿" },
  { id: "mixed",           label: "Mixed",    emoji: "♻️" },
  { id: "algae_bloom",     label: "Algae",    emoji: "🟢" },
];

const SEVERITIES = [
  { id: "low",    label: "Low",    pts: 15, color: "text-amber" },
  { id: "medium", label: "Medium", pts: 20, color: "text-orange-500" },
  { id: "high",   label: "High",   pts: 30, color: "text-coral" },
];

export function PhotoUpload({ questId, team }) {
  const { user, refreshProfile } = useAuth() || {};
  const [photo,       setPhoto]      = useState(null);
  const [preview,     setPreview]    = useState(null);
  const [gps,         setGps]        = useState(null);
  const [litterType,  setLitterType] = useState("mixed");
  const [severity,    setSeverity]   = useState("medium");
  const [result,      setResult]     = useState(null);
  const [loading,     setLoading]    = useState(false);
  const [error,       setError]      = useState(null);
  const inputRef = useRef();

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      pos => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => console.warn("GPS unavailable:", err.message),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhoto(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError(null);
  }

  function clearPhoto() {
    setPhoto(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setResult(null);
  }

  async function handleSubmit() {
    if (!photo || !gps) return;
    if (!supabase) { setError("Supabase not configured."); return; }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload photo to Supabase Storage
      const ext      = photo.name.split(".").pop() || "jpg";
      const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("pollution-photos")
        .upload(filename, photo, { contentType: photo.type });
      if (uploadErr) throw new Error(uploadErr.message);

      const { data: { publicUrl } } = supabase.storage
        .from("pollution-photos")
        .getPublicUrl(filename);

      // 2. Save record to pollution_photos
      const points = SEVERITY_PTS[severity] || 15;
      const { error: dbErr } = await supabase.from("pollution_photos").insert({
        quest_id:   questId,
        user_id:    user?.id || "anonymous",
        team,
        gps_lat:    gps.lat,
        gps_lng:    gps.lng,
        litter_type: litterType,
        severity,
        is_valid:   true,
        points,
        photo_url:  publicUrl,
      });
      if (dbErr) throw new Error(dbErr.message);

      // 3. Award points to logged-in user
      if (user) {
        await awardPoints(user.id, questId, "photo_upload", points).catch(() => {});
        refreshProfile?.();
      }

      setResult({ points, litter_type: litterType, severity });
      setPhoto(null);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (result) {
    return (
      <div className="max-w-lg bg-teal-light border border-teal rounded-2xl p-8 text-center">
        <CheckCircle className="w-10 h-10 text-teal mx-auto mb-3" />
        <p className="text-teal-dark font-bold text-3xl mb-1">+{result.points} points!</p>
        <p className="text-sm text-teal-dark capitalize">
          {result.litter_type.replace(/_/g, " ")} — {result.severity} severity
        </p>
        {user && <p className="text-xs text-teal mt-1">Points added to your profile</p>}
        <button
          onClick={() => setResult(null)}
          className="mt-5 bg-teal text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-teal-dark"
        >
          Report another
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-4">
      {/* Camera */}
      <input ref={inputRef} type="file" accept="image/*" capture="environment"
        onChange={handleFile} className="hidden" />

      {!preview ? (
        <button
          onClick={() => inputRef.current.click()}
          className="w-full h-48 md:h-64 border-2 border-dashed border-teal rounded-2xl
            flex flex-col items-center justify-center gap-3 text-teal
            hover:bg-teal-light transition-colors cursor-pointer"
        >
          <Camera className="w-12 h-12" />
          <span className="font-semibold">Tap to photograph pollution</span>
          <span className="text-sm text-gray-400">Opens camera on mobile</span>
        </button>
      ) : (
        <div className="relative">
          <img src={preview} className="w-full rounded-2xl object-cover max-h-64" alt="preview" />
          <button onClick={clearPhoto}
            className="absolute top-2 right-2 bg-white rounded-full w-8 h-8 shadow
              flex items-center justify-center text-gray-600 hover:bg-gray-50">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* GPS */}
      <div className={`flex items-center gap-2 text-sm ${gps ? "text-teal" : "text-gray-400"}`}>
        <MapPin className="w-4 h-4 flex-shrink-0" />
        {gps ? `GPS: ${gps.lat.toFixed(4)}°N, ${gps.lng.toFixed(4)}°E` : "Getting location…"}
      </div>

      {/* Litter type */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">What type of pollution?</p>
        <div className="flex flex-wrap gap-2">
          {LITTER_TYPES.map(t => (
            <button key={t.id} onClick={() => setLitterType(t.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-colors
                ${litterType === t.id
                  ? "bg-teal text-white border-teal"
                  : "bg-white text-gray-700 border-gray-200 hover:border-teal"}`}>
              {t.emoji} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Severity */}
      <div>
        <p className="text-sm font-medium text-gray-700 mb-2">Severity</p>
        <div className="flex gap-2">
          {SEVERITIES.map(s => (
            <button key={s.id} onClick={() => setSeverity(s.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors
                ${severity === s.id
                  ? "bg-teal text-white border-teal"
                  : "bg-white text-gray-700 border-gray-200 hover:border-teal"}`}>
              {s.label}<br />
              <span className="text-xs opacity-75">+{s.pts} pts</span>
            </button>
          ))}
        </div>
      </div>

      {/* Not logged in warning */}
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
        disabled={!photo || !gps || loading}
        className="w-full bg-teal text-white font-semibold py-3 rounded-xl
          disabled:opacity-40 min-h-[44px] flex items-center justify-center gap-2
          hover:bg-teal-dark transition-colors"
      >
        <Send className="w-4 h-4" />
        {loading ? "Uploading…" : `Submit — earn +${SEVERITY_PTS[severity]} pts`}
      </button>
    </div>
  );
}
