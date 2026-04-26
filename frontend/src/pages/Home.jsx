import { Link } from "react-router-dom";
import { ArrowRight, Satellite, Users, Trophy, Droplets } from "lucide-react";
import { MapView } from "../components/MapView";
import { TeamBar } from "../components/TeamBar";
import { Countdown } from "../components/Countdown";
import { useQuests } from "../hooks/useQuests";

const STATS = [
  { icon: Satellite, label: "Satellite-Verified",  value: "Real Data",   color: "text-ocean" },
  { icon: Users,     label: "Active Cleaners",      value: "NL-Wide",    color: "text-teal" },
  { icon: Trophy,    label: "Weekly Winners",        value: "Every Mon",  color: "text-amber" },
  { icon: Droplets,  label: "Quests This Season",   value: "All Free",   color: "text-coral" },
];

export default function Home() {
  const { quest, loading } = useQuests();

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-teal-dark via-teal to-ocean px-4 py-12 sm:py-16 lg:py-20">
        <div className="max-w-screen-xl mx-auto">
          <div className="max-w-2xl">
            <span className="inline-block bg-white/20 text-white text-xs font-semibold
              px-3 py-1 rounded-full mb-4 backdrop-blur">
              🛰️ Powered by Copernicus Satellite Data
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight mb-4">
              Clean Rivers.<br />Win the Week.<br />
              <span className="text-amber">Save the Netherlands.</span>
            </h1>
            <p className="text-white/90 text-base sm:text-lg mb-8 leading-relaxed">
              WaterQuest uses real satellite data to find the most polluted rivers
              every week — then mobilises citizens like you to clean them. Compete
              in teams, earn points, and watch before/after satellite images prove
              your impact.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                to="/quest"
                className="flex items-center justify-center gap-2 bg-white text-teal-dark
                  font-bold px-6 py-3 rounded-xl hover:bg-teal-light transition-colors
                  min-h-[44px] text-base"
              >
                See This Week's Quest <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/about"
                className="flex items-center justify-center gap-2 bg-white/20 text-white
                  font-semibold px-6 py-3 rounded-xl hover:bg-white/30 transition-colors
                  min-h-[44px] text-base backdrop-blur"
              >
                How It Works
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-gray-50 border-b border-gray-100 py-6">
        <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {STATS.map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="flex items-center gap-3">
                <Icon className={`w-8 h-8 ${color} flex-shrink-0`} />
                <div>
                  <p className="font-bold text-gray-900 text-sm">{value}</p>
                  <p className="text-xs text-gray-500">{label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">This Week's Quest Zones</h2>
        {loading ? (
          <div className="bg-gray-100 rounded-2xl h-80 animate-pulse" />
        ) : (
          <MapView quest={quest} height="h-[300px] md:h-[400px] lg:h-[480px]" />
        )}
      </section>

      {/* Live scores + countdown */}
      <section className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-t border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-gray-900">Live Team Scores</h2>
          <div className="flex flex-col items-start md:items-end gap-1">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
              Next quest reset in
            </p>
            <Countdown />
          </div>
        </div>

        {quest ? (
          <TeamBar questId={quest.id} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {["A", "B"].map(t => (
              <div key={t} className="bg-gray-100 rounded-2xl h-36 animate-pulse" />
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="bg-teal-light py-12 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-teal-dark mb-3">
            Ready to make a difference?
          </h2>
          <p className="text-teal-dark/80 mb-6 text-sm sm:text-base">
            Join thousands of Dutch citizens cleaning their waterways — backed by real
            satellite science.
          </p>
          <Link
            to="/upload"
            className="inline-flex items-center gap-2 bg-teal text-white font-bold
              px-8 py-3 rounded-xl hover:bg-teal-dark transition-colors min-h-[44px] text-base"
          >
            Report Pollution Now <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
