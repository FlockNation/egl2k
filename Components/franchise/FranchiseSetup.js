import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ArrowRight, Trophy } from "lucide-react";

export default function FranchiseSetup({ onComplete }) {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const queryClient = useQueryClient();

  const { data: teams = [] } = useQuery({
    queryKey: ['allTeams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const startFranchiseMutation = useMutation({
    mutationFn: async (teamId) => {
      await base44.entities.Team.update(teamId, { is_user_team: true });
      const season = await base44.entities.Season.create({
        name: "Season II",
        status: "draft",
        current_week: 0
      });
      return { teamId, season };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userTeam'] });
      queryClient.invalidateQueries({ queryKey: ['currentSeason'] });
      onComplete();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    startFranchiseMutation.mutate(selectedTeamId);
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-amber-400" />
          <div>
            <CardTitle className="text-white text-2xl">Select Your Franchise</CardTitle>
            <p className="text-slate-400 text-sm">Choose an EGL team to manage</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-4">
            {teams.map(team => (
              <button
                key={team.id}
                type="button"
                onClick={() => setSelectedTeamId(team.id)}
                className={`p-4 rounded-lg border-2 transition-all text-left ${
                  selectedTeamId === team.id
                    ? 'border-amber-500 bg-amber-500/10'
                    : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: team.primary_color }}
                  >
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-white">{team.city} {team.name}</p>
                    <p className="text-xs text-slate-400">{team.conference} Conference</p>
                    <p className="text-xs text-slate-500">Leader: {team.leader_name}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          <Button
            type="submit"
            disabled={!selectedTeamId || startFranchiseMutation.isPending}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            {startFranchiseMutation.isPending ? "Starting..." : (
              <>
                Start Franchise & Enter Draft
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
