import { useState, useEffect, useRef } from "react";
import { Camera, MapPin, Send, X, CheckCircle, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import { useAuth } from "../hooks/useAuth.jsx";
import { awardPoints } from "../lib/auth.js";

const LITTER_TYPES = [
  { id: "plastic_bottles", label: "Bottles",  emoji: "🍶" },
  { id: "plastic_bags",    label: "Bags",     emoji: "🛍️" },
  { id: "foam",            label: "Foam",     emoji: "🔲" },
  { id: "rope",            label: "Rope",     emoji: "🧵" },
  { id: "organic",         label: "Organic",  emoji: "🌿" },
  { id: "mixed",           label: "Mixed",    emoji: "♻️" },
  { id: "algae_bloom",     label: "Algae",    emoji: "🟢" },
];

export function PhotoUpload({ questId, team }) {
  const { user, refreshProfile } = useAuth() || {};
  const [photo,    setPhoto]   = useState(null);
  const [preview,  setPreview] = useState(null);
  const [gps,      setGps]     = useState(null);
  const [result,   setResult]  = useState(null);
  const [loading,  setLoading] = useState(false);
  const [error,    setError]   = useState(null);
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
    setLoading(true);
    setError(null);

    const form = new FormData();
    form.append("photo",    photo);
    form.append("gps_lat",  gps.lat);
    form.append("gps_lng",  gps.lng);
    form.append("quest_id", questId);
    form.append("team",     team);

    try {
      const data = await api.uploadPhoto(form);
      setResult(data);
      if (data?.is_valid_pollution && data?.points && user) {
        await awardPoints(user.id, questId, "photo_upload", data.points).catch(() => {});
        refreshProfile?.();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
      {/* Camera area */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFile}
        className="hidden"
      />

      {!preview ? (
        <button
          onClick={() => inputRef.current.click()}
          className="w-full h-48 md:h-64 border-2 border-dashed border-teal rounded-2xl
            flex flex-col items-center justify-center gap-3 text-teal
            hover:bg-teal-light transition-colors min-h-[44px] cursor-pointer"
        >
          <Camera className="w-12 h-12" />
          <span className="font-semibold text-base">Tap to photograph garbage</span>
          <span className="text-sm text-gray-400">Opens your camera on mobile</span>
        </button>
      ) : (
        <div className="relative">
          <img
            src={preview}
            className="w-full rounded-2xl object-cover max-h-72"
            alt="Pollution preview"
          />
          <button
            onClick={clearPhoto}
            className="absolute top-2 right-2 bg-white rounded-full w-8 h-8 shadow
              text-gray-600 flex items-center justify-center font-bold hover:bg-gray-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* GPS status */}
      <div className={`flex items-center gap-2 text-sm ${gps ? "text-teal" : "text-gray-400"}`}>
        <MapPin className="w-4 h-4 flex-shrink-0" />
        {gps
          ? `GPS: ${gps.lat.toFixed(4)}°N, ${gps.lng.toFixed(4)}°E`
          : "Getting your location..."}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!photo || !gps || loading}
        className="w-full bg-teal text-white font-semibold py-3 rounded-xl
          disabled:opacity-40 min-h-[44px] text-base transition-opacity
          hover:opacity-90 flex items-center justify-center gap-2"
      >
        <Send className="w-4 h-4" />
        {loading ? "Analysing with AI..." : "Submit Report"}
      </button>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl p-3">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* AI result — accepted */}
      {result?.is_valid_pollution && (
        <div className="bg-teal-light border border-teal rounded-2xl p-4 text-center animate-bounce-in">
          <CheckCircle className="w-8 h-8 text-teal mx-auto mb-2" />
          <p className="text-teal-dark font-bold text-2xl">+{result.points} points!</p>
          <p className="text-sm text-teal-dark mt-1 capitalize">
            {result.litter_type?.replace(/_/g, " ")} — {result.severity} severity
          </p>
          {result.item_count_estimate > 0 && (
            <p className="text-xs text-teal mt-1">~{result.item_count_estimate} items spotted</p>
          )}
        </div>
      )}

      {/* AI result — rejected */}
      {result && !result.is_valid_pollution && (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 text-center">
          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-600 text-sm font-medium">Photo not accepted</p>
          <p className="text-gray-500 text-xs mt-1">
            {result.rejection_reason?.replace(/_/g, " ") || "No visible pollution detected"}
          </p>
        </div>
      )}
    </div>
  );
}
