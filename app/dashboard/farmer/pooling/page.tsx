'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  Users, Grid, Shield, CheckCircle, XCircle, 
  ArrowRight, Radio, RefreshCw, Compass, Calendar, 
  MapPin, Video, FileText, Check, Cpu, DollarSign, 
  List, BookOpen, BarChart2, Activity, PieChart, HelpCircle, Download, Clock
} from 'lucide-react';
import SmartContractDocument from '@/app/components/SmartContractDocument/SmartContractDocument';
import PoolFinanceBar from '@/components/marketplace/PoolFinanceBar';
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
  signatureHash?: string;
  signedAt?: string;
  signatureMethod?: 'draw' | 'upload';
  signatureImage?: string;
  signatureUrl?: string;
}

interface FarmPool {
  _id: string;
  name: string;
  status: 'awaiting_counselor' | 'counseling_scheduled' | 'planning' | 'signing' | 'blockchain_storage' | 'active';
  participants: Participant[];
  counselorId?: string;
  counselorName?: string;
  rejectionReason?: string;
  rejectedBy?: string;
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
  blockchain?: {
    contractHash?: string;
    transactionHash?: string;
    blockNumber?: number;
    timestamp?: string;
    version?: string;
    sealedAt?: string;
  };
  proposedSchemes?: Array<{
    _id: string;
    schemeId: string;
    schemeName: string;
    proposedBy: string;
    proposerName: string;
    status: 'voting' | 'approved' | 'rejected';
    votes: Array<{
      userId: string;
      vote: 'yes' | 'no';
      votedAt: string;
    }>;
    createdAt: string;
  }>;
}

