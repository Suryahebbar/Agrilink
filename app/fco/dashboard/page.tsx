'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  FiUsers, FiClock, FiCheckSquare, FiLogOut, FiLink2,
  FiCalendar, FiMapPin, FiCheckCircle, FiInfo, FiLayers, FiFileText,
  FiSliders, FiDollarSign, FiShield, FiCpu, FiAward, FiLoader,
  FiPhone, FiMap, FiPlus, FiTrash2, FiEdit2, FiGrid, FiChevronRight, FiList, FiLock, FiAlertCircle, FiUpload, FiDownload
} from 'react-icons/fi';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import HeaderWrapper from '../../components/Header/HeaderWrapper';
import SmartContractDocument from '../../components/SmartContractDocument/SmartContractDocument';
import ContributionHistoryTable from '@/components/pooling/ContributionHistoryTable';
import PoolSettlementView from '@/components/pooling/PoolSettlementView';


interface Participant {
  userId: string;
  fullName: string;
  phone: string;
  landSize: number;
  surveyNumber: string;
  investmentContribution: number;
  labourContribution: number;
  machineryContribution: string;
  landContribution: number;
  address?: string; // farmer address
}

interface Reminder {
  id: string;
  text: string;
  date: string;
  time: string;
}

interface FarmPool {
  _id: string;
  name: string;
  status: 'awaiting_counselor' | 'counseling_scheduled' | 'planning' | 'signing' | 'blockchain_storage' | 'active';
  participants: Participant[];
  counselorId?: string;
  counselorName?: string;
  collaborationModel?: 1 | 2 | 3 | 4 | 5;
  meetingDetails?: {
    meetingType: 'online' | 'offline';
    scheduledAt: string;
    location?: string;
    meetingLink?: string;
    checklist?: {
      benefits: boolean;
      risks: boolean;
      profitSharing: boolean;
      lossSharing: boolean;
      responsibilities: boolean;
      exitConditions: boolean;
      investmentModel: boolean;
      insurance: boolean;
      resourceSharing: boolean;
      answersProvided: boolean;
    };
  };
  farmPlan?: {
    selectedCrop: string;
    cultivationPeriod: string;
    farmArea: number;
    irrigationMethod: string;
    cropPlanning: string;
    sowingSchedule: string;
    fertilizerSchedule: string;
    irrigationSchedule: string;
    pestMonitoring: string;
    harvestSchedule: string;
    estimatedCost: number;
    expectedYield: string;
    expectedRevenue: number;
    profitSharingRatio: string;
    lossSharingRatio: string;
    seeds: string;
    fertilizers: string;
    equipment: string;
    labour: string;
    storage: string;
    transportation: string;
    insuranceType: 'government' | 'private' | 'none';
    insuranceProvider: string;
    coverageDetails: string;
    claimResponsibility: string;
    premiumSharing: string;
  };
  startDate?: string;
  endDate?: string;
  isTerminated?: boolean;
  tasksList?: Array<{
    id: string;
    name: string;
    status: 'pending' | 'completed';
    date: string;
  }>;
  expensesList?: Array<{
    id: string;
    category: string;
    amount: number;
    date: string;
    farmerId: string;
    farmerName: string;
    reason: string;
  }>;
}

// Helper functions for traditional Indian land measurement (Acre-Gunta system where 40 Guntas = 1 Acre)
// Decimals are treated as Guntas (e.g. 0.40 = 40 Guntas = 1 Acre, 0.53 = 53 Guntas = 1 Acre 13 Guntas)
function toGuntas(value: number): number {
  if (!value || isNaN(value)) return 0;
  const str = value.toFixed(2);
  const parts = str.split('.');
  const acres = parseInt(parts[0], 10) || 0;
  const guntas = parseInt(parts[1], 10) || 0;
  return acres * 40 + guntas;
}

