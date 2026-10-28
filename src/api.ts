const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://127.0.0.1:8000'

export type ApiRecord = {
  userId: number
  country: string | null
  age: number | null
  gender: string | null
  occupation: string | null
  education: string | null
  income: number | null
  screenTime: number | null
  phoneUnlocks: number | null
  socialMedia: number | null
  gaming: number | null
  streaming: number | null
  messaging: number | null
  work: number | null
  sleep: number | null
  physicalActivity: number | null
  mentalHealth: number | null
  depression: number | null
  anxiety: number | null
  stress: number | null
  relationshipStatus: string | null
  hasChildren: string | null
  urbanRural: string | null
  familyTime: number | null
  onlineShopping: number | null
  internetType: string | null
  deviceBrand: string | null
  hasScreenTimeApp: string | null
  addiction: string | null
  monthlyDataUsage: number | null
  hasNightMode: string | null
  ageFirstPhone: number | null
  pushNotifications: number | null
  techSavviness: number | null
}

export type UsageRecord = {
  id: number
  age: number
  gender: 'Female' | 'Male' | 'Other'
  screenTime: number
  sleep: number
  stress: number
  physicalActivity: number
  notifications: number
  socialMedia: number
  gaming: number
  otherApps: number
  addiction: 'Low' | 'Moderate' | 'High' | 'Severe'
}

export type ApiMetadata = {
  dataset: string
  rows: number
  columns: number
  missing_values: Record<string, number>
  missing_total: number
  duplicate_rows: number
  column_types: Record<string, string>
  age_min: number
  age_max: number
  gender_counts: Record<string, number>
  addiction_counts: Record<string, number>
}

export type RecordsResponse = {
  total: number
  limit: number
  offset: number
  records: ApiRecord[]
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`)
  }
  return (await response.json()) as T
}

export async function fetchRecords(): Promise<RecordsResponse> {
  const data = await request<RecordsResponse>('/records?limit=5000&offset=0')
  return data
}

export async function fetchMetadata(): Promise<ApiMetadata> {
  return request<ApiMetadata>('/metadata')
}

export function mapRecord(record: ApiRecord): UsageRecord {
  const tracked =
    (record.socialMedia ?? 0) +
    (record.gaming ?? 0) +
    (record.streaming ?? 0) +
    (record.messaging ?? 0) +
    (record.work ?? 0)
  const otherApps = Math.max(0, (record.screenTime ?? 0) - tracked)
  const gender = (record.gender === 'Male' || record.gender === 'Female' || record.gender === 'Other')
    ? record.gender
    : 'Other'
  const addiction = (record.addiction === 'Low' || record.addiction === 'Moderate' || record.addiction === 'High' || record.addiction === 'Severe')
    ? record.addiction
    : 'Low'
  return {
    id: record.userId ?? 0,
    age: record.age ?? 0,
    gender,
    screenTime: record.screenTime ?? 0,
    sleep: record.sleep ?? 0,
    stress: record.stress ?? 0,
    physicalActivity: record.physicalActivity ?? 0,
    notifications: record.pushNotifications ?? 0,
    socialMedia: record.socialMedia ?? 0,
    gaming: record.gaming ?? 0,
    otherApps,
    addiction,
  }
}