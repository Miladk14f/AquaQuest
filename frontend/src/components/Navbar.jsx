import { useState } from "react";
import { Menu, X, Droplets, User } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";

const links = [
  { to: "/",            label: "Home" },
  { to: "/quest",       label: "This Week" },
  { to: "/leaderboard", label: "Scores" },
  { to: "/map",         label: "Map" },
  { to: "/upload",      label: "Report" },
  { to: "/impact",      label: "Impact" },
  { to: "/about",       label: "About" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { pathname }    = useLocation();
  const { user, profile } = useAuth() || {};

  const avatar = profile?.avatar_url || null;
  const initial = (profile?.username?.[0] || user?.email?.[0] || "?").toUpperCase();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <Droplets className="text-teal w-6 h-6" />
            <span className="font-bold text-gray-900 text-lg">WaterQuest</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {links.map(l => (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${pathname === l.to
                    ? "bg-teal-light text-teal-dark"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
              >
                {l.label}
              </Link>
            ))}

            {/* Auth button */}
            <Link
              to={user ? "/profile" : "/login"}
              className={`ml-2 flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium
                transition-colors
                ${pathname === "/profile" || pathname === "/login"
                  ? "bg-teal-light text-teal-dark"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"}`}
            >
              {user
                ? avatar
                  ? <img src={avatar} alt="" className="w-6 h-6 rounded-full object-cover" />
                  : <div className="w-6 h-6 rounded-full bg-teal text-white text-xs flex items-center justify-center font-bold">{initial}</div>
                : <User className="w-4 h-4" />
              }
              {user ? (profile?.username || "Profile") : "Sign in"}
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
            className="md:hidden p-2 rounded-lg text-gray-600 min-h-[44px] min-w-[44px]
              flex items-center justify-center hover:bg-gray-50"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-2 animate-fade-in">
          {links.map(l => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setOpen(false)}
              className={`flex items-center px-3 py-3 rounded-lg text-sm font-medium mb-1 min-h-[44px]
                ${pathname === l.to
                  ? "bg-teal-light text-teal-dark"
                  : "text-gray-700 hover:bg-gray-50"}`}
            >
              {l.label}
            </Link>
          ))}
          <Link
            to={user ? "/profile" : "/login"}
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium mb-1
              min-h-[44px] text-gray-700 hover:bg-gray-50"
          >
            {user
              ? avatar
                ? <img src={avatar} alt="" className="w-5 h-5 rounded-full object-cover" />
                : <div className="w-5 h-5 rounded-full bg-teal text-white text-xs flex items-center justify-center font-bold">{initial}</div>
              : <User className="w-4 h-4" />
            }
            {user ? (profile?.username || "Profile") : "Sign in"}
          </Link>
        </div>
      )}
    </nav>
  );
}
