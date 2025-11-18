import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp } from "lucide-react";

export default function Standings() {
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const westernTeams = teams
    .filter(t => t.conference === 'Western')
    .sort((a, b) => (b.wins || 0) - (a.wins || 0));
  
  const easternTeams = teams
    .filter(t => t.conference === 'Eastern')
    .sort((a, b) => (b.wins || 0) - (a.wins || 0));

  const StandingsTable = ({ teams, conference }) => (
    <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white text-xl">{conference} Conference</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-6 text-xs text-slate-400 font-semibold mb-3 pb-2 border-b border-slate-700">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Team</div>
            <div className="col-span-1 text-center">W-L</div>
            <div className="col-span-1 text-center">PCT</div>
          </div>
          {teams.map((team, idx) => {
            const wins = team.wins || 0;
            const losses = team.losses || 0;
            const pct = wins + losses > 0 ? (wins / (wins + losses)).toFixed(3) : '.000';
            
            return (
              <div 
                key={team.id}
                className={`grid grid-cols-6 items-center p-3 rounded-lg ${
                  idx < 3 ? 'bg-green-950/20 border border-green-900/30' : 'bg-slate-800/30'
                }`}
              >
                <div className="col-span-1 text-slate-400 font-semibold">
                  {idx + 1}
                  {idx < 3 && <Trophy className="inline w-3 h-3 ml-1 text-amber-400" />}
                </div>
                <div className="col-span-3">
                  <p className="font-semibold text-white">{team.city} {team.name}</p>
                  <p className="text-xs text-slate-500">{team.leader_name}</p>
                </div>
                <div className="col-span-1 text-center text-white font-mono">
                  {wins}-{losses}
                </div>
                <div className="col-span-1 text-center text-slate-300 font-mono">
                  {pct}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-green-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <TrendingUp className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">League Standings</h1>
            <p className="text-slate-400">Current season rankings</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <StandingsTable teams={westernTeams} conference="Western" />
          <StandingsTable teams={easternTeams} conference="Eastern" />
        </div>

        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl mt-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <Trophy className="w-5 h-5 text-amber-400 mt-1" />
              <div className="text-sm text-slate-300">
                <p className="font-semibold mb-2">Playoff Format:</p>
                <ul className="space-y-1 text-slate-400">
                  <li>• Top 3 teams from each conference make playoffs</li>
                  <li>• 4th and 5th seeds play in a play-in game</li>
                  <li>• Play-in winners join the playoff bracket</li>
                  <li>• Championship and 3rd place matches conclude the season</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
