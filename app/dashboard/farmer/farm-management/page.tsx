'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Calendar, Sprout, Droplets, Zap, ShieldAlert, CheckCircle2,
  Clock, Plus, AlertCircle,  ChevronRight, Filter,
  Layers, ArrowUpRight, Check, X, Bug, RefreshCw, BarChart3,
  Leaf, Info, Upload
} from '../../../../components/ui/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function FarmManagementPage() {
  const searchParams = useSearchParams();
  const userId = searchParams?.get('userId');

  const [plans, setPlans] = useState<any[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'irrigation' | 'fertilizer' | 'pest_scouting' | 'harvest'>('all');

  // Modal creation state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCropKey, setSelectedCropKey] = useState('paddy');
  const [sowingDate, setSowingDate] = useState(new Date().toISOString().split('T')[0]);
  const [acreage, setAcreage] = useState<number>(3.5);
  const [variety, setVariety] = useState('');
  const [creating, setCreating] = useState(false);

  // Pest incident modal state
  const [isPestModalOpen, setIsPestModalOpen] = useState(false);
  const [pestName, setPestName] = useState('Yellow Stem Borer');
  const [pestSeverity, setPestSeverity] = useState<'low' | 'medium' | 'high'>('high');
  const [pestSymptoms, setPestSymptoms] = useState('Dead hearts observed in central leaf shoots.');
  const [pestAdvisory, setPestAdvisory] = useState('Apply Cartap Hydrochloride 4G @ 7.5kg/acre and setup pheromone traps.');
  const [loggingPest, setLoggingPest] = useState(false);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const url = userId 
        ? `/api/farmer/crop-lifecycle?userId=${userId}` 
        : `/api/farmer/crop-lifecycle`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setPlans(data.plans || []);
        setTemplates(data.templates || []);
        if (data.plans?.length > 0 && !selectedPlanId) {
          setSelectedPlanId(data.plans[0]._id);
        }
      }
    } catch (err) {
      console.error('Error fetching farm lifecycle plans:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [userId]);

  const activePlan = plans.find(p => p._id === selectedPlanId) || plans[0];

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      alert('Please log in or provide userId to create a farm management plan.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/farmer/crop-lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          cropKey: selectedCropKey,
          sowingDate,
          acreage: Number(acreage),
          variety: variety || 'Standard High-Yield'
        })
      });
      const data = await res.json();
      if (data.success) {
        setIsCreateOpen(false);
        await fetchPlans();
        setSelectedPlanId(data.plan._id);
      } else {
        alert(data.error || 'Failed to create plan');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreating(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: boolean) => {
    if (!activePlan) return;
    try {
      const res = await fetch('/api/farmer/crop-lifecycle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: activePlan._id,
          taskId,
          completed: !currentStatus,
          completedBy: 'Farmer'
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlans(prev => prev.map(p => p._id === activePlan._id ? data.plan : p));
      }
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleLogPest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePlan) return;
    setLoggingPest(true);
    try {
      const res = await fetch('/api/farmer/crop-lifecycle', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: activePlan._id,
          pestIncident: {
            pestName,
            severity: pestSeverity,
            symptoms: pestSymptoms,
            advisory: pestAdvisory
          },
          completedBy: 'Farmer'
        })
      });
      const data = await res.json();
      if (data.success) {
        setPlans(prev => prev.map(p => p._id === activePlan._id ? data.plan : p));
        setIsPestModalOpen(false);
      }
    } catch (err) {
      console.error('Failed to log pest incident:', err);
    } finally {
      setLoggingPest(false);
    }
  };

  // Filter tasks based on activeTab
  const filteredTasks = activePlan?.tasks?.filter((t: any) => {
    if (activeTab === 'all') return true;
    return t.category === activeTab;
  }) || [];

  const completedCount = activePlan?.tasks?.filter((t: any) => t.completed).length || 0;
  const totalTasks = activePlan?.tasks?.length || 0;
  const progressPct = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  // Calculate current growth stage
  const daysSinceSowing = activePlan
    ? Math.max(0, Math.floor((new Date().getTime() - new Date(activePlan.sowingDate).getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-[#166534] text-white p-6 md:p-8 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-200 text-xs font-semibold backdrop-blur-md mb-3">
            <Sprout className="w-3.5 h-3.5" /> Module 4: Dynamic Farm Lifecycle Management
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight" style={{ fontFamily: "'Outfit', sans-serif" }}>
            Crop Planning & Execution Engine
          </h1>
          <p className="text-sm text-emerald-100/80 mt-1 max-w-xl">
            Interactive agronomic scheduling for sowing timelines, stage-specific irrigation, precision NPK dosages, pest scouting, and harvest milestones.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-emerald-400 hover:bg-emerald-300 text-emerald-950 font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" /> Start New Crop Plan
          </Button>
        </div>
      </div>

      {/* Plan Selector & Progress Stats */}
      {plans.length > 0 && activePlan && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Active Crop Overview Card */}
          <div className="lg:col-span-3 bg-white border border-[#e2d4b7] rounded-3xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xl">
                  
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-[#1f3b2c]">{activePlan.cropName}</h2>
                    <Badge className="bg-emerald-100 text-emerald-800 border-0 text-xs">
                      {activePlan.acreage} Acres
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Sown on {new Date(activePlan.sowingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • Day {daysSinceSowing} of season
                  </p>
                </div>
              </div>

              {/* Selector if multiple plans */}
              {plans.length > 1 && (
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  className="px-3 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {plans.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.cropName} ({p.acreage} Ac) - {new Date(p.sowingDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Stage Progress Bar */}
            <div className="mt-5 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5 text-emerald-700 font-bold">
                  <Clock className="w-3.5 h-3.5" /> Lifecycle Completion
                </span>
                <span>{completedCount} of {totalTasks} Tasks Done ({progressPct}%)</span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                <div 
                  className="h-full bg-[#166534] rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
              <div className="bg-emerald-50/60 border border-emerald-100 p-3.5 rounded-2xl">
                <span className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Sowing Date
                </span>
                <p className="text-sm font-bold text-emerald-950 mt-1">
                  {new Date(activePlan.sowingDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </p>
              </div>

              <div className="bg-blue-50/60 border border-blue-100 p-3.5 rounded-2xl">
                <span className="text-[11px] font-bold text-blue-800 uppercase flex items-center gap-1">
                  <Droplets className="w-3 h-3" /> Target Harvest
                </span>
                <p className="text-sm font-bold text-blue-950 mt-1">
                  {new Date(activePlan.expectedHarvestDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
              </div>

              <div className="bg-amber-50/60 border border-amber-100 p-3.5 rounded-2xl">
                <span className="text-[11px] font-bold text-amber-800 uppercase flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Total Tasks
                </span>
                <p className="text-sm font-bold text-amber-950 mt-1">
                  {totalTasks} Actions
                </p>
              </div>

              <div className="bg-purple-50/60 border border-purple-100 p-3.5 rounded-2xl">
                <span className="text-[11px] font-bold text-purple-800 uppercase flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3" /> Pest Incidents
                </span>
                <p className="text-sm font-bold text-purple-950 mt-1">
                  {activePlan.pestIncidents?.length || 0} Logged
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions Sidebar */}
          <div className="bg-white border border-[#e2d4b7] rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Bug className="w-4 h-4 text-rose-600" /> Pest Surveillance
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Found insect larvae, leaf curl, or blast spots? Log an incident for agronomic advisory recommendations.
              </p>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
              <Button
                onClick={() => setIsPestModalOpen(true)}
                className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold border border-rose-200 rounded-2xl py-2.5 text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <ShieldAlert className="w-4 h-4" /> Report Pest/Disease
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {plans.length === 0 && !loading && (
        <div className="bg-white border border-[#e2d4b7] rounded-3xl p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-2xl border border-emerald-100">
            
          </div>
          <h2 className="text-xl font-bold text-slate-800">No Active Crop Lifecycle Plan</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Select your crop and sowing date to instantly generate a tailored irrigation schedule, precision fertilizer dosage timeline, and pest monitoring checklist.
          </p>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-[#166534] hover:bg-[#14532d] text-white font-bold px-6 py-2.5 rounded-2xl text-xs inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Generate Crop Schedule
          </Button>
        </div>
      )}

      {/* Interactive Task Schedule Table & Filter Tabs */}
      {activePlan && (
        <div className="bg-white border border-[#e2d4b7] rounded-3xl overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/50">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Crop Operational Task Timeline</h3>
              <p className="text-xs text-slate-500 mt-0.5">Filter by farming operation and check off completed activities.</p>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'all', label: 'All Tasks', icon: Layers },
                { key: 'irrigation', label: 'Irrigation', icon: Droplets },
                { key: 'fertilizer', label: 'Fertilizers', icon: Zap },
                { key: 'pest_scouting', label: 'Pest Scouting', icon: Bug },
                { key: 'harvest', label: 'Harvest', icon: Sprout }
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      active
                        ? 'bg-[#166534] text-white '
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" /> {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Task List */}
          <div className="divide-y divide-slate-100">
            {filteredTasks.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No tasks found for this category.
              </div>
            ) : (
              filteredTasks.map((task: any) => {
                const isOverdue = !task.completed && new Date(task.dueDate) < new Date();
                return (
                  <div
                    key={task.taskId || task._id}
                    className={`p-4 md:p-5 flex items-start justify-between gap-4 transition-colors ${
                      task.completed ? 'bg-emerald-50/20 opacity-80' : 'hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={() => handleToggleTask(task.taskId || task._id, task.completed)}
                        className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                          task.completed
                            ? 'bg-emerald-600 text-white '
                            : 'border-2 border-slate-300 hover:border-emerald-500 bg-white'
                        }`}
                      >
                        {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-sm font-bold ${task.completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                            {task.title}
                          </span>
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                            Day +{task.dueDayOffset}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100">
                            {task.stageName}
                          </span>
                          {isOverdue && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700">
                              Action Due
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                          {task.description}
                        </p>

                        <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                          <span>
                            Target Date: {new Date(task.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                          {task.completedAt && (
                            <span className="text-emerald-700 font-medium">
                               Completed on {new Date(task.completedAt).toLocaleDateString('en-IN')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {task.dosage && (
                      <div className="hidden sm:block text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">Dosage</span>
                        <span className="text-xs font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100 inline-block mt-0.5">
                          {task.dosage}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Pest Incident Log History */}
      {activePlan?.pestIncidents && activePlan.pestIncidents.length > 0 && (
        <div className="bg-white border border-[#e2d4b7] rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <Bug className="w-4 h-4 text-rose-600" /> Recorded Pest & Disease Incidents
            </h3>
            <Badge className="bg-rose-100 text-rose-800 border-0 text-xs">
              {activePlan.pestIncidents.length} Records
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePlan.pestIncidents.map((incident: any, idx: number) => (
              <div key={idx} className="bg-rose-50/40 border border-rose-100 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <h4 className="text-sm font-bold text-rose-950">{incident.pestName}</h4>
                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-full ${
                    incident.severity === 'high' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                  }`}>
                    {incident.severity} Severity
                  </span>
                </div>
                <p className="text-xs text-slate-700"><strong>Symptoms:</strong> {incident.symptoms}</p>
                <div className="bg-white p-3 rounded-xl border border-rose-200/60 text-xs text-emerald-900 font-medium">
                  <strong>Agronomic Advisory:</strong> {incident.advisory}
                </div>
                <p className="text-[10px] text-slate-400">
                  Reported by {incident.reportedBy} on {new Date(incident.reportedAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Create Plan */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#e2d4b7] w-full max-w-lg rounded-3xl p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Sprout className="w-5 h-5 text-emerald-600" /> Generate Seasonal Crop Plan
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Select Crop Template</label>
                <select
                  value={selectedCropKey}
                  onChange={(e) => setSelectedCropKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="paddy">Paddy (Rice) - 120 Days</option>
                  <option value="coffee">Coffee (Robusta / Arabica) - 240 Days</option>
                  <option value="maize">Maize (Corn) - 105 Days</option>
                  <option value="tomato">Tomato - 110 Days</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Sowing Date</label>
                  <input
                    type="date"
                    value={sowingDate}
                    onChange={(e) => setSowingDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Land Extent (Acres)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={acreage}
                    onChange={(e) => setAcreage(parseFloat(e.target.value) || 1)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Seed Variety (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Sona Masoori / Hybrid 6444"
                  value={variety}
                  onChange={(e) => setVariety(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={creating}
                  className="bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs px-5"
                >
                  {creating ? 'Generating Calendar...' : 'Generate Plan'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Report Pest */}
      {isPestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white border border-[#e2d4b7] w-full max-w-lg rounded-3xl p-6 space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Bug className="w-5 h-5 text-rose-600" /> Log Pest Incident & Advisory
              </h3>
              <button onClick={() => setIsPestModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogPest} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Observed Pest / Disease</label>
                <input
                  type="text"
                  value={pestName}
                  onChange={(e) => setPestName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Severity</label>
                <select
                  value={pestSeverity}
                  onChange={(e) => setPestSeverity(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="low">Low - Isolated spotted plants</option>
                  <option value="medium">Medium - Spreading across rows</option>
                  <option value="high">High - Severe crop damage risk</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Field Symptoms</label>
                <textarea
                  rows={2}
                  value={pestSymptoms}
                  onChange={(e) => setPestSymptoms(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Recommended Advisory Step</label>
                <textarea
                  rows={2}
                  value={pestAdvisory}
                  onChange={(e) => setPestAdvisory(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPestModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loggingPest}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs px-5"
                >
                  {loggingPest ? 'Logging...' : 'Save Incident'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
