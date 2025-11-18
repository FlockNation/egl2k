import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Medal, Trophy, Star, TrendingUp } from "lucide-react";

export default function Awards() {
  const { data: awards = [] } = useQuery({
    queryKey: ['awards'],
    queryFn: () => base44.entities.Award.list(),
  });

  const awardIcons = {
    MVP: Trophy,
    Finals_MVP: Trophy,
    ROTY: Star,
    Leader_of_the_Year: Medal,
    PPOY: TrendingUp,
    CPOY: Star
  };

  const awardColors = {
    MVP: "from-amber-500 to-yellow-500",
    Finals_MVP: "from-purple-500 to-pink-500",
    ROTY: "from-blue-500 to-cyan-500",
    Leader_of_the_Year: "from-green-500 to-emerald-500",
    PPOY: "from-orange-500 to-red-500",
    CPOY: "from-indigo-500 to-violet-500"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl flex items-center justify-center">
            <Medal className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Season Awards</h1>
            <p className="text-slate-400">Recognizing excellence in EGL</p>
          </div>
        </div>

        {awards.length === 0 ? (
          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
            <CardContent className="p-12 text-center">
              <Medal className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No awards given yet</p>
              <p className="text-slate-500 text-sm mt-2">Complete the season to see award winners</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {awards.map(award => {
              const Icon = awardIcons[award.award_type] || Medal;
              const colorClass = awardColors[award.award_type] || "from-slate-500 to-slate-600";
              
              return (
                <Card key={award.id} className="bg-slate-900/50 border-slate-700 backdrop-blur-xl overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${colorClass}`} />
                  <CardHeader>
                    <div className="flex items-center gap-4">
                      <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-white text-xl">
                          {award.award_type.replace(/_/g, ' ')}
                        </CardTitle>
                        <p className="text-slate-400 text-sm">Season {award.season_id?.slice(0, 8)}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center p-6 bg-slate-800/50 rounded-lg">
                      <p className="text-3xl font-bold text-white mb-2">{award.winner_name}</p>
                      <p className="text-slate-400">Award Winner</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl mt-8">
          <CardHeader>
            <CardTitle className="text-white">Award Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="font-semibold text-amber-400 mb-1">MVP</p>
                <p className="text-slate-400">Most Valuable Player of the season</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="font-semibold text-purple-400 mb-1">Finals MVP</p>
                <p className="text-slate-400">Best performer in the finals</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="font-semibold text-blue-400 mb-1">ROTY</p>
                <p className="text-slate-400">Rookie of the Year</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="font-semibold text-green-400 mb-1">Leader of the Year</p>
                <p className="text-slate-400">Best team leader</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="font-semibold text-orange-400 mb-1">PPOY</p>
                <p className="text-slate-400">Playoff Performer of the Year</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg">
                <p className="font-semibold text-indigo-400 mb-1">CPOY</p>
                <p className="text-slate-400">Comeback Player of the Year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
