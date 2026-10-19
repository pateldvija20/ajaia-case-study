export type Status = 'mismatch' | 'missing' | 'waiting' | 'ready' | 'bound'

export interface Broker {
  name: string
  firm: string
  email: string
  phone: string
}

export interface DocField {
  key: string
  label: string
  value: string
}

export interface SourceDoc {
  title: string
  kind: string
  source: string
  received: string
  fields: DocField[]
}

export interface Diff {
  id: string
  field: string
  leftKey: string
  rightKey: string
  left: string
  right: string
  confidence: number
  note: string
}

export interface ChecklistItem {
  id: string
  label: string
  state: 'done' | 'missing' | 'empty'
  detail?: string
  suggestion?: { value: string; from: string }
}

export interface DocRef {
  id: string
  name: string
  type: string
  source: string
  received: string
  /** key into application / counterDoc for a rich preview */
  preview?: 'application' | 'counter'
}

export interface Submission {
  id: string
  client: string
  line: string
  policyNo: string
  effective: string
  received: string
  week: 'current' | 'older'
  broker: Broker
  status: Status
  reason: string
  /** demo day on which the broker was first asked */
  waitingSince?: number
  /** demo day of last contact (request, follow-up or call) */
  lastContact?: number
  /** demo day the user chose to wait until */
  snoozedUntil?: number
  followUps?: number
  askedFor?: string
  boundOn?: string
  checklistCount: number
  /** demo day the submission arrived (0 = Tue 14 Apr) */
  receivedDay: number
  boundDay?: number
  /** follow-up threshold in days, set per policy by the underwriting assistant */
  followUpDays: number
  documents: DocRef[]
  application: SourceDoc
  counterDoc?: SourceDoc
  diffs?: Diff[]
  checklist?: ChecklistItem[]
}

export type Decision = 'real' | 'acceptable'

export interface CaptureDoc {
  id: string
  file: string
  type: string
  source: 'Email attachment' | 'Broker portal' | 'Fax scan (uploaded)'
  from: string
  matchId: string
  confidence: number
  candidates?: string[]
  /** submission whose documents give the rich preview */
  previewOf?: { sub: string; doc: 'application' | 'counter' }
  state: 'matched' | 'uncertain' | 'confirmed' | 'reassigned'
}

export type AppSection = 'status' | 'checklist' | 'docs' | 'followup' | 'bind'
export type AppsTab = 'open' | 'review' | 'closed'

export type Screen =
  | { name: 'capture' }
  | { name: 'home' }
  | { name: 'applications'; tab: AppsTab }
  | { name: 'app'; id: string; section?: AppSection }
