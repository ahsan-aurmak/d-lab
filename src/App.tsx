import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Banknote,
  Boxes,
  Brain,
  Building2,
  CheckCircle2,
  ClipboardList,
  Droplets,
  Home,
  IdCard,
  Menu,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Stethoscope,
  Truck,
  UserCircle2,
  Users
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Drawer } from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import {
  BillingLedgerItem,
  BiomarkerResult,
  EquipmentConnector,
  InventoryItem,
  LabLocation,
  LabQueueItem,
  Patient,
  ReportStatus,
  vitaliaData,
  vitaliaSeedJson
} from '@/data/mockData'

type Persona = 'admin' | 'pathologist' | 'patient' | 'doctor'
type AdminPage = 'Dashboard' | 'Patients' | 'Inventory' | 'Billing' | 'Connectors' | 'Dispatch'
type QueueFilter = 'All' | 'Critical' | 'Draft'
type PatientPage = 'home' | 'vault' | 'wellness' | 'profile'
type ToastState = { message: string; tone: 'success' | 'warning' } | null
type SystemConnection = {
  id: string
  name: string
  purpose: string
  status: 'Connected' | 'Disconnected' | 'Error'
  syncEnabled: boolean
  lastSync: string
}

type BillingJourneyEvent = {
  id: string
  step: string
  detail: string
  at: string
}

type SelectedBiomarker = {
  marker: string
  unit: string
  normalMin: number
  normalMax: number
  history: Array<{ date: string; value: number }>
}

const PERSONA_ORDER: Persona[] = ['admin', 'pathologist', 'patient', 'doctor']
const PERSONA_LABEL: Record<Persona, string> = {
  admin: 'Lab Admin',
  pathologist: 'Pathologist',
  patient: 'Patient App',
  doctor: 'Doctor Portal'
}

const PHQ_QUESTIONS = [
  'Little interest or pleasure in doing things',
  'Feeling down or hopeless',
  'Trouble sleeping or oversleeping',
  'Feeling tired or low energy',
  'Poor appetite or overeating',
  'Feeling bad about yourself',
  'Trouble concentrating',
  'Moving/speaking slowly or being fidgety',
  'Thoughts of self-harm'
]

const USD_SYMBOL = '$'
const BASE_URL = import.meta.env.BASE_URL || '/'

function assetPath(path: string) {
  return `${BASE_URL}${path.replace(/^\/+/, '')}`
}

const TEST_CATALOG: Array<{ name: string; priceUsd: number }> = [
  { name: 'Hematology Panel', priceUsd: 120 },
  { name: 'Lipid Profile', priceUsd: 95 },
  { name: 'Thyroid Panel', priceUsd: 210 },
  { name: 'Vitamin D Panel', priceUsd: 85 },
  { name: 'MRI Lumbar Spine', priceUsd: 440 }
]
const DASHBOARD_PIE_COLORS = ['#0066FF', '#10B981', '#F59E0B', '#64748B']

const POS_SYNC_TEMPLATES: InventoryItem[] = [
  {
    id: 'POS-TMP-1',
    name: 'Glucose Test Strip Kit',
    category: 'Test Kit',
    stockOnHand: 18,
    reorderAt: 40,
    unit: 'kits',
    sourceType: 'POS Sync',
    sourceRef: 'POS-PO-1082',
    complianceStatus: 'Not Applicable',
    lastTestedOn: null,
    operationalStatus: 'Not Applicable'
  },
  {
    id: 'POS-TMP-2',
    name: 'Ferritin Reagent Pack',
    category: 'Medication',
    stockOnHand: 26,
    reorderAt: 35,
    unit: 'packs',
    sourceType: 'POS Sync',
    sourceRef: 'POS-PO-1091',
    complianceStatus: 'Not Applicable',
    lastTestedOn: null,
    operationalStatus: 'Not Applicable'
  },
  {
    id: 'POS-TMP-3',
    name: 'Backup Hematology Analyzer',
    category: 'Equipment',
    stockOnHand: 1,
    reorderAt: 1,
    unit: 'machine',
    sourceType: 'POS Sync',
    sourceRef: 'POS-PO-1098',
    complianceStatus: 'Due Soon',
    lastTestedOn: '2025-11-20',
    operationalStatus: 'Operational'
  }
]

function rangePreset(markerName: string) {
  const marker = markerName.toLowerCase()
  if (marker === 'ldl') return { min: 0, max: 130, unit: 'mg/dL' }
  if (marker === 'hdl') return { min: 40, max: 60, unit: 'mg/dL' }
  if (marker === 'triglycerides') return { min: 0, max: 150, unit: 'mg/dL' }
  if (marker === 'tsh') return { min: 0.4, max: 4, unit: 'mIU/L' }
  if (marker === 'vitamin d') return { min: 30, max: 100, unit: 'ng/mL' }
  if (marker === 'ferritin') return { min: 20, max: 250, unit: 'ng/mL' }
  return { min: 0, max: 100, unit: 'units' }
}

function isCriticalValue(markerName: string, value: number) {
  const range = rangePreset(markerName)
  if (markerName.toLowerCase() === 'ldl' && value >= 160) return true
  if (markerName.toLowerCase() === 'tsh' && value > 5) return true
  return value > range.max || value < range.min
}

function isQueueCritical(item: LabQueueItem) {
  if (item.status === 'Flagged') return true
  return Object.entries(item.values).some(([marker, value]) => isCriticalValue(marker, value))
}

function latestTsh(patient: Patient) {
  const entries = patient.reports
    .flatMap((report) => report.biomarkers)
    .filter((marker) => marker.name.toLowerCase() === 'tsh')
    .flatMap((marker) => marker.history)
    .sort((a, b) => a.date.localeCompare(b.date))
  return entries[entries.length - 1]?.value ?? 2.5
}

function makeAiSummary(values: Record<string, number>) {
  const lines = Object.entries(values).map(([marker, value]) => {
    const critical = isCriticalValue(marker, value)
    if (critical) return `Elevated ${marker} (${value}) indicates potential risk.`
    return `${marker} (${value}) is within or near expected range.`
  })
  return lines.join(' ')
}

function toBiomarkerSelection(marker: BiomarkerResult): SelectedBiomarker {
  return {
    marker: marker.name,
    unit: marker.unit,
    normalMin: marker.normalMin,
    normalMax: marker.normalMax,
    history: marker.history
  }
}

function transportForInterface(standard: EquipmentConnector['interfaceStandard']): EquipmentConnector['transport'] {
  if (standard === 'ASTM LIS2 Serial') return 'Serial RS-232'
  if (standard === 'REST/FHIR API') return 'HTTPS'
  return 'TCP/IP'
}

function defaultAuthForInterface(standard: EquipmentConnector['interfaceStandard']): EquipmentConnector['authMode'] {
  if (standard === 'ASTM LIS2 Serial') return 'None'
  if (standard === 'REST/FHIR API') return 'Token'
  return 'mTLS'
}

function defaultEndpointForInterface(standard: EquipmentConnector['interfaceStandard']) {
  if (standard === 'ASTM LIS2 Serial') return '/dev/ttyS1 -> LIS Gateway'
  if (standard === 'REST/FHIR API') return 'https://vendor.example/fhir'
  if (standard === 'DICOM') return 'dicom://10.22.5.18:104'
  return 'tcp://10.12.1.44:2575'
}

