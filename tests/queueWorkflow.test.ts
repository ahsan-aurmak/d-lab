import { describe, expect, it } from 'vitest'
import { applyDraftEdits, isDraftQueueItem } from '../src/lib/queueWorkflow'
import { LabQueueItem } from '../src/data/mockData'

const baseQueue: LabQueueItem[] = [
  {
    id: 'REQ-1',
    patientUid: 'PT-1',
    patientName: 'Alpha',
    test: 'Lipid Profile',
    status: 'Draft',
    values: { LDL: 155, HDL: 42 }
  },
  {
    id: 'REQ-2',
    patientUid: 'PT-2',
    patientName: 'Beta',
    test: 'CBC',
    status: 'Published',
    values: { HGB: 12.9 }
  }
]

describe('queueWorkflow', () => {
  it('identifies draft items correctly', () => {
    expect(isDraftQueueItem(baseQueue[0])).toBe(true)
    expect(isDraftQueueItem(baseQueue[1])).toBe(false)
  })

  it('applies draft edits only to the targeted draft request', () => {
    const edited = applyDraftEdits(baseQueue, 'REQ-1', { LDL: 162, HDL: 39 })
    expect(edited[0].values).toEqual({ LDL: 162, HDL: 39 })
    expect(edited[1].values).toEqual({ HGB: 12.9 })
  })

  it('does not overwrite non-draft request values', () => {
    const edited = applyDraftEdits(baseQueue, 'REQ-2', { HGB: 9.1 })
    expect(edited[1].values).toEqual({ HGB: 12.9 })
  })
})
