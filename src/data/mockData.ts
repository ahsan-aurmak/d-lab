export type CurrencyCode = 'USD' | 'PKR' | 'SAR' | 'AED'
export type LabLocation = 'Pakistan' | 'Saudi Arabia' | 'United Arab Emirates'
export type ReportStatus = 'Draft' | 'Flagged' | 'Published'

export type TenantConfig = {
  labName: string
  location: string
  currency: CurrencyCode
  primaryColor: string
  logoUrl: string
}

type SeedResult = {
  marker: string
  value: number
  unit: string
  range: string
  flag?: string
}

type SeedHistoryEntry = {
  id: string
  date: string
  type: string
  provider: string
  status?: ReportStatus
  results?: SeedResult[]
  study?: string
  modality?: string
  dicomSeriesId?: string
  images?: string[]
}

type SeedPatient = {
  uid: string
  name: string
  age: number
  city: string
  country: 'PK' | 'SA' | 'AE'
  homeMap: { x: number; y: number }
  history: SeedHistoryEntry[]
  wellness: {
    moodScore: number[]
    phq9: number
    isAdult: boolean
  }
}

export type LabQueueItem = {
  id: string
  patientUid: string
  patientName: string
  test: string
  status: ReportStatus
  values: Record<string, number>
}

export type VitaliaSeedJson = {
  tenantConfig: TenantConfig
  patients: SeedPatient[]
  labQueue: LabQueueItem[]
}

export type BiomarkerPoint = {
  date: string
  value: number
}

export type BiomarkerResult = {
  name: string
  value: number
  unit: string
  normalMin: number
  normalMax: number
  flag?: string
  history: BiomarkerPoint[]
}

export type LabReport = {
  id: string
  date: string
  type: string
  tenant: string
  status: ReportStatus
  biomarkers: BiomarkerResult[]
}

export type MoodBiologyPoint = {
  date: string
  mood: number
  tsh: number
}

export type ScanStudy = {
  study: string
  modality: string
  provider: string
  dicomSeriesId: string
  images: string[]
}

export type Patient = {
  id: string
  name: string
  age: number
  labLocation: LabLocation
  address: string
  homeMap: { x: number; y: number }
  reports: LabReport[]
  scanStudy: ScanStudy
  moodBiology: MoodBiologyPoint[]
  phq9Score: number
  isAdult: boolean
}

export type RevenueSnapshot = {
  dailySales: number
  pendingClaims: number
  outstandingInvoices: number
}

export type BillingLedgerItem = {
  id: string
  patientName: string
  test: string
  payerType: 'Insurance' | 'Self-Pay'
  totalUsd: number
  collectedUpfrontUsd: number
  outstandingUsd: number
  claimStatus: 'N/A' | 'Submitted' | 'In Review' | 'Paid'
}

export type EquipmentConnector = {
  id: string
  name: string
  vendor: string
  dataType: 'Hematology' | 'Chemistry' | 'Imaging' | 'Immunoassay'
  interfaceStandard: 'HL7 v2.5.1 (LAW)' | 'ASTM LIS2 Serial' | 'DICOM' | 'REST/FHIR API'
  transport: 'TCP/IP' | 'Serial RS-232' | 'HTTPS'
  endpoint: string
  authMode: 'None' | 'Token' | 'Basic' | 'mTLS'
  syncEnabled: boolean
  status: 'Connected' | 'Disconnected' | 'Error'
  lastSync: string
}

export type InventoryItem = {
  id: string
  name: string
  category: 'Medication' | 'Test Kit' | 'Equipment'
  stockOnHand: number
  reorderAt: number
  unit: string
  sourceType: 'POS Sync' | 'Manual Entry' | 'Purchase Order Sync'
  sourceRef: string
  complianceStatus: 'Compliant' | 'Due Soon' | 'Expired' | 'Not Applicable'
  lastTestedOn: string | null
  operationalStatus: 'Operational' | 'Maintenance' | 'Down' | 'Not Applicable'
}

