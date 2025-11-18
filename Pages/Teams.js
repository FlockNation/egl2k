import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy } from "lucide-react";

export default function Teams() {
  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const westernTeams = teams.filter(t => t.conference === 'Western');
  const easternTeams = teams.filter(t => t.conference === 'Eastern');

  const getTeamPlayers = (teamId) => players.filter(p => p.team_id === teamId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">EGL Teams</h1>
            <p className="text-slate-400">All teams across both conferences</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold text-amber-400 mb-4">Western Conference</h2>
            <div className="space-y-4">
              {westernTeams.map(team => (
                <Card key={team.id} className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: team.primary_color }}
                        >
                          <Trophy className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white">{team.city} {team.name}</CardTitle>
                          <p className="text-sm text-slate-400">Leader: {team.leader_name}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500">
                        {team.wins || 0}-{team.losses || 0}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getTeamPlayers(team.id).map(player => (
                        <div key={player.id} className="flex items-center justify-between text-sm p-2 bg-slate-800/50 rounded">
                          <span className="text-slate-300">{player.username}</span>
                          <Badge variant="outline" className="text-xs">
                            Tier {player.tier} • {player.skill_rating}
                          </Badge>
                        </div>
                      ))}
                      {getTeamPlayers(team.id).length === 0 && (
                        <p className="text-slate-500 text-sm text-center py-2">No players yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-blue-400 mb-4">Eastern Conference</h2>
            <div className="space-y-4">
              {easternTeams.map(team => (
                <Card key={team.id} className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: team.primary_color }}
                        >
                          <Trophy className="w-7 h-7 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-white">{team.city} {team.name}</CardTitle>
                          <p className="text-sm text-slate-400">Leader: {team.leader_name}</p>
                        </div>
                      </div>
                      <Badge className="bg-blue-500/20 text-blue-300 border-blue-500">
                        {team.wins || 0}-{team.losses || 0}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {getTeamPlayers(team.id).map(player => (
                        <div key={player.id} className="flex items-center justify-between text-sm p-2 bg-slate-800/50 rounded">
                          <span className="text-slate-300">{player.username}</span>
                          <Badge variant="outline" className="text-xs">
                            Tier {player.tier} • {player.skill_rating}
                          </Badge>
                        </div>
                      ))}
                      {getTeamPlayers(team.id).length === 0 && (
                        <p className="text-slate-500 text-sm text-center py-2">No players yet</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