export default function FarmPoolingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [readyToPool, setReadyToPool] = useState(false);
  const [land, setLand] = useState<any>(null);
  const [activePool, setActivePool] = useState<FarmPool | null>(null);
  const [digitizedPlots, setDigitizedPlots] = useState<any[]>([]);
  const [activePoolWorkspaceTab, setActivePoolWorkspaceTab] = useState<'overview' | 'contributions' | 'finances' | 'governance' | 'disputes' | 'contract'>('overview');

  // Digital Signature input states
  const [signingName, setSigningName] = useState('');
  const [signatureSubmitted, setSignatureSubmitted] = useState(false);
  const [isSigningLoading, setIsSigningLoading] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [sigMethod, setSigMethod] = useState<'draw' | 'upload'>('draw');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [rejectionReasonText, setRejectionReasonText] = useState('');

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#1e293b'; // slate-800
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    let x = 0;
    let y = 0;
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length > 0) {
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      }
    } else {
      x = e.nativeEvent.clientX - rect.left;
      y = e.nativeEvent.clientY - rect.top;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    let x = 0;
    let y = 0;
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      if (e.touches.length > 0) {
        e.preventDefault();
        x = e.touches[0].clientX - rect.left;
        y = e.touches[0].clientY - rect.top;
      }
    } else {
      x = e.nativeEvent.clientX - rect.left;
      y = e.nativeEvent.clientY - rect.top;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Active Dashboard simulation states
  const [tasks, setTasks] = useState([
    { id: 1, name: 'Sowing seeds', status: 'completed', date: 'Aug 5, 2026' },
    { id: 2, name: 'First NPK Fertilizer application', status: 'pending', date: 'Aug 20, 2026' },
    { id: 3, name: 'Weeding cycle 1', status: 'pending', date: 'Sep 10, 2026' },
    { id: 4, name: 'Harvesting', status: 'pending', date: 'Nov 15, 2026' }
  ]);

  const [expenses, setExpenses] = useState([
    { id: 1, category: 'Seeds', amount: 35000, date: 'Aug 3, 2026', paidBy: 'Kempanna Gowda' },
    { id: 2, category: 'Fertilizers', amount: 48000, date: 'Aug 10, 2026', paidBy: 'AgriLink Fund' }
  ]);

  // Model-specific states
  const [laborLogs, setLaborLogs] = useState([
    { id: 1, date: 'Aug 10, 2026', farmerName: 'Kempanna Gowda', hours: 8, task: 'Weeding Section A', status: 'verified' },
    { id: 2, date: 'Aug 12, 2026', farmerName: 'Siddappa Gowda', hours: 6, task: 'Tilling Row 3', status: 'pending' }
  ]);
  const [newLaborHours, setNewLaborHours] = useState('8');
  const [newLaborTask, setNewLaborTask] = useState('');

  const [proposals, setProposals] = useState([
    { id: 1, title: 'Upgrade to premium drip irrigation nozzles', proposedBy: 'FCO Counsel', votesFor: 2, votesAgainst: 0, status: 'passed' },
    { id: 2, title: 'Switch to Bio-Pesticide spray next week', proposedBy: 'Siddappa Gowda', votesFor: 1, votesAgainst: 0, status: 'pending', userVoted: false }
  ]);

  const [yieldEstimates, setYieldEstimates] = useState([
    { id: 1, crop: 'Coffee (Robusta)', quantity: '4.5 Tons', status: 'Ready for market market matching' }
  ]);
  const [newEstimateCrop, setNewEstimateCrop] = useState('');
  const [newEstimateQuantity, setNewEstimateQuantity] = useState('');
  // Governance scheme proposal states
  const [availableSchemes, setAvailableSchemes] = useState<any[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [isProposing, setIsProposing] = useState(false);

  const fetchAvailableSchemes = async () => {
    try {
      const res = await fetch('/api/admin/schemes?limit=50');
      const data = await res.json();
      if (data.success) {
        setAvailableSchemes(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching available schemes:', err);
    }
  };

  const handleProposeScheme = async () => {
    if (!activePool || !selectedSchemeId || !userId) return;
    setIsProposing(true);
    try {
      const res = await fetch('/api/farmer/pooling/propose-scheme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: activePool._id,
          schemeId: selectedSchemeId,
          userId
        })
      });
      const data = await res.json();
      if (data.success) {
        setActivePool(data.data);
        setSelectedSchemeId('');
        alert('Scheme proposed successfully for group voting!');
      } else {
        alert(data.error || 'Failed to propose scheme');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProposing(false);
    }
  };

  const handleVoteScheme = async (proposalId: string, vote: 'yes' | 'no') => {
    if (!activePool || !userId) return;
    try {
      const res = await fetch('/api/farmer/pooling/propose-scheme', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: activePool._id,
          proposalId,
          userId,
          vote
        })
      });
      const data = await res.json();
      if (data.success) {
        setActivePool(data.data);
      } else {
        alert(data.error || 'Failed to record vote');
      }
    } catch (err) {
      console.error(err);
    }
  };


  // Dispute Ticketing States
  const [tickets, setTickets] = useState<any[]>([]);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [ticketCategory, setTicketCategory] = useState<'labour' | 'water' | 'financial' | 'boundary' | 'others'>('others');
  const [ticketTitle, setTicketTitle] = useState('');
  const [ticketDesc, setTicketDesc] = useState('');
  const [ticketVisibility, setTicketVisibility] = useState<'public' | 'private'>('public');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState(false);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get registry status
      const statusRes = await fetch(`/api/farmer/pooling/status?userId=${userId || ''}`);
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setLand(statusData.land);
        setReadyToPool(statusData.readyToPool);
      }

      // Check if user is in an active farm pool
      const poolRes = await fetch(`/api/farmer/pooling/pool?userId=${userId || ''}`);
      if (poolRes.ok) {
        const poolData = await poolRes.json();
        if (poolData.success && poolData.pool) {
          setActivePool(poolData.pool);
          
          // Sync tasks and expenses from db
          if (poolData.pool.tasksList) {
            setTasks(poolData.pool.tasksList);
          }
          if (poolData.pool.expensesList) {
            setExpenses(poolData.pool.expensesList);
          }

          // Check if already signed
          const myParticipant = poolData.pool.participants.find((p: any) => p.userId.toString() === userId?.toString());
          if (myParticipant?.signatureHash) {
            setSignatureSubmitted(true);
          }

          // Fetch active tickets for this pool
          const ticketRes = await fetch(`/api/farmer/pooling/tickets?poolId=${poolData.pool._id}&currentViewerId=${userId || ''}`);
          if (ticketRes.ok) {
            const ticketData = await ticketRes.json();
            if (ticketData.success && ticketData.tickets) {
              setTickets(ticketData.tickets);
            }
          }
        }
      }

      // Fetch digitized plots
      const plotsRes = await fetch('/api/digitizer/plots');
      if (plotsRes.ok) {
        const plotsData = await plotsRes.json();
        if (plotsData.success && plotsData.data) {
          setDigitizedPlots(plotsData.data);
        }
      }

      // Fetch schemes for proposal dropdown
      await fetchAvailableSchemes();
    } catch (err: any) {
      setError(err.message || 'An error occurred while loading data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, [userId]);

  const togglePoolingAvailability = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const newStatus = !readyToPool;

      const res = await fetch(`/api/farmer/pooling/status?userId=${userId || ''}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ready: newStatus, userId })
      });

      if (res.ok) {
        const data = await res.json();
        setReadyToPool(data.readyToPool);
        setSuccess(
          data.readyToPool 
            ? 'Successfully marked your land available for pooling! Discover neighbours now.' 
            : 'Removed your land from pooling availability.'
        );
      }
    } catch (err: any) {
      setError('Failed to toggle availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!activePool || !signingName) return;

    try {
      setIsSigningLoading(true);
      
      let signatureUrl = '';
      let signatureImage = '';

      if (sigMethod === 'draw') {
        const canvas = canvasRef.current;
        if (!canvas) {
          alert('Signature pad not found');
          setIsSigningLoading(false);
          return;
        }
        signatureImage = canvas.toDataURL('image/png');

        // Convert base64 to Blob & upload to Cloudinary
        const blob = await (await fetch(signatureImage)).blob();
        const file = new File([blob], 'signature.png', { type: 'image/png' });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'signatures');

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.success) {
            signatureUrl = uploadData.data.url;
          } else {
            signatureUrl = signatureImage;
          }
        } catch (uErr) {
          signatureUrl = signatureImage;
        }
      } else {
        if (!uploadedFile) {
          alert('Please select a signature file to upload');
          setIsSigningLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', uploadedFile);
        formData.append('folder', 'signatures');

        try {
          const uploadRes = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          });
          const uploadData = await uploadRes.json();
          if (uploadRes.ok && uploadData.success) {
            signatureUrl = uploadData.data.url;
          } else {
            signatureUrl = uploadedPreview || '';
          }
        } catch (uErr) {
          signatureUrl = uploadedPreview || '';
        }
        signatureImage = signatureUrl;
      }

      const mockHash = '0xsig_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const res = await fetch('/api/farmer/pooling/pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: activePool._id,
          userId,
          signatureHash: mockHash,
          signatureImage,
          signatureMethod: sigMethod,
          signatureUrl
        })
      });
      const data = await res.json();
      if (data.success) {
        setSignatureSubmitted(true);
        fetchInitialData();
      } else {
        alert(data.error || 'Failed to sign contract');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigningLoading(false);
    }
  };

  const handleResign = async () => {
    if (!activePool) return;
    try {
      setIsSigningLoading(true);
      const res = await fetch('/api/farmer/pooling/pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: activePool._id,
          userId,
          resign: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setSignatureSubmitted(false);
        setSigningName('');
        fetchInitialData();
      } else {
        alert(data.error || 'Failed to reset signature');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigningLoading(false);
    }
  };

  const handleRejectContract = async () => {
    if (!activePool || !rejectionReasonText) {
      alert('Please enter a reason for requesting changes');
      return;
    }
    try {
      setIsSigningLoading(true);
      const res = await fetch('/api/farmer/pooling/pool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          poolId: activePool._id,
          userId,
          action: 'reject',
          rejectionReason: rejectionReasonText
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowRejectionModal(false);
        setRejectionReasonText('');
        fetchInitialData();
      } else {
        alert(data.error || 'Failed to reject agreement');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSigningLoading(false);
    }
  };

  const handleCreateConflictTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePool || !userId || !ticketTitle || !ticketDesc) {
      alert('Please fill all dispute details.');
      return;
    }

    try {
      setIsSubmittingTicket(true);
      const res = await fetch('/api/farmer/pooling/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          poolId: activePool._id,
          farmerId: userId,
          category: ticketCategory,
          title: ticketTitle,
          description: ticketDesc,
          visibility: ticketVisibility
        })
      });
      const data = await res.json();
      if (data.success) {
        setTicketTitle('');
        setTicketDesc('');
        setTicketCategory('others');
        setTicketVisibility('public');
        setShowTicketModal(false);
        fetchInitialData();
        alert('Dispute query ticket raised successfully. Field Counseling Officer (FCO) has been notified.');
      } else {
        alert(data.error || 'Failed to raise conflict ticket.');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error occurred while raising ticket.');
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  const handleAddLaborLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLaborTask.trim()) return;
    const newLog = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      farmerName: 'You (Farmer)',
      hours: Number(newLaborHours),
      task: newLaborTask,
      status: 'pending'
    };
    setLaborLogs([newLog, ...laborLogs]);
    setNewLaborTask('');
  };

  const handleVoteProposal = (proposalId: number, support: boolean) => {
    setProposals(proposals.map(p => {
      if (p.id === proposalId) {
        return {
          ...p,
          votesFor: support ? p.votesFor + 1 : p.votesFor,
          votesAgainst: !support ? (p.votesAgainst || 0) + 1 : (p.votesAgainst || 0),
          userVoted: true
        };
      }
      return p;
    }));
  };

  const handleAddYieldEstimate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstimateCrop.trim() || !newEstimateQuantity.trim()) return;
    const newEst = {
      id: Date.now(),
      crop: newEstimateCrop,
      quantity: newEstimateQuantity,
      status: 'Ready for market matching'
    };
    setYieldEstimates([newEst, ...yieldEstimates]);
    setNewEstimateCrop('');
    setNewEstimateQuantity('');
  };

  const handleToggleTask = (id: any) => {
    // Read-only for farmers. Handled by FCO.
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    // Read-only for farmers. Handled by FCO.
  };

  // Match parcels from DB or use fallback points
  const matchedPlots = activePool ? activePool.participants.map((p, idx) => {
    const normSurvey = p.surveyNumber?.toLowerCase().replace(/\s+/g, '') || '';
    let match = digitizedPlots.find(plot => {
      if (!normSurvey || normSurvey === 'n/a') return false;
      const plotSurvey = plot.administrative?.survey?.toLowerCase().replace(/\s+/g, '') || '';
      return plotSurvey === normSurvey || plotSurvey.includes(normSurvey) || normSurvey.includes(plotSurvey);
    });

    if (!match && p.fullName) {
      const normName = p.fullName.toLowerCase().replace(/\s+/g, '');
      match = digitizedPlots.find(plot => {
        const plotOwner = plot.owner?.name?.toLowerCase().replace(/\s+/g, '') || '';
        return plotOwner === normName || plotOwner.includes(normName) || normName.includes(plotOwner);
      });
    }

    const getPointsForPlot = (index: number) => {
      if (index === 0) {
        return [[150, 120], [270, 110], [240, 240], [130, 210]];
      } else if (index === 1) {
        return [[270, 110], [380, 130], [350, 250], [240, 240]];
      } else {
        return [[130, 210], [240, 240], [350, 250], [310, 310], [150, 300]];
      }
    };

    return {
      participant: p,
      match: match,
      survey: match?.administrative?.survey || p.surveyNumber,
      points: match?.points || getPointsForPlot(idx),
      gis: match?.gis,
      administrative: match?.administrative,
      owner: match?.owner
    };
  }) : [];

  const village = matchedPlots.find(p => p.administrative?.village)?.administrative?.village || 'Chiksikenchigudde';
  const taluk = matchedPlots.find(p => p.administrative?.taluk)?.administrative?.taluk || 'Thirthahalli';
  const district = matchedPlots.find(p => p.administrative?.district)?.administrative?.district || 'Shivamogga';

  const validCoords = matchedPlots.filter(p => p.gis?.latitude && p.gis?.longitude);
  const avgLat = validCoords.length > 0 
    ? validCoords.reduce((acc, p) => acc + (p.gis?.latitude || 0), 0) / validCoords.length
    : 13.6828;
  const avgLng = validCoords.length > 0 
    ? validCoords.reduce((acc, p) => acc + (p.gis?.longitude || 0), 0) / validCoords.length
    : 75.2104;

  const totalArea = activePool ? activePool.participants.reduce((acc, p) => acc + (p.landContribution || p.landSize || 0), 0) : 0;
  const parsedLands = activePool ? activePool.participants.map(p => {
    const rawVal = p.landContribution || p.landSize || 0;
    const acres = Math.floor(rawVal);
    const guntas = Math.round((rawVal - acres) * 100);
    const decimalAcres = acres + (guntas / 40); // 1 Gunta = 1/40 Acre
    return {
      raw: rawVal,
      acres,
      guntas,
      decimalAcres
    };
  }) : [];

  const totalGuntas = parsedLands.reduce((acc, l) => acc + (l.acres * 40 + l.guntas), 0);
  const totalAcresInt = Math.floor(totalGuntas / 40);
  const totalGuntasRemainder = totalGuntas % 40;
  const correctedTotalDecimalArea = totalGuntas / 40;

  useEffect(() => {
    if (!activePool || matchedPlots.length === 0) return;
    const canvasElement = document.getElementById('dashboardCombinedSketchCanvas') as HTMLCanvasElement;
    if (!canvasElement) return;
    const ctx = canvasElement.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    // Grid Pattern
    ctx.strokeStyle = '#eef3ee';
    ctx.lineWidth = 1;
    const gridSize = 20;
    for (let x = 0; x < canvasElement.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvasElement.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvasElement.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvasElement.width, y);
      ctx.stroke();
    }

    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    matchedPlots.forEach(p => {
      p.points.forEach((pt: any) => {
        if (pt[0] < minX) minX = pt[0];
        if (pt[0] > maxX) maxX = pt[0];
        if (pt[1] < minY) minY = pt[1];
        if (pt[1] > maxY) maxY = pt[1];
      });
    });

    const width = maxX - minX;
    const height = maxY - minY;

    if (width > 0 && height > 0) {
      const padding = 20;
      const drawW = canvasElement.width - padding * 2;
      const drawH = canvasElement.height - padding * 2;
      const sScale = Math.min(drawW / width, drawH / height);

      const sOffsetX = (canvasElement.width - width * sScale) / 2;
      const sOffsetY = (canvasElement.height - height * sScale) / 2;

      const sketchToScreen = (pt: any) => {
        return [
          (pt[0] - minX) * sScale + sOffsetX,
          (pt[1] - minY) * sScale + sOffsetY
        ];
      };

      const getCentroid = (pts: number[][]) => {
        let cx = 0, cy = 0;
        pts.forEach(p => {
          cx += p[0];
          cy += p[1];
        });
        return [cx / pts.length, cy / pts.length];
      };

      matchedPlots.forEach((p, idx) => {
        const pts = p.points;
        if (pts.length < 3) return;

        ctx.beginPath();
        const [x0, y0] = sketchToScreen(pts[0]);
        ctx.moveTo(x0, y0);
        for (let i = 1; i < pts.length; i++) {
          const [x, y] = sketchToScreen(pts[i]);
          ctx.lineTo(x, y);
        }
        ctx.closePath();

        ctx.fillStyle = idx % 2 === 0 ? 'rgba(26, 155, 154, 0.12)' : 'rgba(6, 125, 98, 0.15)';
        ctx.fill();

        ctx.lineWidth = 2;
        ctx.strokeStyle = idx % 2 === 0 ? '#1A9B9A' : '#067D62';
        ctx.stroke();

        const c = getCentroid(pts);
        const [sx, sy] = sketchToScreen(c);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillStyle = '#232F3E';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.lineWidth = 2.5;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeText(`Survey ${p.survey}`, sx, sy);
        ctx.fillText(`Survey ${p.survey}`, sx, sy);
      });
    }
  }, [activePool, matchedPlots]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#166534]"></div>
        <p className="mt-4 text-sm text-[#6b7280]">Loading pooling console...</p>
      </div>
    );
  }

  // Active Farm Pool View
  if (activePool && activePool.status === 'active') {
    return (
      <div className="space-y-6 animate-fadeIn pb-12">
        {/* 1. Executive Top Header Card */}
        <div className="bg-white border border-[#e2d4b7] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Active Farm Pool
                </span>
                <span className="px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded-full text-xs font-semibold">
                  Model {activePool.collaborationModel || 5}: {activePool.collaborationModel === 1 ? 'Land Lease' : activePool.collaborationModel === 2 ? 'Managed Farming' : activePool.collaborationModel === 3 ? 'Partnership Farming' : activePool.collaborationModel === 4 ? 'Marketing Partner' : 'Collaborative Pool'}
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-mono">
                  ID: {activePool._id.slice(-6)}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1f3b2c]">{activePool.name}</h1>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl leading-relaxed">
                Digital cooperative farming agreement immutably monitored and audited on AgriLink.
              </p>
            </div>

            {/* Top Quick Actions */}
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(activePool._id);
                  setSuccess('Agreement ID copied!');
                  setTimeout(() => setSuccess(null), 2000);
                }}
                className="px-3.5 py-2 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              >
                <span>📋 Copy ID</span>
              </button>
              <a
                href={`/verify?poolId=${activePool._id}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 text-xs font-bold bg-[#166534] hover:bg-[#14532d] text-white rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <span>🔍 Verify Contract ↗</span>
              </a>
              <button
                onClick={() => setShowTicketModal(true)}
                className="px-3.5 py-2 text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl transition flex items-center gap-1.5"
              >
                <span>🚩 Raise Query</span>
              </button>
            </div>
          </div>

          {/* 4 Summary Metric Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
            <div className="p-3 bg-[#f8fafc] border border-slate-100 rounded-2xl">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Total Pooled Area</span>
              <span className="text-lg font-black text-[#1f3b2c]">{totalArea} Acres</span>
              <span className="text-[10px] text-[#166534] font-medium block">{village} Village</span>
            </div>
            <div className="p-3 bg-[#f8fafc] border border-slate-100 rounded-2xl">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Active Farmers</span>
              <span className="text-lg font-black text-[#1f3b2c]">{activePool.participants?.length || 0} Members</span>
              <span className="text-[10px] text-emerald-600 font-medium block">100% Signed</span>
            </div>
            <div className="p-3 bg-[#f8fafc] border border-slate-100 rounded-2xl">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Primary Crop</span>
              <span className="text-lg font-black text-[#166534] truncate block">{activePool.farmPlan?.selectedCrop || 'Mixed Seasonal'}</span>
              <span className="text-[10px] text-slate-500 block">Est: {activePool.farmPlan?.expectedYield || 'In Progress'}</span>
            </div>
            <div className="p-3 bg-[#f8fafc] border border-slate-100 rounded-2xl">
              <span className="text-[11px] text-slate-500 uppercase font-semibold block">Assigned FCO</span>
              <span className="text-lg font-black text-[#1f3b2c] truncate block">{activePool.counselorName || 'Field Officer'}</span>
              <span className="text-[10px] text-emerald-600 font-semibold block">✓ Legal Verified</span>
            </div>
          </div>
        </div>

        {/* 2. Clean Tab Navigation Bar */}
        <div className="flex border border-[#e2d4b7] bg-white rounded-2xl p-1.5 shadow-sm overflow-x-auto gap-1">
          <button
            onClick={() => setActivePoolWorkspaceTab('overview')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activePoolWorkspaceTab === 'overview'
                ? 'bg-[#166534] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#166534] hover:bg-emerald-50/50'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>Overview & Tasks</span>
          </button>
          
          <button
            onClick={() => setActivePoolWorkspaceTab('contributions')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activePoolWorkspaceTab === 'contributions'
                ? 'bg-[#166534] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#166534] hover:bg-emerald-50/50'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Daily Contributions (Model {activePool.collaborationModel || 5})</span>
          </button>

          <button
            onClick={() => setActivePoolWorkspaceTab('finances')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activePoolWorkspaceTab === 'finances'
                ? 'bg-[#166534] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#166534] hover:bg-emerald-50/50'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Finances & Settlement</span>
          </button>

          <button
            onClick={() => setActivePoolWorkspaceTab('governance')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activePoolWorkspaceTab === 'governance'
                ? 'bg-[#166534] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#166534] hover:bg-emerald-50/50'
            }`}
          >
            <Shield className="w-4 h-4" />
            <span>Group Schemes & Voting</span>
          </button>

          <button
            onClick={() => setActivePoolWorkspaceTab('disputes')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activePoolWorkspaceTab === 'disputes'
                ? 'bg-[#166534] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#166534] hover:bg-emerald-50/50'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Dispute & Support Desk</span>
          </button>

          <button
            onClick={() => setActivePoolWorkspaceTab('contract')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
              activePoolWorkspaceTab === 'contract'
                ? 'bg-[#166534] text-white shadow-sm'
                : 'text-slate-600 hover:text-[#166534] hover:bg-emerald-50/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Signed Smart Contract</span>
          </button>
        </div>

        {/* 3. TAB 1: OVERVIEW & TASKS */}
        {activePoolWorkspaceTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Area - Tasks, Cultivation Details, Documents */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Cultivation Tasks & Milestones */}
              <div className="bg-white border border-[#e2d4b7] rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-[#1f3b2c] flex items-center gap-2">
                    <List className="w-5 h-5 text-[#166534]" /> Crop Cultivation Milestones & Tasks
                  </h3>
                  <span className="text-xs text-slate-500 font-semibold">
                    {tasks.filter(t => t.status === 'completed').length} of {tasks.length} Completed
                  </span>
                </div>
                
                <div className="space-y-2.5">
                  {tasks.map(task => (
                    <button
                      key={task.id}
                      onClick={() => handleToggleTask(task.id)}
                      className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-slate-100 hover:bg-emerald-50/40 text-left transition-all bg-[#f8fafc]"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          task.status === 'completed' 
                            ? 'bg-[#166534] border-[#166534] text-white' 
                            : 'border-slate-300 bg-white'
                        }`}>
                          {task.status === 'completed' && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <span className={`text-sm font-semibold ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-[#1f3b2c]'}`}>{task.name}</span>
                      </div>
                      <span className="text-xs text-slate-500 font-medium">Target: {task.date}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* FCO Advisories & Shared Documents */}
              <div className="bg-white border border-[#e2d4b7] rounded-3xl p-6 shadow-sm space-y-4">
                <div className="border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-[#1f3b2c] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#166534]" /> Pool Files & Shared Advisories
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Download guidance notes, seed certificates, and advisories shared by your Field Counseling Officer (FCO).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {activePool && (activePool as any).uploadedFiles?.map((file: any) => (
                    <div key={file.id} className="p-3.5 bg-[#f8fafc] border border-slate-100 rounded-2xl flex justify-between items-center">
                      <div className="truncate pr-2">
                        <p className="font-bold text-xs text-[#1f3b2c] truncate" title={file.name}>{file.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">Shared: {file.uploadedAt}</p>
                      </div>
                      <a
                        href={file.url}
                        download={file.name}
                        className="p-2 bg-white hover:bg-emerald-50 text-emerald-800 rounded-xl border border-slate-200 transition-all flex items-center justify-center shrink-0 shadow-xs"
                        title="Download Document"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                  {(!activePool || !((activePool as any).uploadedFiles) || (activePool as any).uploadedFiles.length === 0) && (
                    <p className="col-span-1 sm:col-span-2 text-center text-xs text-slate-400 py-4 italic">No documents shared by counselor yet.</p>
                  )}
                </div>
              </div>

            </div>

            {/* Right Area - Participants & Farm Plan Info */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Member Land Holdings & Allocations */}
              <div className="bg-white border border-[#e2d4b7] rounded-3xl p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-[#1f3b2c] flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#166534]" /> Participating Land Roster
                </h4>
                <div className="space-y-2.5">
                  {matchedPlots.map((p, idx) => (
                    <div key={idx} className="p-3 bg-[#f8fafc] rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-xs text-[#1f3b2c]">{p.participant.fullName}</p>
                        <p className="text-[10px] text-slate-500">Survey No: {p.survey}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-[#166534]">
                          {p.participant.landContribution || p.participant.landSize} Acres
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cultivation Plan Metadata */}
              <div className="bg-white border border-[#e2d4b7] rounded-3xl p-6 shadow-sm space-y-3 text-xs">
                <h4 className="font-bold text-sm text-[#1f3b2c] flex items-center gap-2 border-b border-slate-100 pb-2">
                  <BookOpen className="w-4 h-4 text-[#166534]" /> Farm Plan Parameters
                </h4>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Irrigation Method:</span>
                  <span className="font-semibold text-[#1f3b2c]">{activePool.farmPlan?.irrigationMethod || 'Drip / Furrow'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Cultivation Period:</span>
                  <span className="font-semibold text-[#1f3b2c]">{activePool.farmPlan?.cultivationPeriod || 'July - Nov 2026'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Insurance Coverage:</span>
                  <span className="font-semibold text-[#166534]">{activePool.farmPlan?.insuranceType || 'Government PMFBY'}</span>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 4. TAB 2: MEMBER ONGOING CONTRIBUTIONS */}
        {activePoolWorkspaceTab === 'contributions' && (
          <div className="space-y-6">
            <ContributionHistoryTable
              poolId={activePool._id}
              userId={userId || ''}
              userName={activePool.participants.find((p: any) => p.userId.toString() === userId?.toString())?.fullName || 'Farmer Member'}
              isFco={false}
              onRefreshPool={fetchInitialData}
            />
          </div>
        )}

        {/* 5. TAB 3: FINANCES & HARVEST SETTLEMENT */}
        {activePoolWorkspaceTab === 'finances' && (
          <div className="space-y-6">
            {/* Cooperative Farm Pool Finance Bar */}
            <PoolFinanceBar 
              userId={userId} 
              onOpenPoolOrders={() => router.push(`/dashboard/farmer/marketplace?userId=${userId || ''}`)} 
            />

            {/* Shared Expense Ledger */}
            <div className="bg-white border border-[#e2d4b7] rounded-3xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-bold text-[#1f3b2c] flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-[#166534]" /> Shared Expense Ledger
                </h3>
                <span className="text-xs text-slate-500 font-semibold">{expenses.length} Records</span>
              </div>
              
              <div className="space-y-2.5">
                {expenses.map((exp: any) => (
                  <div key={exp.id} className="flex justify-between items-center p-3.5 rounded-2xl border border-slate-100 bg-[#f8fafc]">
                    <div>
                      <p className="text-sm font-bold text-[#1f3b2c]">{exp.category}</p>
                      <p className="text-[10px] text-slate-500">Paid by: {exp.farmerName || exp.paidBy} on {exp.date}</p>
                      {exp.reason && <p className="text-[10px] text-slate-600 italic mt-0.5">&quot;{exp.reason}&quot;</p>}
                    </div>
                    <p className="text-sm font-bold text-[#166534]">₹{exp.amount.toLocaleString()}</p>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <p className="text-center text-xs text-slate-400 py-6">No operational expenses recorded on this pool yet.</p>
                )}
              </div>
            </div>

            {/* Harvest & Dynamic Profit/Loss Settlement */}
            <PoolSettlementView
              poolId={activePool._id}
              poolName={activePool.name}
              collaborationModel={activePool.collaborationModel || 5}
              isFco={false}
              userId={userId || ''}
              userName={activePool.participants.find((p: any) => p.userId.toString() === userId?.toString())?.fullName || 'Farmer Member'}
              onSettlementCreated={fetchInitialData}
            />
          </div>
        )}

        {/* 6. TAB 4: GROUP SCHEMES & VOTING */}
        {activePoolWorkspaceTab === 'governance' && (
          <div className="space-y-6">
            
            {/* Collaborative Scheme Selection & Voting Consensus */}
            <div className="bg-white border border-[#e2d4b7] rounded-3xl shadow-sm p-6 space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <h3 className="text-base font-bold text-[#1f3b2c] flex items-center gap-2">
                  🗳️ Shared Group Schemes & Proposals
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Propose a government scheme for the pooled land. Unanimous (100% agreement) vote is required to approve the proposal.
                </p>
              </div>

              {/* Propose a scheme dropdown form */}
              <div className="bg-[#f8fafc] p-4 rounded-2xl border border-slate-200 space-y-2">
                <label className="block text-xs font-bold text-slate-600 uppercase">Propose a Scheme for this Pool</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedSchemeId}
                    onChange={(e) => setSelectedSchemeId(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded-xl p-2.5 bg-white text-[#1f3b2c] focus:outline-hidden"
                  >
                    <option value="">-- Choose Government Scheme --</option>
                    {availableSchemes.map((s) => (
                      <option key={s._id} value={s._id}>{s.name} ({s.category})</option>
                    ))}
                  </select>
                  <button
                    onClick={handleProposeScheme}
                    disabled={isProposing || !selectedSchemeId}
                    className="bg-[#166534] hover:bg-[#14532d] text-white text-xs font-bold px-4 py-2.5 rounded-xl disabled:opacity-50 transition-all shrink-0"
                  >
                    {isProposing ? 'Submitting...' : 'Submit Proposal'}
                  </button>
                </div>
              </div>

              {/* Active proposed schemes list */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Group Consensus Tracker</h4>
                {(!activePool.proposedSchemes || activePool.proposedSchemes.length === 0) ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">No schemes have been proposed yet for this shared land pool.</p>
                ) : (
                  <div className="space-y-3">
                    {activePool.proposedSchemes.map((prop: any) => {
                      const yesVotes = prop.votes.filter((v: any) => v.vote === 'yes').length;
                      const totalMembers = activePool.participants.length;
                      const hasUserVoted = prop.votes.some((v: any) => String(v.userId) === userId);
                      const myVote = prop.votes.find((v: any) => String(v.userId) === userId)?.vote;

                      return (
                        <div key={prop._id} className="border border-slate-200 rounded-2xl p-4 space-y-3 bg-[#f8fafc] hover:bg-slate-50 transition-all">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-xs text-[#1f3b2c] leading-snug">{prop.schemeName}</p>
                              <p className="text-[10px] text-slate-500 mt-0.5">Proposed by: {prop.proposerName}</p>
                            </div>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md uppercase ${
                              prop.status === 'approved' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : prop.status === 'rejected'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                            }`}>
                              {prop.status === 'approved' ? '✓ Approved' : prop.status === 'rejected' ? '✗ Rejected' : 'Voting'}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] text-slate-500">
                              <span>Consensus progress: {yesVotes} / {totalMembers} approved</span>
                              <span>{Math.round((yesVotes / totalMembers) * 100)}% Agreement</span>
                            </div>
                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-600 transition-all duration-300"
                                style={{ width: `${(yesVotes / totalMembers) * 100}%` }}
                              />
                            </div>
                          </div>

                          {prop.status === 'voting' && (
                            <div className="flex items-center justify-between pt-1 text-[10px]">
                              {hasUserVoted ? (
                                <span className={`font-bold ${myVote === 'yes' ? 'text-emerald-700' : 'text-rose-700'}`}>
                                  Your Vote: {myVote === 'yes' ? 'Agree 👍' : 'Disagree 👎'}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Voting pending...</span>
                              )}

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleVoteScheme(prop._id, 'yes')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                    myVote === 'yes'
                                      ? 'bg-emerald-700 text-white shadow-xs'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}
                                >
                                  👍 Agree
                                </button>
                                <button
                                  onClick={() => handleVoteScheme(prop._id, 'no')}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                                    myVote === 'no'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200'
                                  }`}
                                >
                                  👎 Disagree
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 7. TAB 5: DISPUTE & SUPPORT QUERY DESK */}
        {activePoolWorkspaceTab === 'disputes' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#e2d4b7] rounded-3xl shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-[#1f3b2c] flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[#166534]" /> Dispute & Support Query Desk
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Submit queries, resource allocation disputes, or complaints to your Field Counseling Officer (FCO) or pooled farmers.
                  </p>
                </div>
                <button
                  onClick={() => setShowTicketModal(true)}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-all shrink-0"
                >
                  🚩 Raise Conflict / Query
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {tickets.map((t: any) => (
                  <div key={t._id} className="p-4 rounded-2xl border border-slate-200 bg-[#f8fafc] space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md uppercase ${
                        t.status === 'resolved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {t.status}
                      </span>
                      <div className="flex gap-2">
                        <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase ${
                          t.visibility === 'private' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {t.visibility === 'private' ? '🔒 Private' : '🌐 Shared'}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono bg-white px-2 py-0.5 rounded-md uppercase border border-slate-200">Category: {t.category}</span>
                      </div>
                    </div>
                    <h4 className="font-extrabold text-sm text-[#1f3b2c]">{t.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed">{t.description}</p>
                    
                    {t.status === 'resolved' && (
                      <div className="mt-2.5 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1">
                        <p className="font-bold text-emerald-900">Resolution:</p>
                        <p className="text-emerald-800 italic">&quot;{t.resolution}&quot;</p>
                        <p className="text-[10px] text-emerald-700 mt-1">Resolved by: {t.resolvedBy} on {new Date(t.resolvedAt).toLocaleDateString('en-IN')}</p>
                      </div>
                    )}
                  </div>
                ))}
                {tickets.length === 0 && (
                  <div className="p-8 text-center bg-[#f8fafc] rounded-2xl border border-dashed border-slate-200">
                    <HelpCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-[#1f3b2c]">No active queries or disputes filed</p>
                    <p className="text-xs text-slate-500 mt-1">If you have any discrepancy regarding field hours, water resources, or land boundaries, click &quot;Raise Conflict / Query&quot; above.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 8. TAB 6: SIGNED SMART CONTRACT */}
        {activePoolWorkspaceTab === 'contract' && (
          <div className="space-y-6">
            <div className="bg-white border border-[#e2d4b7] rounded-3xl shadow-sm overflow-hidden space-y-4 p-6">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-[#1f3b2c] flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#166534]" /> Signed Smart Contract Terms
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Access the cryptographically stamped agreement terms for this active pool.
                  </p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 text-xs font-bold bg-[#f8fafc] hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition flex items-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Print Agreement</span>
                </button>
              </div>
              <SmartContractDocument pool={activePool} />
            </div>
          </div>
        )}

        {/* Dispute Ticket Modal Overlay */}
        {showTicketModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-[#e2d4b7] shadow-2xl space-y-4 animate-scaleUp">
              <div className="border-b border-slate-100 pb-2 flex justify-between items-center">
                <h3 className="font-extrabold text-sm text-[#1f3b2c] flex items-center gap-1.5">
                  🚩 Raise Dispute or Support Ticket
                </h3>
                <button onClick={() => setShowTicketModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">&times;</button>
              </div>

              <form onSubmit={handleCreateConflictTicket} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Dispute Category</label>
                  <select
                    value={ticketCategory}
                    onChange={(e: any) => setTicketCategory(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-[#1f3b2c] font-semibold"
                    required
                  >
                    <option value="others">Others (Custom Category)</option>
                    <option value="labour">Labour Share Dispute</option>
                    <option value="water">Irrigation / Water Resource Conflict</option>
                    <option value="financial">Financial / Expense Sharing Query</option>
                    <option value="boundary">Boundary / parcel allocation Dispute</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Issue Title</label>
                  <input
                    type="text"
                    placeholder="Brief summary of your query"
                    value={ticketTitle}
                    onChange={(e) => setTicketTitle(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-[#1f3b2c] bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Detailed Description</label>
                  <textarea
                    placeholder="Explain the conflict details, affected parties, and proposed expectations..."
                    value={ticketDesc}
                    onChange={(e) => setTicketDesc(e.target.value)}
                    rows={4}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2 text-[#1f3b2c] bg-white"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-600 uppercase mb-1">Query Visibility</label>
                  <select
                    value={ticketVisibility}
                    onChange={(e: any) => setTicketVisibility(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-2.5 py-2 bg-white text-[#1f3b2c] font-semibold"
                    required
                  >
                    <option value="public">🌐 Share with pooled farmers (Public)</option>
                    <option value="private">🔒 Send privately to FCO & Admin only (Private)</option>
                  </select>
                  <p className="text-[10px] text-slate-500 mt-1 leading-normal">
                    Private tickets are hidden from the query feed of other farmers in your pool.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
                >
                  {isSubmittingTicket ? 'Filing Query...' : 'Submit Support Ticket'}
                </button>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  }

  // Contract Review & Signing Step (Step 7 & 8)
  if (activePool && activePool.status === 'signing') {
    return (
      <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
        
        {/* Step Header */}
        <div className="border-b border-[#e5e7eb] pb-5">
          <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
            STEP 8: DIGITAL SIGNATURE PENDING
          </span>
          <h1 className="text-2xl font-black text-[#1f3b2c] mt-2">Review & Sign Digital Agreement</h1>
          <p className="text-sm text-gray-500">Every participating farmer must digitally sign the generated smart contract before registration on the blockchain ledger.</p>
        </div>

        {activePool.rejectionReason && (
          <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-rose-800 space-y-2">
            <h4 className="font-bold flex items-center gap-1.5 text-sm">
              <XCircle className="w-5 h-5 text-rose-600" /> Changes Requested by {activePool.rejectedBy || 'Farmer'}
            </h4>
            <p className="text-xs">{activePool.rejectionReason}</p>
            <p className="text-[10px] text-rose-500 font-semibold uppercase">The agreement was returned to the counselor for modification. Re-review the revised terms below before signing.</p>
          </div>
        )}

        {/* Contract Layout */}
        <div className="bg-white border border-[#e2d4b7] rounded-3xl shadow-sm overflow-hidden">
          <div className="p-1">
            <SmartContractDocument pool={activePool} />
          </div>

          {/* Digital Signature Panel */}
          <div className="bg-[#f8fafc] p-8 border-t border-gray-100 space-y-4">
            {signatureSubmitted ? (
              <div className="flex flex-col items-center justify-center p-6 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-800 text-center space-y-2">
                <CheckCircle className="w-8 h-8 text-emerald-600" />
                <h4 className="font-bold">Your Digital Signature is Submitted!</h4>
                <p className="text-xs text-emerald-600 max-w-sm">We are waiting for the remaining participating farmers to sign the agreement. Once completed, the pool transitions to Active.</p>
                <button
                  onClick={handleResign}
                  disabled={isSigningLoading}
                  className="mt-3 bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50 text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm"
                >
                  {isSigningLoading ? 'Resetting...' : 'Re-sign Contract (Testing)'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <h4 className="font-bold text-[#1f3b2c] text-sm">Digitally Sign the Agreement</h4>
                
                {/* Choose Signature Method */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-gray-400 uppercase">
                    1. Choose Signature Method:
                  </label>
                  <div className="flex gap-4 border-b border-gray-100 pb-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="radio"
                        name="sigMethodDashboard"
                        checked={sigMethod === 'draw'}
                        onChange={() => setSigMethod('draw')}
                        className="accent-emerald-700"
                      />
                      ◉ Draw Signature
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-700">
                      <input
                        type="radio"
                        name="sigMethodDashboard"
                        checked={sigMethod === 'upload'}
                        onChange={() => setSigMethod('upload')}
                        className="accent-emerald-700"
                      />
                      ◯ Upload Signature
                    </label>
                  </div>
                </div>

                {sigMethod === 'draw' ? (
                  <div className="space-y-2 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Draw your signature on the pad below:
                    </label>
                    <div className="relative w-full max-w-[500px]">
                      <canvas
                        ref={canvasRef}
                        width={500}
                        height={150}
                        className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-crosshair touch-none shadow-inner w-full"
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                      />
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="absolute right-2 bottom-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
                      >
                        Clear Pad
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 italic">
                      Draw using mouse pointer, laptop trackpad, or touch screen.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 animate-fadeIn">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase">
                      Upload your signature image (JPG/PNG):
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadedFile(file);
                          setUploadedPreview(URL.createObjectURL(file));
                        }
                      }}
                      className="w-full max-w-[500px] text-xs border border-slate-200 p-2 rounded-xl bg-white focus:outline-none"
                    />
                    {uploadedPreview && (
                      <div className="mt-2 space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Uploaded Signature Preview:</p>
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 w-fit">
                          <img
                            src={uploadedPreview}
                            alt="Uploaded Signature Preview"
                            className="h-16 object-contain"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-4 items-end">
                  <div className="flex-grow w-full">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1">
                      2. Enter your full legal name to sign
                    </label>
                    <input 
                      type="text"
                      placeholder="e.g. Kempanna Gowda"
                      value={signingName}
                      onChange={(e) => setSigningName(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm bg-white"
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-center">
                    <button
                      onClick={handleSignContract}
                      disabled={!signingName || isSigningLoading}
                      className="px-6 py-2.5 bg-[#166534] hover:bg-[#14532d] text-white text-sm font-bold rounded-xl shadow-md hover:shadow-lg disabled:opacity-50 transition-all w-full sm:w-auto text-center"
                    >
                      {isSigningLoading ? 'Signing...' : 'Accept & Sign'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectionModal(true)}
                      disabled={isSigningLoading}
                      className="px-6 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-sm font-bold rounded-xl transition-all w-full sm:w-auto text-center"
                    >
                      Reject & Request Changes
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rejection/Modification Modal */}
        {showRejectionModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-xl space-y-4">
              <div>
                <h3 className="font-extrabold text-[#1f3b2c] text-base">Request Agreement Changes</h3>
                <p className="text-xs text-gray-500 mt-1">Specify what revisions are needed. This agreement will be returned to the FCO (Farm Counseling Officer) for modification.</p>
              </div>
              <textarea
                value={rejectionReasonText}
                onChange={(e) => setRejectionReasonText(e.target.value)}
                placeholder="e.g. Please increase the machinery contribution weight or adjust the profit share split to 40%..."
                className="w-full h-32 border border-gray-200 rounded-2xl p-3 text-xs bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setShowRejectionModal(false);
                    setRejectionReasonText('');
                  }}
                  className="px-4 py-2 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRejectContract}
                  disabled={!rejectionReasonText || isSigningLoading}
                  className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all disabled:opacity-50"
                >
                  {isSigningLoading ? 'Submitting...' : 'Reject & Revert'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Counseling step (Step 4)
  if (activePool && (activePool.status === 'awaiting_counselor' || activePool.status === 'counseling_scheduled' || activePool.status === 'planning')) {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
        <div className="pb-5 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-[#1f3b2c]">Land Pooling & Counseling Status</h1>
          <p className="text-sm text-gray-500 mt-1">Review meeting details, operational planning progress, and next steps.</p>
        </div>

        <div className="bg-white border border-[#e2d4b7] rounded-3xl p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
              STAGE: {activePool.status.toUpperCase().replace('_', ' ')}
            </span>
            <span className="text-xs text-gray-400">Pool ID: {activePool._id}</span>
          </div>

          <div className="space-y-4">
            <h3 className="font-bold text-[#1f3b2c] text-base">Counselor Information</h3>
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#166534]/10 flex items-center justify-center text-[#166534] font-bold">
                {activePool.counselorName?.charAt(0) || 'C'}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-800">{activePool.counselorName || 'Awaiting Counselor Assignment'}</p>
                <p className="text-xs text-gray-400">Assigned AgriLink Officer</p>
              </div>
            </div>
          </div>

          {!activePool.counselorId ? (
            <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-200 text-amber-900 text-center font-bold text-sm">
              AgriLink will shortly connect you with a Counselor/FCO
            </div>
          ) : activePool.meetingDetails && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <h3 className="font-bold text-[#1f3b2c] text-base">Briefing Meeting details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-gray-100 flex items-center gap-3 text-sm">
                  <Calendar className="text-amber-600" />
                  <div>
                    <p className="font-bold text-gray-700">Scheduled Date</p>
                    <p className="text-xs text-gray-500">{new Date(activePool.meetingDetails.scheduledAt).toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="p-4 rounded-xl border border-gray-100 flex items-center gap-3 text-sm">
                  {activePool.meetingDetails.meetingType === 'online' ? (
                    <>
                      <Video className="text-amber-600" />
                      <div>
                        <p className="font-bold text-gray-700">Google Meet Link</p>
                        <a href={activePool.meetingDetails.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-[#166534] underline">{activePool.meetingDetails.meetingLink}</a>
                      </div>
                    </>
                  ) : (
                    <>
                      <MapPin className="text-amber-600" />
                      <div>
                        <p className="font-bold text-gray-700">Physical Location</p>
                        <p className="text-xs text-gray-500">{activePool.meetingDetails.location}</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {activePool.status === 'planning' && (
            <div className="p-4 bg-blue-50 border border-blue-100 text-blue-900 rounded-2xl flex gap-3 text-sm">
              <FileText className="w-5 h-5 flex-shrink-0" />
              <div>
                <h4 className="font-bold">Operational Plan Formulation in Progress</h4>
                <p className="text-xs mt-1">Your assigned FCO counselor is recording the farm operational details, collaboration model preferences, and financial ledgers. Once submitted, the contract will be ready for your review and digital signing.</p>
              </div>
            </div>
          )}

        </div>
      </div>
    );
  }

  // Registry / Availablity Step (Step 1-3)
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#e5e7eb] pb-6">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <div className="w-8 h-8 rounded-lg bg-[#166534]/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-[#166534]" />
            </div>
            <h1 className="text-2xl font-bold text-[#1f3b2c] tracking-tight">Digital Farm Pooling</h1>
          </div>
          <p className="text-sm text-[#6b7280]">
            Mark your land available, discover neighboring farms, and initiate the collaborative farming invitation process.
          </p>
        </div>
        <button
          onClick={fetchInitialData}
          className="inline-flex items-center gap-2 self-start rounded-lg border border-[#e2d4b7] bg-white px-4 py-2 text-xs font-semibold text-[#1f3b2c] shadow-sm hover:bg-[#f7f0de] transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Console
        </button>
      </div>

      {/* Alert Notices */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex gap-3 text-rose-800 shadow-sm">
          <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm">Action Required</h4>
            <p className="text-xs mt-1 leading-relaxed">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex gap-3 text-emerald-800 shadow-sm animate-slideDown">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-medium leading-relaxed">{success}</p>
        </div>
      )}

      {land && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Controls Panel */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white border border-[#e2d4b7] rounded-2xl shadow-sm p-6 space-y-6">
              <div>
                <h3 className="text-lg font-bold text-[#1f3b2c] flex items-center gap-2">
                  <Grid className="w-5 h-5 text-[#166534]" /> Step 1: Farm Registry Information
                </h3>
                <p className="text-xs text-[#6b7280] mt-1">
                  Details fetched from your verified Land Record RTC entry.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] rounded-xl p-5 border border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Survey Number</span>
                  <p className="text-sm font-bold text-[#1f3b2c]">{land.surveyNumber}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Cultivable Land Area</span>
                  <p className="text-sm font-bold text-[#1f3b2c]">{land.area}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Location / Village</span>
                  <p className="text-sm font-bold text-[#1f3b2c]">{land.location}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">GIS Center Coordinates</span>
                  <p className="text-sm font-bold text-[#1f3b2c]">
                    {land.centroidLatitude?.toFixed(6)}, {land.centroidLongitude?.toFixed(6)}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#e5e7eb] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-3.5 h-3.5 rounded-full flex-shrink-0 ${readyToPool ? 'bg-emerald-500 animate-ping' : 'bg-gray-400'}`} />
                  <div>
                    <span className="text-xs font-bold text-[#1f3b2c] block">
                      Pooling Status: {readyToPool ? 'Marked Available' : 'Hidden / Offline'}
                    </span>
                    <span className="text-[11px] text-[#6b7280] block">
                      {readyToPool 
                        ? 'Neighboring farmers can now discover your land and send invites.' 
                        : 'Your land is private and hidden from neighbouring searches.'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={togglePoolingAvailability}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-md transition-all active:scale-[0.98] ${
                    readyToPool 
                      ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                      : 'bg-[#166534] hover:bg-[#14532d] text-white'
                  }`}
                >
                  {readyToPool ? 'Revoke Availability' : 'Mark My Land Available for Pooling'}
                </button>
              </div>
            </div>

            {readyToPool && (
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => router.push(`/dashboard/farmer/pooling/discover?userId=${userId || ''}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#166534] px-6 py-4 text-sm font-bold text-white shadow-md hover:bg-[#14532d] transition-all"
                >
                  <Compass className="w-5 h-5" /> Step 2: Discover Neighbouring Farmers <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => router.push(`/dashboard/farmer/pooling/invitations?userId=${userId || ''}`)}
                  className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl border border-[#e2d4b7] bg-white px-6 py-4 text-sm font-bold text-[#1f3b2c] shadow-sm hover:bg-[#f7f0de] transition-all"
                >
                  <Users className="w-5 h-5" /> Step 3: View Received Invitations <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Right Sidebar Info Panel */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-[#166534] to-[#15803d] text-white rounded-3xl p-6 shadow-lg space-y-4">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-[#fef3c7]" /> Collaborative Agriculture
              </h3>
              <p className="text-xs text-emerald-100 leading-relaxed">
                By pooling neighboring lands, farmers pool scale to leverage cheaper pricing, shared tractors, seed drills, water channels, and collective bargaining with distributors.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
