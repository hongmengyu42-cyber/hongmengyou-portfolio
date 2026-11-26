import type { LinkStatus } from '../../api/adminTypes';
import { Badge } from '../../components/ui/Badge';
import { formatDateTime } from '../../lib/format';

const LABEL: Record<LinkStatus, string> = {
  UNKNOWN: 'Not checked',
  OK: 'Link OK',
  BROKEN: 'Link broken',
  BLOCKED: 'Link blocked',
};

/** Status is always spelled out in words (never colour alone), with the time of the last check. */
export function LinkStatusBadge({ status, checkedAt }: { status: LinkStatus; checkedAt?: string | null }) {
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Badge tone={status === 'OK' ? 'accent' : status === 'UNKNOWN' ? 'neutral' : 'outline'}>{LABEL[status]}</Badge>
      {status !== 'UNKNOWN' ? <span className="text-xs text-muted">Checked {formatDateTime(checkedAt)}</span> : null}
    </span>
  );
}
