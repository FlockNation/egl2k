import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Play, Calendar, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function FranchiseWeek() {
  const queryClient = useQueryClient();
  const [matchResult, setMatchResult] = useState(null);

  const { data: userTeam } = useQuery({
    queryKey: ['userTeam'],
    queryFn: async () => {
      const teams = await base44.entities.Team.filter({ is_user_team: true });
      return teams[0];
    },
  });

  const { data: currentSeason } = useQuery({
    queryKey: ['currentSeason'],
    queryFn: async () => {
      const seasons = await base44.entities.Season.list('-created_date', 1);
      return seasons[0];
    },
  });

  const { data: thisWeekMatchup } = useQuery({
    queryKey: ['thisWeekMatchup', currentSeason?.current_week],
    queryFn: async () => {
      if (!userTeam || !currentSeason) return null;
      const matchups = await base44.entities.Matchup.filter({
        week: currentSeason.current_week,
        status: 'scheduled'
      });
      return matchups.find(m => 
        m.home_team_id === userTeam.id || m.away_team_id === userTeam.id
      );
    },
    enabled: !!userTeam && !!currentSeason
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['teams'],
    queryFn: () => base44.entities.Team.list(),
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: scratchGames = [] } = useQuery({
    queryKey: ['scratchGames'],
    queryFn: () => base44.entities.ScratchGame.list(),
  });

  const simulateMatchMutation = useMutation({
    mutationFn: async () => {
      const game = scratchGames[Math.floor(Math.random() * scratchGames.length)];
      const homeTeam = teams.find(t => t.id === thisWeekMatchup.home_team_id);
      const awayTeam = teams.find(t => t.id === thisWeekMatchup.away_team_id);
      const homePlayers = players.filter(p => p.team_id === thisWeekMatchup.home_team_id);
      const awayPlayers = players.filter(p => p.team_id === thisWeekMatchup.away_team_id);

      const simulateScore = (player) => {
        const baseScore = game.average_score || 1000;
        const tierMultiplier = player.tier === 1 ? 1.3 : player.tier === 2 ? 1.0 : 0.7;
        const skillFactor = (player.skill_rating || 75) / 75;
        const randomness = 0.7 + Math.random() * 0.6;
        return Math.floor(baseScore * tierMultiplier * skillFactor * randomness);
      };

      const homeScores = homePlayers.map(p => ({ player: p, score: simulateScore(p) }));
      const awayScores = awayPlayers.map(p => ({ player: p, score: simulateScore(p) }));
      
      const homeTotal = homeScores.reduce((sum, s) => sum + s.score, 0);
      const awayTotal = awayScores.reduce((sum, s) => sum + s.score, 0);

      const playerScoresMap = {};
      homeScores.forEach(s => playerScoresMap[s.player.id] = s.score);
      awayScores.forEach(s => playerScoresMap[s.player.id] = s.score);

      await base44.entities.Matchup.update(thisWeekMatchup.id, {
        scratch_game_id: game.id,
        home_score: homeTotal,
        away_score: awayTotal,
        status: 'completed',
        player_scores: playerScoresMap
      });

      if (homeTotal > awayTotal) {
        await base44.entities.Team.update(homeTeam.id, { wins: (homeTeam.wins || 0) + 1 });
        await base44.entities.Team.update(awayTeam.id, { losses: (awayTeam.losses || 0) + 1 });
      } else {
        await base44.entities.Team.update(awayTeam.id, { wins: (awayTeam.wins || 0) + 1 });
        await base44.entities.Team.update(homeTeam.id, { losses: (homeTeam.losses || 0) + 1 });
      }

      setMatchResult({
        game,
        homeTeam,
        awayTeam,
        homeScores,
        awayScores,
        homeTotal,
        awayTotal,
        winner: homeTotal > awayTotal ? homeTeam : awayTeam
      });

      if (currentSeason.current_week < 5) {
        await base44.entities.Season.update(currentSeason.id, {
          current_week: currentSeason.current_week + 1
        });
      } else {
        await base44.entities.Season.update(currentSeason.id, {
          status: 'playoffs'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
    },
  });

  const handleContinue = () => {
    setMatchResult(null);
    queryClient.invalidateQueries();
  };

  if (!thisWeekMatchup) {
    return (
      <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
        <CardContent className="p-12 text-center">
          <Calendar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 text-lg">You have a bye week!</p>
          <p className="text-slate-500 text-sm mt-2">Rest up and prepare for next week</p>
          <Button 
            onClick={handleContinue}
            className="mt-6 bg-gradient-to-r from-blue-500 to-cyan-500"
          >
            Continue to Next Week
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const opponent = teams.find(t => 
    t.id === (thisWeekMatchup.home_team_id === userTeam?.id ? thisWeekMatchup.away_team_id : thisWeekMatchup.home_team_id)
  );

  if (matchResult) {
    const isUserWinner = matchResult.winner.id === userTeam?.id;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white text-center">
              Playing: {matchResult.game.game_name}
            </CardTitle>
          </CardHeader>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className={`border-2 ${matchResult.homeTotal > matchResult.awayTotal ? 'border-green-500 bg-green-950/20' : 'border-slate-700 bg-slate-900/50'} backdrop-blur-xl`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {matchResult.homeTeam.city} {matchResult.homeTeam.name}
                </CardTitle>
                {matchResult.homeTotal > matchResult.awayTotal && (
                  <Trophy className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div className="text-4xl font-bold text-white">{matchResult.homeTotal.toLocaleString()}</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-semibold mb-2">SCORE BREAKDOWN</div>
                {matchResult.homeScores.map(({ player, score }) => (
                  <div key={player.id} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                    <div>
                      <span className="text-white font-medium">{player.username}</span>
                      <span className="text-xs text-slate-400 ml-2">Tier {player.tier}</span>
                    </div>
                    <span className="font-mono text-lg text-white font-bold">{score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className={`border-2 ${matchResult.awayTotal > matchResult.homeTotal ? 'border-green-500 bg-green-950/20' : 'border-slate-700 bg-slate-900/50'} backdrop-blur-xl`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  {matchResult.awayTeam.city} {matchResult.awayTeam.name}
                </CardTitle>
                {matchResult.awayTotal > matchResult.homeTotal && (
                  <Trophy className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div className="text-4xl font-bold text-white">{matchResult.awayTotal.toLocaleString()}</div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-xs text-slate-400 font-semibold mb-2">SCORE BREAKDOWN</div>
                {matchResult.awayScores.map(({ player, score }) => (
                  <div key={player.id} className="flex justify-between items-center p-2 bg-slate-800/50 rounded">
                    <div>
                      <span className="text-white font-medium">{player.username}</span>
                      <span className="text-xs text-slate-400 ml-2">Tier {player.tier}</span>
                    </div>
                    <span className="font-mono text-lg text-white font-bold">{score.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className={`backdrop-blur-xl ${isUserWinner ? 'bg-gradient-to-r from-green-500/10 to-emerald-500/10 border-green-500/30' : 'bg-gradient-to-r from-red-500/10 to-orange-500/10 border-red-500/30'}`}>
          <CardContent className="p-6 text-center">
            <p className="text-3xl font-bold text-white mb-2">
              {isUserWinner ? '🎉 You Win!' : '😔 You Lost'}
            </p>
            <p className="text-slate-300 text-lg mb-1">
              Final Score: <span className="font-bold">{matchResult.homeTotal.toLocaleString()}</span> - <span className="font-bold">{matchResult.awayTotal.toLocaleString()}</span>
            </p>
            <p className="text-slate-400 text-sm mb-4">
              Margin: {Math.abs(matchResult.homeTotal - matchResult.awayTotal).toLocaleString()} points
            </p>
            <Button 
              onClick={handleContinue}
              className="bg-gradient-to-r from-blue-500 to-cyan-500"
            >
              Continue to Next Week
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white text-2xl">Week {currentSeason?.current_week}</CardTitle>
              <p className="text-slate-400 text-sm">Regular Season</p>
            </div>
            <Badge className="bg-blue-500 text-white">
              {userTeam?.wins || 0}-{userTeam?.losses || 0}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-white">This Week's Matchup</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-8">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                <p className="font-bold text-white">{userTeam?.city} {userTeam?.name}</p>
                <p className="text-sm text-slate-400">{userTeam?.wins || 0}-{userTeam?.losses || 0}</p>
              </div>

              <div className="text-3xl font-bold text-slate-500">VS</div>

              <div className="text-center">
                <div className="w-20 h-20 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="w-10 h-10 text-slate-400" />
                </div>
                <p className="font-bold text-white">{opponent?.city} {opponent?.name}</p>
                <p className="text-sm text-slate-400">{opponent?.wins || 0}-{opponent?.losses || 0}</p>
              </div>
            </div>

            <Button
              onClick={() => simulateMatchMutation.mutate()}
              disabled={simulateMatchMutation.isPending}
              className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
              size="lg"
            >
              {simulateMatchMutation.isPending ? "Simulating..." : (
                <>
                  <Play className="w-5 h-5 mr-2" />
                  Simulate Week {currentSeason?.current_week}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