export type StaffMember = {
  id: string
  name: string
  role: 'Admin' | 'Front Desk' | 'Pathologist' | 'Radiologist'
  branch: string
  accessLevel: 'Full' | 'Operational' | 'Clinical'
}

export type FacilityProfile = {
  id: string
  name: string
  city: string
  status: 'Active' | 'Onboarding'
}

export type PhlebotomistStatus = {
  id: string
  name: string
  partner: string
  region: string
  transitTempC: number
  status: 'En Route' | 'Collecting' | 'At Lab'
}

export type LabData = {
  revenueByCurrency: Record<CurrencyCode, RevenueSnapshot>
  paymentMix: {
    selfPayCount: number
    insuredCount: number
  }
  billingLedger: BillingLedgerItem[]
  connectors: EquipmentConnector[]
  inventory: InventoryItem[]
  staff: StaffMember[]
  facilities: FacilityProfile[]
  phlebotomists: PhlebotomistStatus[]
}

export type VitaliaData = {
  tenantConfig: TenantConfig
  patients: Patient[]
  labQueue: LabQueueItem[]
  labData: LabData
  doctorPortal: {
    sessionMinutes: number
  }
  logisticsPartners: Record<LabLocation, string>
  courierTracker: {
    phlebotomist: string
    etaMinutes: number
    startMap: { x: number; y: number }
  }
}

