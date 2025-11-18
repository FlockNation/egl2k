import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Zap, Users, Gamepad2, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-16 pt-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 rounded-2xl mb-6 shadow-2xl shadow-orange-500/30">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-6xl font-black mb-4 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 bg-clip-text text-transparent">
            EGL 2K
          </h1>
          <p className="text-2xl text-slate-300 mb-2">Elite Gaming League</p>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Compete in Scratch gaming tournaments, manage your franchise, and become the ultimate champion
          </p>
        </div>

        {/* Game Modes */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Link to={createPageUrl("QuickPlay")}>
            <Card className="bg-slate-900/50 border-slate-700 hover:border-amber-500/50 transition-all duration-300 group cursor-pointer h-full backdrop-blur-xl">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-purple-500/30">
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      Quick Play
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-slate-400 mb-4">
                      Jump into a quick 1v1 matchup. Pick two teams and simulate a game instantly.
                    </p>
                    <ul className="text-sm text-slate-500 space-y-1">
                      <li>• Instant matchups</li>
                      <li>• Random Scratch game selection</li>
                      <li>• Real-time score simulation</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("Franchise")}>
            <Card className="bg-slate-900/50 border-slate-700 hover:border-orange-500/50 transition-all duration-300 group cursor-pointer h-full backdrop-blur-xl">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-orange-500/30">
                    <Trophy className="w-8 h-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      Franchise Mode
                      <ArrowRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-slate-400 mb-4">
                      Create and manage your own EGL team through a complete season.
                    </p>
                    <ul className="text-sm text-slate-500 space-y-1">
                      <li>• Draft Tier 1, 2, 3 players</li>
                      <li>• Make trades and manage roster</li>
                      <li>• Compete for championships</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Quick Links */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link to={createPageUrl("Teams")}>
            <Card className="bg-slate-900/30 border-slate-700 hover:border-slate-600 transition-all duration-200 cursor-pointer backdrop-blur-xl">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-1">Teams</h3>
                <p className="text-sm text-slate-400">View all EGL teams</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("Standings")}>
            <Card className="bg-slate-900/30 border-slate-700 hover:border-slate-600 transition-all duration-200 cursor-pointer backdrop-blur-xl">
              <CardContent className="p-6 text-center">
                <Trophy className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-1">Standings</h3>
                <p className="text-sm text-slate-400">Check league rankings</p>
              </CardContent>
            </Card>
          </Link>

          <Link to={createPageUrl("GamesLibrary")}>
            <Card className="bg-slate-900/30 border-slate-700 hover:border-slate-600 transition-all duration-200 cursor-pointer backdrop-blur-xl">
              <CardContent className="p-6 text-center">
                <Gamepad2 className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-white mb-1">Games Library</h3>
                <p className="text-sm text-slate-400">Browse Scratch games</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
