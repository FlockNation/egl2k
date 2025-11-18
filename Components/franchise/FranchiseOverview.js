import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

export default function FranchiseOverview() {
  return (
    <Card className="bg-slate-900/50 border-slate-700 backdrop-blur-xl">
      <CardHeader>
        <CardTitle className="text-white">Season Complete!</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Trophy className="w-24 h-24 text-amber-400 mx-auto mb-4" />
          <p className="text-2xl font-bold text-white mb-2">Congratulations!</p>
          <p className="text-slate-400">Your season has been completed. Check the Awards page for results!</p>
        </div>
      </CardContent>
    </Card>
  );
}
