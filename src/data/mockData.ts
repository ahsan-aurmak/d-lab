export type CurrencyCode = 'PKR' | 'SAR' | 'AED'
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

export type InventoryItem = {
  reagent: string
  stockLeft: number
  reorderAt: number
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
    otp: string
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
    currency: 'PKR',
    primaryColor: '#0066FF',
    logoUrl: 'https://logo.placeholder.com/150'
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
        history: history.length ? history : [{ date: entry.date, value: result.value }]
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

export const vitaliaData: VitaliaData = {
  tenantConfig: vitaliaSeedJson.tenantConfig,
  patients: vitaliaSeedJson.patients.map(buildPatient),
  labQueue: vitaliaSeedJson.labQueue,
  labData: {
    revenueByCurrency: {
      PKR: { dailySales: 1860000, pendingClaims: 420000, outstandingInvoices: 240000 },
      SAR: { dailySales: 48000, pendingClaims: 12800, outstandingInvoices: 8200 },
      AED: { dailySales: 52000, pendingClaims: 14200, outstandingInvoices: 9100 }
    },
    inventory: [
      { reagent: 'Glucose Kits', stockLeft: 50, reorderAt: 70 },
      { reagent: 'CBC Reagent Pack', stockLeft: 28, reorderAt: 40 },
      { reagent: 'TSH Chemiluminescence Cartridges', stockLeft: 16, reorderAt: 30 },
      { reagent: 'Vitamin D Panels', stockLeft: 22, reorderAt: 35 }
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
    otp: '739245',
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
