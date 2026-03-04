import { LabQueueItem } from '@/data/mockData'

export function isDraftQueueItem(item: Pick<LabQueueItem, 'status'>) {
  return item.status === 'Draft'
}

export function applyDraftEdits(
  queue: LabQueueItem[],
  requestId: string,
  editedValues: Record<string, number>
) {
  return queue.map((item) => {
    if (item.id !== requestId || !isDraftQueueItem(item)) return item
    return {
      ...item,
      values: editedValues
    }
  })
}