function fromGuntas(guntas: number): number {
  if (!guntas || isNaN(guntas) || guntas <= 0) return 0;
  const acres = Math.floor(guntas / 40);
  const remainingGuntas = Math.round(guntas % 40);
  return parseFloat(`${acres}.${remainingGuntas.toString().padStart(2, '0')}`);
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const userId = searchParams.get('userId');

  const [pools, setPools] = useState<FarmPool[]>([]);
  const [selectedPool, setSelectedPool] = useState<FarmPool | null>(null);
  const [loading, setLoading] = useState(true);

  // Active sidebar Tab state from URL query param
  const activeSidebarTab =
    searchParams.get('tab') === 'calendar' ? 'calendar' :
      searchParams.get('tab') === 'manage-pools' ? 'manage-pools' :
        searchParams.get('tab') === 'schemes' ? 'schemes' : 'assigned-farmers';

  const setActiveSidebarTab = (tab: 'assigned-farmers' | 'manage-pools' | 'calendar' | 'schemes') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/fco/dashboard?${params.toString()}`);
  };

  // Active form Tab state from URL query param
  const activeTab = (searchParams.get('formTab') as 'model' | 'info' | 'contributions' | 'financials' | 'insurance') || 'model';

  const setActiveTab = (tab: 'model' | 'info' | 'contributions' | 'financials' | 'insurance') => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('formTab', tab);
    router.push(`/fco/dashboard?${params.toString()}`);
  };

  // Reminders / Calendar States
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminderText, setNewReminderText] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [newReminderTime, setNewReminderTime] = useState('');

  // Meeting Schedule States
  const [meetingType, setMeetingType] = useState<'online' | 'offline'>('online');
  const [scheduledAt, setScheduledAt] = useState('');
  const [location, setLocation] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  // Counseling Checklist States
  const [checklist, setChecklist] = useState({
    benefits: false,
    risks: false,
    profitSharing: false,
    lossSharing: false,
    responsibilities: false,
    exitConditions: false,
    investmentModel: false,
    insurance: false,
    resourceSharing: false,
    answersProvided: false
  });

  // Collaboration Model State
  const [selectedModel, setSelectedModel] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Irrigation and Custom Crop States
  const [irrigationSelection, setIrrigationSelection] = useState('');
  const [customIrrigation, setCustomIrrigation] = useState('');
  const [customCropInput, setCustomCropInput] = useState('');
  const [totalPrivatePremium, setTotalPrivatePremium] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Contract Timeline States
  const [contractStartDate, setContractStartDate] = useState('');
  const [contractEndDate, setContractEndDate] = useState('');

  // Operational Block States
  const [blockActionInput, setBlockActionInput] = useState('');
  const [blockRemarksInput, setBlockRemarksInput] = useState('');
  const [isPublishingBlock, setIsPublishingBlock] = useState(false);

  // Dynamic Crop Management Board & Expense States
  const [newBoardTaskName, setNewBoardTaskName] = useState('');
  const [newBoardTaskDate, setNewBoardTaskDate] = useState('');
  const [newExpCategory, setNewExpCategory] = useState('Seeds');
  const [newExpCustomCategory, setNewExpCustomCategory] = useState('');
  const [newExpAmount, setNewExpAmount] = useState('');
  const [newExpFarmerId, setNewExpFarmerId] = useState('');
  const [newExpReason, setNewExpReason] = useState('');

  // Conflict Tickets State
  const [tickets, setTickets] = useState<any[]>([]);
  const [resolutionInput, setResolutionInput] = useState<{ [key: string]: string }>({});
  const [isResolvingTicket, setIsResolvingTicket] = useState<{ [key: string]: boolean }>({});

  // FCO Schemes operations states
  const [fcoSchemes, setFcoSchemes] = useState<any[]>([]);
  const [fcoCampaigns, setFcoCampaigns] = useState<any[]>([]);
  const [fcoPoolProposals, setFcoPoolProposals] = useState<any[]>([]);
  const [loadingFcoSchemes, setLoadingFcoSchemes] = useState(false);
  const [recommendTargetSchemeId, setRecommendTargetSchemeId] = useState('');
  const [recommendFilterCrop, setRecommendFilterCrop] = useState('');
  const [recommendFilterState, setRecommendFilterState] = useState('');
  const [isSendingRecommendation, setIsSendingRecommendation] = useState(false);
  const [fcoSchemesSubTab, setFcoSchemesSubTab] = useState<'list' | 'campaigns' | 'consensus' | 'applied'>('list');
  const [recommendSchemeData, setRecommendSchemeData] = useState<any | null>(null);

  // FCO Schemes Tab Filters
  const [fcoSearchQuery, setFcoSearchQuery] = useState('');
  const [fcoFilterCategory, setFcoFilterCategory] = useState('');
  const [fcoFilterCropText, setFcoFilterCropText] = useState('');
  const [fcoFilterStateText, setFcoFilterStateText] = useState('');

  // File Upload State
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // Farm Planning Form States
  const [farmPlan, setFarmPlan] = useState({
    selectedCrop: '',
    cultivationPeriod: '',
    farmArea: 0,
    irrigationMethod: '',
    cropPlanning: '',
    sowingSchedule: '',
    fertilizerSchedule: '',
    irrigationSchedule: '',
    pestMonitoring: '',
    harvestSchedule: '',
    estimatedCost: 0,
    expectedYield: '',
    expectedRevenue: 0,
    profitSharingRatio: '',
    lossSharingRatio: '',
    seeds: '',
    fertilizers: '',
    equipment: '',
    labour: '',
    storage: '',
    transportation: '',
    insuranceType: 'none' as 'government' | 'private' | 'none',
    insuranceProvider: '',
    coverageDetails: '',
    claimResponsibility: '',
    premiumSharing: ''
  });

  // Participant contributions
  const [participantContributions, setParticipantContributions] = useState<{
    [key: string]: {
      investment: number;
      labour: number;
      machinery: string;
      land: number;
      collaborationModel: 1 | 2 | 3 | 4 | 5;
      labourChargePerDay: number;
    }
  }>({});

  const queryPoolId = searchParams.get('poolId');

  const setSelectedPoolAndUrl = (pool: FarmPool | null) => {
    setSelectedPool(pool);
    const params = new URLSearchParams(searchParams.toString());
    if (pool) {
      params.set('poolId', pool._id);
    } else {
      params.delete('poolId');
    }
    router.push(`/fco/dashboard?${params.toString()}`);
  };

  const fetchPools = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/fco/pools?userId=${userId || ''}`);
      const data = await res.json();
      if (data.success) {
        setPools(data.pools);
        if (data.pools.length > 0) {
          const poolFromUrl = queryPoolId ? data.pools.find((p: any) => p._id === queryPoolId) : null;
          setSelectedPool(poolFromUrl || selectedPool ? data.pools.find((p: any) => p._id === (selectedPool?._id || '')) || data.pools[0] : data.pools[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching FCO pools:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, [userId]);

  useEffect(() => {
    if (selectedPool) {
      if (selectedPool.meetingDetails?.checklist) {
        setChecklist(selectedPool.meetingDetails.checklist);
      }
      if (selectedPool.collaborationModel) {
        setSelectedModel(selectedPool.collaborationModel);
      }

      setContractStartDate(selectedPool.startDate ? new Date(selectedPool.startDate).toISOString().split('T')[0] : '');
      setContractEndDate(selectedPool.endDate ? new Date(selectedPool.endDate).toISOString().split('T')[0] : '');

      // Fetch active tickets for selected pool
      fetch(`/api/farmer/pooling/tickets?poolId=${selectedPool._id}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.tickets) {
            setTickets(data.tickets);
          }
        })
        .catch(err => console.error(err));

      const totalGuntas = selectedPool.participants.reduce((acc, p) => acc + toGuntas(p.landContribution || p.landSize || 0), 0);
      const totalSize = fromGuntas(totalGuntas);

      if (selectedPool.farmPlan) {
        setFarmPlan({
          ...farmPlan,
          ...selectedPool.farmPlan
        });
        const method = selectedPool.farmPlan.irrigationMethod || '';
        const standardOptions = ['Drip', 'Sprinkler', 'River', 'Borewell', 'Well', 'Rainfed'];
        if (standardOptions.includes(method)) {
          setIrrigationSelection(method);
          setCustomIrrigation('');
        } else if (method) {
          setIrrigationSelection('Other');
          setCustomIrrigation(method);
        } else {
          setIrrigationSelection('');
          setCustomIrrigation('');
        }
      } else {
        setFarmPlan(prev => ({
          ...prev,
          farmArea: totalSize,
          selectedCrop: '',
          irrigationMethod: '',
          cultivationPeriod: ''
        }));
        setIrrigationSelection('');
        setCustomIrrigation('');
      }

      const contributions: typeof participantContributions = {};
      selectedPool.participants.forEach(p => {
        contributions[p.userId] = {
          investment: p.investmentContribution || 0,
          labour: p.labourContribution || 0,
          machinery: p.machineryContribution || '',
          land: p.landContribution || p.landSize || 0,
          collaborationModel: (p as any).collaborationModel || 1,
          labourChargePerDay: (p as any).labourChargePerDay || 0
        };
      });
      setParticipantContributions(contributions);
    }
  }, [selectedPool]);

  // Auto-calculate combined farm area
  useEffect(() => {
    if (selectedPool) {
      const totalGuntas = selectedPool.participants.reduce(
        (acc, p) => acc + toGuntas(participantContributions[p.userId]?.land || p.landContribution || p.landSize || 0),
        0
      );
      const totalLand = fromGuntas(totalGuntas);
      setFarmPlan(prev => {
        if (prev.farmArea !== totalLand) {
          return { ...prev, farmArea: totalLand };
        }
        return prev;
      });
    }
  }, [participantContributions, selectedPool]);

  // Auto-calculate Insurance fields (Claim Responsibility, Premium Sharing, Coverage Details)
  useEffect(() => {
    if (!selectedPool) return;

    // Get farmer percentages
    const totalGuntas = selectedPool.participants.reduce(
      (acc, p) => acc + toGuntas(participantContributions[p.userId]?.land || p.landContribution || p.landSize || 0),
      0
    );
    const modelFactors: { [key: number]: number } = { 1: 0.1, 2: 0.8, 3: 0.6, 4: 0.9, 5: 0.7 };
    const weights = selectedPool.participants.map(p => {
      const land = participantContributions[p.userId]?.land || p.landContribution || p.landSize || 0;
      const landGuntas = toGuntas(land);
      const model = participantContributions[p.userId]?.collaborationModel || 1;
      const landPct = totalGuntas > 0 ? landGuntas / totalGuntas : 0;
      const factor = modelFactors[model] || 0.5;

      const resourceVal = getFarmerResourceContributionsVal(p.userId);
      const resourceWeight = farmPlan.estimatedCost > 0 ? (resourceVal / farmPlan.estimatedCost) * 0.3 : 0;

      return {
        userId: p.userId,
        fullName: p.fullName,
        rawWeight: landPct * factor + resourceWeight
      };
    });

    const sumWeights = weights.reduce((acc, w) => acc + w.rawWeight, 0);
    const platformPct = sumWeights > 0 ? Math.max(10, Math.min(90, Math.round((1 - sumWeights) * 100))) : 30;
    const remainingPct = 100 - platformPct;

    const farmerPctList = weights.map(w => {
      const farmerPct = sumWeights > 0 ? Math.round((w.rawWeight / sumWeights) * remainingPct) : 0;
      return {
        fullName: w.fullName,
        percentage: farmerPct
      };
    });

    const totalFarmerPct = farmerPctList.reduce((sum, f) => sum + f.percentage, 0);

    setFarmPlan(prev => {
      let coverage = prev.coverageDetails;
      let claim = prev.claimResponsibility;
      let premium = prev.premiumSharing;

      if (prev.insuranceType === 'government') {
        coverage = "Government Scheme: No guarantee of payout. Payout is strictly conditional on government declarations of drought or heavy rain conditions in the region.";
        claim = "Farmer is responsible for filing claims via government Bhoomi/Kisan portal; payouts will be credited directly to farmer bank accounts.";
        premium = "Premium shared based on government scheme subsidised rates (split by land area share).";
      } else if (prev.insuranceType === 'private') {
        coverage = `Private Insurance: Covers crop loss under specified policy terms up to ₹${prev.estimatedCost || 0} (Full Cost coverage).`;
        claim = "AgriLink will facilitate insurance claims with the private provider; payouts distributed proportionate to loss sharing ratios.";

        // Calculate premium sharing by profit sharing percentage
        premium = farmerPctList.map(f => {
          const share = totalFarmerPct > 0 ? (f.percentage / totalFarmerPct) : 0;
          return `${f.fullName}: ${Math.round(share * 100)}% (₹${Math.round(share * (totalPrivatePremium || 0))})`;
        }).join('; ');
      } else if (prev.insuranceType === 'none') {
        coverage = "No Insurance Active: In case of crop loss, damages, or natural calamities, AgriLink shall not provide any compensation or financial aid. Farmers are solely and individually responsible for all losses.";
        claim = "Solely the farmers' responsibility. No insurance active.";
        premium = "Not Applicable. No premium due.";
      }

      if (prev.coverageDetails !== coverage || prev.claimResponsibility !== claim || prev.premiumSharing !== premium) {
        return {
          ...prev,
          coverageDetails: coverage,
          claimResponsibility: claim,
          premiumSharing: premium
        };
      }
      return prev;
    });
  }, [farmPlan.insuranceType, totalPrivatePremium, participantContributions, selectedPool, farmPlan.estimatedCost]);

  const handleLogout = () => {
    router.push('/');
  };

  const handleScheduleMeeting = async () => {
    if (!selectedPool || !scheduledAt) return;
    try {
      const res = await fetch('/api/fco/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool._id,
          action: 'schedule_meeting',
          meetingType,
          scheduledAt,
          location,
          meetingLink
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Counseling meeting scheduled successfully!');
        fetchPools();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveChecklist = async () => {
    if (!selectedPool) return;
    try {
      const res = await fetch('/api/fco/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool._id,
          action: 'complete_counseling',
          checklist
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Counseling objectives saved. Moving to Farm Planning!');
        fetchPools();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchFcoSchemesData = async () => {
    if (!userId) return;
    setLoadingFcoSchemes(true);
    try {
      // 1. Fetch available schemes
      const schemesRes = await fetch('/api/admin/schemes?limit=50');
      const schemesData = await schemesRes.json();
      if (schemesData.success) {
        setFcoSchemes(schemesData.data || []);
      }

      // 2. Fetch campaigns (recommendations status)
      const campaignRes = await fetch('/api/admin/schemes/recommend');
      const campaignData = await campaignRes.json();
      if (campaignData.success) {
        setFcoCampaigns(campaignData.data || []);
      }

      // 3. Fetch pool proposals that have unanimous consensus ('approved' or 'applied')
      const poolsRes = await fetch(`/api/fco/pools?userId=${userId}`);
      const poolsData = await poolsRes.json();
      if (poolsData.success) {
        const approvedProps: any[] = [];
        (poolsData.pools || []).forEach((pool: any) => {
          (pool.proposedSchemes || []).forEach((prop: any) => {
            if (prop.status === 'approved' || prop.status === 'applied') {
              approvedProps.push({
                ...prop,
                poolId: pool._id,
                poolName: pool.name
              });
            }
          });
        });
        setFcoPoolProposals(approvedProps);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingFcoSchemes(false);
    }
  };

  const handleSendRecommendation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recommendTargetSchemeId || !userId) return;
    setIsSendingRecommendation(true);
    try {
      const res = await fetch('/api/admin/schemes/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: recommendTargetSchemeId,
          fcoId: userId,
          filter: {
            crop: recommendFilterCrop,
            state: recommendFilterState
          }
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully recommended to ${data.count} farmers matching criteria!`);
        setRecommendTargetSchemeId('');
        setRecommendFilterCrop('');
        setRecommendFilterState('');
        fetchFcoSchemesData();
      } else {
        alert(data.error || 'Failed to send recommendations');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSendingRecommendation(false);
    }
  };

  const handleBulkApplyCampaign = async (campaignId: string) => {
    try {
      const res = await fetch('/api/admin/schemes/recommend', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recommendationId: campaignId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Successfully bulk-applied for all interested farmers! Status updated.`);
        fetchFcoSchemesData();
      } else {
        alert(data.error || 'Failed to bulk-apply');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleApplyGroupProposal = async (poolId: string, proposalId: string) => {
    if (!userId) return;
    try {
      const res = await fetch('/api/farmer/pooling/propose-scheme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId,
          proposalId,
          action: 'apply',
          fcoId: userId
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Scheme applied successfully on behalf of the shared land pool consensus group!');
        fetchFcoSchemesData();
        fetchPools();
      } else {
        alert(data.error || 'Failed to apply consensus scheme');
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeSidebarTab === 'schemes' && userId) {
      fetchFcoSchemesData();
    }
  }, [activeSidebarTab, userId]);

  const handleSavePlanning = async () => {
    if (!selectedPool) return;
    try {
      // Map participant contributions
      const updatedParticipants = selectedPool.participants.map(p => {
        const contrib = participantContributions[p.userId] || {
          investment: 0,
          labour: 0,
          machinery: '',
          land: p.landContribution || p.landSize,
          collaborationModel: (p as any).collaborationModel || 1,
          labourChargePerDay: (p as any).labourChargePerDay || 0
        };

        let finalInvestment = contrib.investment;
        if (contrib.collaborationModel === 2 || contrib.collaborationModel === 4) {
          const totalGuntas = selectedPool.participants.reduce((acc, p2) => acc + toGuntas(participantContributions[p2.userId]?.land || p2.landContribution || p2.landSize || 0), 0);
          const farmerGuntas = toGuntas(contrib.land);
          const landRatio = totalGuntas > 0 ? farmerGuntas / totalGuntas : 0;
          finalInvestment = Math.round(landRatio * (farmPlan.estimatedCost || 0));
        }

        return {
          userId: p.userId,
          fullName: p.fullName,
          phone: p.phone,
          landSize: p.landSize,
          surveyNumber: p.surveyNumber,
          investmentContribution: finalInvestment,
          labourContribution: contrib.collaborationModel === 1 || contrib.collaborationModel === 4 ? 0 : contrib.labour,
          machineryContribution: contrib.collaborationModel === 5 ? contrib.machinery : '',
          landContribution: contrib.land,
          collaborationModel: contrib.collaborationModel || 1,
          labourChargePerDay: contrib.collaborationModel === 3 ? (contrib.labourChargePerDay || 0) : 0
        };
      });

      // 1. Save general collaboration model (fallback to first participant's choice)
      await fetch('/api/fco/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool._id,
          action: 'select_model',
          collaborationModel: updatedParticipants[0]?.collaborationModel || 1
        })
      });

      // 2. Save farm plan details with updated participants
      const res = await fetch('/api/fco/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool._id,
          action: 'save_planning',
          farmPlan,
          participants: updatedParticipants,
          startDate: contractStartDate,
          endDate: contractEndDate
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Form details saved successfully!');
        fetchPools();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleGenerateContract = async () => {
    if (!selectedPool) return;
    try {
      await handleSavePlanning();
      const res = await fetch('/api/fco/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool._id,
          action: 'generate_contract'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('Smart Contract generated and dispatched to all farmers successfully!');
        fetchPools();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddProgressBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool || !blockActionInput) return;
    try {
      setIsPublishingBlock(true);
      const res = await fetch('/api/fco/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool._id,
          action: 'add_progress_block',
          blockAction: blockActionInput,
          remarks: blockRemarksInput,
          operator: 'FCO Node Facilitator'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert(`Block successfully anchored on the chain progression ledger!`);
        setBlockActionInput('');
        setBlockRemarksInput('');
        fetchPools();
      } else {
        alert(data.error || 'Failed to anchor block.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error occurred while sealing block.');
    } finally {
      setIsPublishingBlock(false);
    }
  };

  const handleAddBoardTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool || !newBoardTaskName) return;
    try {
      const res = await fetch('/api/fco/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool._id,
          action: 'add_task',
          taskName: newBoardTaskName,
          taskDate: newBoardTaskDate
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewBoardTaskName('');
        setNewBoardTaskDate('');
        fetchPools();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleBoardTask = async (taskId: string) => {
    if (!selectedPool) return;
    try {
      const res = await fetch('/api/fco/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool._id,
          action: 'toggle_task',
          taskId
        })
      });
      if (res.ok) {
        fetchPools();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBoardTask = async (taskId: string) => {
    if (!selectedPool) return;
    try {
      const res = await fetch('/api/fco/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool._id,
          action: 'delete_task',
          taskId
        })
      });
      if (res.ok) {
        fetchPools();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddBoardExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPool || !newExpAmount || !newExpFarmerId) {
      alert('Please fill all expense fields.');
      return;
    }
    const farmer = selectedPool.participants.find(p => p.userId === newExpFarmerId);
    if (!farmer) return;

    const finalCategory = newExpCategory === 'Others' ? (newExpCustomCategory || 'Custom Expense') : newExpCategory;

    try {
      const res = await fetch('/api/fco/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool._id,
          action: 'add_expense',
          category: finalCategory,
          amount: newExpAmount,
          farmerId: newExpFarmerId,
          farmerName: farmer.fullName,
          reason: newExpReason
        })
      });
      const data = await res.json();
      if (data.success) {
        setNewExpAmount('');
        setNewExpReason('');
        setNewExpFarmerId('');
        setNewExpCustomCategory('');
        fetchPools();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteBoardExpense = async (expenseId: string) => {
    if (!selectedPool) return;
    try {
      const res = await fetch('/api/fco/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool._id,
          action: 'delete_expense',
          expenseId
        })
      });
      if (res.ok) {
        fetchPools();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveConflictTicket = async (ticketId: string) => {
    const resolution = resolutionInput[ticketId];
    if (!resolution || !resolution.trim()) {
      alert('Please enter a resolution explanation.');
      return;
    }

    try {
      setIsResolvingTicket(prev => ({ ...prev, [ticketId]: true }));
      const res = await fetch('/api/farmer/pooling/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'resolve',
          ticketId,
          resolution,
          resolvedBy: 'Field Counseling Officer'
        })
      });
      const data = await res.json();
      if (data.success) {
        setResolutionInput(prev => ({ ...prev, [ticketId]: '' }));
        // Refresh ticket list
        if (selectedPool) {
          const ticketRes = await fetch(`/api/farmer/pooling/tickets?poolId=${selectedPool._id}`);
          if (ticketRes.ok) {
            const ticketData = await ticketRes.json();
            if (ticketData.success && ticketData.tickets) {
              setTickets(ticketData.tickets);
            }
          }
          fetchPools(); // Refresh pool timeline on-chain logs
        }
        alert('Dispute resolved successfully. sealed block progress transaction has been generated.');
      } else {
        alert(data.error || 'Failed to resolve ticket.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error occurred while resolving ticket.');
    } finally {
      setIsResolvingTicket(prev => ({ ...prev, [ticketId]: false }));
    }
  };

  const handleUploadPoolFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPool) return;

    try {
      setIsUploadingFile(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        const fileUrl = reader.result as string;
        const res = await fetch('/api/fco/pools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            poolId: selectedPool._id,
            action: 'upload_file',
            fileName: file.name,
            fileUrl
          })
        });
        const data = await res.json();
        if (data.success) {
          fetchPools();
          alert('File uploaded successfully. Shared with all farmers in this pool.');
        } else {
          alert('Failed to upload file.');
        }
        setIsUploadingFile(false);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.error(err);
      alert('Error occurred during file upload.');
      setIsUploadingFile(false);
    }
  };

  const handleDeletePoolFile = async (fileId: string) => {
    if (!selectedPool || !window.confirm('Are you sure you want to delete this file?')) return;
    try {
      const res = await fetch('/api/fco/pools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: selectedPool._id,
          action: 'delete_file',
          fileId
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchPools();
        alert('File deleted successfully.');
      } else {
        alert('Failed to delete file.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReminderText || !newReminderDate || !newReminderTime) return;
    const r = {
      id: Date.now().toString(),
      text: newReminderText,
      date: newReminderDate,
      time: newReminderTime
    };
    setReminders([...reminders, r]);
    setNewReminderText('');
    setNewReminderDate('');
    setNewReminderTime('');
  };

  const handleDeleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const modelDescriptions = {
    1: { title: 'Model 1 – Land Lease', desc: 'Farmers lease unused land. AgriLink manages cultivation. Farmers receive fixed lease income.' },
    2: { title: 'Model 2 – Managed Farming', desc: 'Farmers invest in cultivation. AgriLink manages operations. AgriLink earns a management fee.' },
    3: { title: 'Model 3 – Partnership Farming', desc: 'Farmers contribute land and labour. AgriLink (or investors) contribute capital. Profits are shared according to the agreed ratio.' },
    4: { title: 'Model 4 – Marketing Partner', desc: 'Farmers cultivate independently. AgriLink provides buyer discovery, marketing, and logistics. Revenue generated via commission.' },
    5: { title: 'Model 5 – Collaborative Farm Pool', desc: 'Multiple farmers combine land, investment, labour, and machinery. Platform transparently records contributions and distributes profits/losses.' }
  };

  const renderScheduleEditor = (
    label: string,
    fieldKey: 'sowingSchedule' | 'fertilizerSchedule' | 'irrigationSchedule' | 'pestMonitoring' | 'harvestSchedule',
    standardOptions: string[]
  ) => {
    const rawValue = farmPlan[fieldKey] || '';
    let items: Array<{ activity: string; date: string; notes: string }> = [];
    try {
      if (rawValue.startsWith('[')) {
        items = JSON.parse(rawValue);
      } else if (rawValue) {
        items = [{ activity: 'Other', date: '', notes: rawValue }];
      }
    } catch (e) {
      items = [{ activity: 'Other', date: '', notes: rawValue }];
    }

    const updateItems = (newItems: typeof items) => {
      setFarmPlan(prev => ({ ...prev, [fieldKey]: JSON.stringify(newItems) }));
    };

    const handleAddItem = () => {
      const newItem = { activity: standardOptions[0] || 'Other', date: '', notes: '' };
      updateItems([...items, newItem]);
    };

    const handleRemoveItem = (index: number) => {
      const newItems = items.filter((_, idx) => idx !== index);
      updateItems(newItems);
    };

    const handleFieldChange = (index: number, key: keyof typeof items[0], val: string) => {
      const newItems = items.map((item, idx) => {
        if (idx === index) {
          return { ...item, [key]: val };
        }
        return item;
      });
      updateItems(newItems);
    };

    return (
      <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-3 col-span-1 md:col-span-2">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100">
          <label className="block font-bold text-gray-700 uppercase tracking-wider text-xs">{label}</label>
          <button
            type="button"
            onClick={handleAddItem}
            className="text-xs bg-[#1f3b2c] hover:bg-[#152a1f] text-white font-bold px-2 py-1 rounded-md flex items-center gap-1 transition-all"
          >
            <FiPlus className="w-3.5 h-3.5" /> Add Task
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-[11px] text-gray-400 italic">No tasks added to this schedule yet. Click 'Add Task' to plan activities.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-150 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Task / Activity</label>
                  <select
                    value={item.activity}
                    onChange={(e) => handleFieldChange(idx, 'activity', e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-slate-800 bg-white font-semibold text-xs"
                  >
                    {standardOptions.map((opt, oIdx) => (
                      <option key={oIdx} value={opt}>{opt}</option>
                    ))}
                    <option value="Other">Other (Custom)</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Target Date</label>
                  <input
                    type="date"
                    value={item.date}
                    onChange={(e) => handleFieldChange(idx, 'date', e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-slate-800 bg-white font-semibold text-xs"
                  />
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Notes / Details</label>
                  <input
                    type="text"
                    placeholder="Enter details..."
                    value={item.notes}
                    onChange={(e) => handleFieldChange(idx, 'notes', e.target.value)}
                    className="w-full border border-gray-200 rounded-md px-2 py-1 text-slate-800 bg-white font-semibold text-xs"
                  />
                </div>

                <div className="md:col-span-1 text-right">
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-red-500 hover:text-red-700 p-1 mb-0.5 inline-block"
                    title="Delete Task"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getFarmerResourceContributionsVal = (userId: string) => {
    let totalResourceValue = 0;
    const resourceFields: Array<'seeds' | 'fertilizers' | 'equipment' | 'labour' | 'storage' | 'transportation'> = [
      'seeds', 'fertilizers', 'equipment', 'labour', 'storage', 'transportation'
    ];

    resourceFields.forEach(field => {
      const rawVal = farmPlan[field] || '';
      if (rawVal.startsWith('{')) {
        try {
          const parsed = JSON.parse(rawVal);
          if (parsed.provider === 'Farmer Provides' && parsed.farmerId === userId) {
            totalResourceValue += Number(parsed.value) || 0;
          }
        } catch (e) {
          console.error(e);
        }
      }
    });

    return totalResourceValue;
  };

  const renderResourceAllocation = (
    label: string,
    fieldKey: 'seeds' | 'fertilizers' | 'equipment' | 'labour' | 'storage' | 'transportation',
    isSeeds: boolean = false
  ) => {
    const rawValue = farmPlan[fieldKey] || '';

    // Parse JSON or parse legacy string
    let parsed: { provider: string; farmerId: string; value: number; details: string } = {
      provider: '',
      farmerId: '',
      value: 0,
      details: ''
    };

    try {
      if (rawValue.startsWith('{')) {
        parsed = JSON.parse(rawValue);
      } else if (rawValue) {
        parsed = {
          provider: rawValue === 'No seeds - Tree is already there' ? 'No seeds - Tree is already there' : (rawValue.includes('AgriLink') ? 'AgriLink Provides' : 'Other / Custom'),
          farmerId: '',
          value: 0,
          details: rawValue
        };
      }
    } catch (e) {
      parsed = { provider: 'Other / Custom', farmerId: '', value: 0, details: rawValue };
    }

    const updateParsed = (updatedFields: Partial<typeof parsed>) => {
      const merged = { ...parsed, ...updatedFields };
      setFarmPlan(prev => ({ ...prev, [fieldKey]: JSON.stringify(merged) }));
    };

    const providers = isSeeds
      ? ['No seeds - Tree is already there', 'AgriLink Provides', 'Farmer Provides', 'Other / Custom']
      : ['AgriLink Provides', 'Farmer Provides', 'Other / Custom'];

    return (
      <div className="bg-white p-3.5 rounded-xl border border-gray-200 space-y-2.5">
        <label className="block font-bold text-gray-700 uppercase tracking-wider text-[10px] pb-1.5 border-b border-gray-100">{label}</label>

        <div className="space-y-2 text-xs">
          <div>
            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Provider</label>
            <select
              value={parsed.provider}
              onChange={(e) => {
                const prov = e.target.value;
                updateParsed({
                  provider: prov,
                  farmerId: prov === 'Farmer Provides' ? parsed.farmerId : '',
                  value: prov === 'Farmer Provides' ? parsed.value : 0
                });
              }}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
            >
              <option value="">Select provider...</option>
              {providers.map((p, pIdx) => (
                <option key={pIdx} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {parsed.provider === 'Farmer Provides' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Which Farmer?</label>
                <select
                  value={parsed.farmerId}
                  onChange={(e) => updateParsed({ farmerId: e.target.value })}
                  className="w-full border border-gray-200 rounded-md px-2 py-1 text-slate-800 bg-white font-semibold text-xs"
                >
                  <option value="">Select farmer...</option>
                  {selectedPool?.participants.map((part, pIdx) => (
                    <option key={pIdx} value={part.userId}>{part.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Estimated Value (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={parsed.value || ''}
                  onChange={(e) => updateParsed({ value: Number(e.target.value) })}
                  className="w-full border border-gray-200 rounded-md px-2 py-1 text-slate-800 bg-white font-semibold text-xs"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-0.5">Specific Details / Notes</label>
            <input
              type="text"
              placeholder="e.g. Specific details or requirements..."
              value={parsed.details}
              onChange={(e) => updateParsed({ details: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-2.5 py-1 text-slate-800 bg-white font-semibold"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#f0fdf4] to-[#dcfce7] font-sans animate-fade-in">
      {/* Left Navigation Sidebar */}
      <aside className="w-64 bg-white/85 backdrop-blur-md border-r border-[#e5e7eb] shadow-xl flex flex-col fixed left-0 top-0 bottom-0 overflow-y-auto pt-4 z-20">
        {/* Sidebar Header */}
        <div className="px-5 py-6 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#166534] to-[#15803d] flex items-center justify-center shadow-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1f3b2c]">AgriLink</h2>
              <p className="text-xs text-[#6b7280]">FCO Portal</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-grow py-6 px-3 space-y-1.5">
          <button
            onClick={() => setActiveSidebarTab('assigned-farmers')}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${activeSidebarTab === 'assigned-farmers'
                ? 'bg-gradient-to-r from-[#166534] to-[#15803d] text-white shadow-md font-bold'
                : 'text-[#374151] hover:bg-[#f0fdf4] hover:text-[#166534]'
              }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${activeSidebarTab === 'assigned-farmers'
                ? 'bg-white/20'
                : 'bg-[#f0fdf4] group-hover:bg-white group-hover:shadow-sm'
              }`}>
              <FiUsers className={`h-4 w-4 ${activeSidebarTab === 'assigned-farmers' ? 'text-white' : 'text-[#166534]'}`} />
            </div>
            <span className="font-medium text-sm">Assigned Farmers</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('manage-pools')}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${activeSidebarTab === 'manage-pools'
                ? 'bg-gradient-to-r from-[#166534] to-[#15803d] text-white shadow-md font-bold'
                : 'text-[#374151] hover:bg-[#f0fdf4] hover:text-[#166534]'
              }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${activeSidebarTab === 'manage-pools'
                ? 'bg-white/20'
                : 'bg-[#f0fdf4] group-hover:bg-white group-hover:shadow-sm'
              }`}>
              <FiSliders className={`h-4 w-4 ${activeSidebarTab === 'manage-pools' ? 'text-white' : 'text-[#166534]'}`} />
            </div>
            <span className="font-medium text-sm">Manage Pools</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('calendar')}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${activeSidebarTab === 'calendar'
                ? 'bg-gradient-to-r from-[#166534] to-[#15803d] text-white shadow-md font-bold'
                : 'text-[#374151] hover:bg-[#f0fdf4] hover:text-[#166534]'
              }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${activeSidebarTab === 'calendar'
                ? 'bg-white/20'
                : 'bg-[#f0fdf4] group-hover:bg-white group-hover:shadow-sm'
              }`}>
              <FiCalendar className={`h-4 w-4 ${activeSidebarTab === 'calendar' ? 'text-white' : 'text-[#166534]'}`} />
            </div>
            <span className="font-medium text-sm">Calendar</span>
          </button>

          <button
            onClick={() => setActiveSidebarTab('schemes')}
            className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 transition-all duration-200 ${activeSidebarTab === 'schemes'
                ? 'bg-gradient-to-r from-[#166534] to-[#15803d] text-white shadow-md font-bold'
                : 'text-[#374151] hover:bg-[#f0fdf4] hover:text-[#166534]'
              }`}
          >
            <div className={`p-1.5 rounded-lg transition-all ${activeSidebarTab === 'schemes'
                ? 'bg-white/20'
                : 'bg-[#f0fdf4] group-hover:bg-white group-hover:shadow-sm'
              }`}>
              <FiFileText className={`h-4 w-4 ${activeSidebarTab === 'schemes' ? 'text-white' : 'text-[#166534]'}`} />
            </div>
            <span className="font-medium text-sm">Government Schemes</span>
          </button>
        </nav>

        {/* Sidebar Footer with Tips & Logout */}
        <div className="px-3 py-4 border-t border-[#e5e7eb] bg-white/50 space-y-3">
          <div className="bg-gradient-to-br from-[#fef3c7] to-[#fde68a] rounded-lg p-3 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg className="w-3.5 h-3.5 text-[#d97706] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-[11px] font-semibold text-[#92400e] leading-tight">Quick Tip</span>
            </div>
            <p className="text-[11px] text-[#92400e] leading-tight">
              Review and verify land details thoroughly before completing the counseling checklist.
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 bg-gradient-to-r from-[#dc2626] to-[#b91c1c] text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
          >
            <FiLogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col ml-64 min-h-screen overflow-hidden">
        <HeaderWrapper />

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-7xl mx-auto relative min-h-[500px]">
            {loading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#166534]"></div>
              </div>
            ) : activeSidebarTab === 'assigned-farmers' ? (
              /* ASSIGNED FARMERS TAB VIEW */
              <div className="flex flex-col lg:flex-row gap-6">

                {/* Pool Selector & Farmer Details Sidebar */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                  <div className="bg-white p-5 rounded-3xl border border-gray-200/60 shadow-sm space-y-4">
                    <h2 className="text-base font-extrabold text-[#1f3b2c] flex items-center gap-2"><FiGrid /> Assigned Pools</h2>
                    <div className="space-y-2">
                      {pools.map(pool => (
                        <button
                          key={pool._id}
                          onClick={() => setSelectedPoolAndUrl(pool)}
                          className={`w-full text-left p-3.5 rounded-2xl border text-sm transition-all ${selectedPool?._id === pool._id
                              ? 'bg-gradient-to-br from-[#166534]/10 to-[#15803d]/5 border-[#166534] font-bold shadow-sm'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <p className="text-[#1f3b2c] truncate">{pool.name}</p>
                          <div className="flex justify-between items-center mt-2 text-[11px] text-gray-400 font-normal">
                            <span>Farmers: {pool.participants.length}</span>
                            <span className="uppercase text-[9px] bg-gray-100 px-1.5 py-0.5 rounded font-bold">{pool.status.replace('_', ' ')}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Farmer Details Sidebar */}
                  {selectedPool && (
                    <div className="bg-white p-5 rounded-3xl border border-gray-200/60 shadow-sm space-y-4">
                      <div className="border-b border-gray-100 pb-2">
                        <h3 className="text-base font-extrabold text-[#1f3b2c] flex items-center gap-2">
                          <FiUsers /> Farmer Profiles
                        </h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Required details for pool alignment</p>
                      </div>

                      <div className="space-y-4 max-h-[350px] overflow-y-auto pr-1">
                        {selectedPool.participants.map((p, idx) => (
                          <div key={idx} className="p-3 bg-gradient-to-br from-[#fffaf1] to-white rounded-2xl border border-amber-100/50 space-y-2">
                            <div className="flex justify-between items-start">
                              <p className="text-sm font-bold text-gray-800">{p.fullName}</p>
                              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded font-bold">{p.landContribution || p.landSize} Ac</span>
                            </div>
                            <div className="space-y-1 text-xs text-gray-500">
                              <p className="flex items-center gap-1.5"><FiPhone className="text-gray-400 w-3.5 h-3.5" /> {p.phone || 'N/A'}</p>
                              <p className="flex items-start gap-1.5"><FiMapPin className="text-gray-400 w-3.5 h-3.5 mt-0.5" /> <span className="leading-tight">{p.address || 'Kadur, Chikkamagaluru'}</span></p>
                              <p className="flex items-center gap-1.5"><FiMap className="text-gray-400 w-3.5 h-3.5" /> Survey: {p.surveyNumber}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Main Workspace Console */}
                <div className="flex-grow space-y-6">
                  {selectedPool ? (
                    (() => {
                      const statusLower = selectedPool.status?.toLowerCase() || '';
                      return (
                        <div className="bg-white p-6 rounded-3xl border border-gray-200/60 shadow-sm space-y-6">

                          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-gray-100">
                            <div>
                              <span className="text-xs uppercase font-extrabold px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg">
                                Stage: {selectedPool.status.replace('_', ' ')}
                              </span>
                              <h1 className="text-2xl font-black text-[#1f3b2c] mt-2">{selectedPool.name} Workspace</h1>
                            </div>
                          </div>

                          {/* Scheduling Panel */}
                          <div className="p-5 rounded-2xl bg-amber-50/30 border border-amber-100/50 space-y-4">
                            <h3 className="font-bold text-[#1f3b2c] text-sm flex items-center gap-2"><FiCalendar /> Setup / View Meeting Schedule</h3>

                            {selectedPool.meetingDetails?.scheduledAt && (
                              <div className="p-4 bg-white rounded-xl border border-[#e5e7eb] mb-2 text-xs space-y-2">
                                <p className="text-emerald-700 font-bold">✓ Scheduled Meeting Session</p>
                                <p><strong>Scheduled Time:</strong> {new Date(selectedPool.meetingDetails.scheduledAt).toLocaleString('en-IN')}</p>
                                <p><strong>Mode:</strong> {selectedPool.meetingDetails.meetingType === 'online' ? '💻 Online Call' : '🤝 Offline Gathering'}</p>
                                {selectedPool.meetingDetails.meetingType === 'online' ? (
                                  <p><strong>Google Meet Link:</strong> <a href={selectedPool.meetingDetails.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate block">{selectedPool.meetingDetails.meetingLink}</a></p>
                                ) : (
                                  <p><strong>Location:</strong> {selectedPool.meetingDetails.location}</p>
                                )}
                              </div>
                            )}

                            {selectedPool.status === 'awaiting_counselor' ? (
                              <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                  <div>
                                    <label className="block font-bold text-gray-500 uppercase mb-1">Meeting Mode</label>
                                    <select
                                      value={meetingType}
                                      onChange={(e) => setMeetingType(e.target.value as any)}
                                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-slate-800 font-semibold"
                                    >
                                      <option value="online">Online Call (Google Meet)</option>
                                      <option value="offline">Offline Gathering</option>
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block font-bold text-gray-500 uppercase mb-1">Date & Time</label>
                                    <input
                                      type="datetime-local"
                                      value={scheduledAt}
                                      onChange={(e) => setScheduledAt(e.target.value)}
                                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-slate-800 bg-white font-semibold"
                                    />
                                  </div>
                                </div>

                                {meetingType === 'online' ? (
                                  <div className="text-xs">
                                    <label className="block font-bold text-gray-500 uppercase mb-1">Google Meet Link</label>
                                    <input
                                      type="url"
                                      value={meetingLink}
                                      onChange={(e) => setMeetingLink(e.target.value)}
                                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-slate-800 bg-white font-semibold"
                                    />
                                  </div>
                                ) : (
                                  <div className="text-xs">
                                    <label className="block font-bold text-gray-500 uppercase mb-1">Physical Location</label>
                                    <input
                                      type="text"
                                      value={location}
                                      onChange={(e) => setLocation(e.target.value)}
                                      className="w-full border border-gray-200 rounded-lg px-2.5 py-2 text-slate-800 bg-white font-semibold"
                                    />
                                  </div>
                                )}

                                <button
                                  onClick={handleScheduleMeeting}
                                  disabled={!scheduledAt}
                                  className="w-full py-2 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs disabled:opacity-50"
                                >
                                  Schedule Meeting
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">Meeting schedule is locked (already scheduled).</p>
                            )}
                          </div>

                          {/* Counseling checklist panel */}
                          {(statusLower === 'counseling_scheduled' || statusLower === 'planning' || statusLower === 'signing' || statusLower === 'active') && (
                            <div className="p-5 rounded-2xl bg-amber-50/30 border border-amber-100/50 space-y-4">
                              <h3 className="font-bold text-[#1f3b2c] text-sm flex items-center gap-2"><FiInfo /> Counselor Checklist Verification</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {Object.keys(checklist).map(key => (
                                  <label key={key} className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={(checklist as any)[key]}
                                      disabled={statusLower !== 'counseling_scheduled'}
                                      onChange={(e) => setChecklist({ ...checklist, [key]: e.target.checked })}
                                      className="w-4 h-4 text-[#166534] rounded"
                                    />
                                    <span className="capitalize font-medium">{key.replace(/([A-Z])/g, ' $1')}</span>
                                  </label>
                                ))}
                              </div>
                              {statusLower === 'counseling_scheduled' && (
                                <button
                                  onClick={handleSaveChecklist}
                                  className="w-full py-2.5 bg-gradient-to-r from-[#166534] to-[#15803d] text-white font-bold rounded-xl text-xs mt-4"
                                >
                                  Save & Move to Farm Planning
                                </button>
                              )}
                            </div>
                          )}

                          {/* FARM PLANNING FORM PANELS */}
                          {(statusLower === 'planning' || statusLower === 'signing' || statusLower === 'active') ? (
                            <div className="space-y-6">
                              {/* Tab Navigation */}
                              <div className="flex border-b border-gray-100 overflow-x-auto gap-2">
                                <button
                                  onClick={() => setActiveTab('model')}
                                  className={`pb-3 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === 'model' ? 'border-[#166534] text-[#166534]' : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                  Step 5: Model Selection
                                </button>
                                <button
                                  onClick={() => setActiveTab('info')}
                                  className={`pb-3 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === 'info' ? 'border-[#166534] text-[#166534]' : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                  Crop Allocation
                                </button>
                                <button
                                  onClick={() => setActiveTab('financials')}
                                  className={`pb-3 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === 'financials' ? 'border-[#166534] text-[#166534]' : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                  Finance & Resources
                                </button>
                                <button
                                  onClick={() => setActiveTab('contributions')}
                                  className={`pb-3 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === 'contributions' ? 'border-[#166534] text-[#166534]' : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                  Farmer Contribution
                                </button>
                                <button
                                  onClick={() => setActiveTab('insurance')}
                                  className={`pb-3 px-4 text-xs font-bold whitespace-nowrap transition-all border-b-2 ${activeTab === 'insurance' ? 'border-[#166534] text-[#166534]' : 'border-transparent text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                  Crop Insurance
                                </button>
                              </div>

                              {/* FORM TAB CONTENTS */}
                              <div className="min-h-[300px]">

                                {/* Tab 1: Model Selection */}
                                {activeTab === 'model' && (
                                  <div className="space-y-6">
                                    <div className="border-b border-gray-100 pb-3">
                                      <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5"><FiLayers /> Participant Collaboration Model Selection</h3>
                                      <p className="text-xs text-gray-400 mt-1">Select the agreed agricultural model uniquely for each farmer. This modifies variables on the final contract ledger and is used as a criterion for profit sharing ratio calculation.</p>
                                    </div>

                                    <div className="space-y-6">
                                      {selectedPool.participants.map((p, idx) => {
                                        const currentContrib = participantContributions[p.userId] || { collaborationModel: 1 };
                                        const farmerModel = currentContrib.collaborationModel || 1;

                                        return (
                                          <div key={idx} className="p-4 bg-gray-50/50 rounded-2xl border border-gray-100 space-y-3">
                                            <div className="flex justify-between items-center flex-wrap gap-2">
                                              <span className="text-xs font-extrabold text-[#1f3b2c] uppercase tracking-wider bg-[#1f3b2c]/5 px-2.5 py-1 rounded-lg">
                                                {p.fullName} ({p.landContribution || p.landSize} Acres)
                                              </span>
                                              <span className="text-xs text-[#166534] font-bold">
                                                Current: Model {farmerModel}
                                              </span>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                                              {[1, 2, 3, 4, 5].map(modelNum => (
                                                <button
                                                  key={modelNum}
                                                  type="button"
                                                  onClick={() => {
                                                    setParticipantContributions({
                                                      ...participantContributions,
                                                      [p.userId]: {
                                                        ...(participantContributions[p.userId] || { investment: 0, labour: 0, machinery: '', land: p.landContribution || p.landSize }),
                                                        collaborationModel: modelNum as any
                                                      }
                                                    });
                                                  }}
                                                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${farmerModel === modelNum
                                                      ? 'bg-[#166534] text-white border-[#166534] shadow-sm'
                                                      : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                    }`}
                                                >
                                                  Model {modelNum}
                                                </button>
                                              ))}
                                            </div>

                                            <div className="p-3.5 rounded-xl bg-emerald-50/50 border border-emerald-100/50 text-[11px]">
                                              <p className="font-bold text-[#166534]">{(modelDescriptions as any)[farmerModel].title}</p>
                                              <p className="text-gray-600 mt-1">{(modelDescriptions as any)[farmerModel].desc}</p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>

                                    {/* Suggested Profit Sharing Ratio Card */}
                                    <div className="p-4 rounded-2xl bg-amber-50/30 border border-amber-100/50 space-y-3">
                                      <h4 className="text-xs font-bold text-amber-800 uppercase tracking-wider">Suggested Profit Sharing Ratio Calculation</h4>
                                      <p className="text-[11px] text-gray-500">Calculated based on land contribution ratio weighted by each farmer's selected collaboration model factor.</p>

                                      <div className="space-y-2 mt-2">
                                        {(() => {
                                          const totalGuntas = selectedPool.participants.reduce(
                                            (acc, p) => acc + toGuntas(participantContributions[p.userId]?.land || p.landContribution || p.landSize || 0),
                                            0
                                          );
                                          const totalLand = fromGuntas(totalGuntas);
                                          const modelFactors: { [key: number]: number } = { 1: 0.1, 2: 0.8, 3: 0.6, 4: 0.9, 5: 0.7 };

                                          const weights = selectedPool.participants.map(p => {
                                            const land = participantContributions[p.userId]?.land || p.landContribution || p.landSize || 0;
                                            const landGuntas = toGuntas(land);
                                            const model = participantContributions[p.userId]?.collaborationModel || 1;
                                            const landPct = totalGuntas > 0 ? landGuntas / totalGuntas : 0;
                                            const factor = modelFactors[model] || 0.5;

                                            // Resource contribution value and extra weight
                                            const resourceVal = getFarmerResourceContributionsVal(p.userId);
                                            const resourceWeight = farmPlan.estimatedCost > 0 ? (resourceVal / farmPlan.estimatedCost) * 0.3 : 0;

                                            return {
                                              userId: p.userId,
                                              fullName: p.fullName,
                                              rawWeight: landPct * factor + resourceWeight,
                                              resourceVal
                                            };
                                          });

                                          const sumWeights = weights.reduce((acc, w) => acc + w.rawWeight, 0);
                                          const platformPct = sumWeights > 0 ? Math.max(10, Math.min(90, Math.round((1 - sumWeights) * 100))) : 30;
                                          const remainingPct = 100 - platformPct;

                                          return (
                                            <div className="text-xs space-y-2 bg-white p-3 rounded-xl border border-gray-100">
                                              {weights.map((w, i) => {
                                                const farmerPct = sumWeights > 0 ? Math.round((w.rawWeight / sumWeights) * remainingPct) : 0;
                                                return (
                                                  <div key={i} className="flex justify-between items-center">
                                                    <div className="flex flex-col">
                                                      <span className="text-gray-600 font-medium">{w.fullName}:</span>
                                                      {w.resourceVal > 0 && (
                                                        <span className="text-[9px] text-[#166534] font-semibold">
                                                          (+ ₹{w.resourceVal.toLocaleString()} Resource value credited)
                                                        </span>
                                                      )}
                                                    </div>
                                                    <span className="font-bold text-gray-800">{farmerPct}% Suggested Profit Share</span>
                                                  </div>
                                                );
                                              })}
                                              <div className="flex justify-between items-center pt-1.5 border-t border-dashed border-gray-200">
                                                <span className="text-gray-500 font-semibold">AgriLink Platform Fee:</span>
                                                <span className="font-extrabold text-[#166534]">{platformPct}% Suggested Share</span>
                                              </div>
                                            </div>
                                          );
                                        })()}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Tab 2: Farm Info & Operations */}
                                {activeTab === 'info' && (
                                  <div className="space-y-6 text-xs">
                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                                      <h4 className="font-bold text-gray-700 uppercase tracking-wider">Farm Information</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Selected Crop(s)</label>
                                          {(() => {
                                            const selectedCropsArray = farmPlan.selectedCrop
                                              ? farmPlan.selectedCrop.split(',').map((c: string) => c.trim()).filter(Boolean)
                                              : [];
                                            const standardCrops = ['Coffee', 'Pepper', 'Arecanut', 'Cardamom', 'Ragi', 'Paddy', 'Coconut', 'Potato', 'Maize'];
                                            const farmerRegisteredCrops = selectedPool
                                              ? Array.from(new Set(selectedPool.participants.flatMap((p: any) => p.registeredCrops || [])))
                                              : [];

                                            return (
                                              <div className="space-y-2">
                                                {/* Selected crop badges */}
                                                <div className="flex flex-wrap gap-1.5 min-h-[30px] p-2 border border-gray-100 rounded-lg bg-gray-50">
                                                  {selectedCropsArray.map((crop, idx) => (
                                                    <Badge key={idx} variant="secondary" className="bg-[#1f3b2c] hover:bg-[#152a1f] text-white flex items-center gap-1 py-0.5 px-2 text-[10px] font-semibold">
                                                      <span>{crop}</span>
                                                      <button
                                                        type="button"
                                                        onClick={() => {
                                                          const newCrops = selectedCropsArray.filter((_, i) => i !== idx);
                                                          setFarmPlan({ ...farmPlan, selectedCrop: newCrops.join(', ') });
                                                        }}
                                                        className="text-white hover:text-red-400 font-bold ml-1 text-xs"
                                                        title="Remove crop"
                                                      >
                                                        &times;
                                                      </button>
                                                    </Badge>
                                                  ))}
                                                  {selectedCropsArray.length === 0 && (
                                                    <span className="text-red-500 font-semibold text-[10px] self-center">* Sowing at least one crop is compulsory</span>
                                                  )}
                                                </div>

                                                {/* Selection and Custom inputs */}
                                                <div className="flex gap-2">
                                                  <select
                                                    onChange={(e) => {
                                                      if (e.target.value && !selectedCropsArray.includes(e.target.value)) {
                                                        const newCrops = [...selectedCropsArray, e.target.value];
                                                        setFarmPlan({ ...farmPlan, selectedCrop: newCrops.join(', ') });
                                                      }
                                                      e.target.value = '';
                                                    }}
                                                    className="border border-gray-200 rounded-lg px-2 py-1 text-slate-800 bg-white font-semibold text-xs flex-1"
                                                  >
                                                    <option value="">Add standard crop...</option>
                                                    {standardCrops.filter(c => !selectedCropsArray.includes(c)).map((crop, idx) => (
                                                      <option key={idx} value={crop}>{crop}</option>
                                                    ))}
                                                  </select>

                                                  <div className="flex gap-1 flex-1">
                                                    <input
                                                      type="text"
                                                      placeholder="Custom crop name..."
                                                      value={customCropInput}
                                                      onChange={(e) => setCustomCropInput(e.target.value)}
                                                      className="border border-gray-200 rounded-lg px-2 py-1 text-slate-800 bg-white font-semibold text-xs flex-1 min-w-[80px]"
                                                    />
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        const trimmed = customCropInput.trim();
                                                        if (trimmed && !selectedCropsArray.includes(trimmed)) {
                                                          const newCrops = [...selectedCropsArray, trimmed];
                                                          setFarmPlan({ ...farmPlan, selectedCrop: newCrops.join(', ') });
                                                          setCustomCropInput('');
                                                        }
                                                      }}
                                                      className="bg-[#1f3b2c] hover:bg-[#152a1f] text-white px-2 py-1 rounded-lg font-bold text-xs"
                                                    >
                                                      Add
                                                    </button>
                                                  </div>
                                                </div>

                                                {/* Farmer-registered crops suggestions */}
                                                {farmerRegisteredCrops.length > 0 && (
                                                  <div className="pt-1.5">
                                                    <span className="text-[10px] text-gray-500 font-bold block mb-1">Crops Registered by Farmers:</span>
                                                    <div className="flex flex-wrap gap-1">
                                                      {farmerRegisteredCrops.map((crop, idx) => {
                                                        const isSelected = selectedCropsArray.includes(crop);
                                                        return (
                                                          <button
                                                            key={idx}
                                                            type="button"
                                                            disabled={isSelected}
                                                            onClick={() => {
                                                              const newCrops = [...selectedCropsArray, crop];
                                                              setFarmPlan({ ...farmPlan, selectedCrop: newCrops.join(', ') });
                                                            }}
                                                            className={`text-[9px] px-2 py-0.5 rounded-full font-bold transition-all ${isSelected
                                                                ? 'bg-gray-150 text-gray-400 cursor-not-allowed border border-gray-200'
                                                                : 'bg-[#e2f0d9] text-[#2c5c3d] hover:bg-[#cbe3be] border border-[#b2d5a3]'
                                                              }`}
                                                          >
                                                            + {crop}
                                                          </button>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })()}
                                        </div>
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Cultivation Period</label>
                                          {(() => {
                                            const { value: cultValue, unit: cultUnit } = (() => {
                                              if (!farmPlan.cultivationPeriod) return { value: '', unit: 'Years' };
                                              const parts = farmPlan.cultivationPeriod.trim().split(' ');
                                              const val = parseFloat(parts[0]);
                                              const unit = parts[1] || 'Years';
                                              return { value: isNaN(val) ? '' : val.toString(), unit };
                                            })();

                                            return (
                                              <div>
                                                <div className="flex gap-2">
                                                  <input
                                                    type="number"
                                                    min="0"
                                                    step="any"
                                                    placeholder="e.g. 2"
                                                    value={cultValue}
                                                    onChange={(e) => {
                                                      const val = e.target.value;
                                                      setFarmPlan({ ...farmPlan, cultivationPeriod: val ? `${val} ${cultUnit}` : '' });
                                                    }}
                                                    className="w-2/3 border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                                  />
                                                  <select
                                                    value={cultUnit}
                                                    onChange={(e) => {
                                                      const unit = e.target.value;
                                                      if (cultValue) {
                                                        setFarmPlan({ ...farmPlan, cultivationPeriod: `${cultValue} ${unit}` });
                                                      }
                                                    }}
                                                    className="w-1/3 border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                                  >
                                                    <option value="Years">Years</option>
                                                    <option value="Months">Months</option>
                                                    <option value="Seasons">Seasons</option>
                                                    <option value="Weeks">Weeks</option>
                                                  </select>
                                                </div>
                                                <span className="text-[10px] text-gray-400 block mt-1">Specify duration and unit (e.g. 2 Years)</span>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Contract Timeline (Start Date)</label>
                                          <input
                                            type="date"
                                            value={contractStartDate}
                                            onChange={(e) => setContractStartDate(e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Contract Timeline (End Date)</label>
                                          <input
                                            type="date"
                                            value={contractEndDate}
                                            onChange={(e) => setContractEndDate(e.target.value)}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Combined Farm Area (Acres)</label>
                                          <input
                                            type="number"
                                            value={farmPlan.farmArea}
                                            readOnly
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-500 bg-gray-100 font-semibold cursor-not-allowed"
                                          />
                                          <span className="text-[10px] text-gray-400 block mt-1">Automatically computed from participant contributions</span>
                                        </div>
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Irrigation Method</label>
                                          <select
                                            value={irrigationSelection}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              setIrrigationSelection(val);
                                              if (val !== 'Other') {
                                                setFarmPlan({ ...farmPlan, irrigationMethod: val });
                                                setCustomIrrigation('');
                                              } else {
                                                setFarmPlan({ ...farmPlan, irrigationMethod: customIrrigation });
                                              }
                                            }}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold mb-2"
                                          >
                                            <option value="">Select irrigation method...</option>
                                            <option value="Drip">Drip</option>
                                            <option value="Sprinkler">Sprinkler</option>
                                            <option value="River">River</option>
                                            <option value="Borewell">Borewell</option>
                                            <option value="Well">Well</option>
                                            <option value="Rainfed">Rainfed</option>
                                            <option value="Other">Other (Write Custom)</option>
                                          </select>

                                          {irrigationSelection === 'Other' && (
                                            <input
                                              type="text"
                                              placeholder="Enter custom irrigation method..."
                                              value={customIrrigation}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                setCustomIrrigation(val);
                                                setFarmPlan({ ...farmPlan, irrigationMethod: val });
                                              }}
                                              className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                            />
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-6">
                                      <h4 className="font-bold text-gray-700 uppercase tracking-wider text-xs">Farm Management Schedules</h4>

                                      <div className="space-y-4">
                                        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-2">
                                          <label className="block font-bold text-gray-700 uppercase tracking-wider text-xs pb-2 border-b border-gray-100">Crop Planning Details</label>
                                          <textarea
                                            rows={3}
                                            value={farmPlan.cropPlanning}
                                            placeholder="Enter general crop planning details, varieties, layouts, and recommendations..."
                                            onChange={(e) => setFarmPlan({ ...farmPlan, cropPlanning: e.target.value })}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold text-xs mt-1"
                                          />
                                        </div>

                                        {renderScheduleEditor(
                                          'Sowing Schedule',
                                          'sowingSchedule',
                                          ['Land Preparation', 'Seed Treatment', 'Sowing / Sowing Seeds', 'Nursery Bed Sowing', 'Transplanting']
                                        )}

                                        {renderScheduleEditor(
                                          'Fertilizer Schedule',
                                          'fertilizerSchedule',
                                          ['Organic Manure', 'Basal Fertilizer Application', 'First Top Dressing', 'Second Top Dressing', 'Foliar Spraying / Micronutrients']
                                        )}

                                        {renderScheduleEditor(
                                          'Irrigation Schedule',
                                          'irrigationSchedule',
                                          ['Pre-sowing irrigation', 'Immediate post-sowing', 'Critical vegetative stage irrigation', 'Flowering stage irrigation', 'Drip system flushing']
                                        )}

                                        {renderScheduleEditor(
                                          'Pest Monitoring Plan',
                                          'pestMonitoring',
                                          ['Regular Inspection / Field Scouting', 'Pheromone Trap Setup', 'Biopesticide Spraying', 'Targeted Chemical Treatment', 'Weeding / Hand weeding']
                                        )}

                                        {renderScheduleEditor(
                                          'Harvest Schedule',
                                          'harvestSchedule',
                                          ['Maturity test', 'Harvesting', 'Post-harvest sorting', 'Drying', 'Packaging', 'Transport to marketplace']
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Tab 3: Farmer Contributions */}
                                {activeTab === 'contributions' && (
                                  <div className="space-y-4 text-xs">
                                    <h3 className="text-sm font-bold text-gray-700">Step 6: Participant Contributions</h3>
                                    <div className="space-y-4">
                                      {selectedPool.participants.map((p, idx) => {
                                        const farmerModel = participantContributions[p.userId]?.collaborationModel || 1;
                                        const isLandEditable = farmerModel !== 1 && farmerModel !== 4;

                                        return (
                                          <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-150 space-y-3">
                                            <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                              <p className="font-bold text-gray-800 text-sm">{p.fullName}</p>
                                              <span className="text-[10px] bg-[#1f3b2c] text-white px-2 py-0.5 rounded font-bold">
                                                Model {farmerModel} Selected
                                              </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              {/* Collaboration Model Selection */}
                                              <div>
                                                <label className="block font-bold text-gray-400 uppercase mb-1">Collaboration Model</label>
                                                <select
                                                  value={farmerModel}
                                                  onChange={(e) => setParticipantContributions({
                                                    ...participantContributions,
                                                    [p.userId]: {
                                                      ...(participantContributions[p.userId] || { investment: 0, labour: 0, machinery: '', land: p.landContribution || p.landSize, labourChargePerDay: 0 }),
                                                      collaborationModel: Number(e.target.value) as any
                                                    }
                                                  })}
                                                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                                >
                                                  <option value={1}>Model 1 - Land Lease</option>
                                                  <option value={2}>Model 2 - Managed Farming</option>
                                                  <option value={3}>Model 3 - Partnership Farming</option>
                                                  <option value={4}>Model 4 - Marketing Partner</option>
                                                  <option value={5}>Model 5 - Collaborative Farm Pool</option>
                                                </select>
                                              </div>

                                              {/* Land Contribution */}
                                              <div>
                                                <label className="block font-bold text-gray-400 uppercase mb-1">
                                                  Land Contribution (Acres) {isLandEditable ? '' : '(Read-Only)'}
                                                </label>
                                                <input
                                                  type="number"
                                                  value={participantContributions[p.userId]?.land || 0}
                                                  readOnly={!isLandEditable}
                                                  onChange={(e) => {
                                                    if (isLandEditable) {
                                                      setParticipantContributions({
                                                        ...participantContributions,
                                                        [p.userId]: {
                                                          ...(participantContributions[p.userId] || { investment: 0, labour: 0, machinery: '', land: 0, labourChargePerDay: 0, collaborationModel: farmerModel }),
                                                          land: Number(e.target.value)
                                                        }
                                                      });
                                                    }
                                                  }}
                                                  className={`w-full border border-gray-200 rounded-lg px-2.5 py-1.5 font-semibold ${isLandEditable
                                                      ? 'text-slate-800 bg-white'
                                                      : 'text-slate-500 bg-gray-150 cursor-not-allowed'
                                                    }`}
                                                />
                                              </div>

                                              {/* Model 1 Specific Output */}
                                              {farmerModel === 1 && (
                                                <div className="col-span-1 md:col-span-2 p-3 bg-[#e2f0d9] text-[#2c5c3d] rounded-xl border border-[#b2d5a3] text-[11px] leading-relaxed">
                                                  <strong>Land Lease Model Active:</strong> Land is leased to the platform. No additional investment, labor, or machinery contributions are required from the farmer.
                                                </div>
                                              )}

                                              {/* Model 2 Specific Output */}
                                              {farmerModel === 2 && (
                                                <>
                                                  <div>
                                                    <label className="block font-bold text-gray-400 uppercase mb-1">Calculated Investment Contribution (₹)</label>
                                                    {(() => {
                                                      const totalGuntas = selectedPool.participants.reduce((acc, p2) => acc + toGuntas(participantContributions[p2.userId]?.land || p2.landContribution || p2.landSize || 0), 0);
                                                      const farmerGuntas = toGuntas(participantContributions[p.userId]?.land || p.landContribution || p.landSize || 0);
                                                      const landRatio = totalGuntas > 0 ? farmerGuntas / totalGuntas : 0;
                                                      const calculatedInvestment = Math.round(landRatio * (farmPlan.estimatedCost || 0));
                                                      return (
                                                        <div>
                                                          <input
                                                            type="number"
                                                            value={calculatedInvestment}
                                                            readOnly
                                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-500 bg-gray-150 font-semibold cursor-not-allowed"
                                                          />
                                                          <span className="text-[9px] text-gray-500 block mt-1">
                                                            Auto-calculated based on land share ({Math.round(landRatio * 100)}%) of total cost (₹{farmPlan.estimatedCost || 0}).
                                                          </span>
                                                        </div>
                                                      );
                                                    })()}
                                                  </div>
                                                  <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100 text-[11px] leading-relaxed flex items-center">
                                                    <span>Managed Farming model calculates investment dynamically based on land share ratios.</span>
                                                  </div>
                                                </>
                                              )}

                                              {/* Model 3 Specific Output */}
                                              {farmerModel === 3 && (
                                                <>
                                                  <div>
                                                    <label className="block font-bold text-gray-400 uppercase mb-1">Farmer Labour Charge Per Day (₹)</label>
                                                    <input
                                                      type="number"
                                                      value={participantContributions[p.userId]?.labourChargePerDay || 0}
                                                      onChange={(e) => setParticipantContributions({
                                                        ...participantContributions,
                                                        [p.userId]: {
                                                          ...(participantContributions[p.userId] || { investment: 0, labour: 0, machinery: '', land: p.landContribution || p.landSize, labourChargePerDay: 0, collaborationModel: 3 }),
                                                          labourChargePerDay: Number(e.target.value)
                                                        }
                                                      })}
                                                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                                    />
                                                    <span className="text-[9px] text-gray-500 block mt-1">Farmer will receive this daily charge in addition to final shared profit.</span>
                                                  </div>
                                                  <div>
                                                    <label className="block font-bold text-gray-400 uppercase mb-1">Labour Contribution (%)</label>
                                                    <input
                                                      type="number"
                                                      value={participantContributions[p.userId]?.labour || 0}
                                                      onChange={(e) => setParticipantContributions({
                                                        ...participantContributions,
                                                        [p.userId]: {
                                                          ...(participantContributions[p.userId] || { investment: 0, labour: 0, machinery: '', land: p.landContribution || p.landSize, labourChargePerDay: 0, collaborationModel: 3 }),
                                                          labour: Number(e.target.value)
                                                        }
                                                      })}
                                                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                                    />
                                                  </div>
                                                </>
                                              )}

                                              {/* Model 4 Specific Output */}
                                              {farmerModel === 4 && (
                                                <>
                                                  <div>
                                                    <label className="block font-bold text-gray-400 uppercase mb-1">Calculated Investment Contribution (₹)</label>
                                                    {(() => {
                                                      const totalGuntas = selectedPool.participants.reduce((acc, p2) => acc + toGuntas(participantContributions[p2.userId]?.land || p2.landContribution || p2.landSize || 0), 0);
                                                      const farmerGuntas = toGuntas(participantContributions[p.userId]?.land || p.landContribution || p.landSize || 0);
                                                      const landRatio = totalGuntas > 0 ? farmerGuntas / totalGuntas : 0;
                                                      const calculatedInvestment = Math.round(landRatio * (farmPlan.estimatedCost || 0));
                                                      return (
                                                        <div>
                                                          <input
                                                            type="number"
                                                            value={calculatedInvestment}
                                                            readOnly
                                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-500 bg-gray-150 font-semibold cursor-not-allowed"
                                                          />
                                                          <span className="text-[9px] text-gray-500 block mt-1">
                                                            Auto-calculated based on land share ({Math.round(landRatio * 100)}%) of total cost (₹{farmPlan.estimatedCost || 0}).
                                                          </span>
                                                        </div>
                                                      );
                                                    })()}
                                                  </div>
                                                  <div className="col-span-1 md:col-span-2 p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-100 text-[11px] leading-relaxed">
                                                    <strong>Marketing Partner:</strong> Farmers cultivate independently. AgriLink provides buyer discovery, marketing, and logistics. Revenue generated via commission.
                                                  </div>
                                                </>
                                              )}

                                              {/* Model 5 Specific Output */}
                                              {farmerModel === 5 && (
                                                <>
                                                  <div>
                                                    <label className="block font-bold text-gray-400 uppercase mb-1">Investment Contribution (₹)</label>
                                                    <input
                                                      type="number"
                                                      value={participantContributions[p.userId]?.investment || 0}
                                                      onChange={(e) => setParticipantContributions({
                                                        ...participantContributions,
                                                        [p.userId]: {
                                                          ...(participantContributions[p.userId] || { investment: 0, labour: 0, machinery: '', land: p.landContribution || p.landSize, labourChargePerDay: 0, collaborationModel: 5 }),
                                                          investment: Number(e.target.value)
                                                        }
                                                      })}
                                                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block font-bold text-gray-400 uppercase mb-1">Labour Contribution (%)</label>
                                                    <input
                                                      type="number"
                                                      value={participantContributions[p.userId]?.labour || 0}
                                                      onChange={(e) => setParticipantContributions({
                                                        ...participantContributions,
                                                        [p.userId]: {
                                                          ...(participantContributions[p.userId] || { investment: 0, labour: 0, machinery: '', land: p.landContribution || p.landSize, labourChargePerDay: 0, collaborationModel: 5 }),
                                                          labour: Number(e.target.value)
                                                        }
                                                      })}
                                                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                                    />
                                                  </div>
                                                  <div className="col-span-1 md:col-span-2">
                                                    <label className="block font-bold text-gray-400 uppercase mb-1">Machinery Contribution Details</label>
                                                    <input
                                                      type="text"
                                                      value={participantContributions[p.userId]?.machinery || ''}
                                                      placeholder="e.g. Tractor Model 2025"
                                                      onChange={(e) => setParticipantContributions({
                                                        ...participantContributions,
                                                        [p.userId]: {
                                                          ...(participantContributions[p.userId] || { investment: 0, labour: 0, machinery: '', land: p.landContribution || p.landSize, labourChargePerDay: 0, collaborationModel: 5 }),
                                                          machinery: e.target.value
                                                        }
                                                      })}
                                                      className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                                    />
                                                  </div>
                                                </>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}

                                {/* Tab 4: Financials & Resources */}
                                {activeTab === 'financials' && (
                                  <div className="space-y-6 text-xs">
                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                                      <h4 className="font-bold text-gray-700 uppercase tracking-wider">Financial Estimates</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Estimated Cost (₹)</label>
                                          <input
                                            type="number"
                                            value={farmPlan.estimatedCost}
                                            onChange={(e) => setFarmPlan({ ...farmPlan, estimatedCost: Number(e.target.value) })}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Expected Yield</label>
                                          <input
                                            type="text"
                                            value={farmPlan.expectedYield}
                                            onChange={(e) => setFarmPlan({ ...farmPlan, expectedYield: e.target.value })}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Expected Revenue (₹)</label>
                                          <input
                                            type="number"
                                            value={farmPlan.expectedRevenue}
                                            onChange={(e) => setFarmPlan({ ...farmPlan, expectedRevenue: Number(e.target.value) })}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                          />
                                        </div>
                                        <div className="col-span-1 md:col-span-2 bg-[#e2f0d9]/30 p-4 rounded-xl border border-[#b2d5a3]/50 space-y-3">
                                          <h5 className="font-bold text-[#2c5c3d] text-xs">Standard Collaboration Model Rules Guide</h5>
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] text-[#2c5c3d] leading-relaxed">
                                            <div>
                                              <p className="font-bold border-b border-[#b2d5a3]/30 pb-1 mb-1">Profit Sharing Ratio Rules:</p>
                                              <ul className="list-disc list-inside space-y-0.5">
                                                <li><strong>Model 1 (Lease):</strong> Fixed land lease payout to farmer.</li>
                                                <li><strong>Model 2 (Managed):</strong> 100% crop profit minus 10% AgriLink fee.</li>
                                                <li><strong>Model 3 (Partnership):</strong> Land/labor contribution ratio (after daily labor charges).</li>
                                                <li><strong>Model 4 (Marketing):</strong> 100% crop sales minus commission.</li>
                                                <li><strong>Model 5 (Collaborative):</strong> Proportionate to combined contribution weights.</li>
                                              </ul>
                                            </div>
                                            <div>
                                              <p className="font-bold border-b border-[#b2d5a3]/30 pb-1 mb-1">Loss Sharing Ratio Rules:</p>
                                              <ul className="list-disc list-inside space-y-0.5">
                                                <li><strong>Model 1 (Lease):</strong> 0% farmer loss risk (borne by tenant).</li>
                                                <li><strong>Model 2 (Managed):</strong> 100% borne by the farmer.</li>
                                                <li><strong>Model 3 (Partnership):</strong> Shared proportionate to contribution ratio.</li>
                                                <li><strong>Model 4 (Marketing):</strong> 100% borne by the farmer.</li>
                                                <li><strong>Model 5 (Collaborative):</strong> Shared proportionate to investment/land ratio.</li>
                                              </ul>
                                            </div>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const modelsInUse = Array.from(new Set(selectedPool.participants.map(p => participantContributions[p.userId]?.collaborationModel || 1)));
                                              const pParts: string[] = [];
                                              const lParts: string[] = [];
                                              if (modelsInUse.includes(1)) { pParts.push("M1: Fixed Lease Payout"); lParts.push("M1: 0% Farmer Risk"); }
                                              if (modelsInUse.includes(2)) { pParts.push("M2: 100% Profit minus 10% Fee"); lParts.push("M2: 100% Farmer Risk"); }
                                              if (modelsInUse.includes(3)) { pParts.push("M3: Land/Labor Ratio Share"); lParts.push("M3: Proportionate to Land/Labor Share"); }
                                              if (modelsInUse.includes(4)) { pParts.push("M4: 100% Sales minus Commission"); lParts.push("M4: 100% Farmer Risk"); }
                                              if (modelsInUse.includes(5)) { pParts.push("M5: Combined Contribution Weights"); lParts.push("M5: Proportionate to Investment"); }

                                              setFarmPlan({
                                                ...farmPlan,
                                                profitSharingRatio: pParts.join("; "),
                                                lossSharingRatio: lParts.join("; ")
                                              });
                                            }}
                                            className="text-[10px] bg-[#1f3b2c] hover:bg-[#152a1f] text-white font-bold px-2 py-1 rounded transition-all"
                                          >
                                            Auto-fill rules based on pool models
                                          </button>
                                        </div>

                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Profit Sharing Ratio Formula</label>
                                          <input
                                            type="text"
                                            placeholder="e.g. M3: Land/Labor Ratio; M5: Combined Weights"
                                            value={farmPlan.profitSharingRatio}
                                            onChange={(e) => setFarmPlan({ ...farmPlan, profitSharingRatio: e.target.value })}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Loss Sharing Ratio Rule</label>
                                          <input
                                            type="text"
                                            placeholder="e.g. M1: 0% Farmer Risk; M3: Land Ratio"
                                            value={farmPlan.lossSharingRatio}
                                            onChange={(e) => setFarmPlan({ ...farmPlan, lossSharingRatio: e.target.value })}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                                      <h4 className="font-bold text-gray-700 uppercase tracking-wider">Resource Allocation Plan</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {renderResourceAllocation('Seeds Allocation', 'seeds', true)}
                                        {renderResourceAllocation('Fertilizer Allocation', 'fertilizers', false)}
                                        {renderResourceAllocation('Equipment & Machinery Sharing', 'equipment', false)}
                                        {renderResourceAllocation('Labour Allocation', 'labour', false)}
                                        {renderResourceAllocation('Storage Allocation', 'storage', false)}
                                        {renderResourceAllocation('Transportation & Logistics', 'transportation', false)}
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Tab 5: Crop Insurance */}
                                {activeTab === 'insurance' && (
                                  <div className="space-y-4 text-xs">
                                    <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100 space-y-4">
                                      <h4 className="font-bold text-gray-700 uppercase tracking-wider">Crop Insurance Policy Setup</h4>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Insurance Type</label>
                                          <select
                                            value={farmPlan.insuranceType}
                                            onChange={(e) => setFarmPlan({ ...farmPlan, insuranceType: e.target.value as any })}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-800 font-semibold"
                                          >
                                            <option value="government">Government Scheme</option>
                                            <option value="private">Private Insurance</option>
                                            <option value="none">No Insurance</option>
                                          </select>
                                        </div>

                                        {farmPlan.insuranceType === 'private' ? (
                                          <>
                                            <div>
                                              <label className="block font-bold text-gray-400 uppercase mb-1">Insurance Provider Name</label>
                                              <input
                                                type="text"
                                                placeholder="e.g. HDFC Ergo, ICICI Lombard..."
                                                value={farmPlan.insuranceProvider}
                                                onChange={(e) => setFarmPlan({ ...farmPlan, insuranceProvider: e.target.value })}
                                                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                              />
                                            </div>
                                            <div>
                                              <label className="block font-bold text-gray-400 uppercase mb-1">Total Insurance Premium (₹)</label>
                                              <input
                                                type="number"
                                                placeholder="e.g. 5000"
                                                value={totalPrivatePremium || ''}
                                                onChange={(e) => setTotalPrivatePremium(Number(e.target.value))}
                                                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                              />
                                            </div>
                                            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-100/50 text-[10px] leading-relaxed flex items-center md:col-span-2">
                                              <span>Private insurance premium cost will be shared by farmers proportionate to their profit sharing percentages.</span>
                                            </div>
                                          </>
                                        ) : farmPlan.insuranceType === 'government' ? (
                                          <div className="col-span-1 md:col-span-2 p-3 bg-amber-50 text-amber-800 rounded-xl border border-amber-200 text-[11px] leading-relaxed">
                                            <strong>Government Scheme warning:</strong> Payout is NOT guaranteed. Payouts depend strictly on official state government declarations of drought or heavy rain conditions in the region.
                                          </div>
                                        ) : (
                                          <div className="col-span-1 md:col-span-2 p-3 bg-red-50 text-red-800 rounded-xl border border-red-200 text-[11px] leading-relaxed">
                                            <strong>⚠️ CRITICAL WARNING:</strong> No insurance is active. In case of crop loss, damages, or natural calamities, AgriLink shall NOT provide any compensation or financial aid. Farmers are solely and individually responsible for all losses.
                                          </div>
                                        )}

                                        <div className="md:col-span-2">
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Insurance Coverage Details</label>
                                          <input
                                            type="text"
                                            readOnly
                                            value={farmPlan.coverageDetails}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-500 bg-gray-100 font-semibold cursor-not-allowed"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Claim Responsibility</label>
                                          <input
                                            type="text"
                                            readOnly
                                            value={farmPlan.claimResponsibility}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-500 bg-gray-100 font-semibold cursor-not-allowed"
                                          />
                                        </div>
                                        <div>
                                          <label className="block font-bold text-gray-400 uppercase mb-1">Premium Sharing Details (Auto-calculated)</label>
                                          <input
                                            type="text"
                                            readOnly
                                            value={farmPlan.premiumSharing}
                                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-500 bg-gray-100 font-semibold cursor-not-allowed"
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}

                              </div>

                              {/* Actions footer */}
                              <div className="flex gap-3 pt-6 border-t border-gray-100 justify-end">
                                <button
                                  onClick={handleSavePlanning}
                                  className="px-6 py-2.5 border border-gray-200 text-gray-600 font-bold rounded-xl text-xs hover:bg-gray-50 transition-all"
                                >
                                  Save Progress Draft
                                </button>
                                {(statusLower === 'planning' || statusLower === 'signing' || statusLower === 'active') && (
                                  <button
                                    onClick={async () => {
                                      await handleSavePlanning();
                                      setShowPreviewModal(true);
                                    }}
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all"
                                  >
                                    Final Draft
                                  </button>
                                )}
                                {(statusLower === 'planning' || statusLower === 'signing' || statusLower === 'active') && (
                                  <button
                                    onClick={async () => {
                                      if (statusLower === 'planning') {
                                        await handleSavePlanning();
                                        setShowPreviewModal(true);
                                      } else {
                                        await handleGenerateContract();
                                      }
                                    }}
                                    className="px-6 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition-all"
                                  >
                                    {statusLower === 'planning' ? 'Generate & Dispatch Contract' : 'Regenerate & Re-Dispatch Contract (Testing)'}
                                  </button>
                                )}
                              </div>

                            </div>
                          ) : (
                            <div className="p-5 rounded-2xl bg-amber-50/20 border border-amber-100/30 text-xs text-gray-500 flex items-center gap-2">
                              <FiLock className="w-4 h-4 text-amber-600" />
                              <span>Farm planning forms and model selection will unlock once the counseling meeting checklist is saved.</span>
                            </div>
                          )}

                          {/* Signing step status details */}
                          {statusLower === 'signing' && (
                            <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-100/50 space-y-4 text-xs">
                              <h3 className="font-bold text-indigo-800 text-sm flex items-center gap-2"><FiFileText /> Smart Contract Dispatched</h3>
                              <p>The contract has been compiled and generated with SHA-256 hash stamp on the platform's network. Signatures are currently being collated from farmers.</p>
                            </div>
                          )}

                          {/* Active step details */}
                          {statusLower === 'active' && (
                            <div className="space-y-6">
                              <div className="p-5 rounded-2xl bg-emerald-50/40 border border-emerald-100/50 space-y-2 text-xs">
                                <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-2"><FiAward /> Active Pool</h3>
                                <p>All farmers have completed signing. The pool is fully active. Manage operations and log expenses via the dedicated **Manage Pools** sidebar tab.</p>
                              </div>
                            </div>
                          )}

                        </div>
                      );
                    })()
                  ) : (
                    <div className="bg-white p-12 text-center text-gray-400 border border-gray-200/60 rounded-3xl shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                      <FiList className="w-12 h-12 text-gray-200 mb-4" />
                      <h3 className="font-bold text-[#1f3b2c] text-base">Select a Farm Pool</h3>
                      <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">Choose an assigned pool from the left panel to begin counseling and agricultural operational planning.</p>
                    </div>
                  )}
                </div>

              </div>
            ) : activeSidebarTab === 'manage-pools' ? (
              /* DEDICATED MANAGE POOLS VIEW */
              <div className="flex flex-col lg:flex-row gap-6">

                {/* Pool Selector Sidebar */}
                <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
                  <div className="bg-white p-5 rounded-3xl border border-gray-200/60 shadow-sm space-y-4">
                    <h2 className="text-base font-extrabold text-[#1f3b2c] flex items-center gap-2"><FiGrid /> Select Pool to Manage</h2>
                    <p className="text-[10px] text-gray-500 mt-1">Select an active pool below to log expenditures and manage cultivation milestones.</p>

                    <div className="space-y-2">
                      {pools.map(pool => (
                        <button
                          key={pool._id}
                          onClick={() => setSelectedPoolAndUrl(pool)}
                          className={`w-full text-left p-3.5 rounded-2xl border text-sm transition-all ${selectedPool?._id === pool._id
                              ? 'bg-gradient-to-br from-[#166534]/10 to-[#15803d]/5 border-[#166534] font-bold shadow-sm'
                              : 'bg-white border-gray-200 hover:border-gray-300'
                            }`}
                        >
                          <p className="text-[#1f3b2c] truncate">{pool.name}</p>
                          <div className="flex justify-between items-center mt-2 text-[11px] text-gray-400 font-normal">
                            <span>Farmers: {pool.participants.length}</span>
                            <span className="uppercase text-[9px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">{pool.status.replace('_', ' ')}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Operations Management Work Board */}
                <div className="flex-1 space-y-6">
                  {selectedPool ? (
                    <>
                      <div className="bg-white p-6 rounded-3xl border border-gray-200/60 shadow-sm">
                        <h1 className="text-2xl font-black text-[#1f3b2c] mb-2 flex items-center gap-2">
                          🎛️ Operations Desk: {selectedPool.name}
                        </h1>
                        <p className="text-xs text-gray-500">Track crop lifecycle progress, verify member labour & machinery logs, and execute seasonal harvest settlement below.</p>
                      </div>

                      {/* FCO Member Contribution Audit & Verification Desk */}
                      <ContributionHistoryTable
                        poolId={selectedPool._id}
                        userId={userId || ''}
                        userName="Field Counseling Officer"
                        isFco={true}
                        onRefreshPool={fetchPools}
                      />

                      {/* FCO Harvest Valuation & Final Settlement Desk */}
                      <PoolSettlementView
                        poolId={selectedPool._id}
                        poolName={selectedPool.name}
                        collaborationModel={selectedPool.collaborationModel || 5}
                        isFco={true}
                        userId={userId || ''}
                        userName="Field Counseling Officer"
                        onSettlementCreated={fetchPools}
                      />

                      {/* Crop Cultivation Task Management Board */}
                      <div className="p-6 rounded-3xl bg-white border border-gray-200/60 shadow-sm space-y-4 text-xs">
                        <div className="border-b border-gray-100 pb-3">
                          <h4 className="font-extrabold text-[#1f3b2c] text-sm flex items-center gap-2">
                            <FiSliders className="text-[#166534] w-5 h-5" /> Crop Cultivation Progress Management Board
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Verify and toggle scheduled tasks for: <span className="font-bold text-[#166534]">{selectedPool.farmPlan?.selectedCrop || 'Cooperative Crops'}</span>.
                          </p>
                        </div>

                        {/* Tasks List */}
                        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                          {(selectedPool.tasksList || []).map((task: any) => (
                            <div key={task.id} className="flex justify-between items-center p-3.5 border border-gray-100 rounded-2xl hover:bg-gray-50/50">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => handleToggleBoardTask(task.id)}
                                  className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${task.status === 'completed'
                                      ? 'bg-[#166534] border-[#166534] text-white'
                                      : 'border-gray-300 hover:border-emerald-600'
                                    }`}
                                >
                                  {task.status === 'completed' && <FiCheckCircle className="w-3.5 h-3.5" />}
                                </button>
                                <span className={`font-bold text-sm ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                  {task.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-[10px] text-gray-500 font-bold bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-xl">Target: {task.date}</span>
                                <button
                                  onClick={() => handleDeleteBoardTask(task.id)}
                                  className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg font-bold text-xs"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))}
                          {(!selectedPool.tasksList || selectedPool.tasksList.length === 0) && (
                            <p className="text-center text-slate-400 py-6 italic">No tasks initialized. Dispatch contract to populate default checklist.</p>
                          )}
                        </div>

                        {/* Add Task Form */}
                        <form onSubmit={handleAddBoardTask} className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
                          <input
                            type="text"
                            placeholder="Milestone Task (e.g. Apply organic urea)"
                            value={newBoardTaskName}
                            onChange={(e) => setNewBoardTaskName(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white"
                            required
                          />
                          <input
                            type="text"
                            placeholder="Target Date (e.g. Aug 25, 2026)"
                            value={newBoardTaskDate}
                            onChange={(e) => setNewBoardTaskDate(e.target.value)}
                            className="border border-gray-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 bg-white"
                            required
                          />
                          <button
                            type="submit"
                            className="bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs py-2 shadow-sm transition-all"
                          >
                            + Add Crop Task
                          </button>
                        </form>
                      </div>

                      {/* Shared Expense Ledger Manager */}
                      <div className="p-6 rounded-3xl bg-white border border-gray-200/60 shadow-sm space-y-4 text-xs">
                        <div className="border-b border-gray-100 pb-3">
                          <h4 className="font-extrabold text-[#1f3b2c] text-sm flex items-center gap-2">
                            <FiDollarSign className="text-[#166534] w-5 h-5" /> Shared Expense Ledger Manager
                          </h4>
                          <p className="text-[11px] text-gray-500 mt-1">
                            Log operational expenditures against specific farmers. Values are dynamically divided in on-chain settlements.
                          </p>
                        </div>

                        {/* Expenses List */}
                        <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                          {(selectedPool.expensesList || []).map((exp: any) => (
                            <div key={exp.id} className="flex justify-between items-center p-3.5 bg-gray-50/50 border border-gray-100 rounded-2xl hover:bg-gray-50">
                              <div>
                                <p className="font-bold text-gray-800 text-sm">{exp.category} &mdash; ₹{exp.amount.toLocaleString('en-IN')}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Paid by: <span className="font-semibold text-gray-600">{exp.farmerName}</span> · Date: {exp.date}</p>
                                <p className="text-[10px] text-[#166534] italic font-semibold mt-1">&quot;{exp.reason}&quot;</p>
                              </div>
                              <button
                                onClick={() => handleDeleteBoardExpense(exp.id)}
                                className="text-rose-600 hover:text-rose-800 font-bold text-xs px-3 py-1.5 hover:bg-rose-50 rounded-xl transition-all"
                              >
                                Delete
                              </button>
                            </div>
                          ))}
                          {(!selectedPool.expensesList || selectedPool.expensesList.length === 0) && (
                            <p className="text-center text-slate-400 py-6 italic">No expenses log entries found.</p>
                          )}
                        </div>

                        {/* Add Expense Form */}
                        <form onSubmit={handleAddBoardExpense} className="space-y-3 pt-4 border-t border-gray-100">
                          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                            <select
                              value={newExpCategory}
                              onChange={(e) => setNewExpCategory(e.target.value)}
                              className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-800 bg-white font-semibold"
                            >
                              <option value="Seeds">Seeds</option>
                              <option value="Fertilizers">Fertilizers</option>
                              <option value="Irrigation Repair">Irrigation Repair</option>
                              <option value="Machinery Rent">Machinery Rent</option>
                              <option value="Labour wages">Labour wages</option>
                              <option value="Logistics">Logistics & Transport</option>
                              <option value="Others">Others (Write Custom...)</option>
                            </select>

                            {newExpCategory === 'Others' && (
                              <input
                                type="text"
                                placeholder="Custom Category Name"
                                value={newExpCustomCategory}
                                onChange={(e) => setNewExpCustomCategory(e.target.value)}
                                className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-800 bg-white"
                                required
                              />
                            )}

                            <input
                              type="number"
                              placeholder="Amount (₹)"
                              value={newExpAmount}
                              onChange={(e) => setNewExpAmount(e.target.value)}
                              className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-800 bg-white"
                              required
                            />
                            <select
                              value={newExpFarmerId}
                              onChange={(e) => setNewExpFarmerId(e.target.value)}
                              className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-800 bg-white font-semibold"
                              required
                            >
                              <option value="">Select Farmer...</option>
                              {selectedPool.participants.map(p => (
                                <option key={p.userId} value={p.userId}>{p.fullName}</option>
                              ))}
                            </select>
                            <input
                              type="text"
                              placeholder="Reason/Notes"
                              value={newExpReason}
                              onChange={(e) => setNewExpReason(e.target.value)}
                              className="border border-gray-200 rounded-xl px-2.5 py-2.5 text-xs text-slate-800 bg-white"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs py-2 shadow-sm transition-all"
                          >
                            + Log Expense
                          </button>
                        </form>
                      </div>

                      {/* Progressive Block Chain Operations Anchor Form */}
                      {selectedPool.status === 'active' && (
                        <div className="p-6 rounded-3xl bg-[#f0fdf4]/50 border border-emerald-100 space-y-4 text-xs">
                          <div className="border-b border-emerald-100 pb-2.5">
                            <h4 className="font-extrabold text-[#1f3b2c] text-sm flex items-center gap-1.5">
                              ⛓️ Publish Operational Milestone to Blockchain Ledger
                            </h4>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Secure this crop cycle operational achievements by anchoring them onto the smart contract timeline blocks.
                            </p>
                          </div>

                          <form onSubmit={handleAddProgressBlock} className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <label className="block font-bold text-gray-400 uppercase mb-1">Select Milestone Action</label>
                                <select
                                  value={blockActionInput}
                                  onChange={(e) => setBlockActionInput(e.target.value)}
                                  className="w-full border border-gray-200 rounded-lg px-2.5 py-2 bg-white text-slate-800 font-semibold"
                                  required
                                >
                                  <option value="">Choose milestone action...</option>
                                  <option value="Sowing Verification">🌱 Sowing Verification Completed</option>
                                  <option value="Fertilization Stage">🧪 Fertilization Dose Applied</option>
                                  <option value="Irrigation Checked">💧 Scheduled Irrigation Audited</option>
                                  <option value="Pest Control Applied">🐛 Pest Mitigation Completed</option>
                                  <option value="Harvest Commenced">🌾 Harvest Phase Commenced</option>
                                  <option value="Yield Audited">📦 Crop Yield Audited</option>
                                  <option value="Settlement Finalized">💰 Financial Settlement Finalized</option>
                                  <option value="Termination Trigger">🔴 Operational Cycle Terminated</option>
                                </select>
                              </div>

                              <div>
                                <label className="block font-bold text-gray-400 uppercase mb-1">Milestone Details & Ledger Remarks</label>
                                <textarea
                                  value={blockRemarksInput}
                                  onChange={(e) => setBlockRemarksInput(e.target.value)}
                                  placeholder="Provide verification notes, batch details, or audit metadata..."
                                  rows={1}
                                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white font-semibold"
                                  required
                                />
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={isPublishingBlock || !blockActionInput || !blockRemarksInput}
                              className="w-full py-2 bg-[#166534] hover:bg-[#14532d] disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm"
                            >
                              {isPublishingBlock ? 'Mining Block & Sealing...' : '🔐 Seal Progressive Operation Block'}
                            </button>
                          </form>
                        </div>
                      )}

                      {/* Dispute & Support Query Desk for FCO */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-200/60 shadow-sm space-y-4">
                        <div className="border-b border-gray-150 pb-3">
                          <h3 className="text-base font-extrabold text-[#1f3b2c] flex items-center gap-2">
                            <FiAlertCircle className="text-rose-600 w-5 h-5" /> Farmer Disputes & Support Tickets
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">Review raised conflicts and input resolution details to seal them on the blockchain progression ledger.</p>
                        </div>

                        <div className="space-y-4">
                          {tickets.map((ticket: any) => (
                            <div key={ticket._id} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl space-y-3">
                              <div className="flex justify-between items-start flex-wrap gap-2 text-xs">
                                <div>
                                  <span className="font-extrabold text-gray-700">From: {ticket.farmerName}</span>
                                  <span className="text-gray-400 font-normal"> · Pool: {ticket.poolName}</span>
                                </div>
                                <div className="flex gap-2">
                                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase ${ticket.visibility === 'private' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {ticket.visibility === 'private' ? '🔒 Private' : '🌐 Shared'}
                                  </span>
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${ticket.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                    }`}>
                                    {ticket.status}
                                  </span>
                                </div>
                              </div>

                              <div>
                                <h4 className="font-bold text-sm text-gray-800">{ticket.title}</h4>
                                <p className="text-xs text-gray-600 mt-1 leading-relaxed">{ticket.description}</p>
                              </div>

                              {ticket.status === 'pending' ? (
                                <div className="space-y-2 pt-2 border-t border-gray-100">
                                  <label className="block text-[10px] font-bold text-gray-400 uppercase">Input Resolution Terms</label>
                                  <div className="flex gap-2">
                                    <input
                                      type="text"
                                      placeholder="e.g. Compensated for machinery loss / Rescheduled irrigation cycle..."
                                      value={resolutionInput[ticket._id] || ''}
                                      onChange={(e) => setResolutionInput(prev => ({ ...prev, [ticket._id]: e.target.value }))}
                                      className="flex-1 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 bg-white"
                                      required
                                    />
                                    <button
                                      onClick={() => handleResolveConflictTicket(ticket._id)}
                                      disabled={isResolvingTicket[ticket._id]}
                                      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
                                    >
                                      {isResolvingTicket[ticket._id] ? 'Resolving...' : 'Resolve'}
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs space-y-1">
                                  <p className="font-bold text-emerald-800">Resolution Status:</p>
                                  <p className="text-emerald-700 italic">&quot;{ticket.resolution}&quot;</p>
                                  <p className="text-[10px] text-emerald-600 mt-1">Resolved on {new Date(ticket.resolvedAt).toLocaleDateString('en-IN')}</p>
                                </div>
                              )}
                            </div>
                          ))}
                          {tickets.length === 0 && (
                            <p className="text-center text-xs text-gray-400 py-6">No pending query disputes or tickets found.</p>
                          )}
                        </div>
                      </div>

                      {/* Shared Pool Files Repository for FCO */}
                      <div className="bg-white p-6 rounded-3xl border border-gray-200/60 shadow-sm space-y-4">
                        <div className="border-b border-gray-150 pb-3 flex justify-between items-center flex-wrap gap-2">
                          <div>
                            <h3 className="text-base font-extrabold text-[#1f3b2c] flex items-center gap-2">
                              <FiFileText className="text-[#166534] w-5 h-5" /> Pool Files & Documents Repository
                            </h3>
                            <p className="text-xs text-gray-500 mt-1">Upload reference guides, quality test logs, or invoices. Accessible by all pool participants.</p>
                          </div>

                          <label className="bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer shadow-sm flex items-center gap-1.5 transition-all">
                            <FiUpload /> {isUploadingFile ? 'Uploading...' : 'Upload File'}
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleUploadPoolFile}
                              disabled={isUploadingFile}
                            />
                          </label>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {((selectedPool as any).uploadedFiles || []).map((file: any) => (
                            <div key={file.id} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex justify-between items-center">
                              <div className="truncate pr-2">
                                <p className="font-bold text-xs text-gray-800 truncate" title={file.name}>{file.name}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Uploaded: {file.uploadedAt}</p>
                              </div>
                              <div className="flex gap-2 flex-shrink-0">
                                <a
                                  href={file.url}
                                  download={file.name}
                                  className="p-2 bg-white hover:bg-gray-100 text-gray-600 rounded-xl border border-gray-150 transition-all flex items-center justify-center"
                                  title="Download"
                                >
                                  <FiDownload className="w-3.5 h-3.5" />
                                </a>
                                <button
                                  onClick={() => handleDeletePoolFile(file.id)}
                                  className="p-2 bg-white hover:bg-rose-50 text-rose-600 rounded-xl border border-gray-150 hover:border-rose-200 transition-all flex items-center justify-center"
                                  title="Delete"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                          {(!((selectedPool as any).uploadedFiles) || (selectedPool as any).uploadedFiles.length === 0) && (
                            <p className="col-span-1 sm:col-span-2 text-center text-xs text-gray-400 py-6 italic">No shared documents uploaded yet.</p>
                          )}
                        </div>
                      </div>

                      {/* Smart Contract Explorer */}
                      <div className="bg-white border border-gray-200/60 rounded-3xl shadow-sm overflow-hidden space-y-4 p-1">
                        <div className="p-5 border-b border-gray-100">
                          <h3 className="text-base font-bold text-[#1f3b2c] flex items-center gap-2">
                            <FiFileText className="text-[#166534]" /> Smart Contract & Ledger Explorer
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">Review the cryptographically sealed details and progression timeline blocks.</p>
                        </div>
                        <SmartContractDocument pool={selectedPool} />
                      </div>
                    </>
                  ) : (
                    <div className="bg-white p-12 text-center text-gray-400 border border-gray-200/60 rounded-3xl shadow-sm flex flex-col items-center justify-center min-h-[400px]">
                      <FiList className="w-12 h-12 text-gray-200 mb-4" />
                      <h3 className="font-bold text-[#1f3b2c] text-base">Select a Farm Pool</h3>
                      <p className="text-xs text-gray-400 mt-1 max-w-xs leading-relaxed">Choose an active pool from the left panel to begin managing crop milestones and expense ledger entries.</p>
                    </div>
                  )}
                </div>

              </div>
            ) : activeSidebarTab === 'calendar' ? (
              /* CALENDAR TAB VIEW */
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl border border-gray-200/60 shadow-sm">
                  <h1 className="text-2xl font-black text-[#1f3b2c] mb-2 flex items-center gap-2">
                    <FiCalendar className="text-[#166534]" /> Counselor Schedule & Calendar
                  </h1>
                  <p className="text-xs text-gray-500">Manage your counseling appointments, upcoming tasks, and set daily reminders.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                  {/* Reminders List & Form */}
                  <div className="lg:col-span-1 bg-white p-5 rounded-3xl border border-gray-200/60 shadow-sm space-y-4 h-fit">
                    <div className="border-b border-gray-100 pb-2 flex justify-between items-center">
                      <h3 className="text-base font-extrabold text-[#1f3b2c] flex items-center gap-2">
                        <FiCheckSquare className="text-amber-600" /> Tasks & Reminders
                      </h3>
                      <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-bold border border-amber-100">{reminders.length}</span>
                    </div>

                    {/* Reminder creation form */}
                    <form onSubmit={handleAddReminder} className="space-y-2 text-xs">
                      <input
                        type="text"
                        placeholder="e.g. Call Rame Gowda"
                        value={newReminderText}
                        onChange={(e) => setNewReminderText(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 focus:ring-[#166534]"
                        required
                      />
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={newReminderDate}
                          onChange={(e) => setNewReminderDate(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px]"
                          required
                        />
                        <input
                          type="time"
                          value={newReminderTime}
                          onChange={(e) => setNewReminderTime(e.target.value)}
                          className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-[10px]"
                          required
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full bg-[#166534] hover:bg-[#14532d] text-white text-[10px] font-bold rounded-lg py-1.5 flex items-center justify-center gap-1 transition-all"
                      >
                        <FiPlus /> Add Reminder
                      </button>
                    </form>

                    {/* Reminders List */}
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 pt-2">
                      {reminders.length === 0 ? (
                        <p className="text-center text-xs text-gray-400 py-4">No tasks or reminders yet.</p>
                      ) : (
                        reminders.map(r => (
                          <div key={r.id} className="flex justify-between items-start p-3 bg-gray-50 border border-gray-100 rounded-2xl text-xs animate-slide-in">
                            <div className="space-y-1 pr-2">
                              <p className="text-gray-700 font-semibold leading-tight">{r.text}</p>
                              <p className="text-[10px] text-gray-400">{r.date} at {r.time}</p>
                            </div>
                            <button
                              onClick={() => handleDeleteReminder(r.id)}
                              className="text-red-500 hover:text-red-700 p-1 rounded hover:bg-red-50 transition-all"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Scheduled counseling meetings across all pools */}
                  <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-gray-200/60 shadow-sm space-y-4">
                    <div className="border-b border-gray-100 pb-2">
                      <h3 className="text-base font-extrabold text-[#1f3b2c] flex items-center gap-2">
                        <FiClock className="text-emerald-600" /> Upcoming Counseling Meetings
                      </h3>
                    </div>

                    <div className="space-y-3">
                      {pools.filter(p => p.meetingDetails?.scheduledAt).length === 0 ? (
                        <p className="text-center text-xs text-gray-400 py-12">No upcoming counseling sessions scheduled. Select a pool in "Assigned Farmers" to schedule meetings.</p>
                      ) : (
                        pools.filter(p => p.meetingDetails?.scheduledAt).map(pool => (
                          <div key={pool._id} className="p-4 bg-gradient-to-br from-[#f0fdf4]/40 to-white border border-emerald-100/50 rounded-2xl space-y-2 hover:shadow-md transition-all">
                            <div className="flex justify-between items-start flex-wrap gap-2">
                              <span className="text-xs uppercase font-extrabold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
                                {pool.name}
                              </span>
                              <span className="text-xs text-[#1f3b2c] font-bold flex items-center gap-1">
                                <FiCalendar className="text-[#166534]" />
                                {new Date(pool.meetingDetails!.scheduledAt).toLocaleString('en-IN', {
                                  dateStyle: 'medium',
                                  timeStyle: 'short'
                                })}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600 space-y-1">
                              <p><strong>Meeting Mode:</strong> {pool.meetingDetails!.meetingType === 'online' ? '💻 Google Meet Call' : '📍 Physical Meeting'}</p>
                              {pool.meetingDetails!.meetingType === 'online' && pool.meetingDetails!.meetingLink && (
                                <p><strong>Link:</strong> <a href={pool.meetingDetails!.meetingLink} target="_blank" rel="noreferrer" className="text-blue-600 underline truncate block">{pool.meetingDetails!.meetingLink}</a></p>
                              )}
                              {pool.meetingDetails!.meetingType === 'offline' && pool.meetingDetails!.location && (
                                <p><strong>Location:</strong> {pool.meetingDetails!.location}</p>
                              )}
                              <p className="pt-2 text-gray-500 font-medium">Participating Farmers:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {pool.participants.map((p, index) => (
                                  <span key={index} className="bg-white px-2 py-0.5 rounded border border-gray-100 text-[10px] text-gray-600">
                                    {p.fullName} ({p.landContribution || p.landSize} Ac)
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            ) : (
              /* FCO GOVERNMENT SCHEMES MANAGER VIEW (Step 7, 10 Refinements) */
              <div className="space-y-8 animate-fadeIn text-xs">
                <div className="bg-white p-6 rounded-3xl border border-gray-200/60 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-black text-[#1f3b2c] mb-1 flex items-center gap-2">
                      🛡️ Government Schemes Workspace
                    </h1>
                    <p className="text-xs text-gray-500">Recommend active schemes to targeted farmer cohorts, track responses, and manage group approvals.</p>
                  </div>
                  <button
                    onClick={fetchFcoSchemesData}
                    className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-all flex items-center gap-1.5"
                  >
                    Refresh Panel Data
                  </button>
                </div>

                {/* Sub-tab Navigation */}
                <div className="flex border-b border-gray-200/80 bg-white rounded-t-3xl px-4 pt-2">
                  {(['list', 'campaigns', 'consensus', 'applied'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setFcoSchemesSubTab(tab)}
                      className={`px-5 py-3.5 text-xs font-bold transition-all border-b-2 capitalize ${fcoSchemesSubTab === tab
                          ? 'border-[#166534] text-[#166534]'
                          : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                    >
                      {tab === 'list' && 'All Schemes 📜'}
                      {tab === 'campaigns' && 'Recommended Campaigns 📢'}
                      {tab === 'consensus' && 'Consensus Pool Proposals 🗳️'}
                      {tab === 'applied' && 'Applied Schemes ✓'}
                    </button>
                  ))}
                </div>

                {/* Sub-tab Content Renders */}
                <div className="bg-white p-6 rounded-b-3xl border-x border-b border-gray-200/60 shadow-sm">

                  {/* TAB 1: ALL SCHEMES LIST */}
                  {fcoSchemesSubTab === 'list' && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-100 pb-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-base font-extrabold text-[#1f3b2c]">Government Schemes Directory</h3>
                          <p className="text-[11px] text-gray-400 mt-0.5">Browse available schemes and broadcast recommendations to targeted crops or states.</p>
                        </div>
                      </div>

                      {/* FILTER BAR SECTION */}
                      <div className="bg-gray-50/60 p-4 rounded-2xl border border-gray-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        <div>
                          <label className="block font-bold text-gray-400 uppercase mb-1">Search Schemes</label>
                          <input
                            type="text"
                            placeholder="Type to search name/desc..."
                            value={fcoSearchQuery}
                            onChange={(e) => setFcoSearchQuery(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block font-bold text-gray-400 uppercase mb-1">Filter Category</label>
                          <select
                            value={fcoFilterCategory}
                            onChange={(e) => setFcoFilterCategory(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white"
                          >
                            <option value="">All Categories</option>
                            {Array.from(new Set(fcoSchemes.map(s => s.category).filter(Boolean))).map((cat: any) => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-gray-400 uppercase mb-1">Target Crop</label>
                          <select
                            value={fcoFilterCropText}
                            onChange={(e) => setFcoFilterCropText(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white"
                          >
                            <option value="">All Crops</option>
                            <option value="Coffee">Coffee</option>
                            <option value="Pepper">Pepper</option>
                            <option value="Arecanut">Arecanut</option>
                            <option value="Cardamom">Cardamom</option>
                            <option value="Ragi">Ragi</option>
                            <option value="Paddy">Paddy</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-gray-400 uppercase mb-1">Target State</label>
                          <select
                            value={fcoFilterStateText}
                            onChange={(e) => setFcoFilterStateText(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-slate-800 bg-white"
                          >
                            <option value="">All States</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {fcoSchemes.filter(scheme => {
                          const matchesSearch = !fcoSearchQuery ||
                            scheme.name?.toLowerCase().includes(fcoSearchQuery.toLowerCase()) ||
                            scheme.description?.toLowerCase().includes(fcoSearchQuery.toLowerCase());

                          const matchesCat = !fcoFilterCategory || scheme.category === fcoFilterCategory;

                          // Check state filter against raw state fields if present
                          const rawState = String(scheme.raw?.State || scheme.raw?.state || scheme.raw?.STATE || '');
                          const matchesState = !fcoFilterStateText || !rawState || rawState.toLowerCase().includes(fcoFilterStateText.toLowerCase());

                          // Check crop filter against raw crop fields if present
                          const rawCrop = String(scheme.raw?.Crop || scheme.raw?.crops || scheme.raw?.crop || scheme.raw?.Crops || '');
                          const matchesCrop = !fcoFilterCropText || !rawCrop || rawCrop.toLowerCase().includes(fcoFilterCropText.toLowerCase());

                          return matchesSearch && matchesCat && matchesState && matchesCrop;
                        }).map((scheme) => (
                          <div key={scheme._id} className="border border-gray-100 rounded-2xl p-5 hover:shadow-md transition-all space-y-4 flex flex-col justify-between">
                            <div className="space-y-2">
                              <div className="flex justify-between items-start gap-2">
                                <span className="bg-slate-100 text-slate-700 text-[9px] font-extrabold px-2 py-0.5 rounded border border-slate-200">
                                  {scheme.category || 'General'}
                                </span>
                                <span className="text-[10px] text-[#166534] font-bold">Live List</span>
                              </div>
                              <h4 className="font-extrabold text-sm text-[#1f3b2c] leading-snug">{scheme.name}</h4>
                              <p className="text-[11px] text-gray-500 line-clamp-3">{scheme.description}</p>

                              <div className="pt-2 border-t border-dashed border-gray-100 space-y-1.5 text-[10px]">
                                {Object.entries(scheme.raw || {}).slice(0, 3).map(([k, v]) => (
                                  <p key={k} className="text-gray-500">
                                    <strong className="capitalize text-gray-600">{k.replace(/_/g, ' ')}:</strong> {String(v)}
                                  </p>
                                ))}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                setRecommendSchemeData(scheme);
                                setRecommendTargetSchemeId(scheme._id);
                              }}
                              className="w-full bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl py-2 text-xs transition-colors shadow-sm mt-3"
                            >
                              Recommend to Cohort 🚀
                            </button>
                          </div>
                        ))}
                        {fcoSchemes.length === 0 && (
                          <p className="text-center text-gray-400 py-12 italic col-span-full">No active schemes found in live list database.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: ACTIVE BROADCAST CAMPAIGNS */}
                  {fcoSchemesSubTab === 'campaigns' && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-base font-extrabold text-[#1f3b2c]">Broadcast Campaign Status Tracker</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Monitor farmer opt-in response status and initiate bulk application filings once farmers agree.</p>
                      </div>

                      <div className="space-y-4">
                        {fcoCampaigns.filter(c => !c.bulkApplied).map((rec) => {
                          const interested = rec.farmerResponses.filter((r: any) => r.status === 'interested');
                          const declined = rec.farmerResponses.filter((r: any) => r.status === 'not_interested');
                          const pending = rec.farmerResponses.filter((r: any) => r.status === 'pending');

                          return (
                            <div key={rec._id} className="border border-gray-100 rounded-2xl p-5 flex flex-col md:flex-row justify-between gap-4 hover:bg-gray-50/20 transition-all">
                              <div className="flex-1 space-y-2">
                                <span className="bg-gray-100 text-gray-700 text-[10px] px-2.5 py-0.5 rounded font-extrabold uppercase border border-gray-200">
                                  Filter: Crop &mdash; {rec.targetFilters?.crop || 'All'} | State &mdash; {rec.targetFilters?.state || 'All'}
                                </span>
                                <h4 className="font-extrabold text-sm text-[#1f3b2c]">{rec.schemeId?.name || 'Government Scheme'}</h4>

                                <div className="flex flex-wrap gap-3 pt-1">
                                  <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg">Interested: {interested.length} 👍</span>
                                  <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded-lg">Declined: {declined.length} 👎</span>
                                  <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-lg">Pending: {pending.length} ⌛</span>
                                </div>
                              </div>

                              <div className="flex flex-col justify-center items-center md:items-end gap-2 min-w-[160px] border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
                                <button
                                  onClick={() => handleBulkApplyCampaign(rec._id)}
                                  disabled={interested.length === 0}
                                  className="w-full bg-[#166534] hover:bg-[#14532d] disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-all shadow-sm"
                                >
                                  Bulk Apply ({interested.length}) 🛡️
                                </button>
                                {interested.length === 0 && (
                                  <span className="text-[10px] text-gray-400 block text-center">Waiting for farmer interest...</span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                        {fcoCampaigns.filter(c => !c.bulkApplied).length === 0 && (
                          <p className="text-center text-slate-400 py-12 italic">No active campaigns matching criteria.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: CONSENSUS POOL PROPOSALS */}
                  {fcoSchemesSubTab === 'consensus' && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-base font-extrabold text-[#1f3b2c]">Consensus Pool Proposals</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">List of proposed schemes that have reached 100% agreement from all collaborated group participants.</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {fcoPoolProposals.filter(p => p.status === 'approved').map((prop) => (
                          <div key={prop._id} className="p-5 border border-emerald-100 bg-[#f0fdf4]/20 rounded-2xl space-y-4 hover:shadow-sm transition-all flex flex-col justify-between">
                            <div className="space-y-2">
                              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-200">
                                Unanimous Agreement Met 🤝
                              </span>
                              <h4 className="font-extrabold text-sm text-[#1f3b2c] leading-snug">{prop.schemeName}</h4>
                              <p className="text-xs text-gray-500 font-semibold">Cooperative Land Pool: <span className="text-[#166534]">{prop.poolName}</span></p>

                              {(() => {
                                const schemeDetail = fcoSchemes.find(s => String(s._id) === String(prop.schemeId));
                                if (schemeDetail) {
                                  return (
                                    <div className="mt-3 p-3.5 bg-white rounded-xl text-[10px] border border-gray-100 text-gray-600 space-y-1.5">
                                      <p><strong>Gov Scheme Category:</strong> {schemeDetail.category || 'General'}</p>
                                      {schemeDetail.link && <p><strong>Official Link:</strong> <a href={schemeDetail.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline break-all">{schemeDetail.link}</a></p>}
                                      {Object.entries(schemeDetail.raw || {}).slice(0, 3).map(([k, v]) => (
                                        <p key={k}><strong>{k.replace(/_/g, ' ')}:</strong> {String(v)}</p>
                                      ))}
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>

                            <button
                              onClick={() => handleApplyGroupProposal(prop.poolId, prop._id)}
                              className="w-full bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold py-2 rounded-xl transition-all shadow-md mt-2"
                            >
                              Apply for Pool Group 🚜
                            </button>
                          </div>
                        ))}
                        {fcoPoolProposals.filter(p => p.status === 'approved').length === 0 && (
                          <p className="text-center text-gray-400 py-12 italic col-span-full">No group consensus proposals currently waiting application.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 4: APPLIED SCHEMES ARCHIVE */}
                  {fcoSchemesSubTab === 'applied' && (
                    <div className="space-y-6">
                      <div className="border-b border-gray-100 pb-3">
                        <h3 className="text-base font-extrabold text-[#1f3b2c]">Applied Schemes Ledger</h3>
                        <p className="text-[11px] text-gray-400 mt-0.5">Historical log of bulk-applied campaigns and approved pool applications signed on the blockchain ledger.</p>
                      </div>

                      <div className="space-y-4">
                        {/* Section A: Pool Group Schemes */}
                        <div className="space-y-3">
                          <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Group Pool Applications</h4>
                          {fcoPoolProposals.filter(p => p.status === 'applied').map((prop) => (
                            <div key={prop._id} className="border border-green-100 bg-[#f0fdf4]/20 rounded-2xl p-4 flex justify-between items-center">
                              <div>
                                <span className="bg-emerald-100 text-emerald-800 text-[9px] font-bold px-2 py-0.5 rounded">Pool Applied</span>
                                <h5 className="font-bold text-sm text-gray-800 mt-1">{prop.schemeName}</h5>
                                <p className="text-[10px] text-gray-400">Pool: <strong>{prop.poolName}</strong> · Action Status: Complete</p>
                              </div>
                              <span className="text-xs font-bold text-green-700 bg-white border border-green-200 px-3 py-1.5 rounded-xl">Applied ✓</span>
                            </div>
                          ))}
                          {fcoPoolProposals.filter(p => p.status === 'applied').length === 0 && (
                            <p className="text-xs text-slate-400 italic py-2">No pool group applications filed yet.</p>
                          )}
                        </div>

                        {/* Section B: FCO Recommended Campaign Schemes */}
                        <div className="space-y-3 pt-4 border-t border-gray-100">
                          <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Broadcast Campaigns</h4>
                          {fcoCampaigns.filter(c => c.bulkApplied).map((rec) => (
                            <div key={rec._id} className="border border-gray-150 rounded-2xl p-4 flex justify-between items-center hover:bg-gray-50/40">
                              <div>
                                <span className="bg-slate-100 text-gray-600 text-[9px] font-bold px-2 py-0.5 rounded border border-gray-200">Campaign Broadcast</span>
                                <h5 className="font-bold text-sm text-[#1f3b2c] mt-1">{rec.schemeId?.name || 'Government Scheme'}</h5>
                                <p className="text-[10px] text-gray-400">Filters: Crop &mdash; {rec.targetFilters?.crop || 'All'} | State &mdash; {rec.targetFilters?.state || 'All'}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-green-700 bg-white border border-green-200 px-3 py-1.5 rounded-xl inline-block">Bulk Applied ✓</span>
                                <p className="text-[9px] text-gray-400 mt-1">Cohort size: {rec.farmerResponses.filter((r: any) => r.status === 'interested').length} Farmers</p>
                              </div>
                            </div>
                          ))}
                          {fcoCampaigns.filter(c => c.bulkApplied).length === 0 && (
                            <p className="text-xs text-slate-400 italic py-2">No broadcast campaigns bulk-applied yet.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* MODAL FORM: BROADCAST RECOMMENDATION CRITERIA */}
                {recommendSchemeData && (
                  <div className="fixed inset-0 bg-[#1f3b2c]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl border border-gray-200/60 shadow-2xl w-full max-w-md overflow-hidden animate-fadeIn">
                      <div className="bg-[#1f3b2c] p-5 text-white flex justify-between items-center">
                        <div>
                          <h3 className="font-black text-sm uppercase tracking-wide">Configure Cohort filters</h3>
                          <p className="text-[10px] text-emerald-200 mt-0.5">Scheme: {recommendSchemeData.name}</p>
                        </div>
                        <button
                          onClick={() => setRecommendSchemeData(null)}
                          className="text-white hover:text-emerald-200 font-extrabold text-sm bg-[#2e5741] px-2.5 py-1 rounded"
                        >
                          &times;
                        </button>
                      </div>

                      <form onSubmit={handleSendRecommendation} className="p-6 space-y-4">
                        <div>
                          <label className="block font-bold text-gray-500 uppercase mb-1">Target Crop Filter</label>
                          <select
                            value={recommendFilterCrop}
                            onChange={(e) => setRecommendFilterCrop(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg p-2.5 bg-white text-slate-800 font-semibold"
                          >
                            <option value="">All Crops (No filter)</option>
                            <option value="Coffee">Coffee</option>
                            <option value="Pepper">Pepper</option>
                            <option value="Arecanut">Arecanut</option>
                            <option value="Cardamom">Cardamom</option>
                            <option value="Ragi">Ragi</option>
                            <option value="Paddy">Paddy</option>
                          </select>
                        </div>

                        <div>
                          <label className="block font-bold text-gray-500 uppercase mb-1">Target State Filter</label>
                          <select
                            value={recommendFilterState}
                            onChange={(e) => setRecommendFilterState(e.target.value)}
                            className="w-full border border-gray-200 rounded-lg p-2.5 bg-white text-slate-800 font-semibold"
                          >
                            <option value="">All States (No filter)</option>
                            <option value="Karnataka">Karnataka</option>
                            <option value="Andhra Pradesh">Andhra Pradesh</option>
                            <option value="Kerala">Kerala</option>
                            <option value="Tamil Nadu">Tamil Nadu</option>
                          </select>
                        </div>

                        <div className="flex gap-3 justify-end pt-3 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setRecommendSchemeData(null)}
                            className="px-4 py-2 border border-gray-200 rounded-xl text-gray-500 font-bold hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSendingRecommendation}
                            className="px-5 py-2 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                          >
                            {isSendingRecommendation ? 'Broadcasting...' : 'Broadcast Recommendation 🚀'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* Draft Agreement Preview Modal */}
      {showPreviewModal && selectedPool && (() => {
        const statusLower = selectedPool.status?.toLowerCase() || '';
        return (
          <div className="fixed inset-0 bg-[#1f3b2c]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-3xl border border-gray-150 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

              {/* Header */}
              <div className="bg-[#1f3b2c] p-6 text-white flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black tracking-wide">
                    {statusLower === 'planning' ? 'DRAFT AGREEMENT PREVIEW' : 'RE-DISPATCH CONTRACT PREVIEW'}
                  </h3>
                  <p className="text-xs text-emerald-200 mt-0.5">
                    {statusLower === 'planning'
                      ? "Please read the terms below to the farmers to ensure agreement before dispatching the smart contract."
                      : "Please verify the updated farmer information before regenerating and re-dispatching the contract."}
                  </p>
                </div>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="text-white hover:text-emerald-200 text-xs font-bold bg-[#2e5741] px-3 py-1.5 rounded-lg transition-all"
                >
                  Close / Edit
                </button>
              </div>

              {/* Document Content */}
              <div className="p-8 overflow-y-auto space-y-6 text-xs text-gray-700 leading-relaxed font-sans max-h-[65vh]">

                {/* Document Header */}
                <div className="text-center space-y-2 pb-6 border-b border-gray-200">
                  <h2 className="text-base font-black text-[#1f3b2c] uppercase tracking-widest">LAND POOL COLLABORATION & INTEGRATION AGREEMENT</h2>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">SHA-256 SECURED CRYPTOGRAPHIC BLOCKCHAIN LEDGER CONTRACT</p>
                  <p className="font-bold text-gray-800">POOL NAME: {selectedPool.name}</p>
                </div>

                {/* SECTION 1: PARTICIPATING PARTIES */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[#1f3b2c] uppercase tracking-wider text-[11px]">1. PARTICIPATING FARMERS & CO-OPERATORS</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-gray-200 rounded-lg">
                      <thead>
                        <tr className="bg-gray-50 text-[10px] uppercase font-bold text-gray-500 border-b border-gray-200">
                          <th className="p-2 border-r border-gray-200">Farmer Name</th>
                          <th className="p-2 border-r border-gray-200">Survey No.</th>
                          <th className="p-2 border-r border-gray-200">Agreed Model</th>
                          <th className="p-2 border-r border-gray-200">Land Contribution</th>
                          <th className="p-2 border-r border-gray-200">Direct Capital Contribution</th>
                          <th className="p-2">Suggested Profit Share</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const totalGuntas = selectedPool.participants.reduce(
                            (acc, p) => acc + toGuntas(participantContributions[p.userId]?.land || p.landContribution || p.landSize || 0),
                            0
                          );
                          const modelFactors: { [key: number]: number } = { 1: 0.1, 2: 0.8, 3: 0.6, 4: 0.9, 5: 0.7 };
                          const weights = selectedPool.participants.map(p => {
                            const land = participantContributions[p.userId]?.land || p.landContribution || p.landSize || 0;
                            const landGuntas = toGuntas(land);
                            const model = participantContributions[p.userId]?.collaborationModel || 1;
                            const landPct = totalGuntas > 0 ? landGuntas / totalGuntas : 0;
                            const factor = modelFactors[model] || 0.5;

                            const resourceVal = getFarmerResourceContributionsVal(p.userId);
                            const resourceWeight = farmPlan.estimatedCost > 0 ? (resourceVal / farmPlan.estimatedCost) * 0.3 : 0;

                            return {
                              userId: p.userId,
                              fullName: p.fullName,
                              surveyNumber: p.surveyNumber,
                              model,
                              land,
                              rawWeight: landPct * factor + resourceWeight
                            };
                          });

                          const sumWeights = weights.reduce((acc, w) => acc + w.rawWeight, 0);
                          const platformPct = sumWeights > 0 ? Math.max(10, Math.min(90, Math.round((1 - sumWeights) * 100))) : 30;
                          const remainingPct = 100 - platformPct;

                          return weights.map((w, index) => {
                            const farmerPct = sumWeights > 0 ? Math.round((w.rawWeight / sumWeights) * remainingPct) : 0;
                            const directContrib = participantContributions[w.userId]?.investment || 0;
                            return (
                              <tr key={index} className="border-b border-gray-150 text-[10px]">
                                <td className="p-2 border-r border-gray-200 font-bold text-gray-800">{w.fullName}</td>
                                <td className="p-2 border-r border-gray-200">{w.surveyNumber}</td>
                                <td className="p-2 border-r border-gray-200">Model {w.model}</td>
                                <td className="p-2 border-r border-gray-200">{w.land} Acres</td>
                                <td className="p-2 border-r border-gray-200">₹{directContrib.toLocaleString()}</td>
                                <td className="p-2 font-bold text-emerald-700">{farmerPct}%</td>
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 2: AGRICULTURAL PLAN */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[#1f3b2c] uppercase tracking-wider text-[11px]">2. CROP & OPERATION PLAN</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-150">
                    <p><strong>Allocated Crop(s):</strong> {farmPlan.selectedCrop || 'Not Specified'}</p>
                    <p><strong>Cultivation Period:</strong> {farmPlan.cultivationPeriod || 'Not Specified'}</p>
                    <p><strong>Combined Pool Area:</strong> {farmPlan.farmArea || '0'} Acres</p>
                    <p><strong>Irrigation Method:</strong> {farmPlan.irrigationMethod || 'Not Specified'}</p>
                  </div>
                </div>

                {/* SECTION 3: RESOURCE ALLOCATIONS */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[#1f3b2c] uppercase tracking-wider text-[11px]">3. RESOURCE PROVISION & DEPLOYMENT</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(['seeds', 'fertilizers', 'equipment', 'labour', 'storage', 'transportation'] as Array<keyof typeof farmPlan>).map((key) => {
                      const rawVal = (farmPlan[key] as string) || '';
                      let display = 'Not planned';
                      if (rawVal.startsWith('{')) {
                        try {
                          const parsed = JSON.parse(rawVal);
                          if (parsed.provider === 'Farmer Provides') {
                            const farmerName = selectedPool.participants.find(p => p.userId === parsed.farmerId)?.fullName || 'Farmer';
                            display = `Farmer Provided: ${farmerName} (Estimated value: ₹${parsed.value}) - ${parsed.details || 'None'}`;
                          } else {
                            display = `${parsed.provider} - ${parsed.details || 'No notes'}`;
                          }
                        } catch (e) {
                          display = rawVal;
                        }
                      } else if (rawVal) {
                        display = rawVal;
                      }
                      return (
                        <div key={key} className="p-3 border border-gray-150 bg-white rounded-xl">
                          <p className="uppercase text-[9px] font-extrabold text-gray-400 tracking-wider mb-1">{key}</p>
                          <p className="font-bold text-gray-800 text-[10px]">{display}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* SECTION 4: FINANCIAL TERMS */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[#1f3b2c] uppercase tracking-wider text-[11px]">4. FINANCIAL ESTIMATES & RATIOS</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-2xl border border-gray-150">
                    <p><strong>Estimated Cultivation Cost:</strong> ₹{(farmPlan.estimatedCost || 0).toLocaleString()}</p>
                    <p><strong>Expected Crop Yield:</strong> {farmPlan.expectedYield || 'N/A'}</p>
                    <p><strong>Expected Gross Revenue:</strong> ₹{(farmPlan.expectedRevenue || 0).toLocaleString()}</p>
                    <p><strong>Agreed Profit Sharing Ratio:</strong> {farmPlan.profitSharingRatio || 'N/A'}</p>
                    <div className="md:col-span-2">
                      <p><strong>Agreed Loss Sharing Ratio:</strong> {farmPlan.lossSharingRatio || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 5: INSURANCE SETUP */}
                <div className="space-y-2">
                  <h4 className="font-extrabold text-[#1f3b2c] uppercase tracking-wider text-[11px]">5. CROP INSURANCE POLICY</h4>
                  <div className="p-4 border border-gray-150 bg-white rounded-2xl space-y-2">
                    <p><strong>Insurance Scheme Type:</strong> {farmPlan.insuranceType ? farmPlan.insuranceType.toUpperCase() : 'NONE'}</p>
                    {farmPlan.insuranceType === 'private' && <p><strong>Selected Provider:</strong> {farmPlan.insuranceProvider}</p>}
                    <p><strong>Coverage Terms:</strong> {farmPlan.coverageDetails}</p>
                    <p><strong>Premium Sharing:</strong> {farmPlan.premiumSharing}</p>
                    <p><strong>Claim Process & Responsibility:</strong> {farmPlan.claimResponsibility}</p>
                  </div>
                </div>

                {/* STAMP */}
                <div className="border-t border-dashed border-gray-300 pt-6 text-center space-y-1">
                  <p className="text-[9px] font-mono text-gray-400">DIGITAL AGREEMENT PRE-REGISTRATION STATUS: PENDING SIGNATURES</p>
                  <p className="text-[10px] text-gray-500 font-bold">I, the Field Counseling Officer, verify that all details have been dictated and aligned with the farmers.</p>
                </div>

              </div>

              {/* Footer Buttons */}
              <div className="bg-gray-50 border-t border-gray-150 p-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(false)}
                  className="px-6 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl text-xs transition-all shadow-sm"
                >
                  ← Back to Edit Form
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setShowPreviewModal(false);
                    await handleGenerateContract();
                  }}
                  className="px-6 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white font-bold rounded-xl text-xs transition-all shadow-md hover:shadow-lg"
                >
                  {statusLower === 'planning' ? 'Confirm & Dispatch Smart Contract' : 'Confirm & Re-Dispatch Smart Contract'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function FcoDashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#fffaf1] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#166534]"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
