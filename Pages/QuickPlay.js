import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function QuickPlay() {
  const [homeTeamId, setHomeTeamId] = useState("");
  const [awayTeamId, setAwayTeamId] = useState("");
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState(null);

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

  const simulateScore = (player, game) => {
    const baseScore = game.average_score || 1000;
    const tierMultiplier = player.tier === 1 ? 1.3 : player.tier === 2 ? 1.0 : 0.7;
    const skillFactor = (player.skill_rating || 75) / 75;
    const randomness = 0.7 + Math.random() * 0.6;
    
    return Math.floor(baseScore * tierMultiplier * skillFactor * randomness);
  };

  const handleSimulate = async () => {
    if (!homeTeamId || !awayTeamId || homeTeamId === awayTeamId) {
      return;
    }

    setIsSimulating(true);
    setResult(null);

    await new Promise(resolve => setTimeout(resolve, 1500));

    const homeTeam = teams.find(t => t.id === homeTeamId);
    const awayTeam = teams.find(t => t.id === awayTeamId);
    const homePlayers = players.filter(p => p.team_id === homeTeamId);
    const awayPlayers = players.filter(p => p.team_id === awayTeamId);
    const randomGame = scratchGames[Math.floor(Math.random() * scratchGames.length)];

    const homeScores = homePlayers.map(p => ({
      player: p,
      score: simulateScore(p, randomGame)
    }));

    const awayScores = awayPlayers.map(p => ({
      player: p,
      score: simulateScore(p, randomGame)
    }));

    const homeTotal = homeScores.reduce((sum, s) => sum + s.score, 0);
    const awayTotal = awayScores.reduce((sum, s) => sum + s.score, 0);

    setResult({
      homeTeam,
      awayTeam,
      homeScores,
      awayScores,
      homeTotal,
      awayTotal,
      game: randomGame,
      winner: homeTotal > awayTotal ? homeTeam : awayTeam
    });

    setIsSimulating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Quick Play</h1>
            <p className="text-slate-400">Simulate a 1v1 matchup</p>
          </div>
        </div>

        <Card className="bg-slate-900/50 border-slate-700 mb-8 backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-white">Select Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Home Team</label>
                <Select value={homeTeamId} onValueChange={setHomeTeamId}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select home team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.city} {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Away Team</label>
                <Select value={awayTeamId} onValueChange={setAwayTeamId}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                    <SelectValue placeholder="Select away team" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.map(team => (
                      <SelectItem key={team.id} value={team.id}>
                        {team.city} {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              onClick={handleSimulate}
              disabled={!homeTeamId || !awayTeamId || homeTeamId === awayTeamId || isSimulating}
              className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isSimulating ? "Simulating..." : "Simulate Match"}
            </Button>
          </CardContent>
        </Card>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="bg-slate-900/50 border-slate-700 mb-6 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-white text-center">
                    Playing: {result.game.game_name}
                  </CardTitle>
                </CardHeader>
              </Card>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                <Card className={`border-2 ${result.homeTotal > result.awayTotal ? 'border-green-500 bg-green-950/20' : 'border-slate-700 bg-slate-900/50'} backdrop-blur-xl`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">
                        {result.homeTeam.city} {result.homeTeam.name}
                      </CardTitle>
                      {result.homeTotal > result.awayTotal && (
                        <Trophy className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <div className="text-4xl font-bold text-white">{result.homeTotal}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 font-semibold mb-2">SCORE BREAKDOWN</div>
                      {result.homeScores.map(({ player, score }) => (
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

                <Card className={`border-2 ${result.awayTotal > result.homeTotal ? 'border-green-500 bg-green-950/20' : 'border-slate-700 bg-slate-900/50'} backdrop-blur-xl`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">
                        {result.awayTeam.city} {result.awayTeam.name}
                      </CardTitle>
                      {result.awayTotal > result.homeTotal && (
                        <Trophy className="w-6 h-6 text-amber-400" />
                      )}
                    </div>
                    <div className="text-4xl font-bold text-white">{result.awayTotal}</div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="text-xs text-slate-400 font-semibold mb-2">SCORE BREAKDOWN</div>
                      {result.awayScores.map(({ player, score }) => (
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

              <Card className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 backdrop-blur-xl">
                <CardContent className="p-6 text-center">
                  <p className="text-3xl font-bold text-white mb-2">
                    {result.winner.city} {result.winner.name} Wins!
                  </p>
                  <p className="text-slate-300 text-lg">
                    Final Score: <span className="font-bold">{result.homeTotal.toLocaleString()}</span> - <span className="font-bold">{result.awayTotal.toLocaleString()}</span>
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    Margin of Victory: {Math.abs(result.homeTotal - result.awayTotal).toLocaleString()} points
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