export const vitaliaSeedJson: VitaliaSeedJson = {
  tenantConfig: {
    labName: 'Al-Hayat Diagnostics',
    location: 'Lahore, PK',
    currency: 'USD',
    primaryColor: '#0066FF',
    logoUrl: '/vitalia-logo.svg'
  },
  patients: [
    {
      uid: 'PT-9921',
      name: 'Aisha Khan',
      age: 28,
      city: 'Lahore',
      country: 'PK',
      homeMap: { x: 84, y: 26 },
      history: [
        {
          id: 'HIS-9921-01',
          date: '2026-02-15',
          type: 'Hematology',
          provider: 'Al-Hayat Diagnostics',
          status: 'Published',
          results: [
            { marker: 'HbA1c', value: 5.7, unit: '%', range: '4.0-5.6', flag: 'High' },
            { marker: 'Vitamin D', value: 22, unit: 'ng/mL', range: '30-100', flag: 'Low' }
          ]
        },
        {
          id: 'HIS-9921-02',
          date: '2025-12-20',
          type: 'Endocrinology',
          provider: 'PrimePath Labs',
          status: 'Published',
          results: [{ marker: 'TSH', value: 4.6, unit: 'mIU/L', range: '0.4-4.0', flag: 'High' }]
        },
        {
          id: 'HIS-9921-03',
          date: '2026-01-10',
          type: 'Radiology',
          provider: 'City Imaging Dubai',
          study: 'MRI Lumbar Spine',
          modality: 'MR',
          dicomSeriesId: 'DICOM-LUM-1101',
          images: ['mri_slice_1.jpg', 'mri_slice_2.jpg', 'mri_slice_3.jpg', 'mri_slice_4.jpg']
        }
      ],
      wellness: {
        moodScore: [7, 6, 5, 8, 4],
        phq9: 12,
        isAdult: true
      }
    },
    {
      uid: 'PT-8834',
      name: 'Zaid Ahmed',
      age: 34,
      city: 'Karachi',
      country: 'PK',
      homeMap: { x: 74, y: 45 },
      history: [
        {
          id: 'HIS-8834-01',
          date: '2026-02-03',
          type: 'Cardio Metabolic',
          provider: 'Nexa Labs',
          status: 'Published',
          results: [
            { marker: 'LDL', value: 152, unit: 'mg/dL', range: '0-130', flag: 'High' },
            { marker: 'HDL', value: 41, unit: 'mg/dL', range: '40-60' }
          ]
        },
        {
          id: 'HIS-8834-02',
          date: '2025-11-14',
          type: 'Vitamin Panel',
          provider: 'Al-Hayat Diagnostics',
          status: 'Published',
          results: [{ marker: 'Vitamin D', value: 18, unit: 'ng/mL', range: '30-100', flag: 'Low' }]
        },
        {
          id: 'HIS-8834-03',
          date: '2026-01-06',
          type: 'Radiology',
          provider: 'Aga Khan Imaging',
          study: 'MRI Brain',
          modality: 'MR',
          dicomSeriesId: 'DICOM-BRAIN-8834',
          images: ['mri_slice_5.jpg', 'mri_slice_6.jpg', 'mri_slice_7.jpg']
        }
      ],
      wellness: {
        moodScore: [6, 5, 5, 4, 6],
        phq9: 10,
        isAdult: true
      }
    },
    {
      uid: 'PT-7710',
      name: 'Mariam Al-Saud',
      age: 31,
      city: 'Riyadh',
      country: 'SA',
      homeMap: { x: 67, y: 30 },
      history: [
        {
          id: 'HIS-7710-01',
          date: '2026-02-21',
          type: 'Thyroid Panel',
          provider: 'BioCore Diagnostics',
          status: 'Published',
          results: [
            { marker: 'TSH', value: 5.1, unit: 'mIU/L', range: '0.4-4.0', flag: 'High' },
            { marker: 'Vitamin D', value: 29, unit: 'ng/mL', range: '30-100', flag: 'Low' }
          ]
        },
        {
          id: 'HIS-7710-02',
          date: '2025-12-08',
          type: 'Inflammatory',
          provider: 'PrimePath Labs',
          status: 'Published',
          results: [{ marker: 'CRP', value: 3.4, unit: 'mg/L', range: '0-3.0', flag: 'High' }]
        },
        {
          id: 'HIS-7710-03',
          date: '2026-01-29',
          type: 'Radiology',
          provider: 'Riyadh Imaging Center',
          study: 'MRI Cervical Spine',
          modality: 'MR',
          dicomSeriesId: 'DICOM-CSP-7710',
          images: ['mri_slice_8.jpg', 'mri_slice_9.jpg']
        }
      ],
      wellness: {
        moodScore: [8, 7, 6, 6, 5],
        phq9: 9,
        isAdult: true
      }
    },
    {
      uid: 'PT-6642',
      name: 'Omar Nasser',
      age: 26,
      city: 'Dubai',
      country: 'AE',
      homeMap: { x: 79, y: 61 },
      history: [
        {
          id: 'HIS-6642-01',
          date: '2026-02-18',
          type: 'Iron Studies',
          provider: 'Gulf Precision Labs',
          status: 'Published',
          results: [
            { marker: 'Ferritin', value: 17, unit: 'ng/mL', range: '20-250', flag: 'Low' },
            { marker: 'Vitamin D', value: 26, unit: 'ng/mL', range: '30-100', flag: 'Low' }
          ]
        },
        {
          id: 'HIS-6642-02',
          date: '2025-10-23',
          type: 'Endocrinology',
          provider: 'City Imaging Dubai',
          status: 'Published',
          results: [{ marker: 'TSH', value: 3.9, unit: 'mIU/L', range: '0.4-4.0' }]
        },
        {
          id: 'HIS-6642-03',
          date: '2026-01-15',
          type: 'Radiology',
          provider: 'City Imaging Dubai',
          study: 'MRI Knee',
          modality: 'MR',
          dicomSeriesId: 'DICOM-KNEE-6642',
          images: ['mri_slice_10.jpg', 'mri_slice_1.jpg', 'mri_slice_2.jpg']
        }
      ],
      wellness: {
        moodScore: [8, 8, 7, 6, 7],
        phq9: 7,
        isAdult: true
      }
    },
    {
      uid: 'PT-5509',
      name: 'Sana Iqbal',
      age: 19,
      city: 'Islamabad',
      country: 'PK',
      homeMap: { x: 70, y: 18 },
      history: [
        {
          id: 'HIS-5509-01',
          date: '2026-02-11',
          type: 'General Wellness',
          provider: 'Al-Hayat Diagnostics',
          status: 'Published',
          results: [
            { marker: 'Vitamin D', value: 32, unit: 'ng/mL', range: '30-100' },
            { marker: 'TSH', value: 2.8, unit: 'mIU/L', range: '0.4-4.0' }
          ]
        },
        {
          id: 'HIS-5509-02',
          date: '2025-11-02',
          type: 'CBC',
          provider: 'Nexa Labs',
          status: 'Published',
          results: [{ marker: 'Hemoglobin', value: 11.9, unit: 'g/dL', range: '12-16', flag: 'Low' }]
        },
        {
          id: 'HIS-5509-03',
          date: '2026-01-12',
          type: 'Radiology',
          provider: 'PrimePath Imaging',
          study: 'MRI Wrist',
          modality: 'MR',
          dicomSeriesId: 'DICOM-WRS-5509',
          images: ['mri_slice_3.jpg', 'mri_slice_4.jpg', 'mri_slice_5.jpg']
        }
      ],
      wellness: {
        moodScore: [7, 8, 8, 7, 9],
        phq9: 6,
        isAdult: true
      }
    }
  ],
  labQueue: [
    {
      id: 'REQ-001',
      patientUid: 'PT-8834',
      patientName: 'Zaid Ahmed',
      test: 'Lipid Profile',
      status: 'Draft',
      values: { LDL: 160, HDL: 40, Triglycerides: 170 }
    },
    {
      id: 'REQ-002',
      patientUid: 'PT-7710',
      patientName: 'Mariam Al-Saud',
      test: 'Thyroid Panel',
      status: 'Flagged',
      values: { TSH: 5.4, 'Vitamin D': 25 }
    },
    {
      id: 'REQ-003',
      patientUid: 'PT-6642',
      patientName: 'Omar Nasser',
      test: 'Iron Studies',
      status: 'Published',
      values: { Ferritin: 18 }
    },
    {
      id: 'REQ-004',
      patientUid: 'PT-5509',
      patientName: 'Sana Iqbal',
      test: 'Comprehensive Metabolic Panel',
      status: 'Draft',
      values: { Glucose: 97, ALT: 44, AST: 39 }
    },
    {
      id: 'REQ-005',
      patientUid: 'PT-9921',
      patientName: 'Aisha Khan',
      test: 'Thyroid + Vitamin Panel',
      status: 'Flagged',
      values: { TSH: 5.8, 'Vitamin D': 19 }
    },
    {
      id: 'REQ-006',
      patientUid: 'PT-4402',
      patientName: 'Yousef Al-Dossari',
      test: 'Liver Function',
      status: 'Draft',
      values: { ALT: 62, AST: 51 }
    },
    {
      id: 'REQ-007',
      patientUid: 'PT-4403',
      patientName: 'Lina Rahman',
      test: 'Cardiac Risk Panel',
      status: 'Draft',
      values: { LDL: 168, HDL: 38, Triglycerides: 191 }
    }
  ]
}

