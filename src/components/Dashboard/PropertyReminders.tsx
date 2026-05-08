import React, { useState } from 'react';
import { Bell, X, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import type { SavedMortgage } from '../../types/mortgage';
import type { Insurance } from '../../types/insurance';
import { formatCurrency } from '../../utils/formatting';

interface Reminder {
  id: string;
  type: 'lease' | 'insurance';
  severity: 'urgent' | 'warning' | 'info';
  title: string;
  subtitle: string;
  daysLeft: number;
  actionPath?: string;
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function buildReminders(mortgages: SavedMortgage[], insurances: Insurance[]): Reminder[] {
  const reminders: Reminder[] = [];

  // Lease reminders (2.5 months = 76 days)
  for (const m of mortgages) {
    if (m.propertyType !== 'investment' || !m.leases) continue;
    for (const lease of m.leases) {
      const days = daysUntil(lease.leaseEndDate);
      if (days > 76 || days < -30) continue; // only show if within 76 days or just expired
      reminders.push({
        id: `lease-${lease.id}`,
        type: 'lease',
        severity: days < 0 ? 'urgent' : days <= 30 ? 'urgent' : 'warning',
        title: days < 0
          ? `Lease expired — ${m.name}`
          : `Lease expiring soon — ${m.name}`,
        subtitle: `Tenant: ${lease.tenantName} · ${formatCurrency(lease.monthlyRent)}/mo · ends ${new Date(lease.leaseEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
        daysLeft: days,
        actionPath: '/dashboard',
      });
    }
  }

  // Insurance renewal reminders (60 days)
  for (const ins of insurances) {
    const days = daysUntil(ins.coverageEndDate);
    if (days > 60 || days < -14) continue;
    reminders.push({
      id: `ins-${ins.id}`,
      type: 'insurance',
      severity: days < 0 ? 'urgent' : days <= 14 ? 'urgent' : 'warning',
      title: days < 0
        ? `Insurance expired — ${ins.provider}`
        : `Insurance renewal due — ${ins.provider}`,
      subtitle: `Policy #${ins.policyNumber} · ${ins.category.charAt(0).toUpperCase() + ins.category.slice(1)} · renews ${new Date(ins.coverageEndDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      daysLeft: days,
      actionPath: '/insurance',
    });
  }

  return reminders.sort((a, b) => a.daysLeft - b.daysLeft);
}

interface PropertyRemindersProps {
  mortgages: SavedMortgage[];
  insurances: Insurance[];
}

const PropertyReminders: React.FC<PropertyRemindersProps> = ({ mortgages, insurances }) => {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState(true);

  const allReminders = buildReminders(mortgages, insurances);
  const visible = allReminders.filter(r => !dismissed.has(r.id));

  if (visible.length === 0) return null;

  const urgentCount = visible.filter(r => r.severity === 'urgent').length;

  const severityStyle = (s: Reminder['severity']) => {
    if (s === 'urgent') return 'border-red-200 bg-red-50';
    return 'border-amber-200 bg-amber-50';
  };
  const dotStyle = (s: Reminder['severity']) => s === 'urgent' ? 'bg-red-500' : 'bg-amber-500';
  const titleStyle = (s: Reminder['severity']) => s === 'urgent' ? 'text-red-800' : 'text-amber-800';
  const subStyle = (s: Reminder['severity']) => s === 'urgent' ? 'text-red-600' : 'text-amber-700';

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-soft overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Bell className="w-4.5 h-4.5 text-slate-600" />
            {urgentCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {urgentCount}
              </span>
            )}
          </div>
          <span className="text-sm font-bold text-slate-800">Reminders</span>
          <span className="text-xs text-slate-400">{visible.length} alert{visible.length !== 1 ? 's' : ''}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 border-t border-slate-100">
          {visible.map(r => (
            <div key={r.id} className={`flex items-start gap-3 p-3 rounded-xl border ${severityStyle(r.severity)}`}>
              <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${dotStyle(r.severity)}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-xs font-bold ${titleStyle(r.severity)}`}>{r.title}</p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                    r.daysLeft < 0 ? 'bg-red-200 text-red-800' : 'bg-white/60 text-amber-800'
                  }`}>
                    {r.daysLeft < 0 ? `${Math.abs(r.daysLeft)}d overdue` : `${r.daysLeft}d left`}
                  </span>
                </div>
                <p className={`text-[11px] mt-0.5 ${subStyle(r.severity)}`}>{r.subtitle}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                {r.actionPath && (
                  <a href={r.actionPath} className={`p-1 rounded-lg hover:bg-white/50 ${titleStyle(r.severity)}`}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => setDismissed(d => new Set([...d, r.id]))}
                  className={`p-1 rounded-lg hover:bg-white/50 ${titleStyle(r.severity)}`}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
          <p className="text-[10px] text-slate-400 px-1">
            For automated email reminders, connect Firebase Scheduled Functions — see docs.
          </p>
        </div>
      )}
    </div>
  );
};

export default PropertyReminders;
