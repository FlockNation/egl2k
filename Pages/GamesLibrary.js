import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Gamepad2, Search } from "lucide-react";

export default function GamesLibrary() {
  const [search, setSearch] = useState("");

  const { data: games = [] } = useQuery({
    queryKey: ['scratchGames'],
    queryFn: () => base44.entities.ScratchGame.list(),
  });

  const filteredGames = games.filter(game =>
    game.game_name.toLowerCase().includes(search.toLowerCase()) ||
    game.game_type.toLowerCase().includes(search.toLowerCase())
  );

  const difficultyColors = {
    easy: "bg-green-500/20 text-green-300 border-green-500",
    medium: "bg-yellow-500/20 text-yellow-300 border-yellow-500",
    hard: "bg-red-500/20 text-red-300 border-red-500"
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-cyan-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
            <Gamepad2 className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Scratch Games Library</h1>
            <p className="text-slate-400">{games.length} games available for competition</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search games..."
              className="pl-10 bg-slate-900/50 border-slate-700 text-white"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredGames.map(game => (
            <Card key={game.id} className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 transition-all backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white text-lg">{game.game_name}</CardTitle>
                <p className="text-sm text-slate-400 capitalize">{game.game_type}</p>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Badge className={difficultyColors[game.difficulty]}>
                    {game.difficulty}
                  </Badge>
                  <span className="text-sm text-slate-400">
                    Avg: {game.average_score}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredGames.length === 0 && (
          <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
            <CardContent className="p-12 text-center">
              <Gamepad2 className="w-16 h-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No games found</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
