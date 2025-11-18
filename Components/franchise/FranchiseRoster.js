import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ArrowLeftRight, X } from "lucide-react";

export default function FranchiseRoster() {
  const [selectedPlayer, setSelectedPlayer] = useState("");
  const [targetTeam, setTargetTeam] = useState("");
  const queryClient = useQueryClient();

  const { data: userTeam } = useQuery({
    queryKey: ['userTeam'],
    queryFn: async () => {
      const teams = await base44.entities.Team.filter({ is_user_team: true });
      return teams[0];
    },
  });

  const { data: myPlayers = [] } = useQuery({
    queryKey: ['myPlayers'],
    queryFn: async () => {
      if (!userTeam) return [];
      return await base44.entities.Player.filter({ team_id: userTeam.id });
    },
    enabled: !!userTeam
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ['allTeams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['allPlayers'],
    queryFn: () => base44.entities.Player.list(),
  });

  const tradeMutation = useMutation({
    mutationFn: async () => {
      const myPlayer = myPlayers.find(p => p.id === selectedPlayer);
      const targetTeamPlayers = allPlayers.filter(p => p.team_id === targetTeam && p.tier === myPlayer.tier);
      
      if (targetTeamPlayers.length === 0) return;
      
      const targetPlayer = targetTeamPlayers[Math.floor(Math.random() * targetTeamPlayers.length)];
      
      await base44.entities.Player.update(myPlayer.id, { team_id: targetTeam });
      await base44.entities.Player.update(targetPlayer.id, { team_id: userTeam.id });
      
      return { myPlayer, targetPlayer };
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      setSelectedPlayer("");
      setTargetTeam("");
    },
  });

  const otherTeams = allTeams.filter(t => t.id !== userTeam?.id);
  const selectedPlayerObj = myPlayers.find(p => p.id === selectedPlayer);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-amber-400" />
            <CardTitle className="text-white">Your Roster</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {myPlayers.map(player => (
              <div key={player.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                <div>
                  <p className="font-semibold text-white">{player.username}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">Tier {player.tier}</Badge>
                    <span className="text-xs text-slate-400">Rating: {player.skill_rating}</span>
                    {!player.is_tradable && (
                      <Badge className="bg-red-500/20 text-red-300 text-xs">Non-Tradable</Badge>
                    )}
                  </div>
                </div>
                {player.is_tradable && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPlayer(player.id)}
                    className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedPlayer && (
        <Card className="bg-slate-900/50 border-amber-500/50 backdrop-blur-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ArrowLeftRight className="w-6 h-6 text-amber-400" />
                <CardTitle className="text-white">Trade {selectedPlayerObj?.username}</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedPlayer("");
                  setTargetTeam("");
                }}
              >
                <X className="w-4 h-4 text-slate-400" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Trade with</label>
                <Select value={targetTeam} onValueChange={setTargetTeam}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select team" />
                  </SelectTrigger>
                  <SelectContent>
                    {otherTeams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.city} {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Trade Details:</p>
                <p className="text-sm text-white">
                  You send: <span className="font-bold text-amber-400">{selectedPlayerObj?.username}</span> (Tier {selectedPlayerObj?.tier})
                </p>
                <p className="text-sm text-white mt-1">
                  You receive: Random Tier {selectedPlayerObj?.tier} player from selected team
                </p>
              </div>

              <Button
                onClick={() => tradeMutation.mutate()}
                disabled={!targetTeam || tradeMutation.isPending}
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500"
              >
                {tradeMutation.isPending ? "Processing Trade..." : "Propose Trade"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
