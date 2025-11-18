import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Trophy, Clock } from "lucide-react";
import { motion } from "framer-motion";

const TIER_COLORS = {
  1: "bg-amber-100 text-amber-800 border-amber-300",
  2: "bg-blue-100 text-blue-800 border-blue-300",
  3: "bg-slate-100 text-slate-800 border-slate-300"
};

export default function FranchiseDraft({ onComplete }) {
  const [currentRound, setCurrentRound] = useState(1);
  const [draftOrder, setDraftOrder] = useState([]);
  const [currentPick, setCurrentPick] = useState(0);
  const [draftLog, setDraftLog] = useState([]);
  const queryClient = useQueryClient();

  const { data: userTeam } = useQuery({
    queryKey: ['userTeam'],
    queryFn: async () => {
      const teams = await base44.entities.Team.filter({ is_user_team: true });
      return teams[0];
    },
  });

  const { data: allTeams = [] } = useQuery({
    queryKey: ['allTeams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: availablePlayers = [] } = useQuery({
    queryKey: ['availablePlayers', currentRound],
    queryFn: async () => {
      const allPlayers = await base44.entities.Player.filter({ team_id: null });
      if (currentRound === 1) return allPlayers.filter(p => p.tier === 1);
      if (currentRound === 2) return allPlayers.filter(p => p.tier === 2);
      if (currentRound === 3) return allPlayers.filter(p => p.tier === 3);
      return [];
    },
  });

  useEffect(() => {
    if (allTeams.length > 0 && draftOrder.length === 0) {
      const shuffled = [...allTeams].sort(() => Math.random() - 0.5);
      setDraftOrder(shuffled);
    }
  }, [allTeams]);

  const draftPlayerMutation = useMutation({
    mutationFn: async ({ playerId, teamId }) => {
      await base44.entities.Player.update(playerId, { team_id: teamId });
    },
    onSuccess: (_, { playerId, teamId }) => {
      const player = availablePlayers.find(p => p.id === playerId);
      const team = allTeams.find(t => t.id === teamId);
      setDraftLog(prev => [...prev, { player: player.username, team: team.name, round: currentRound }]);
      queryClient.invalidateQueries({ queryKey: ['availablePlayers'] });
      
      if (currentPick < draftOrder.length - 1) {
        setCurrentPick(currentPick + 1);
      } else if (currentRound < 3) {
        setCurrentRound(currentRound + 1);
        setCurrentPick(0);
      } else {
        completeDraft();
      }
    },
  });

  const completeDraft = async () => {
    const season = await base44.entities.Season.list('-created_date', 1);
    if (season[0]) {
      await base44.entities.Season.update(season[0].id, { status: 'regular_season', current_week: 1 });
      queryClient.invalidateQueries({ queryKey: ['currentSeason'] });
    }
    onComplete();
  };

  const autoPickForAI = () => {
    if (availablePlayers.length === 0) return;
    const randomPlayer = availablePlayers[Math.floor(Math.random() * availablePlayers.length)];
    draftPlayerMutation.mutate({ 
      playerId: randomPlayer.id, 
      teamId: draftOrder[currentPick].id 
    });
  };

  const handleUserPick = (playerId) => {
    draftPlayerMutation.mutate({ playerId, teamId: userTeam.id });
  };

  const isUserTurn = draftOrder[currentPick]?.id === userTeam?.id;

  useEffect(() => {
    if (!isUserTurn && draftOrder.length > 0 && availablePlayers.length > 0) {
      const timer = setTimeout(autoPickForAI, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentPick, isUserTurn, availablePlayers]);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl">Draft - Round {currentRound}</CardTitle>
              <p className="text-slate-400 text-sm">
                Pick {currentPick + 1} of {draftOrder.length}
              </p>
            </div>
            <Badge className={TIER_COLORS[currentRound]}>
              Tier {currentRound} Round
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg">
            <Clock className={`w-5 h-5 ${isUserTurn ? 'text-green-400' : 'text-slate-400'}`} />
            <div>
              <p className="text-white font-semibold">
                {isUserTurn ? "YOUR PICK!" : `${draftOrder[currentPick]?.name} is picking...`}
              </p>
              <p className="text-sm text-slate-400">
                {isUserTurn ? "Select a player below" : "Please wait"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {isUserTurn && (
        <div>
          <h3 className="text-xl font-bold text-white mb-4">Available Players</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {availablePlayers.map((player) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
              >
                <Card className="bg-slate-800/50 border-slate-700 hover:border-amber-500/50 transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-white">{player.username}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${TIER_COLORS[player.tier]} text-xs`}>
                            Tier {player.tier}
                          </Badge>
                          <span className="text-xs text-slate-400">
                            Rating: {player.skill_rating}
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => handleUserPick(player.id)}
                        disabled={draftPlayerMutation.isPending}
                        size="sm"
                        className="bg-amber-500 hover:bg-amber-600"
                      >
                        Draft
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white text-lg">Draft Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {draftLog.slice().reverse().map((pick, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm p-2 bg-slate-900/50 rounded">
                <span className="text-slate-300">{pick.player}</span>
                <Badge variant="outline" className="text-xs">R{pick.round} → {pick.team}</Badge>
              </div>
            ))}
            {draftLog.length === 0 && (
              <p className="text-slate-500 text-center py-4">No picks yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
