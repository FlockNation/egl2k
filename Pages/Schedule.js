import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trophy } from "lucide-react";

export default function Schedule() {
  const { data: matchups = [] } = useQuery({
    queryKey: ['matchups'],
    queryFn: () => base44.entities.Matchup.list(),
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: scratchGames = [] } = useQuery({
    queryKey: ['scratchGames'],
    queryFn: () => base44.entities.ScratchGame.list(),
  });

  const weeks = [1, 2, 3, 4, 5];

  const getTeam = (id) => teams.find(t => t.id === id);
  const getGame = (id) => scratchGames.find(g => g.id === id);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Calendar className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Season Schedule</h1>
            <p className="text-slate-400">All matchups by week</p>
          </div>
        </div>

        <div className="space-y-6">
          {weeks.map(week => {
            const weekMatchups = matchups.filter(m => m.week === week);
            
            return (
              <Card key={week} className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Week {week}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weekMatchups.length === 0 ? (
                    <p className="text-slate-500 text-center py-4">No matchups scheduled yet</p>
                  ) : (
                    <div className="space-y-3">
                      {weekMatchups.map(matchup => {
                        const homeTeam = getTeam(matchup.home_team_id);
                        const awayTeam = getTeam(matchup.away_team_id);
                        const game = getGame(matchup.scratch_game_id);
                        
                        return (
                          <div 
                            key={matchup.id}
                            className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-4 flex-1">
                                <div className="text-right flex-1">
                                  <p className="font-semibold text-white">{homeTeam?.city} {homeTeam?.name}</p>
                                  {matchup.status === 'completed' && (
                                    <p className="text-2xl font-bold text-white">{matchup.home_score?.toLocaleString()}</p>
                                  )}
                                </div>
                                <div className="text-slate-400 font-bold">VS</div>
                                <div className="flex-1">
                                  <p className="font-semibold text-white">{awayTeam?.city} {awayTeam?.name}</p>
                                  {matchup.status === 'completed' && (
                                    <p className="text-2xl font-bold text-white">{matchup.away_score?.toLocaleString()}</p>
                                  )}
                                </div>
                              </div>
                              <Badge className={
                                matchup.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                                matchup.status === 'in_progress' ? 'bg-blue-500/20 text-blue-300' :
                                'bg-slate-500/20 text-slate-300'
                              }>
                                {matchup.status === 'completed' ? 'Final' : 
                                 matchup.status === 'in_progress' ? 'Live' : 'Scheduled'}
                              </Badge>
                            </div>
                            {game && (
                              <div className="text-sm text-slate-400 mt-2 pt-2 border-t border-slate-700">
                                Playing: {game.game_name}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
