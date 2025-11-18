import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function Playoffs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-red-950 to-slate-950 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">EGL Playoffs</h1>
            <p className="text-slate-400">Championship bracket</p>
          </div>
        </div>

        <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
          <CardContent className="p-12 text-center">
            <Trophy className="w-24 h-24 text-slate-600 mx-auto mb-4" />
            <p className="text-2xl font-bold text-white mb-2">Playoffs Coming Soon</p>
            <p className="text-slate-400">Complete the regular season to unlock the playoff bracket</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