function countryToLabLocation(country: SeedPatient['country']): LabLocation {
  if (country === 'PK') return 'Pakistan'
  if (country === 'SA') return 'Saudi Arabia'
  return 'United Arab Emirates'
}

function parseRange(range: string) {
  const [rawMin, rawMax] = range.split('-')
  const min = Number(rawMin?.trim())
  const max = Number(rawMax?.trim())
  return {
    min: Number.isFinite(min) ? min : 0,
    max: Number.isFinite(max) ? max : 100
  }
}

function shiftDate(inputDate: string, days: number) {
  const date = new Date(`${inputDate}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

function ensureLongHistory(
  history: Array<{ date: string; value: number }>,
  markerName: string,
  targetPoints = 6
) {
  if (!history.length) return history
  if (history.length >= targetPoints) return history

  const earliest = history[0]
  const needed = targetPoints - history.length
  const trendSeed = markerName.length % 4

  const synthetic = Array.from({ length: needed }, (_, index) => {
    const depth = needed - index
    const drift = (trendSeed + depth) * 0.2
    const value = Number(Math.max(0, earliest.value + drift).toFixed(2))
    return {
      date: shiftDate(earliest.date, -30 * depth),
      value
    }
  })

  return [...synthetic, ...history]
}

function mapSliceNameToLocal(fileName: string, index: number) {
  const match = fileName.match(/(\d+)/)
  if (!match) return `/mri/slice-${(index % 10) + 1}.svg`
  const parsed = Number(match[1])
  const bounded = Math.max(1, Math.min(10, parsed))
  return `/mri/slice-${bounded}.svg`
}

function withTenSlices(images: string[]) {
  const mapped = images.map((image, index) => mapSliceNameToLocal(image, index))
  if (!mapped.length) {
    return Array.from({ length: 10 }, (_, index) => `/mri/slice-${index + 1}.svg`)
  }
  while (mapped.length < 10) {
    mapped.push(mapped[mapped.length % Math.max(1, mapped.length)])
  }
  return mapped.slice(0, 10)
}

function buildReports(seedPatient: SeedPatient): LabReport[] {
  const resultEntries = seedPatient.history.filter((entry) => Array.isArray(entry.results) && entry.results.length)
  return resultEntries.map((entry) => {
    const biomarkers: BiomarkerResult[] = (entry.results ?? []).map((result) => {
      const range = parseRange(result.range)
      const history = resultEntries
        .flatMap((resultEntry) => resultEntry.results?.map((item) => ({ date: resultEntry.date, item })) ?? [])
        .filter((row) => row.item.marker === result.marker)
        .map((row) => ({ date: row.date, value: row.item.value }))
        .sort((a, b) => a.date.localeCompare(b.date))

      return {
        name: result.marker,
        value: result.value,
        unit: result.unit,
        normalMin: range.min,
        normalMax: range.max,
        flag: result.flag,
        history: ensureLongHistory(history.length ? history : [{ date: entry.date, value: result.value }], result.marker)
      }
    })

    return {
      id: entry.id,
      date: entry.date,
      type: entry.type,
      tenant: entry.provider,
      status: entry.status ?? 'Published',
      biomarkers
    }
  })
}

function estimateBaselineTsh(reports: LabReport[]) {
  const tshSeries = reports
    .flatMap((report) => report.biomarkers)
    .filter((marker) => marker.name.toLowerCase() === 'tsh')
    .flatMap((marker) => marker.history)
    .sort((a, b) => a.date.localeCompare(b.date))

  return tshSeries[tshSeries.length - 1]?.value ?? 2.5
}

function buildMoodBiology(seedPatient: SeedPatient, tshBase: number): MoodBiologyPoint[] {
  const anchor = new Date('2025-10-01T00:00:00.000Z')
  return seedPatient.wellness.moodScore.map((mood, index) => {
    const date = new Date(anchor)
    date.setMonth(anchor.getMonth() + index)
    return {
      date: date.toISOString().slice(0, 10),
      mood,
      tsh: Number((tshBase + (index % 2 === 0 ? 0.2 : -0.2)).toFixed(1))
    }
  })
}

function buildScanStudy(seedPatient: SeedPatient): ScanStudy {
  const radiology = seedPatient.history.find((entry) => entry.type.toLowerCase() === 'radiology')

  return {
    study: radiology?.study ?? 'MRI General Study',
    modality: radiology?.modality ?? 'MR',
    provider: radiology?.provider ?? 'Imaging Provider',
    dicomSeriesId: radiology?.dicomSeriesId ?? `DICOM-${seedPatient.uid}`,
    images: withTenSlices(radiology?.images ?? [])
  }
}

function buildPatient(seedPatient: SeedPatient): Patient {
  const reports = buildReports(seedPatient)
  const tshBase = estimateBaselineTsh(reports)

  return {
    id: seedPatient.uid,
    name: seedPatient.name,
    age: seedPatient.age,
    labLocation: countryToLabLocation(seedPatient.country),
    address: `${seedPatient.city}, ${seedPatient.country}`,
    homeMap: seedPatient.homeMap,
    reports,
    scanStudy: buildScanStudy(seedPatient),
    moodBiology: buildMoodBiology(seedPatient, tshBase),
    phq9Score: seedPatient.wellness.phq9,
    isAdult: seedPatient.wellness.isAdult
  }
}

function buildExpandedPatientSet(basePatients: Patient[]) {
  const syntheticProfiles: Array<{
    id: string
    name: string
    address: string
    labLocation: LabLocation
    homeMap: { x: number; y: number }
  }> = [
    { id: 'PT-4401', name: 'Hira Mahmood', address: 'Rawalpindi, PK', labLocation: 'Pakistan', homeMap: { x: 63, y: 19 } },
    { id: 'PT-4402', name: 'Yousef Al-Dossari', address: 'Dammam, SA', labLocation: 'Saudi Arabia', homeMap: { x: 72, y: 38 } },
    { id: 'PT-4403', name: 'Lina Rahman', address: 'Abu Dhabi, AE', labLocation: 'United Arab Emirates', homeMap: { x: 82, y: 57 } },
    { id: 'PT-4404', name: 'Farhan Siddiqui', address: 'Multan, PK', labLocation: 'Pakistan', homeMap: { x: 58, y: 28 } },
    { id: 'PT-4405', name: 'Noor Al-Hassan', address: 'Jeddah, SA', labLocation: 'Saudi Arabia', homeMap: { x: 69, y: 49 } }
  ]

  const derived = syntheticProfiles.map((profile, index) => {
    const source = basePatients[index % basePatients.length]
    const dayOffset = (index + 1) * 14

    return {
      ...source,
      id: profile.id,
      name: profile.name,
      labLocation: profile.labLocation,
      address: profile.address,
      homeMap: profile.homeMap,
      reports: source.reports.map((report, reportIndex) => ({
        ...report,
        id: `${report.id}-${profile.id}`,
        date: shiftDate(report.date, dayOffset + reportIndex * 3),
        biomarkers: report.biomarkers.map((marker) => ({
          ...marker,
          value: Number((marker.value + (index + 1) * 0.4).toFixed(2)),
          history: marker.history.map((point, pointIndex) => ({
            date: shiftDate(point.date, dayOffset + pointIndex),
            value: Number((point.value + (index + 1) * 0.2).toFixed(2))
          }))
        }))
      })),
      scanStudy: {
        ...source.scanStudy,
        dicomSeriesId: `${source.scanStudy.dicomSeriesId}-${profile.id}`
      },
      moodBiology: source.moodBiology.map((point, pointIndex) => ({
        date: shiftDate(point.date, dayOffset + pointIndex),
        mood: Math.max(1, Math.min(10, point.mood + (pointIndex % 2 === 0 ? 1 : 0))),
        tsh: Number((point.tsh + 0.2).toFixed(1))
      }))
    }
  })

  return [...basePatients, ...derived]
}

export const vitaliaData: VitaliaData = {
  tenantConfig: vitaliaSeedJson.tenantConfig,
  patients: buildExpandedPatientSet(vitaliaSeedJson.patients.map(buildPatient)),
  labQueue: vitaliaSeedJson.labQueue,
  labData: {
    revenueByCurrency: {
      USD: { dailySales: 12450, pendingClaims: 4680, outstandingInvoices: 3120 },
      PKR: { dailySales: 12450, pendingClaims: 4680, outstandingInvoices: 3120 },
      SAR: { dailySales: 12450, pendingClaims: 4680, outstandingInvoices: 3120 },
      AED: { dailySales: 12450, pendingClaims: 4680, outstandingInvoices: 3120 }
    },
    paymentMix: {
      selfPayCount: 79,
      insuredCount: 46
    },
    billingLedger: [
      {
        id: 'INV-1001',
        patientName: 'Aisha Khan',
        test: 'Hematology Panel',
        payerType: 'Self-Pay',
        totalUsd: 120,
        collectedUpfrontUsd: 120,
        outstandingUsd: 0,
        claimStatus: 'N/A'
      },
      {
        id: 'INV-1002',
        patientName: 'Mariam Al-Saud',
        test: 'Thyroid Panel',
        payerType: 'Insurance',
        totalUsd: 210,
        collectedUpfrontUsd: 0,
        outstandingUsd: 210,
        claimStatus: 'Submitted'
      },
      {
        id: 'INV-1003',
        patientName: 'Omar Nasser',
        test: 'MRI Knee',
        payerType: 'Insurance',
        totalUsd: 440,
        collectedUpfrontUsd: 0,
        outstandingUsd: 440,
        claimStatus: 'In Review'
      },
      {
        id: 'INV-1004',
        patientName: 'Farhan Siddiqui',
        test: 'Cardio Metabolic',
        payerType: 'Self-Pay',
        totalUsd: 160,
        collectedUpfrontUsd: 160,
        outstandingUsd: 0,
        claimStatus: 'N/A'
      }
    ],
    connectors: [
      {
        id: 'CON-01',
        name: 'Roche Cobas Pro',
        vendor: 'Roche',
        dataType: 'Chemistry',
        interfaceStandard: 'HL7 v2.5.1 (LAW)',
        transport: 'TCP/IP',
        endpoint: 'tcp://10.12.1.44:2575',
        authMode: 'mTLS',
        syncEnabled: true,
        status: 'Connected',
        lastSync: '2026-03-04 10:12 UTC'
      },
      {
        id: 'CON-02',
        name: 'Sysmex XN-1000',
        vendor: 'Sysmex',
        dataType: 'Hematology',
        interfaceStandard: 'ASTM LIS2 Serial',
        transport: 'Serial RS-232',
        endpoint: '/dev/ttyS1 -> LIS Gateway',
        authMode: 'None',
        syncEnabled: true,
        status: 'Connected',
        lastSync: '2026-03-04 10:09 UTC'
      },
      {
        id: 'CON-03',
        name: 'PACS Bridge',
        vendor: 'Orthanc',
        dataType: 'Imaging',
        interfaceStandard: 'DICOM',
        transport: 'TCP/IP',
        endpoint: 'dicom://10.22.5.18:104',
        authMode: 'mTLS',
        syncEnabled: false,
        status: 'Disconnected',
        lastSync: '2026-03-03 19:42 UTC'
      },
      {
        id: 'CON-04',
        name: 'Abbott Alinity',
        vendor: 'Abbott',
        dataType: 'Immunoassay',
        interfaceStandard: 'REST/FHIR API',
        transport: 'HTTPS',
        endpoint: 'https://api.vendor.local/fhir',
        authMode: 'Token',
        syncEnabled: false,
        status: 'Error',
        lastSync: '2026-03-03 16:15 UTC'
      }
    ],
    inventory: [
      {
        id: 'INV-STK-001',
        name: 'Metformin 500mg',
        category: 'Medication',
        stockOnHand: 320,
        reorderAt: 180,
        unit: 'tablets',
        sourceType: 'POS Sync',
        sourceRef: 'POS-PO-1042',
        complianceStatus: 'Not Applicable',
        lastTestedOn: null,
        operationalStatus: 'Not Applicable'
      },
      {
        id: 'INV-STK-002',
        name: 'TSH Chemiluminescence Reagent',
        category: 'Medication',
        stockOnHand: 64,
        reorderAt: 80,
        unit: 'vials',
        sourceType: 'Purchase Order Sync',
        sourceRef: 'ERP-PR-22091',
        complianceStatus: 'Not Applicable',
        lastTestedOn: null,
        operationalStatus: 'Not Applicable'
      },
      {
        id: 'INV-STK-003',
        name: 'Vitamin D Assay Test Kit',
        category: 'Test Kit',
        stockOnHand: 46,
        reorderAt: 55,
        unit: 'kits',
        sourceType: 'POS Sync',
        sourceRef: 'POS-PO-1047',
        complianceStatus: 'Not Applicable',
        lastTestedOn: null,
        operationalStatus: 'Not Applicable'
      },
      {
        id: 'INV-STK-004',
        name: 'HbA1c Rapid Test Kit',
        category: 'Test Kit',
        stockOnHand: 39,
        reorderAt: 50,
        unit: 'kits',
        sourceType: 'Manual Entry',
        sourceRef: 'FRONTDESK-ENTRY-77',
        complianceStatus: 'Not Applicable',
        lastTestedOn: null,
        operationalStatus: 'Not Applicable'
      },
      {
        id: 'INV-EQP-001',
        name: 'Roche Cobas Pro',
        category: 'Equipment',
        stockOnHand: 1,
        reorderAt: 1,
        unit: 'machine',
        sourceType: 'Purchase Order Sync',
        sourceRef: 'ERP-PO-1128',
        complianceStatus: 'Compliant',
        lastTestedOn: '2026-02-18',
        operationalStatus: 'Operational'
      },
      {
        id: 'INV-EQP-002',
        name: 'Sysmex XN-1000',
        category: 'Equipment',
        stockOnHand: 1,
        reorderAt: 1,
        unit: 'machine',
        sourceType: 'Purchase Order Sync',
        sourceRef: 'ERP-PO-1131',
        complianceStatus: 'Due Soon',
        lastTestedOn: '2025-12-30',
        operationalStatus: 'Operational'
      },
      {
        id: 'INV-EQP-003',
        name: 'Centrifuge CF-220',
        category: 'Equipment',
        stockOnHand: 2,
        reorderAt: 1,
        unit: 'machine',
        sourceType: 'Manual Entry',
        sourceRef: 'BIOMED-ADHOC-14',
        complianceStatus: 'Expired',
        lastTestedOn: '2025-10-06',
        operationalStatus: 'Maintenance'
      }
    ],
    staff: [
      { id: 'ST-01', name: 'Adeel Raza', role: 'Admin', branch: 'Lahore Central', accessLevel: 'Full' },
      { id: 'ST-02', name: 'Mina Saeed', role: 'Front Desk', branch: 'Lahore Central', accessLevel: 'Operational' },
      { id: 'ST-03', name: 'Dr. Hina Qureshi', role: 'Pathologist', branch: 'Karachi North', accessLevel: 'Clinical' },
      { id: 'ST-04', name: 'Dr. Faisal Noor', role: 'Radiologist', branch: 'Riyadh Prime', accessLevel: 'Clinical' }
    ],
    facilities: [
      { id: 'FAC-01', name: 'Al-Hayat Central', city: 'Lahore', status: 'Active' },
      { id: 'FAC-02', name: 'Al-Hayat Karachi North', city: 'Karachi', status: 'Active' },
      { id: 'FAC-03', name: 'Al-Hayat Riyadh Prime', city: 'Riyadh', status: 'Onboarding' }
    ],
    phlebotomists: [
      { id: 'PHL-01', name: 'Ayesha Khan', partner: 'Bykea ColdChain', region: 'Lahore', transitTempC: 4.8, status: 'En Route' },
      { id: 'PHL-02', name: 'Nawaf Al-Mutairi', partner: 'Aramex MedExpress', region: 'Riyadh', transitTempC: 5.1, status: 'Collecting' },
      { id: 'PHL-03', name: 'Sara Malik', partner: 'Aramex UAE MedLine', region: 'Dubai', transitTempC: 4.3, status: 'At Lab' }
    ]
  },
  doctorPortal: {
    sessionMinutes: 20
  },
  logisticsPartners: {
    Pakistan: 'Bykea ColdChain',
    'Saudi Arabia': 'Aramex MedExpress',
    'United Arab Emirates': 'Aramex UAE MedLine'
  },
  courierTracker: {
    phlebotomist: 'Ayesha Khan',
    etaMinutes: 18,
    startMap: { x: 10, y: 86 }
  }
}
