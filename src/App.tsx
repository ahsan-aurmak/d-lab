import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BadgeCheck,
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
  CartesianGrid,
  Line,
  LineChart,
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
  BiomarkerResult,
  CurrencyCode,
  LabLocation,
  LabQueueItem,
  Patient,
  ReportStatus,
  vitaliaData,
  vitaliaSeedJson
} from '@/data/mockData'

type Persona = 'admin' | 'pathologist' | 'patient' | 'doctor'
type AdminPage = 'Dashboard' | 'Inventory' | 'Billing' | 'White-Label' | 'Logistics'
type QueueFilter = 'All' | 'Critical' | 'Draft'
type PatientPage = 'home' | 'vault' | 'wellness' | 'profile'
type ToastState = { message: string; tone: 'success' | 'warning' } | null

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

function locationToCurrencyCode(location: LabLocation): CurrencyCode {
  if (location === 'Pakistan') return 'PKR'
  if (location === 'Saudi Arabia') return 'SAR'
  return 'AED'
}

function currencySymbol(code: CurrencyCode) {
  if (code === 'PKR') return 'Rs. '
  if (code === 'SAR') return 'SAR '
  return 'AED '
}

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

export default function App() {
  const [persona, setPersona] = useState<Persona>('admin')

  const [adminPage, setAdminPage] = useState<AdminPage>('Dashboard')
  const [queueFilter, setQueueFilter] = useState<QueueFilter>('All')
  const [patientPage, setPatientPage] = useState<PatientPage>('home')

  const [patients, setPatients] = useState<Patient[]>(vitaliaData.patients)
  const [labQueue, setLabQueue] = useState<LabQueueItem[]>(vitaliaData.labQueue)
  const [selectedPatientId, setSelectedPatientId] = useState(vitaliaData.patients[0]?.id ?? '')

  const [labLocation, setLabLocation] = useState<LabLocation>(vitaliaData.patients[0]?.labLocation ?? 'Pakistan')
  const [primaryColor, setPrimaryColor] = useState(vitaliaData.tenantConfig.primaryColor)
  const [logoUrl, setLogoUrl] = useState(vitaliaData.tenantConfig.logoUrl)

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

  const [doctorOtp, setDoctorOtp] = useState('')
  const [doctorAccessGranted, setDoctorAccessGranted] = useState(false)
  const [doctorError, setDoctorError] = useState('')

  const [toast, setToast] = useState<ToastState>(null)
  const [courierProgress, setCourierProgress] = useState(0)

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
    setLabLocation(selectedPatient.labLocation)
    setSliceIndex(0)
    setWellnessUnlocked(false)
    setDoctorAccessGranted(false)
    setDoctorOtp('')
    setDoctorError('')

    const defaultMarker = selectedPatient.reports
      .filter((report) => report.status === 'Published')
      .flatMap((report) => report.biomarkers)
      .find((marker) => marker.name.toLowerCase() === 'vitamin d')

    setSelectedBiomarker(defaultMarker ? toBiomarkerSelection(defaultMarker) : null)
  }, [selectedPatient?.id])

  useEffect(() => {
    setSliceIndex((index) => Math.min(index, Math.max(0, scanStack.length - 1)))
  }, [scanStack.length])

  const currencyCode = locationToCurrencyCode(labLocation)
  const moneySymbol = currencySymbol(currencyCode)
  const revenueSnapshot = vitaliaData.labData.revenueByCurrency[currencyCode]

  const pendingDrafts = labQueue.filter((item) => item.status === 'Draft').length
  const activePhlebotomists = vitaliaData.labData.phlebotomists.filter((entry) => entry.status !== 'At Lab').length

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

  const courierPosition = useMemo(() => {
    if (!selectedPatient) return { x: 10, y: 86 }
    const start = vitaliaData.courierTracker.startMap
    const end = selectedPatient.homeMap
    return {
      x: start.x + ((end.x - start.x) * courierProgress) / 100,
      y: start.y + ((end.y - start.y) * courierProgress) / 100
    }
  }, [courierProgress, selectedPatient])

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

  function validateDoctorOtp() {
    setDoctorError('')
    setDoctorAccessGranted(true)
  }

  const adminSidebar = (
    <aside className="w-64 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm backdrop-blur">
      <div className="mb-4 flex items-center gap-3">
        <img alt="Tenant logo" className="h-10 w-10 rounded-xl border border-slate-200 object-cover" src={logoUrl} />
        <div>
          <p className="text-sm font-semibold">{vitaliaData.tenantConfig.labName}</p>
          <p className="text-xs text-slate-500">Lab Administrator Console</p>
        </div>
      </div>

      <nav className="space-y-1">
        {(['Dashboard', 'Inventory', 'Billing', 'White-Label', 'Logistics'] as const).map((item) => (
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
            {item === 'Inventory' ? <Boxes className="h-4 w-4" /> : null}
            {item === 'Billing' ? <Banknote className="h-4 w-4" /> : null}
            {item === 'White-Label' ? <Building2 className="h-4 w-4" /> : null}
            {item === 'Logistics' ? <Truck className="h-4 w-4" /> : null}
            {item}
          </button>
        ))}
      </nav>
    </aside>
  )

  const renderAdminPage = () => {
    if (adminPage === 'Dashboard') {
      return (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle>
                  {moneySymbol}
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
                <CardDescription>Active Phlebotomists</CardDescription>
                <CardTitle>{activePhlebotomists}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Insurance Claims</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">
                  {moneySymbol}
                  {revenueSnapshot.pendingClaims.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">Pending insurer reconciliation</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Outstanding Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-semibold">
                  {moneySymbol}
                  {revenueSnapshot.outstandingInvoices.toLocaleString()}
                </p>
                <p className="text-sm text-slate-500">Corporate & referral accounts</p>
              </CardContent>
            </Card>
          </div>
        </div>
      )
    }

    if (adminPage === 'Inventory') {
      return (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Inventory & Reagents</CardTitle>
              <CardDescription>Low stock alerts to prevent analyzer downtime.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {vitaliaData.labData.inventory.map((item) => (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3" key={item.reagent}>
                  <p className="text-sm font-medium">{item.reagent}</p>
                  <Badge variant={item.stockLeft <= item.reorderAt ? 'warning' : 'success'}>
                    {item.stockLeft} left
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Staff & Access Control</CardTitle>
              <CardDescription>Admin vs Front Desk vs Pathologist role permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {vitaliaData.labData.staff.map((member) => (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3" key={member.id}>
                  <div>
                    <p className="text-sm font-semibold">{member.name}</p>
                    <p className="text-xs text-slate-500">{member.role} · {member.branch}</p>
                  </div>
                  <Badge variant="secondary">{member.accessLevel}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )
    }

    if (adminPage === 'Billing') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Label htmlFor="billing-location">Billing Region</Label>
            <Select
              id="billing-location"
              onChange={(event) => setLabLocation(event.target.value as LabLocation)}
              value={labLocation}
            >
              <option value="Pakistan">Pakistan</option>
              <option value="Saudi Arabia">Saudi Arabia</option>
              <option value="United Arab Emirates">United Arab Emirates</option>
            </Select>
            <Badge variant="secondary">{currencyCode}</Badge>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardDescription>Daily Sales</CardDescription>
                <CardTitle>
                  {moneySymbol}
                  {revenueSnapshot.dailySales.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Pending Claims</CardDescription>
                <CardTitle>
                  {moneySymbol}
                  {revenueSnapshot.pendingClaims.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>Outstanding Invoices</CardDescription>
                <CardTitle>
                  {moneySymbol}
                  {revenueSnapshot.outstandingInvoices.toLocaleString()}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      )
    }

    if (adminPage === 'White-Label') {
      return (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">White-Label Studio</CardTitle>
              <CardDescription>Branch branding, logo updates, and color controls.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Label htmlFor="theme-picker">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  className="h-11 w-20 rounded-xl p-1"
                  id="theme-picker"
                  onChange={(event) => setPrimaryColor(event.target.value)}
                  type="color"
                  value={primaryColor}
                />
                <Input onChange={(event) => setPrimaryColor(event.target.value)} value={primaryColor} />
              </div>

              <Label htmlFor="logo-url">Logo URL</Label>
              <Input id="logo-url" onChange={(event) => setLogoUrl(event.target.value)} value={logoUrl} />

              <div className="space-y-2 pt-2">
                <p className="text-xs font-semibold uppercase text-slate-500">Facility Profiles</p>
                {vitaliaData.labData.facilities.map((facility) => (
                  <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3" key={facility.id}>
                    <div>
                      <p className="text-sm font-medium">{facility.name}</p>
                      <p className="text-xs text-slate-500">{facility.city}</p>
                    </div>
                    <Badge variant={facility.status === 'Active' ? 'success' : 'warning'}>{facility.status}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Live Mobile Preview</CardTitle>
              <CardDescription>Primary action color sync</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center">
              <div className="w-56 rounded-[32px] border-[7px] border-slate-900 bg-white p-3">
                <div className="mb-3 h-2 w-16 rounded-full bg-slate-300" />
                <div className="space-y-2 rounded-2xl border border-slate-200 p-3">
                  <p className="text-sm font-semibold">Patient App CTA</p>
                  <button
                    className="w-full rounded-xl px-3 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: primaryColor }}
                    type="button"
                  >
                    Book Home Sample
                  </button>
                </div>
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
            <CardTitle className="text-sm">3PL Hub</CardTitle>
            <CardDescription>Live phlebotomist tracking and cold-chain transit temperature.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {vitaliaData.labData.phlebotomists.map((agent) => (
              <div className="rounded-xl border border-slate-200 p-3" key={agent.id}>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">{agent.name}</p>
                  <Badge variant={agent.transitTempC <= 6 ? 'success' : 'warning'}>{agent.transitTempC.toFixed(1)}°C</Badge>
                </div>
                <p className="text-xs text-slate-500">{agent.partner} · {agent.region} · {agent.status}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Dispatch Map</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative h-56 overflow-hidden rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_20%_20%,#dbeafe,transparent_55%),radial-gradient(circle_at_80%_80%,#d1fae5,transparent_45%),#f8fafc]">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:24px_24px] opacity-50" />
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg bg-emerald-600 px-2 py-1 text-[10px] font-semibold text-white"
                style={{ left: `${selectedPatient?.homeMap.x}%`, top: `${selectedPatient?.homeMap.y}%` }}
              >
                Patient
              </div>
              <div
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-lg bg-brand px-2 py-1 text-[10px] font-semibold text-white"
                style={{ left: `${courierPosition.x}%`, top: `${courierPosition.y}%` }}
              >
                Courier
              </div>
            </div>
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
            <CardDescription>Business owner control layer: revenue, branding, inventory, and logistics.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="admin-patient">Patient</Label>
            <Select id="admin-patient" onChange={(event) => setSelectedPatientId(event.target.value)} value={selectedPatient?.id}>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </Select>
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
      {!doctorAccessGranted ? (
        <Card>
          <CardHeader>
            <CardTitle>Secure Access</CardTitle>
            <CardDescription>Permissioned portal. Enter a patient-issued 6-digit OTP.</CardDescription>
          </CardHeader>
          <CardContent className="max-w-sm space-y-3">
            <Input
              inputMode="numeric"
              maxLength={6}
              onChange={(event) => {
                setDoctorOtp(event.target.value)
                setDoctorError('')
              }}
              placeholder="Enter OTP"
              value={doctorOtp}
            />
            {doctorError ? <p className="text-xs text-red-600">{doctorError}</p> : null}
            <Button onClick={validateDoctorOtp} type="button">Unlock Patient Diagnostics</Button>
          </CardContent>
        </Card>
      ) : (
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
      )}
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
        <span className="inline-flex items-center gap-1"><PackageCheck className="h-3.5 w-3.5" />Inventory + access controls</span>
        <span className="inline-flex items-center gap-1"><Truck className="h-3.5 w-3.5" />3PL cold-chain dashboard</span>
        <span className="inline-flex items-center gap-1"><Droplets className="h-3.5 w-3.5" />Marker trends with safe zones</span>
        <span className="inline-flex items-center gap-1"><Brain className="h-3.5 w-3.5" />Wellness and mood correlation</span>
        <span className="inline-flex items-center gap-1"><IdCard className="h-3.5 w-3.5" />OTP-protected doctor access</span>
        <span className="inline-flex items-center gap-1"><Banknote className="h-3.5 w-3.5" />PKR/SAR/AED localization</span>
        <span className="inline-flex items-center gap-1"><Users className="h-3.5 w-3.5" />{vitaliaSeedJson.patients.length} seed profiles</span>
        <span className="inline-flex items-center gap-1"><Activity className="h-3.5 w-3.5" />Realtime ops simulation</span>
        <span className="inline-flex items-center gap-1"><BadgeCheck className="h-3.5 w-3.5" />White-label preview sync</span>
      </footer>
    </div>
  )
}
