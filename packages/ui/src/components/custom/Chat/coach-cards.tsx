/** Story and test support: the app-specific card lockups a coach thread carries in `data-*` parts. */
import type { DataPart } from '@titan-design/chat-protocol'
import { Pill } from '../../ui/pill'
import { Typography } from '../../ui/typography'
import { DateTime } from '../../ui/date-time'
import { ChatCard } from './ChatCard'
import { CHECKIN_PART_TYPE, type CheckinData } from './coach-thread-fixture'

/** The check-in lockup: a scheduled pill, the date, an agenda, and Confirm / Reschedule. */
export function CheckinCard({ checkin }: { checkin: CheckinData }) {
  return (
    <ChatCard
      status={
        <Pill tone="brand" leading="dot">
          Scheduled
        </Pill>
      }
      title={checkin.title}
      subtitle={
        <DateTime value={checkin.scheduledFor} format="full" variant="body2" color="secondary" />
      }
      footnote={`${checkin.durationMinutes} min`}
      actions={[
        { key: 'confirm', label: 'Confirm' },
        { key: 'reschedule', label: 'Reschedule' },
      ]}
    >
      {checkin.agenda.map((item) => (
        <Typography key={item} variant="body2">
          {`• ${item}`}
        </Typography>
      ))}
    </ChatCard>
  )
}

export function renderCoachPart(part: DataPart) {
  if (part.type !== CHECKIN_PART_TYPE) return null
  return <CheckinCard checkin={part.data as CheckinData} />
}
