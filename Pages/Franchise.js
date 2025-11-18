import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy } from "lucide-react";

import FranchiseSetup from "../components/franchise/FranchiseSetup";
import FranchiseOverview from "../components/franchise/FranchiseOverview";
import FranchiseDraft from "../components/franchise/FranchiseDraft";
import FranchiseWeek from "../components/franchise/FranchiseWeek";
import FranchiseRoster from "../components/franchise/FranchiseRoster";

export default function Franchise() {
  const [franchiseStep, setFranchiseStep] = useState("setup");

  const { data: userTeams = [] } = useQuery({
    queryKey: ['userTeams'],
    queryFn: async () => {
      const teams = await base44.entities.Team.filter({ is_user_team: true });
      return teams;
    },
  });

  const { data: currentSeason } = useQuery({
    queryKey: ['currentSeason'],
    queryFn: async () => {
      const seasons = await base44.entities.Season.list('-created_date', 1);
      return seasons[0];
    },
  });

  useEffect(() => {
    if (userTeams.length > 0 && currentSeason) {
      if (currentSeason.status === 'draft') {
        setFranchiseStep('draft');
      } else if (currentSeason.status === 'regular_season') {
        setFranchiseStep('season');
      } else {
        setFranchiseStep('overview');
      }
    } else {
      setFranchiseStep('setup');
    }
  }, [userTeams, currentSeason]);

  if (franchiseStep === 'setup') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950 to-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Franchise Mode</h1>
              <p className="text-slate-400">Build your dynasty</p>
            </div>
          </div>
          <FranchiseSetup onComplete={() => setFranchiseStep('draft')} />
        </div>
      </div>
    );
  }

  if (franchiseStep === 'draft') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950 to-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Franchise Mode</h1>
              <p className="text-slate-400">Draft your team</p>
            </div>
          </div>
          <FranchiseDraft onComplete={() => setFranchiseStep('season')} />
        </div>
      </div>
    );
  }

  if (franchiseStep === 'overview') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950 to-slate-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Franchise Mode</h1>
              <p className="text-slate-400">Season Complete</p>
            </div>
          </div>
          <FranchiseOverview />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
            <Trophy className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Franchise Mode</h1>
            <p className="text-slate-400">Manage your team</p>
          </div>
        </div>

        <Tabs defaultValue="season" className="space-y-6">
          <TabsList className="bg-slate-900/50 border border-slate-700">
            <TabsTrigger value="season">This Week</TabsTrigger>
            <TabsTrigger value="roster">Roster & Trades</TabsTrigger>
          </TabsList>

          <TabsContent value="season">
            <FranchiseWeek />
          </TabsContent>

          <TabsContent value="roster">
            <FranchiseRoster />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