function timestampUtc() {
  return `${new Date().toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

export default function App() {
  const [persona, setPersona] = useState<Persona>('admin')

  const [adminPage, setAdminPage] = useState<AdminPage>('Dashboard')
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('All')
  const [patientPage, setPatientPage] = useState<PatientPage>('home')

  const [patients, setPatients] = useState<Patient[]>(vitaliaData.patients)
  const [labQueue, setLabQueue] = useState<LabQueueItem[]>(vitaliaData.labQueue)
  const [selectedPatientId, setSelectedPatientId] = useState(vitaliaData.patients[0]?.id ?? '')

  const primaryColor = vitaliaData.tenantConfig.primaryColor
  const logoUrl = vitaliaData.tenantConfig.logoUrl

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedQueueItem, setSelectedQueueItem] = useState<LabQueueItem | null>(null)
  const [editedValues, setEditedValues] = useState<Record<string, number>>({})
  const [aiSummary, setAiSummary] = useState('')

  const [sliceIndex, setSliceIndex] = useState(0)
  const [zoomEnabled, setZoomEnabled] = useState(true)
  const [contrastEnabled, setContrastEnabled] = useState(true)
  const [panEnabled, setPanEnabled] = useState(false)
  const [zoomLevel, setZoomLevel] = useState(1.2)
  const [contrastLevel, setContrastLevel] = useState(110)

  const [wellnessUnlocked, setWellnessUnlocked] = useState(false)
  const [showBiometricGate, setShowBiometricGate] = useState(false)
  const [phqAnswers, setPhqAnswers] = useState<number[]>(Array(9).fill(0))
  const [moodSlider, setMoodSlider] = useState(6)

  const [selectedBiomarker, setSelectedBiomarker] = useState<SelectedBiomarker | null>(null)

  const [toast, setToast] = useState<ToastState>(null)
  const [courierProgress, setCourierProgress] = useState(0)
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(vitaliaData.labData.inventory)
  const [inventoryTab, setInventoryTab] = useState<InventoryItem['category']>('Medication')
  const [inventoryFeed, setInventoryFeed] = useState<Array<{ id: string; source: string; detail: string; at: string }>>([
    { id: 'INV-FEED-1', source: 'POS Sync', detail: 'Initial stock sync from reception POS', at: '2026-03-04 09:05 UTC' },
    { id: 'INV-FEED-2', source: 'Purchase Order Sync', detail: 'Equipment intake posted from ERP', at: '2026-03-04 08:40 UTC' }
  ])
  const [posSyncRuns, setPosSyncRuns] = useState(0)
  const [newInventoryItem, setNewInventoryItem] = useState<{
    name: string
    category: InventoryItem['category']
    stockOnHand: number
    reorderAt: number
    unit: string
    sourceType: InventoryItem['sourceType']
    sourceRef: string
    complianceStatus: InventoryItem['complianceStatus']
    lastTestedOn: string
    operationalStatus: InventoryItem['operationalStatus']
  }>({
    name: '',
    category: 'Medication',
    stockOnHand: 0,
    reorderAt: 0,
    unit: 'units',
    sourceType: 'Manual Entry',
    sourceRef: '',
    complianceStatus: 'Not Applicable',
    lastTestedOn: '',
    operationalStatus: 'Not Applicable'
  })
  const [billingLedger, setBillingLedger] = useState<BillingLedgerItem[]>(vitaliaData.labData.billingLedger)
  const [billingTab, setBillingTab] = useState<'Generator' | 'Ledger'>('Generator')
  const [billingJourney, setBillingJourney] = useState<BillingJourneyEvent[]>([
    { id: 'BILL-EVT-1', step: 'Claim Submitted', detail: 'INV-1002 submitted to payer after test completion.', at: '2026-03-04 09:12 UTC' },
    { id: 'BILL-EVT-2', step: 'Upfront Payment', detail: 'INV-1004 collected at front desk.', at: '2026-03-04 08:55 UTC' }
  ])
  const [newInvoice, setNewInvoice] = useState<{
    patientId: string
    test: string
    payerType: BillingLedgerItem['payerType']
    totalUsd: number
    collectedUpfrontUsd: number
  }>({
    patientId: vitaliaData.patients[0]?.id ?? '',
    test: TEST_CATALOG[0].name,
    payerType: 'Self-Pay',
    totalUsd: TEST_CATALOG[0].priceUsd,
    collectedUpfrontUsd: TEST_CATALOG[0].priceUsd
  })
  const [systemConnections, setSystemConnections] = useState<SystemConnection[]>([
    {
      id: 'SYS-POS',
      name: 'Reception POS',
      purpose: 'Patient billing + inventory purchase intake',
      status: 'Connected',
      syncEnabled: true,
      lastSync: '2026-03-04 10:15 UTC'
    },
    {
      id: 'SYS-CLAIMS',
      name: 'Insurance Clearinghouse',
      purpose: 'Post-test insurance claim submissions',
      status: 'Connected',
      syncEnabled: true,
      lastSync: '2026-03-04 10:10 UTC'
    },
    {
      id: 'SYS-DISPATCH',
      name: 'Dispatch Platform API',
      purpose: 'Incoming sample shipment events',
      status: 'Connected',
      syncEnabled: true,
      lastSync: '2026-03-04 10:09 UTC'
    }
  ])
  const [connectors, setConnectors] = useState<EquipmentConnector[]>(vitaliaData.labData.connectors)
  const [dispatchPatientFilter, setDispatchPatientFilter] = useState<'all' | string>('all')
  const [newConnector, setNewConnector] = useState<{
    name: string
    vendor: string
    dataType: EquipmentConnector['dataType']
    interfaceStandard: EquipmentConnector['interfaceStandard']
    endpoint: string
    authMode: EquipmentConnector['authMode']
  }>({
    name: '',
    vendor: '',
    dataType: 'Chemistry',
    interfaceStandard: 'HL7 v2.5.1 (LAW)',
    endpoint: defaultEndpointForInterface('HL7 v2.5.1 (LAW)'),
    authMode: defaultAuthForInterface('HL7 v2.5.1 (LAW)')
  })
  const [newPatient, setNewPatient] = useState<{
    name: string
    age: number
    address: string
    labLocation: LabLocation
  }>({
    name: '',
    age: 30,
    address: '',
    labLocation: 'Pakistan'
  })

  useEffect(() => {
    document.documentElement.style.setProperty('--primary-color', primaryColor)
  }, [primaryColor])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCourierProgress((current) => (current >= 100 ? 0 : current + 2))
    }, 900)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(null), 2400)
    return () => window.clearTimeout(timer)
  }, [toast])

  const selectedPatient = useMemo(
    () => patients.find((patient) => patient.id === selectedPatientId) ?? patients[0],
    [patients, selectedPatientId]
  )

  const scanStack = selectedPatient?.scanStudy.images ?? []

  useEffect(() => {
    if (!selectedPatient) return
    setSliceIndex(0)
    setWellnessUnlocked(false)

    const defaultMarker = selectedPatient.reports
      .filter((report) => report.status === 'Published')
      .flatMap((report) => report.biomarkers)
      .find((marker) => marker.name.toLowerCase() === 'vitamin d')

    setSelectedBiomarker(defaultMarker ? toBiomarkerSelection(defaultMarker) : null)
  }, [selectedPatient?.id])

  useEffect(() => {
    setSliceIndex((index) => Math.min(index, Math.max(0, scanStack.length - 1)))
  }, [scanStack.length])

  const payerMix = useMemo(() => {
    return billingLedger.reduce(
      (acc, row) => ({
        selfPayCount: acc.selfPayCount + (row.payerType === 'Self-Pay' ? 1 : 0),
        insuredCount: acc.insuredCount + (row.payerType === 'Insurance' ? 1 : 0)
      }),
      { selfPayCount: 0, insuredCount: 0 }
    )
  }, [billingLedger])

  const revenueSnapshot = useMemo(() => {
    let dailySales = 0
    let pendingClaims = 0
    let outstandingInvoices = 0

    billingLedger.forEach((row) => {
      dailySales += row.collectedUpfrontUsd
      if (row.payerType === 'Insurance') {
        outstandingInvoices += row.outstandingUsd
        if (row.claimStatus === 'Submitted' || row.claimStatus === 'In Review') pendingClaims += row.outstandingUsd
        if (row.claimStatus === 'Paid') dailySales += Math.max(0, row.totalUsd - row.collectedUpfrontUsd)
      }
    })

    return { dailySales, pendingClaims, outstandingInvoices }
  }, [billingLedger])

  const inventoryItemsByTab = useMemo(
    () => inventoryItems.filter((item) => item.category === inventoryTab),
    [inventoryItems, inventoryTab]
  )

  const pendingDrafts = labQueue.filter((item) => item.status === 'Draft').length
  const flaggedQueueCount = labQueue.filter((item) => item.status === 'Flagged').length
  const publishedQueueCount = labQueue.filter((item) => item.status === 'Published').length
  const criticalQueueCount = labQueue.filter((item) => isQueueCritical(item)).length
  const activePhlebotomists = vitaliaData.labData.phlebotomists.filter((entry) => entry.status !== 'At Lab').length

  const queueStatusData = useMemo(
    () => [
      { name: 'Draft', count: pendingDrafts },
      { name: 'Flagged', count: flaggedQueueCount },
      { name: 'Published', count: publishedQueueCount }
    ],
    [pendingDrafts, flaggedQueueCount, publishedQueueCount]
  )

  const payerMixChartData = useMemo(
    () => [
      { name: 'Self-Pay', value: payerMix.selfPayCount },
      { name: 'Insurance', value: payerMix.insuredCount }
    ],
    [payerMix]
  )

  const claimsStageData = useMemo(
    () => [
      { stage: 'Submitted', count: billingLedger.filter((row) => row.claimStatus === 'Submitted').length },
      { stage: 'In Review', count: billingLedger.filter((row) => row.claimStatus === 'In Review').length },
      { stage: 'Paid', count: billingLedger.filter((row) => row.claimStatus === 'Paid').length }
    ],
    [billingLedger]
  )

  const inventoryRiskData = useMemo(
    () =>
      (['Medication', 'Test Kit', 'Equipment'] as const).map((category) => {
        const items = inventoryItems.filter((item) => item.category === category)
        const lowStock = items.filter((item) => item.stockOnHand <= item.reorderAt).length
        return {
          category,
          lowStock,
          healthy: Math.max(0, items.length - lowStock),
          total: items.length
        }
      }),
    [inventoryItems]
  )

  const weeklyOpsData = useMemo(() => {
    const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
    const revenueBase = Math.max(1, revenueSnapshot.dailySales)
    const claimsBase = Math.max(1, revenueSnapshot.pendingClaims)
    const factors = [0.72, 0.83, 0.78, 0.91, 1.02, 0.94, 1]

    return labels.map((day, index) => ({
      day,
      revenue: Math.round(revenueBase * factors[index]),
      claims: Math.round(claimsBase * (0.55 + index * 0.08))
    }))
  }, [revenueSnapshot.dailySales, revenueSnapshot.pendingClaims])

  const connectionHealthData = useMemo(() => {
    const combinedStatuses = [
      ...systemConnections.map((connection) => connection.status),
      ...connectors.map((connector) => connector.status)
    ]
    const connected = combinedStatuses.filter((status) => status === 'Connected').length
    const disconnected = combinedStatuses.filter((status) => status === 'Disconnected').length
    const error = combinedStatuses.filter((status) => status === 'Error').length
    const total = Math.max(1, combinedStatuses.length)

    return {
      connected,
      disconnected,
      error,
      total,
      uptimePct: Math.round((connected / total) * 100)
    }
  }, [systemConnections, connectors])

  const filteredQueue = useMemo(() => {
    return labQueue.filter((item) => {
      if (queueFilter === 'All') return true
      if (queueFilter === 'Draft') return item.status === 'Draft'
      return isQueueCritical(item)
    })
  }, [labQueue, queueFilter])

  const groupedPublishedReports = useMemo(() => {
    if (!selectedPatient) return [] as Array<{ date: string; reports: Patient['reports'] }>

    const grouped = selectedPatient.reports
      .filter((report) => report.status === 'Published')
      .reduce<Record<string, Patient['reports']>>((acc, report) => {
        if (!acc[report.date]) acc[report.date] = []
        acc[report.date].push(report)
        return acc
      }, {})

    return Object.entries(grouped)
      .map(([date, reports]) => ({ date, reports }))
      .sort((a, b) => b.date.localeCompare(a.date))
  }, [selectedPatient])

  const vitaminSeries = useMemo(() => {
    if (!selectedPatient) return [] as Array<{ date: string; value: number }>

    return selectedPatient.reports
      .flatMap((report) => report.biomarkers)
      .filter((marker) => marker.name.toLowerCase() === 'vitamin d')
      .flatMap((marker) => marker.history)
      .sort((a, b) => a.date.localeCompare(b.date))
  }, [selectedPatient])

  const moodVsVitaminData = useMemo(() => {
    if (!selectedPatient) return [] as Array<{ date: string; mood: number; vitaminD: number }>
    const fallbackVitamin = vitaminSeries[vitaminSeries.length - 1]?.value ?? 24

    return selectedPatient.moodBiology.map((point, index) => ({
      date: point.date,
      mood: point.mood,
      vitaminD: vitaminSeries[index]?.value ?? fallbackVitamin
    }))
  }, [selectedPatient, vitaminSeries])

  const multiMarkerTrendData = useMemo(() => {
    if (!selectedPatient) return [] as Array<{ date: string; vitaminD: number | null; tsh: number | null }>

    const vitaminMap = new Map(vitaminSeries.map((point) => [point.date, point.value]))
    const tshSeries = selectedPatient.reports
      .flatMap((report) => report.biomarkers)
      .filter((marker) => marker.name.toLowerCase() === 'tsh')
      .flatMap((marker) => marker.history)

    const tshMap = new Map(tshSeries.map((point) => [point.date, point.value]))
    const dates = Array.from(new Set([...vitaminMap.keys(), ...tshMap.keys()])).sort((a, b) => a.localeCompare(b))

    return dates.map((date) => ({
      date,
      vitaminD: vitaminMap.get(date) ?? null,
      tsh: tshMap.get(date) ?? null
    }))
  }, [selectedPatient, vitaminSeries])

  const dispatchRoutes = useMemo(() => {
    const labHub = { x: 52, y: 14 }
    return patients.map((patient, index) => {
      const agent = vitaliaData.labData.phlebotomists[index % vitaliaData.labData.phlebotomists.length]
      const routeProgress = (courierProgress + ((index * 11) % 100)) % 100
      const start = patient?.homeMap ?? { x: 80, y: 25 }
      const end = labHub
      const sampleStatus = routeProgress >= 96 ? 'Received at Lab' : routeProgress >= 20 ? 'In Transit to Lab' : 'Collected from Patient'
      return {
        id: `${agent.id}-${patient.id}`,
        agent,
        patient,
        start,
        end,
        sampleId: `SMP-${patient.id.replace('PT-', '')}`,
        sampleStatus,
        position: {
          x: start.x + ((end.x - start.x) * routeProgress) / 100,
          y: start.y + ((end.y - start.y) * routeProgress) / 100
        },
        etaMinutes: Math.max(2, Math.round(((100 - routeProgress) * 28) / 100))
      }
    })
  }, [patients, courierProgress])

  const visibleDispatchRoutes = useMemo(() => {
    if (dispatchPatientFilter === 'all') return dispatchRoutes
    return dispatchRoutes.filter((route) => route.patient?.id === dispatchPatientFilter)
  }, [dispatchRoutes, dispatchPatientFilter])

  const avgDispatchEtaMinutes = useMemo(() => {
    if (!dispatchRoutes.length) return 0
    const totalEta = dispatchRoutes.reduce((sum, route) => sum + route.etaMinutes, 0)
    return Math.round(totalEta / dispatchRoutes.length)
  }, [dispatchRoutes])

  const criticalDoctorRows = useMemo(() => {
    if (!selectedPatient) return [] as Array<{ marker: string; current: number; previous: number; unit: string }>

    const buckets = new Map<string, Array<{ date: string; value: number; unit: string; min: number; max: number }>>()

    selectedPatient.reports.forEach((report) => {
      report.biomarkers.forEach((marker) => {
        const bucket = buckets.get(marker.name) ?? []
        bucket.push({ date: report.date, value: marker.value, unit: marker.unit, min: marker.normalMin, max: marker.normalMax })
        buckets.set(marker.name, bucket)
      })
    })

    return Array.from(buckets.entries())
      .map(([marker, points]) => {
        const ordered = [...points].sort((a, b) => a.date.localeCompare(b.date))
        const current = ordered[ordered.length - 1]
        const previous = ordered[ordered.length - 2] ?? ordered[ordered.length - 1]
        return {
          marker,
          current: current.value,
          previous: previous.value,
          unit: current.unit,
          min: current.min,
          max: current.max
        }
      })
      .filter((row) => row.current > row.max || row.current < row.min)
      .map((row) => ({ marker: row.marker, current: row.current, previous: row.previous, unit: row.unit }))
  }, [selectedPatient])

  function switchPersona() {
    setPersona((current) => PERSONA_ORDER[(PERSONA_ORDER.indexOf(current) + 1) % PERSONA_ORDER.length])
  }

  function openQueueItem(item: LabQueueItem) {
    if (item.status !== 'Draft') return
    setSelectedQueueItem(item)
    setEditedValues(item.values)
    setAiSummary(makeAiSummary(item.values))
    setDrawerOpen(true)
  }

  function publishQueueItem() {
    if (!selectedQueueItem) return

    const today = new Date().toISOString().slice(0, 10)

    setLabQueue((current) =>
      current.map((item) =>
        item.id === selectedQueueItem.id
          ? {
              ...item,
              status: 'Published' as ReportStatus,
              values: editedValues
            }
          : item
      )
    )

    setPatients((current) =>
      current.map((patient) => {
        if (patient.id !== selectedQueueItem.patientUid) return patient

        const biomarkers = Object.entries(editedValues).map(([marker, value]) => {
          const preset = rangePreset(marker)
          const previousHistory = patient.reports
            .flatMap((report) => report.biomarkers)
            .filter((entry) => entry.name.toLowerCase() === marker.toLowerCase())
            .flatMap((entry) => entry.history)

          return {
            name: marker,
            value,
            unit: preset.unit,
            normalMin: preset.min,
            normalMax: preset.max,
            history: [...previousHistory, { date: today, value }].sort((a, b) => a.date.localeCompare(b.date))
          }
        })

        return {
          ...patient,
          reports: [
            {
              id: `PUB-${selectedQueueItem.id}`,
              date: today,
              type: selectedQueueItem.test,
              tenant: vitaliaData.tenantConfig.labName,
              status: 'Published' as ReportStatus,
              biomarkers
            },
            ...patient.reports
          ]
        }
      })
    )

    setSelectedPatientId(selectedQueueItem.patientUid)
    setDrawerOpen(false)
    setToast({ message: 'Report signed and published to patient vault.', tone: 'success' })
  }

  function submitPhq(event: React.FormEvent) {
    event.preventDefault()
    if (!selectedPatient) return

    const total = phqAnswers.reduce((sum, score) => sum + score, 0)
    const moodFromPhq = Math.max(1, Math.min(10, 10 - Math.round(total / 3)))
    const updatedMood = Math.round((moodSlider + moodFromPhq) / 2)
    const today = new Date().toISOString().slice(0, 10)

    setPatients((current) =>
      current.map((patient) => {
        if (patient.id !== selectedPatient.id) return patient
        return {
          ...patient,
          phq9Score: total,
          moodBiology: [...patient.moodBiology, { date: today, mood: updatedMood, tsh: latestTsh(patient) }]
        }
      })
    )

    setPhqAnswers(Array(9).fill(0))
    setToast({ message: 'Wellness scores updated.', tone: 'success' })
  }

  function toggleConnectorSync(connectorId: string) {
    setConnectors((current) =>
      current.map((connector) =>
        connector.id === connectorId
          ? {
              ...connector,
              syncEnabled: !connector.syncEnabled,
              status: !connector.syncEnabled ? 'Connected' : 'Disconnected',
              lastSync: !connector.syncEnabled ? 'Permission granted, awaiting next cycle' : connector.lastSync
            }
          : connector
      )
    )
  }

  function addConnector(event: React.FormEvent) {
    event.preventDefault()
    const name = newConnector.name.trim()
    const vendor = newConnector.vendor.trim()
    const endpoint = newConnector.endpoint.trim()
    if (!name || !vendor || !endpoint) {
      setToast({ message: 'Connector name, vendor, and endpoint are required.', tone: 'warning' })
      return
    }

    const nextId = `CON-${String(connectors.length + 1).padStart(2, '0')}`
    setConnectors((current) => [
      ...current,
      {
        id: nextId,
        name,
        vendor,
        dataType: newConnector.dataType,
        interfaceStandard: newConnector.interfaceStandard,
        transport: transportForInterface(newConnector.interfaceStandard),
        endpoint,
        authMode: newConnector.authMode,
        syncEnabled: false,
        status: 'Disconnected',
        lastSync: 'Never'
      }
    ])
    setNewConnector({
      name: '',
      vendor: '',
      dataType: 'Chemistry',
      interfaceStandard: 'HL7 v2.5.1 (LAW)',
      endpoint: defaultEndpointForInterface('HL7 v2.5.1 (LAW)'),
      authMode: defaultAuthForInterface('HL7 v2.5.1 (LAW)')
    })
    setToast({ message: 'New equipment connector added.', tone: 'success' })
  }

  function addManualPatient(event: React.FormEvent) {
    event.preventDefault()
    const name = newPatient.name.trim()
    const address = newPatient.address.trim()
    if (!name || !address) {
      setToast({ message: 'Patient name and address are required.', tone: 'warning' })
      return
    }

    const suffix = String(Date.now()).slice(-5)
    const id = `PT-MAN-${suffix}`
    const baseDate = new Date().toISOString().slice(0, 10)

    const created: Patient = {
      id,
      name,
      age: newPatient.age,
      labLocation: newPatient.labLocation,
      address,
      homeMap: { x: 54 + (patients.length % 5) * 7, y: 22 + (patients.length % 4) * 10 },
      reports: [],
      scanStudy: {
        study: 'No imaging study yet',
        modality: 'MR',
        provider: 'Pending',
        dicomSeriesId: `DICOM-${id}`,
        images: Array.from({ length: 10 }, (_, index) => assetPath(`mri/slice-${index + 1}.svg`))
      },
      moodBiology: [
        { date: baseDate, mood: 6, tsh: 2.6 }
      ],
      phq9Score: 0,
      isAdult: newPatient.age >= 18
    }

    setPatients((current) => [created, ...current])
    setSelectedPatientId(id)
    setNewPatient({ name: '', age: 30, address: '', labLocation: 'Pakistan' })
    setToast({ message: 'Patient added (manual override).', tone: 'success' })
  }

  function toggleSystemConnection(connectionId: string) {
    setSystemConnections((current) =>
      current.map((connection) =>
        connection.id === connectionId
          ? {
              ...connection,
              syncEnabled: !connection.syncEnabled,
              status: !connection.syncEnabled ? 'Connected' : 'Disconnected',
              lastSync: !connection.syncEnabled ? timestampUtc() : connection.lastSync
            }
          : connection
      )
    )
  }

  function syncInventoryFromPos() {
    const posConnection = systemConnections.find((connection) => connection.id === 'SYS-POS')
    if (!posConnection?.syncEnabled || posConnection.status !== 'Connected') {
      setToast({ message: 'Enable Reception POS connection before syncing inventory.', tone: 'warning' })
      return
    }

    const template = POS_SYNC_TEMPLATES[posSyncRuns % POS_SYNC_TEMPLATES.length]
    const now = timestampUtc()

    setInventoryItems((current) => {
      const existing = current.find((item) => item.name === template.name)
      if (existing) {
        return current.map((item) =>
          item.id === existing.id
            ? {
                ...item,
                stockOnHand: item.stockOnHand + template.stockOnHand,
                sourceType: 'POS Sync',
                sourceRef: template.sourceRef
              }
            : item
        )
      }

      return [
        {
          ...template,
          id: `INV-POS-${String(current.length + 1).padStart(3, '0')}`
        },
        ...current
      ]
    })

    setPosSyncRuns((current) => current + 1)
    setInventoryFeed((current) => [
      {
        id: `INV-FEED-${Date.now()}`,
        source: 'POS Sync',
        detail: `Stock batch imported: ${template.name}`,
        at: now
      },
      ...current
    ])
    setSystemConnections((current) =>
      current.map((connection) =>
        connection.id === 'SYS-POS'
          ? { ...connection, status: 'Connected', lastSync: now }
          : connection
      )
    )
    setToast({ message: 'Inventory synced from Reception POS.', tone: 'success' })
  }

  function addInventoryEntry(event: React.FormEvent) {
    event.preventDefault()
    const name = newInventoryItem.name.trim()
    const sourceRef = newInventoryItem.sourceRef.trim()
    if (!name || !sourceRef) {
      setToast({ message: 'Item name and source reference are required.', tone: 'warning' })
      return
    }

    const isEquipment = newInventoryItem.category === 'Equipment'
    const created: InventoryItem = {
      id: `INV-MAN-${String(Date.now()).slice(-6)}`,
      name,
      category: newInventoryItem.category,
      stockOnHand: Math.max(0, newInventoryItem.stockOnHand),
      reorderAt: Math.max(0, newInventoryItem.reorderAt),
      unit: newInventoryItem.unit || 'units',
      sourceType: newInventoryItem.sourceType,
      sourceRef,
      complianceStatus: isEquipment ? newInventoryItem.complianceStatus : 'Not Applicable',
      lastTestedOn: isEquipment ? newInventoryItem.lastTestedOn || null : null,
      operationalStatus: isEquipment ? newInventoryItem.operationalStatus : 'Not Applicable'
    }

    setInventoryItems((current) => [created, ...current])
    setInventoryFeed((current) => [
      {
        id: `INV-FEED-${Date.now()}`,
        source: newInventoryItem.sourceType,
        detail: `Manual intake added: ${created.name}`,
        at: timestampUtc()
      },
      ...current
    ])
    setNewInventoryItem({
      name: '',
      category: 'Medication',
      stockOnHand: 0,
      reorderAt: 0,
      unit: 'units',
      sourceType: 'Manual Entry',
      sourceRef: '',
      complianceStatus: 'Not Applicable',
      lastTestedOn: '',
      operationalStatus: 'Not Applicable'
    })
    setToast({ message: 'Inventory item added.', tone: 'success' })
  }

  function createInvoice(event: React.FormEvent) {
    event.preventDefault()
    const patient = patients.find((entry) => entry.id === newInvoice.patientId)
    if (!patient) {
      setToast({ message: 'Select a patient before generating an invoice.', tone: 'warning' })
      return
    }

    const totalUsd = Math.max(0, newInvoice.totalUsd)
    const collectedUpfrontUsd =
      newInvoice.payerType === 'Self-Pay'
        ? totalUsd
        : Math.min(totalUsd, Math.max(0, newInvoice.collectedUpfrontUsd))
    const outstandingUsd = newInvoice.payerType === 'Insurance' ? Math.max(0, totalUsd - collectedUpfrontUsd) : 0
    const claimStatus: BillingLedgerItem['claimStatus'] =
      newInvoice.payerType === 'Insurance'
        ? outstandingUsd > 0
          ? 'Submitted'
          : 'Paid'
        : 'N/A'
    const invoiceId = `INV-${String(1001 + billingLedger.length).padStart(4, '0')}`
    const now = timestampUtc()

    setBillingLedger((current) => [
      {
        id: invoiceId,
        patientName: patient.name,
        test: newInvoice.test,
        payerType: newInvoice.payerType,
        totalUsd,
        collectedUpfrontUsd,
        outstandingUsd,
        claimStatus
      },
      ...current
    ])

    setBillingJourney((current) => {
      const steps: BillingJourneyEvent[] = [
        {
          id: `${invoiceId}-1`,
          step: 'Order Captured',
          detail: `${newInvoice.test} order captured from reception workflow.`,
          at: now
        },
        {
          id: `${invoiceId}-2`,
          step: 'Invoice Generated',
          detail: `${invoiceId} created for ${patient.name} (${USD_SYMBOL}${totalUsd.toLocaleString()}).`,
          at: now
        },
        newInvoice.payerType === 'Self-Pay'
          ? {
              id: `${invoiceId}-3`,
              step: 'Payment Collected',
              detail: `Upfront payment collected at booking/check-in.`,
              at: now
            }
          : {
              id: `${invoiceId}-3`,
              step: 'Claim Submitted',
              detail: `Insurance claim submitted post-test.`,
              at: now
            }
      ]
      return [...steps, ...current].slice(0, 16)
    })

    setNewInvoice({
      patientId: patient.id,
      test: TEST_CATALOG[0].name,
      payerType: 'Self-Pay',
      totalUsd: TEST_CATALOG[0].priceUsd,
      collectedUpfrontUsd: TEST_CATALOG[0].priceUsd
    })
    setToast({ message: 'Invoice generated and journey log updated.', tone: 'success' })
  }

  function advanceInsuranceClaim(invoiceId: string) {
    let transition: string | null = null

    setBillingLedger((current) =>
      current.map((row) => {
        if (row.id !== invoiceId || row.payerType !== 'Insurance') return row
        if (row.claimStatus === 'Submitted') {
          transition = 'In Review'
          return { ...row, claimStatus: 'In Review' }
        }
        if (row.claimStatus === 'In Review') {
          transition = 'Paid'
          return { ...row, claimStatus: 'Paid', outstandingUsd: 0 }
        }
        return row
      })
    )

    if (!transition) return
    setBillingJourney((current) => [
      {
        id: `${invoiceId}-${Date.now()}`,
        step: transition === 'Paid' ? 'Claim Settled' : 'Claim Review',
        detail: `${invoiceId} moved to ${transition}.`,
        at: timestampUtc()
      },
      ...current
    ])
    setToast({
      message: transition === 'Paid' ? 'Insurance claim settled.' : 'Insurance claim moved to review.',
      tone: 'success'
    })
  }

  const adminSidebar = (
    <aside className="w-64 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center gap-3">
        <img
          alt="Tenant logo"
          className="h-10 w-10 rounded-xl border border-slate-200 object-cover"
          onError={(event) => {
            event.currentTarget.onerror = null
            event.currentTarget.src = assetPath('vitalia-logo.svg')
          }}
          src={logoUrl}
        />
        <div>
          <p className="text-sm font-semibold">{vitaliaData.tenantConfig.labName}</p>
          <p className="text-xs text-slate-500">Lab Administrator Console</p>
        </div>
      </div>

      <nav className="space-y-1">
        {(['Dashboard', 'Patients', 'Inventory', 'Billing', 'Connectors', 'Dispatch'] as const).map((item) => (
          <button
            className={cn(
              'flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm',
              adminPage === item ? 'bg-brand text-white' : 'text-slate-700 hover:bg-slate-100'
            )}
            key={item}
            onClick={() => setAdminPage(item)}
            type="button"
          >
            {item === 'Dashboard' ? <Home className="h-4 w-4" /> : null}
            {item === 'Patients' ? <Users className="h-4 w-4" /> : null}
            {item === 'Inventory' ? <Boxes className="h-4 w-4" /> : null}
            {item === 'Billing' ? <Banknote className="h-4 w-4" /> : null}
            {item === 'Connectors' ? <Truck className="h-4 w-4" /> : null}
            {item === 'Dispatch' ? <Activity className="h-4 w-4" /> : null}
            {item}
          </button>
        ))}
      </nav>
    </aside>
  )

  const renderAdminPage = () => {
    const posConnection = systemConnections.find((connection) => connection.id === 'SYS-POS')
    const claimsConnection = systemConnections.find((connection) => connection.id === 'SYS-CLAIMS')
    const lowStockCount = inventoryItems.filter((item) => item.stockOnHand <= item.reorderAt).length

    if (adminPage === 'Dashboard') {
      return (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <Card>
              <CardHeader>
                <CardDescription>Revenue Captured</CardDescription>
                <CardTitle>
                  {USD_SYMBOL}
                  {revenueSnapshot.dailySales.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Pending Validations</CardDescription>
                <CardTitle>{pendingDrafts}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Critical Queue</CardDescription>
                <CardTitle>{criticalQueueCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Avg Sample ETA</CardDescription>
                <CardTitle>{avgDispatchEtaMinutes} min</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Integration Uptime</CardDescription>
                <CardTitle>{connectionHealthData.uptimePct}%</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm">Weekly Financial & Claim Signals</CardTitle>
                <CardDescription>Revenue collection trend versus insurance claim backlog.</CardDescription>
              </CardHeader>
              <CardContent className="h-72">
                <ResponsiveContainer height="100%" width="100%">
                  <AreaChart data={weeklyOpsData}>
                    <defs>
                      <linearGradient id="revGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#0066FF" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#0066FF" stopOpacity={0.04} />
                      </linearGradient>
                      <linearGradient id="claimGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.28} />
                        <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area dataKey="revenue" fill="url(#revGradient)" stroke="#0066FF" strokeWidth={2} type="monotone" />
                    <Area dataKey="claims" fill="url(#claimGradient)" stroke="#F59E0B" strokeWidth={2} type="monotone" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Payer Mix</CardTitle>
                <CardDescription>Self-pay and insurance invoice distribution.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-44">
                  <ResponsiveContainer height="100%" width="100%">
                    <PieChart>
                      <Pie
                        cx="50%"
                        cy="50%"
                        data={payerMixChartData}
                        dataKey="value"
                        innerRadius={48}
                        outerRadius={76}
                        paddingAngle={3}
                      >
                        {payerMixChartData.map((entry, index) => (
                          <Cell fill={DASHBOARD_PIE_COLORS[index % DASHBOARD_PIE_COLORS.length]} key={entry.name} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-sm">
                  {payerMixChartData.map((entry, index) => (
                    <div className="flex items-center justify-between" key={entry.name}>
                      <span className="flex items-center gap-2">
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: DASHBOARD_PIE_COLORS[index % DASHBOARD_PIE_COLORS.length] }}
                        />
                        {entry.name}
                      </span>
                      <span className="font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                  Insurance outstanding: {USD_SYMBOL}
                  {revenueSnapshot.outstandingInvoices.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Validation Workload</CardTitle>
                <CardDescription>Draft, flagged, and published report counts.</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={queueStatusData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#0066FF" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Claims Pipeline</CardTitle>
                <CardDescription>Current stage distribution for insurance invoices.</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={claimsStageData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="stage" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Inventory Risk by Category</CardTitle>
                <CardDescription>Low-stock pressure versus healthy stock count.</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <ResponsiveContainer height="100%" width="100%">
                  <BarChart data={inventoryRiskData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="category" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="healthy" fill="#10B981" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="lowStock" fill="#F59E0B" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Connection Health</CardTitle>
                <CardDescription>System and equipment integration reliability snapshot.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>Connected</span>
                    <span>{connectionHealthData.connected}/{connectionHealthData.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-emerald-500"
                      style={{ width: `${(connectionHealthData.connected / connectionHealthData.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>Disconnected</span>
                    <span>{connectionHealthData.disconnected}/{connectionHealthData.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-slate-400"
                      style={{ width: `${(connectionHealthData.disconnected / connectionHealthData.total) * 100}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                    <span>Error</span>
                    <span>{connectionHealthData.error}/{connectionHealthData.total}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-red-500"
                      style={{ width: `${(connectionHealthData.error / connectionHealthData.total) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Operational Highlights</CardTitle>
                <CardDescription>Cross-module signals for today’s command center.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <span>Insurance Claim Backlog</span>
                  <span className="font-semibold">{USD_SYMBOL}{revenueSnapshot.pendingClaims.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <span>Low Stock Alerts</span>
                  <span className="font-semibold">{lowStockCount} items</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <span>Active Couriers</span>
                  <span className="font-semibold">{activePhlebotomists}</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                  <span>Queue Published Count</span>
                  <span className="font-semibold">{publishedQueueCount}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    if (adminPage === 'Patients') {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Registered Patients</CardTitle>
              <CardDescription>
                Primary source is Reception Desk / HIS sync. Manual add is available as fallback override.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>UID</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Reports</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patients.map((patient) => (
                      <TableRow key={patient.id}>
                        <TableCell className="font-medium">{patient.id}</TableCell>
                        <TableCell>{patient.name}</TableCell>
                        <TableCell>{patient.age}</TableCell>
                        <TableCell>{patient.address}</TableCell>
                        <TableCell>{patient.reports.length}</TableCell>
                        <TableCell>
                          <Badge variant={patient.id.startsWith('PT-MAN') ? 'warning' : 'secondary'}>
                            {patient.id.startsWith('PT-MAN') ? 'Manual Override' : 'Reception Sync'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Manual Patient Intake (Fallback)</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-4" onSubmit={addManualPatient}>
                <Input
                  onChange={(event) => setNewPatient((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Patient name"
                  value={newPatient.name}
                />
                <Input
                  min={0}
                  onChange={(event) => setNewPatient((current) => ({ ...current, age: Number(event.target.value) }))}
                  placeholder="Age"
                  type="number"
                  value={Number.isNaN(newPatient.age) ? '' : newPatient.age}
                />
                <Input
                  onChange={(event) => setNewPatient((current) => ({ ...current, address: event.target.value }))}
                  placeholder="Address / City"
                  value={newPatient.address}
                />
                <Select
                  onChange={(event) => setNewPatient((current) => ({ ...current, labLocation: event.target.value as LabLocation }))}
                  value={newPatient.labLocation}
                >
                  <option value="Pakistan">Pakistan</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="United Arab Emirates">United Arab Emirates</option>
                </Select>
                <div className="md:col-span-4">
                  <Button type="submit">Add Patient</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (adminPage === 'Inventory') {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Inventory Ingestion Journey</CardTitle>
              <CardDescription>
                Stock appears from synced systems (POS/ERP) or manual intake. Every add/sync writes a feed entry.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 p-3 text-sm">
                  <p className="text-xs text-slate-500">Reception POS Connection</p>
                  <p className="font-semibold">{posConnection?.status ?? 'Disconnected'}</p>
                  <p className="text-xs text-slate-500">Last sync: {posConnection?.lastSync ?? 'Never'}</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-sm">
                  <p className="text-xs text-slate-500">Low Stock Alerts</p>
                  <p className="font-semibold">{lowStockCount} items</p>
                  <p className="text-xs text-slate-500">Triggered when stock ≤ reorder point</p>
                </div>
                <div className="rounded-xl border border-slate-200 p-3 text-sm">
                  <p className="text-xs text-slate-500">Total Inventory Records</p>
                  <p className="font-semibold">{inventoryItems.length}</p>
                  <p className="text-xs text-slate-500">Medication, kits, and equipment</p>
                </div>
              </div>
              <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3">
                <p className="text-sm text-slate-600">
                  Pull latest stock purchases and goods-received entries from POS.
                </p>
                <Button onClick={syncInventoryFromPos} type="button">Sync from POS</Button>
              </div>
              <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Feed</p>
                {inventoryFeed.slice(0, 4).map((event) => (
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs last:border-0 last:pb-0" key={event.id}>
                    <div>
                      <p className="font-medium text-slate-800">{event.detail}</p>
                      <p className="text-slate-500">{event.source}</p>
                    </div>
                    <span className="text-slate-500">{event.at}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Add Inventory Item</CardTitle>
              <CardDescription>
                Use this when a stock movement is not yet synced from POS/ERP.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="grid gap-3 md:grid-cols-4" onSubmit={addInventoryEntry}>
                <Input
                  onChange={(event) => setNewInventoryItem((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Item name"
                  value={newInventoryItem.name}
                />
                <Select
                  onChange={(event) =>
                    setNewInventoryItem((current) => ({
                      ...current,
                      category: event.target.value as InventoryItem['category'],
                      complianceStatus: event.target.value === 'Equipment' ? 'Compliant' : 'Not Applicable',
                      operationalStatus: event.target.value === 'Equipment' ? 'Operational' : 'Not Applicable'
                    }))
                  }
                  value={newInventoryItem.category}
                >
                  <option value="Medication">Medication</option>
                  <option value="Test Kit">Test Kit</option>
                  <option value="Equipment">Equipment</option>
                </Select>
                <Input
                  min={0}
                  onChange={(event) =>
                    setNewInventoryItem((current) => ({ ...current, stockOnHand: Number(event.target.value) }))
                  }
                  placeholder="Stock on hand"
                  type="number"
                  value={Number.isNaN(newInventoryItem.stockOnHand) ? '' : newInventoryItem.stockOnHand}
                />
                <Input
                  min={0}
                  onChange={(event) =>
                    setNewInventoryItem((current) => ({ ...current, reorderAt: Number(event.target.value) }))
                  }
                  placeholder="Reorder at"
                  type="number"
                  value={Number.isNaN(newInventoryItem.reorderAt) ? '' : newInventoryItem.reorderAt}
                />
                <Input
                  onChange={(event) => setNewInventoryItem((current) => ({ ...current, unit: event.target.value }))}
                  placeholder="Unit (kits, vials, machine)"
                  value={newInventoryItem.unit}
                />
                <Select
                  onChange={(event) =>
                    setNewInventoryItem((current) => ({ ...current, sourceType: event.target.value as InventoryItem['sourceType'] }))
                  }
                  value={newInventoryItem.sourceType}
                >
                  <option value="Manual Entry">Manual Entry</option>
                  <option value="POS Sync">POS Sync</option>
                  <option value="Purchase Order Sync">Purchase Order Sync</option>
                </Select>
                <Input
                  onChange={(event) => setNewInventoryItem((current) => ({ ...current, sourceRef: event.target.value }))}
                  placeholder="Source reference (PO / POS doc)"
                  value={newInventoryItem.sourceRef}
                />
                {newInventoryItem.category === 'Equipment' ? (
                  <Select
                    onChange={(event) =>
                      setNewInventoryItem((current) => ({
                        ...current,
                        complianceStatus: event.target.value as InventoryItem['complianceStatus']
                      }))
                    }
                    value={newInventoryItem.complianceStatus}
                  >
                    <option value="Compliant">Compliance: Compliant</option>
                    <option value="Due Soon">Compliance: Due Soon</option>
                    <option value="Expired">Compliance: Expired</option>
                  </Select>
                ) : (
                  <div />
                )}
                {newInventoryItem.category === 'Equipment' ? (
                  <Input
                    onChange={(event) => setNewInventoryItem((current) => ({ ...current, lastTestedOn: event.target.value }))}
                    placeholder="Last tested date (YYYY-MM-DD)"
                    value={newInventoryItem.lastTestedOn}
                  />
                ) : null}
                {newInventoryItem.category === 'Equipment' ? (
                  <Select
                    onChange={(event) =>
                      setNewInventoryItem((current) => ({
                        ...current,
                        operationalStatus: event.target.value as InventoryItem['operationalStatus']
                      }))
                    }
                    value={newInventoryItem.operationalStatus}
                  >
                    <option value="Operational">Operational</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Down">Down</option>
                  </Select>
                ) : null}
                <div className="md:col-span-4">
                  <Button type="submit">Add Inventory Item</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Inventory Register</CardTitle>
              <CardDescription>Separate views for medication, test kits, and hardware equipment.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs onValueChange={(value) => setInventoryTab(value as InventoryItem['category'])} value={inventoryTab}>
                <TabsList>
                  <TabsTrigger value="Medication">Medication</TabsTrigger>
                  <TabsTrigger value="Test Kit">Test Kits</TabsTrigger>
                  <TabsTrigger value="Equipment">Equipment</TabsTrigger>
                </TabsList>
                <TabsContent value={inventoryTab}>
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Stock</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Compliance</TableHead>
                          <TableHead>Last Tested</TableHead>
                          <TableHead>Operational</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {inventoryItemsByTab.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.name}
                              <p className="text-xs text-slate-500">{item.unit} · reorder at {item.reorderAt}</p>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.stockOnHand <= item.reorderAt ? 'warning' : 'success'}>
                                {item.stockOnHand}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <p>{item.sourceType}</p>
                              <p className="text-xs text-slate-500">{item.sourceRef}</p>
                            </TableCell>
                            <TableCell>{item.complianceStatus}</TableCell>
                            <TableCell>{item.lastTestedOn ?? 'N/A'}</TableCell>
                            <TableCell>{item.operationalStatus}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (adminPage === 'Billing') {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
            USD-only billing mode is enabled. Self-pay is collected upfront at booking/check-in; insurance is invoiced post-test and settled after claim lifecycle.
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Daily Sales</CardDescription>
                <CardTitle>
                  {USD_SYMBOL}
                  {revenueSnapshot.dailySales.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Insurance Claims Pending</CardDescription>
                <CardTitle>
                  {USD_SYMBOL}
                  {revenueSnapshot.pendingClaims.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Insurance Outstanding</CardDescription>
                <CardTitle>
                  {USD_SYMBOL}
                  {revenueSnapshot.outstandingInvoices.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Payer Mix</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>Self-Pay Invoices: {payerMix.selfPayCount}</p>
                <p>Insurance Invoices: {payerMix.insuredCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Claims Connection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-slate-600">
                <p>Status: <span className="font-medium text-slate-800">{claimsConnection?.status ?? 'Disconnected'}</span></p>
                <p>Last Sync: {claimsConnection?.lastSync ?? 'Never'}</p>
                <p>Insurance claims move `Submitted → In Review → Paid`.</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Invoice Journey</CardTitle>
              <CardDescription>Generate invoices and follow payment/claim progression in one flow.</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs onValueChange={(value) => setBillingTab(value as 'Generator' | 'Ledger')} value={billingTab}>
                <TabsList>
                  <TabsTrigger value="Generator">Invoice Generator</TabsTrigger>
                  <TabsTrigger value="Ledger">Invoice Ledger</TabsTrigger>
                </TabsList>

                <TabsContent value="Generator" className="space-y-4">
                  <form className="grid gap-3 rounded-xl border border-slate-200 p-3 md:grid-cols-3" onSubmit={createInvoice}>
                    <Select
                      onChange={(event) => setNewInvoice((current) => ({ ...current, patientId: event.target.value }))}
                      value={newInvoice.patientId}
                    >
                      {patients.map((patient) => (
                        <option key={patient.id} value={patient.id}>{patient.name}</option>
                      ))}
                    </Select>
                    <Select
                      onChange={(event) => {
                        const selected = TEST_CATALOG.find((test) => test.name === event.target.value)
                        setNewInvoice((current) => ({
                          ...current,
                          test: event.target.value,
                          totalUsd: selected?.priceUsd ?? current.totalUsd,
                          collectedUpfrontUsd:
                            current.payerType === 'Self-Pay'
                              ? selected?.priceUsd ?? current.totalUsd
                              : current.collectedUpfrontUsd
                        }))
                      }}
                      value={newInvoice.test}
                    >
                      {TEST_CATALOG.map((test) => (
                        <option key={test.name} value={test.name}>{test.name}</option>
                      ))}
                    </Select>
                    <Select
                      onChange={(event) => {
                        const payerType = event.target.value as BillingLedgerItem['payerType']
                        setNewInvoice((current) => ({
                          ...current,
                          payerType,
                          collectedUpfrontUsd: payerType === 'Self-Pay' ? current.totalUsd : 0
                        }))
                      }}
                      value={newInvoice.payerType}
                    >
                      <option value="Self-Pay">Self-Pay</option>
                      <option value="Insurance">Insurance</option>
                    </Select>
                    <Input
                      min={0}
                      onChange={(event) =>
                        setNewInvoice((current) => {
                          const totalUsd = Number(event.target.value)
                          return {
                            ...current,
                            totalUsd,
                            collectedUpfrontUsd: current.payerType === 'Self-Pay' ? totalUsd : current.collectedUpfrontUsd
                          }
                        })
                      }
                      placeholder="Total (USD)"
                      type="number"
                      value={Number.isNaN(newInvoice.totalUsd) ? '' : newInvoice.totalUsd}
                    />
                    <Input
                      min={0}
                      onChange={(event) =>
                        setNewInvoice((current) => ({ ...current, collectedUpfrontUsd: Number(event.target.value) }))
                      }
                      placeholder="Collected upfront (USD)"
                      type="number"
                      value={Number.isNaN(newInvoice.collectedUpfrontUsd) ? '' : newInvoice.collectedUpfrontUsd}
                    />
                    <Button type="submit">Generate Invoice</Button>
                  </form>

                  <div className="space-y-2 rounded-xl border border-slate-200 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Recent Billing Events</p>
                    {billingJourney.slice(0, 6).map((event) => (
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs last:border-0 last:pb-0" key={event.id}>
                        <div>
                          <p className="font-medium text-slate-800">{event.step}</p>
                          <p className="text-slate-500">{event.detail}</p>
                        </div>
                        <span className="text-slate-500">{event.at}</span>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="Ledger">
                  <div className="overflow-hidden rounded-2xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice</TableHead>
                          <TableHead>Patient</TableHead>
                          <TableHead>Test</TableHead>
                          <TableHead>Payer</TableHead>
                          <TableHead>Collected Upfront</TableHead>
                          <TableHead>Outstanding</TableHead>
                          <TableHead>Claim Status</TableHead>
                          <TableHead>Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {billingLedger.map((row) => (
                          <TableRow key={row.id}>
                            <TableCell className="font-medium">{row.id}</TableCell>
                            <TableCell>{row.patientName}</TableCell>
                            <TableCell>{row.test}</TableCell>
                            <TableCell>
                              <Badge variant={row.payerType === 'Insurance' ? 'warning' : 'success'}>{row.payerType}</Badge>
                            </TableCell>
                            <TableCell>
                              {USD_SYMBOL}
                              {row.collectedUpfrontUsd.toLocaleString()}
                            </TableCell>
                            <TableCell>
                              {USD_SYMBOL}
                              {row.outstandingUsd.toLocaleString()}
                            </TableCell>
                            <TableCell>{row.claimStatus}</TableCell>
                            <TableCell>
                              {row.payerType === 'Insurance' && row.claimStatus !== 'Paid' ? (
                                <Button onClick={() => advanceInsuranceClaim(row.id)} type="button" variant="outline">
                                  {row.claimStatus === 'Submitted' ? 'Move to Review' : 'Mark Paid'}
                                </Button>
                              ) : (
                                <span className="text-xs text-slate-500">No action</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Outstanding Logic</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>`Self-Pay`: amount is collected at invoice generation, outstanding becomes `0`.</p>
              <p>`Insurance`: outstanding remains until claim moves to `Paid`.</p>
              <p>Use row actions in ledger to simulate payer lifecycle.</p>
            </CardContent>
          </Card>
        </div>
      )
    }

    if (adminPage === 'Dispatch') {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm">Dispatch Tracking</CardTitle>
                  <CardDescription>Track incoming patient samples en route to the lab.</CardDescription>
                </div>
                <div className="min-w-[260px]">
                  <Select onChange={(event) => setDispatchPatientFilter(event.target.value)} value={dispatchPatientFilter}>
                    <option value="all">All Patients</option>
                    {patients.map((patient) => (
                      <option key={patient.id} value={patient.id}>
                        {patient.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="relative h-64 overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_20%_20%,#dbeafe,transparent_55%),radial-gradient(circle_at_80%_80%,#d1fae5,transparent_45%),#f8fafc]">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-50" />
                <div
                  className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white"
                  style={{ left: '52%', top: '14%' }}
                >
                  Lab Hub
                </div>
                {visibleDispatchRoutes.map((route) => {
                  const dx = route.end.x - route.start.x
                  const dy = route.end.y - route.start.y
                  const distance = Math.max(8, Math.hypot(dx, dy))
                  const angle = (Math.atan2(dy, dx) * 180) / Math.PI

                  return (
                    <div key={route.id}>
                      <div
                        className="absolute h-0.5 origin-left bg-slate-300"
                        style={{
                          left: `${route.start.x}%`,
                          top: `${route.start.y}%`,
                          width: `${distance}%`,
                          transform: `rotate(${angle}deg)`
                        }}
                      />
                      <div
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white"
                        style={{ left: `${route.end.x}%`, top: `${route.end.y}%` }}
                      >
                        Lab Intake
                      </div>
                      <div
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg bg-brand px-2 py-1 text-[10px] font-semibold text-white"
                        style={{ left: `${route.position.x}%`, top: `${route.position.y}%` }}
                      >
                        Sample Box
                      </div>
                      <div
                        className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg bg-emerald-700 px-2 py-1 text-[10px] font-semibold text-white"
                        style={{ left: `${route.start.x}%`, top: `${route.start.y}%` }}
                      >
                        {route.patient?.name.split(' ')[0]} Home
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Dispatch Live Table</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Courier</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Sample ID</TableHead>
                      <TableHead>Direction</TableHead>
                      <TableHead>Partner</TableHead>
                      <TableHead>Live Status</TableHead>
                      <TableHead>ETA</TableHead>
                      <TableHead>Transit Temp</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleDispatchRoutes.map((route) => (
                      <TableRow key={`${route.id}-row`}>
                        <TableCell className="font-medium">{route.agent.name}</TableCell>
                        <TableCell>{route.patient?.name}</TableCell>
                        <TableCell>{route.sampleId}</TableCell>
                        <TableCell>Patient → Lab</TableCell>
                        <TableCell>{route.agent.partner}</TableCell>
                        <TableCell>{route.sampleStatus}</TableCell>
                        <TableCell>{route.etaMinutes} min</TableCell>
                        <TableCell>{route.agent.transitTempC.toFixed(1)}°C</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Operational Connections</CardTitle>
            <CardDescription>Integration points that power inventory, billing, dispatch, and claims journeys.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {systemConnections.map((connection) => (
              <div className="rounded-xl border border-slate-200 p-3" key={connection.id}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{connection.name}</p>
                    <p className="text-xs text-slate-500">{connection.purpose}</p>
                  </div>
                  <Badge variant={connection.status === 'Connected' ? 'success' : connection.status === 'Error' ? 'danger' : 'secondary'}>
                    {connection.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Last sync: {connection.lastSync}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Allow Sync</span>
                    <Switch checked={connection.syncEnabled} onCheckedChange={() => toggleSystemConnection(connection.id)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Medical Equipment Connectors</CardTitle>
            <CardDescription>
              Connection model mirrors production patterns: HL7/DICOM/API over network, or ASTM via serial-to-gateway.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600 md:grid-cols-4">
              <p><span className="font-semibold text-slate-800">Analyzer LIS:</span> HL7 v2.5.1 LAW over TCP/IP</p>
              <p><span className="font-semibold text-slate-800">Legacy Serial:</span> ASTM E1381/E1394 via RS-232 gateway</p>
              <p><span className="font-semibold text-slate-800">Imaging:</span> DICOM to PACS bridge over TCP/IP</p>
              <p><span className="font-semibold text-slate-800">Cloud APIs:</span> FHIR REST over HTTPS + token/mTLS</p>
            </div>
            <form className="grid gap-2 rounded-xl border border-slate-200 p-3 md:grid-cols-7" onSubmit={addConnector}>
              <Input
                onChange={(event) => setNewConnector((current) => ({ ...current, name: event.target.value }))}
                placeholder="Equipment name"
                value={newConnector.name}
              />
              <Input
                onChange={(event) => setNewConnector((current) => ({ ...current, vendor: event.target.value }))}
                placeholder="Vendor"
                value={newConnector.vendor}
              />
              <Select
                onChange={(event) =>
                  setNewConnector((current) => ({
                    ...current,
                    dataType: event.target.value as EquipmentConnector['dataType']
                  }))
                }
                value={newConnector.dataType}
              >
                <option value="Hematology">Hematology</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Imaging">Imaging</option>
                <option value="Immunoassay">Immunoassay</option>
              </Select>
              <Select
                onChange={(event) =>
                  setNewConnector((current) => ({
                    ...current,
                    interfaceStandard: event.target.value as EquipmentConnector['interfaceStandard'],
                    authMode: defaultAuthForInterface(event.target.value as EquipmentConnector['interfaceStandard']),
                    endpoint: defaultEndpointForInterface(event.target.value as EquipmentConnector['interfaceStandard'])
                  }))
                }
                value={newConnector.interfaceStandard}
              >
                <option value="HL7 v2.5.1 (LAW)">HL7 v2.5.1 (LAW)</option>
                <option value="ASTM LIS2 Serial">ASTM LIS2 Serial</option>
                <option value="DICOM">DICOM</option>
                <option value="REST/FHIR API">REST/FHIR API</option>
              </Select>
              <Input
                onChange={(event) => setNewConnector((current) => ({ ...current, endpoint: event.target.value }))}
                placeholder="Endpoint (host:port / URL / serial)"
                value={newConnector.endpoint}
              />
              <Select
                onChange={(event) =>
                  setNewConnector((current) => ({
                    ...current,
                    authMode: event.target.value as EquipmentConnector['authMode']
                  }))
                }
                value={newConnector.authMode}
              >
                <option value="None">Auth: None</option>
                <option value="Token">Auth: Token</option>
                <option value="Basic">Auth: Basic</option>
                <option value="mTLS">Auth: mTLS</option>
              </Select>
              <Button type="submit">Add Equipment</Button>
            </form>
            {connectors.map((connector) => (
              <div className="rounded-xl border border-slate-200 p-3" key={connector.id}>
                <div className="mb-2 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold">{connector.name}</p>
                    <p className="text-xs text-slate-500">
                      {connector.vendor} · {connector.dataType} · {connector.interfaceStandard}
                    </p>
                    <p className="text-xs text-slate-500">
                      {connector.transport} · {connector.endpoint} · {connector.authMode}
                    </p>
                  </div>
                  <Badge variant={connector.status === 'Connected' ? 'success' : connector.status === 'Error' ? 'danger' : 'secondary'}>
                    {connector.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-500">Last sync: {connector.lastSync}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Allow Sync</span>
                    <Switch checked={connector.syncEnabled} onCheckedChange={() => toggleConnectorSync(connector.id)} />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  const renderLabAdmin = () => (
    <section className="mx-auto flex w-full max-w-[1440px] gap-4">
      {adminSidebar}
      <Card className="flex-1">
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>{adminPage}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>{renderAdminPage()}</CardContent>
      </Card>
    </section>
  )

  const renderPathologist = () => (
    <section className="mx-auto grid w-full max-w-[1440px] grid-cols-1 gap-4 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Validation Queue</CardTitle>
          <CardDescription>Triage queue with priority flags and one-click e-sign publishing.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs onValueChange={(value) => setQueueFilter(value as QueueFilter)} value={queueFilter}>
            <TabsList>
              <TabsTrigger value="All">All</TabsTrigger>
              <TabsTrigger value="Critical">Critical</TabsTrigger>
              <TabsTrigger value="Draft">Draft</TabsTrigger>
            </TabsList>
            <TabsContent className="mt-3" value={queueFilter}>
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Req ID</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Test</TableHead>
                      <TableHead>Priority</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredQueue.map((item) => (
                      <TableRow
                        className={cn(item.status === 'Draft' ? 'cursor-pointer' : 'cursor-default')}
                        key={item.id}
                        onClick={() => openQueueItem(item)}
                      >
                        <TableCell className="font-medium">{item.id}</TableCell>
                        <TableCell>{item.patientName}</TableCell>
                        <TableCell>{item.test}</TableCell>
                        <TableCell>
                          <Badge variant={isQueueCritical(item) ? 'warning' : 'secondary'}>
                            {isQueueCritical(item) ? 'Critical' : 'Routine'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.status === 'Published' ? 'success' : item.status === 'Flagged' ? 'warning' : 'secondary'}>
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">DICOM Viewer Pro</CardTitle>
          <CardDescription>Web diagnostic preview + annotation mode simulation.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="relative h-48 overflow-hidden rounded-2xl border border-slate-900 bg-black">
            <img
              alt="DICOM preview"
              className={cn('h-full w-full object-cover', panEnabled ? 'cursor-grab' : '')}
              src={scanStack[sliceIndex]}
              style={{
                filter: contrastEnabled ? `contrast(${contrastLevel}%)` : undefined,
                transform: `scale(${zoomEnabled ? zoomLevel : 1})`
              }}
            />
            <div className="absolute left-2 top-2 rounded bg-black/70 px-2 py-1 text-xs text-white">{selectedPatient?.scanStudy.study}</div>
          </div>
          <div className="rounded-xl border border-slate-200 p-3">
            <p className="text-xs font-semibold uppercase text-slate-500">AI Reporting Assistant</p>
            <p className="mt-1 text-sm text-slate-600">{selectedQueueItem ? aiSummary : 'Select a draft to generate summary.'}</p>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={zoomEnabled} onCheckedChange={setZoomEnabled} /> Zoom
            <Switch checked={contrastEnabled} onCheckedChange={setContrastEnabled} /> Contrast
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Switch checked={panEnabled} onCheckedChange={setPanEnabled} /> Annotate/Pan
          </div>
        </CardContent>
      </Card>
    </section>
  )

  const renderPatient = () => (
    <section className="mx-auto flex min-h-[90vh] items-center justify-center">
      <div className="rounded-[48px] border-[10px] border-slate-900 bg-slate-900 p-2 shadow-2xl">
        <div className="relative h-[844px] w-[390px] overflow-hidden rounded-[40px] bg-slate-50">
          <div className="absolute inset-x-0 top-0 z-20 h-20 bg-white/90 px-4 pt-3 backdrop-blur">
            <div className="mx-auto h-1.5 w-24 rounded-full bg-slate-300" />
            <div className="mt-2 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500">Universal Health Vault</p>
                <p className="text-sm font-semibold">{selectedPatient?.name}</p>
                <p className="text-[11px] text-slate-500">UID: {selectedPatient?.id}</p>
              </div>
              <Badge style={{ backgroundColor: primaryColor }}>
                {selectedPatient?.reports.filter((report) => report.status === 'Published').length ?? 0} tests
              </Badge>
            </div>
          </div>

          <div className="h-full overflow-y-auto px-4 pb-28 pt-24">
            {patientPage === 'home' ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Health Passport Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">Your history stays with you across employers and insurers.</p>
                    <p className="mt-2 text-xs text-slate-500">Providers connected: {new Set(selectedPatient?.reports.map((r) => r.tenant)).size}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Multi-Marker Trend Snapshot</CardTitle>
                    <CardDescription>Vitamin D and TSH longitudinal lines.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-44">
                    <ResponsiveContainer height="100%" width="100%">
                      <LineChart data={multiMarkerTrendData}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                        <XAxis dataKey="date" hide />
                        <YAxis yAxisId="left" />
                        <YAxis orientation="right" yAxisId="right" />
                        <Tooltip />
                        <Line dataKey="vitaminD" name="Vitamin D" stroke={primaryColor} strokeWidth={2} yAxisId="left" />
                        <Line dataKey="tsh" name="TSH" stroke="#0f172a" strokeWidth={2} yAxisId="right" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Booking & Payments</CardTitle>
                    <CardDescription>Home sample and local gateway options.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <button className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-white" style={{ backgroundColor: primaryColor }} type="button">
                      Book Home Sampling
                    </button>
                    <div className="flex gap-2 text-xs">
                      <Badge variant="secondary">JazzCash</Badge>
                      <Badge variant="secondary">STC Pay</Badge>
                      <Badge variant="secondary">Card</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {patientPage === 'vault' ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Vault Timeline</CardTitle>
                    <CardDescription>Cross-tenant results in a single timeline.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {groupedPublishedReports.map((group) => (
                      <div className="border-l-2 border-slate-200 pl-3" key={group.date}>
                        <p className="text-xs font-semibold uppercase text-slate-500">{group.date}</p>
                        <div className="mt-2 space-y-2">
                          {group.reports.map((report) => (
                            <div className="rounded-xl border border-slate-200 p-3" key={report.id}>
                              <div className="mb-2 flex items-center justify-between">
                                <p className="text-sm font-semibold">{report.type}</p>
                                <Badge variant="secondary">{report.tenant}</Badge>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {report.biomarkers.map((marker) => (
                                  <button
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium"
                                    key={`${report.id}-${marker.name}`}
                                    onClick={() => setSelectedBiomarker(toBiomarkerSelection(marker))}
                                    type="button"
                                  >
                                    {marker.name}: {marker.value}
                                    {marker.unit}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {selectedBiomarker ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">{selectedBiomarker.marker} Trend</CardTitle>
                    </CardHeader>
                    <CardContent className="h-56">
                      <ResponsiveContainer height="100%" width="100%">
                        <LineChart data={selectedBiomarker.history}>
                          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                          <XAxis dataKey="date" hide />
                          <YAxis />
                          <Tooltip />
                          <ReferenceArea
                            fill="#bbf7d0"
                            fillOpacity={0.35}
                            y1={selectedBiomarker.normalMin}
                            y2={selectedBiomarker.normalMax}
                          />
                          <Line dataKey="value" dot={{ r: 3 }} stroke={primaryColor} strokeWidth={2} type="monotone" />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : null}

            {patientPage === 'wellness' ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Mood Tracker</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Label htmlFor="mood-slider">Today mood: {moodSlider}/10</Label>
                    <input
                      className="mt-2 w-full"
                      id="mood-slider"
                      max={10}
                      min={1}
                      onChange={(event) => setMoodSlider(Number(event.target.value))}
                      step={1}
                      type="range"
                      value={moodSlider}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Your Mood vs. Vitamin D Level</CardTitle>
                  </CardHeader>
                  <CardContent className="h-56">
                    <ResponsiveContainer height="100%" width="100%">
                      <LineChart data={moodVsVitaminData}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[1, 10]} yAxisId="left" />
                        <YAxis orientation="right" yAxisId="right" />
                        <Tooltip />
                        <Line dataKey="mood" name="Mood" stroke={primaryColor} strokeWidth={2} yAxisId="left" />
                        <Line dataKey="vitaminD" name="Vitamin D" stroke="#0f172a" strokeWidth={2} yAxisId="right" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {selectedPatient?.isAdult ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">PHQ-9 (18+)</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form className="space-y-2" onSubmit={submitPhq}>
                        {PHQ_QUESTIONS.map((question, index) => (
                          <div className="rounded-xl border border-slate-200 p-2" key={question}>
                            <Label className="text-xs">{index + 1}. {question}</Label>
                            <Select
                              className="mt-1 h-8"
                              onChange={(event) => {
                                const value = Number(event.target.value)
                                setPhqAnswers((current) =>
                                  current.map((entry, entryIndex) => (entryIndex === index ? value : entry))
                                )
                              }}
                              value={String(phqAnswers[index])}
                            >
                              <option value="0">0 - Not at all</option>
                              <option value="1">1 - Several days</option>
                              <option value="2">2 - More than half</option>
                              <option value="3">3 - Nearly every day</option>
                            </Select>
                          </div>
                        ))}
                        <Button className="w-full" type="submit">Submit Wellness Check</Button>
                      </form>
                    </CardContent>
                  </Card>
                ) : null}
              </div>
            ) : null}

            {patientPage === 'profile' ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Profile & Identity</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><span className="font-semibold">Global UID:</span> {selectedPatient?.id}</p>
                    <p><span className="font-semibold">Location:</span> {selectedPatient?.address}</p>
                    <p><span className="font-semibold">PHQ-9 Latest:</span> {selectedPatient?.phq9Score}</p>
                    <p><span className="font-semibold">DICOM Study:</span> {selectedPatient?.scanStudy.study}</p>
                  </CardContent>
                </Card>
              </div>
            ) : null}
          </div>

          <div className="absolute inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white px-2 py-2">
            <div className="grid grid-cols-4 gap-1">
              <button className={cn('rounded-xl px-2 py-2 text-xs', patientPage === 'home' ? 'bg-brand text-white' : 'text-slate-600')} onClick={() => setPatientPage('home')} type="button">Home</button>
              <button className={cn('rounded-xl px-2 py-2 text-xs', patientPage === 'vault' ? 'bg-brand text-white' : 'text-slate-600')} onClick={() => setPatientPage('vault')} type="button">Vault</button>
              <button
                className={cn('rounded-xl px-2 py-2 text-xs', patientPage === 'wellness' ? 'bg-brand text-white' : 'text-slate-600')}
                onClick={() => {
                  if (selectedPatient?.isAdult && !wellnessUnlocked) {
                    setShowBiometricGate(true)
                    return
                  }
                  setPatientPage('wellness')
                }}
                type="button"
              >
                Wellness
              </button>
              <button className={cn('rounded-xl px-2 py-2 text-xs', patientPage === 'profile' ? 'bg-brand text-white' : 'text-slate-600')} onClick={() => setPatientPage('profile')} type="button">Profile</button>
            </div>
          </div>

          {showBiometricGate ? (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/80 p-6">
              <Card className="w-full max-w-xs">
                <CardHeader>
                  <CardTitle className="text-sm">FaceID / Biometric Check</CardTitle>
                  <CardDescription>Second factor required for mental health vault.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    className="w-full"
                    onClick={() => {
                      setWellnessUnlocked(true)
                      setShowBiometricGate(false)
                      setPatientPage('wellness')
                    }}
                    type="button"
                  >
                    Authenticate
                  </Button>
                  <Button className="w-full" onClick={() => setShowBiometricGate(false)} type="button" variant="outline">
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )

  const renderDoctor = () => (
    <section className="mx-auto w-full max-w-[1100px]">
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Simplified Clinical View</CardTitle>
            <CardDescription>Critical values and side-by-side comparisons for rapid decision support.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex items-center gap-2">
              <Label htmlFor="doctor-patient">Patient</Label>
              <Select id="doctor-patient" onChange={(event) => setSelectedPatientId(event.target.value)} value={selectedPatient?.id}>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>{patient.name}</option>
                ))}
              </Select>
              <Badge variant="secondary">Session {vitaliaData.doctorPortal.sessionMinutes} min</Badge>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Marker</TableHead>
                    <TableHead>Current</TableHead>
                    <TableHead>Previous</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {criticalDoctorRows.map((row) => (
                    <TableRow key={row.marker}>
                      <TableCell className="font-medium">{row.marker}</TableCell>
                      <TableCell>{row.current} {row.unit}</TableCell>
                      <TableCell>{row.previous} {row.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Referral Tracking</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>Referred Patients: {patients.length}</p>
              <p>Completed Test Journeys: {patients.filter((patient) => patient.reports.some((report) => report.status === 'Published')).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Temporary QR Session</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-slate-600">
              <QrCode className="h-4 w-4" />
              DOC-{selectedPatient?.id?.replace('PT-', '')}-TEMP
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  )

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <main className="mx-auto px-4 py-6 sm:px-6 lg:px-8">
        {persona === 'admin' ? renderLabAdmin() : null}
        {persona === 'pathologist' ? renderPathologist() : null}
        {persona === 'patient' ? renderPatient() : null}
        {persona === 'doctor' ? renderDoctor() : null}
      </main>

      <Drawer onOpenChange={setDrawerOpen} open={drawerOpen}>
        {selectedQueueItem ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500">Human-in-the-Loop Validation</p>
              <h3 className="text-lg font-semibold">{selectedQueueItem.id}</h3>
              <p className="text-sm text-slate-500">{selectedQueueItem.patientName} · {selectedQueueItem.test}</p>
            </div>

            <Card>
              <CardContent className="space-y-2 pt-4">
                {Object.entries(editedValues).map(([marker, value]) => (
                  <div className="flex items-center gap-2" key={marker}>
                    <Label className="w-28 text-xs">{marker}</Label>
                    <Input
                      onChange={(event) =>
                        setEditedValues((current) => ({
                          ...current,
                          [marker]: Number(event.target.value)
                        }))
                      }
                      type="number"
                      value={Number.isNaN(value) ? '' : value}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">AI Reporting Assistant</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-slate-600">{aiSummary}</CardContent>
            </Card>

            <Button className="w-full" onClick={publishQueueItem}>
              <CheckCircle2 className="h-4 w-4" />
              E-Sign & Publish
            </Button>
            <Button className="w-full" onClick={() => setDrawerOpen(false)} variant="outline">
              Save as Draft
            </Button>
          </div>
        ) : null}
      </Drawer>

      {toast ? (
        <div className={cn('fixed right-6 top-6 z-[90] rounded-xl px-4 py-2 text-sm font-medium text-white shadow-lg', toast.tone === 'success' ? 'bg-emerald-600' : 'bg-amber-600')}>
          {toast.message}
        </div>
      ) : null}

      <button
        className="fixed bottom-6 right-6 z-[80] inline-flex items-center gap-2 rounded-full bg-brand px-4 py-3 text-sm font-semibold text-white shadow-xl"
        onClick={switchPersona}
        type="button"
      >
        <Menu className="h-4 w-4" />
        Switch Persona
      </button>

      <div className="fixed left-4 top-4 z-30 hidden rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 shadow md:inline-flex">
        <span className="inline-flex items-center gap-1">
          {persona === 'admin' ? <Building2 className="h-3.5 w-3.5" /> : null}
          {persona === 'pathologist' ? <ShieldCheck className="h-3.5 w-3.5" /> : null}
          {persona === 'patient' ? <UserCircle2 className="h-3.5 w-3.5" /> : null}
          {persona === 'doctor' ? <Stethoscope className="h-3.5 w-3.5" /> : null}
          {PERSONA_LABEL[persona]}
        </span>
      </div>

      <footer className="mx-auto mt-2 flex w-full max-w-[1440px] flex-wrap items-center justify-center gap-4 pb-4 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1"><UserCircle2 className="h-3.5 w-3.5" />{patients.length} patients in vault</span>
        <span className="inline-flex items-center gap-1"><ClipboardList className="h-3.5 w-3.5" />HITL triage + E-sign publish</span>
        <span className="inline-flex items-center gap-1"><PackageCheck className="h-3.5 w-3.5" />Inventory ingestion + equipment compliance</span>
        <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" />Incoming sample tracking</span>
        <span className="inline-flex items-center gap-1"><Droplets className="h-3.5 w-3.5" />Marker trends with safe zones</span>
        <span className="inline-flex items-center gap-1"><Brain className="h-3.5 w-3.5" />Wellness and mood correlation</span>
        <span className="inline-flex items-center gap-1"><IdCard className="h-3.5 w-3.5" />Doctor quick-view access</span>
        <span className="inline-flex items-center gap-1"><Banknote className="h-3.5 w-3.5" />USD-only billing mode</span>
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{vitaliaSeedJson.patients.length} seed profiles</span>
        <span className="inline-flex items-center gap-1"><Activity className="h-3.5 w-3.5" />Realtime ops simulation</span>
      </footer>
    </div>
  )
}
