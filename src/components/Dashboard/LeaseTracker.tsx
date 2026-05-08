import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, ChevronDown, ChevronUp, User, History, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import type { Lease, RentalPeriod } from '../../types/lease';
import { formatCurrency } from '../../utils/formatting';

// ─── helpers ─────────────────────────────────────────────────────────────────

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function fmt(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function leaseStatus(lease: Lease): { label: string; color: string; icon: React.ReactNode } {
  const days = daysUntil(lease.leaseEndDate);
  if (days < 0) return { label: 'Expired', color: 'text-red-600 bg-red-50 border-red-200', icon: <X className="w-3 h-3" /> };
  if (days <= 76) return { label: `${days}d left`, color: 'text-amber-700 bg-amber-50 border-amber-200', icon: <AlertTriangle className="w-3 h-3" /> };
  return { label: 'Active', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', icon: <CheckCircle2 className="w-3 h-3" /> };
}

// ─── Add / Renew lease modal ──────────────────────────────────────────────────

interface LeaseFormProps {
  mortgageId: string;
  existing?: Lease;
  isRenewal?: boolean;
  onSave: (lease: Lease) => void;
  onClose: () => void;
}

const LeaseForm: React.FC<LeaseFormProps> = ({ mortgageId, existing, isRenewal, onSave, onClose }) => {
  const renewalStart = isRenewal && existing?.leaseEndDate ? existing.leaseEndDate : '';
  const renewalEnd = renewalStart
    ? (() => { const d = new Date(renewalStart); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; })()
    : '';

  const [f, setF] = useState({
    tenantName: existing?.tenantName ?? '',
    leaseStartDate: isRenewal ? renewalStart : (existing?.leaseStartDate ?? ''),
    leaseEndDate: isRenewal ? renewalEnd : (existing?.leaseEndDate ?? ''),
    monthlyRent: existing?.monthlyRent?.toString() ?? '',
    deposit: existing?.deposit?.toString() ?? '',
    notes: '',
  });
  const [changeReason, setChangeReason] = useState(isRenewal ? 'Renewal' : '');

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setF(prev => ({ ...prev, [k]: e.target.value }));

  const handleSave = () => {
    if (!f.tenantName || !f.leaseStartDate || !f.leaseEndDate || !f.monthlyRent) return;
    const now = new Date().toISOString();
    const newPeriod: RentalPeriod = {
      id: `rp-${Date.now()}`,
      tenantName: f.tenantName,
      startDate: f.leaseStartDate,
      endDate: f.leaseEndDate,
      monthlyRent: Number(f.monthlyRent),
      deposit: Number(f.deposit) || 0,
      effectiveFrom: now,
      effectiveTo: null,
      notes: f.notes,
    };

    let history: RentalPeriod[] = existing?.history ?? [];

    if (isRenewal && existing) {
      // SCD2: close out the current version
      history = history.map(h =>
        h.effectiveTo === null ? { ...h, effectiveTo: now } : h
      );
    }

    history = [...history, newPeriod];

    const lease: Lease = {
      id: existing?.id ?? `lease-${Date.now()}`,
      mortgageId,
      tenantName: f.tenantName,
      leaseStartDate: f.leaseStartDate,
      leaseEndDate: f.leaseEndDate,
      monthlyRent: Number(f.monthlyRent),
      deposit: Number(f.deposit) || 0,
      status: 'active',
      notes: f.notes,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
      history,
    };

    onSave(lease);
    onClose();
  };

  const INPUT = 'w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-sm';
  const LABEL = 'block text-sm font-medium text-gray-700 mb-2';

  const modal = (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-none sm:rounded-2xl shadow-xl w-full sm:max-w-lg h-full sm:h-auto sm:max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white z-10 rounded-t-2xl">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">
              {isRenewal ? 'Renew Lease' : existing ? 'Edit Lease' : 'Add Lease'}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {isRenewal ? 'Creates a new rental period and closes the current one' : 'Track tenant, rent and deposit for this property'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className={LABEL}>Tenant Name</label>
            <input className={INPUT} value={f.tenantName} onChange={set('tenantName')} placeholder="Full name" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Lease Start</label>
              <input type="date" className={INPUT} value={f.leaseStartDate} onChange={set('leaseStartDate')} />
            </div>
            <div>
              <label className={LABEL}>Lease End</label>
              <input type="date" className={INPUT} value={f.leaseEndDate} onChange={set('leaseEndDate')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Monthly Rent</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" className={INPUT + ' pl-7'} value={f.monthlyRent} onChange={set('monthlyRent')} placeholder="0" />
              </div>
            </div>
            <div>
              <label className={LABEL}>Security Deposit</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input type="number" className={INPUT + ' pl-7'} value={f.deposit} onChange={set('deposit')} placeholder="0" />
              </div>
            </div>
          </div>

          {isRenewal && (
            <div>
              <label className={LABEL}>Reason for change</label>
              <input className={INPUT} value={changeReason} onChange={e => setChangeReason(e.target.value)} placeholder="e.g. Annual renewal, Rent increase" />
            </div>
          )}

          <div>
            <label className={LABEL}>Notes <span className="text-gray-400 font-normal">(optional)</span></label>
            <textarea className={INPUT} rows={2} value={f.notes} onChange={set('notes')} placeholder="Any additional details…" />
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-4 sm:px-6 py-4 border-t border-gray-100 bg-white rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!f.tenantName || !f.leaseStartDate || !f.leaseEndDate || !f.monthlyRent}
            className="px-5 py-2 text-sm font-semibold bg-brand-primary hover:bg-blue-700 text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isRenewal ? 'Renew lease' : 'Save lease'}
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

// ─── Rental history table ─────────────────────────────────────────────────────

const RentalHistory: React.FC<{ history: RentalPeriod[] }> = ({ history }) => {
  const sorted = [...history].sort((a, b) => b.effectiveFrom.localeCompare(a.effectiveFrom));
  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold flex items-center gap-1">
        <History className="w-3 h-3" /> Rental History (SCD2)
      </p>
      <div className="border border-slate-100 rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500">
              <th className="text-left px-3 py-2 font-semibold">Period</th>
              <th className="text-left px-3 py-2 font-semibold">Tenant</th>
              <th className="text-right px-3 py-2 font-semibold">Rent/mo</th>
              <th className="text-right px-3 py-2 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(h => (
              <tr key={h.id} className="border-t border-slate-100">
                <td className="px-3 py-2 text-slate-600">{fmt(h.startDate)} – {fmt(h.endDate)}</td>
                <td className="px-3 py-2 text-slate-800 font-medium">{h.tenantName}</td>
                <td className="px-3 py-2 text-right font-mono text-slate-800">{formatCurrency(h.monthlyRent)}</td>
                <td className="px-3 py-2 text-right">
                  {h.effectiveTo === null
                    ? <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 rounded text-[10px] font-bold">CURRENT</span>
                    : <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px]">CLOSED</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Main LeaseTracker ────────────────────────────────────────────────────────

interface LeaseTrackerProps {
  mortgageId: string;
  leases: Lease[];
  onLeasesChange: (leases: Lease[]) => void;
}

const LeaseTracker: React.FC<LeaseTrackerProps> = ({ mortgageId, leases, onLeasesChange }) => {
  const [showForm, setShowForm] = useState(false);
  const [renewingLease, setRenewingLease] = useState<Lease | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAdd = (lease: Lease) => {
    onLeasesChange([...leases.filter(l => l.id !== lease.id), lease]);
  };

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this lease record?')) return;
    onLeasesChange(leases.filter(l => l.id !== id));
  };

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1">
          <User className="w-3.5 h-3.5 text-emerald-600" /> Lease Tracker
        </span>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1 text-xs font-semibold text-brand-primary hover:text-blue-700 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add lease
        </button>
      </div>

      {leases.length === 0 ? (
        <p className="text-xs text-slate-400 italic">No leases tracked yet. Add one to start monitoring.</p>
      ) : (
        <div className="space-y-2">
          {[...leases].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(lease => {
            const st = leaseStatus(lease);
            const days = daysUntil(lease.leaseEndDate);
            const isExpanded = expandedId === lease.id;

            return (
              <div key={lease.id} className="border border-slate-200 rounded-xl overflow-hidden">
                {/* Card header */}
                <div className="flex items-center justify-between px-3 py-2.5 bg-white">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${st.color}`}>
                      {st.icon} {st.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-800 truncate">{lease.tenantName}</p>
                      <p className="text-[10px] text-slate-400">{fmt(lease.leaseStartDate)} → {fmt(lease.leaseEndDate)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <div className="text-right">
                      <p className="text-sm font-bold font-mono text-slate-900">{formatCurrency(lease.monthlyRent)}<span className="text-[10px] text-slate-400 font-normal">/mo</span></p>
                    </div>
                    <button onClick={() => setExpandedId(isExpanded ? null : lease.id)} className="p-1 rounded text-slate-400 hover:text-slate-600">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="px-3 pb-3 bg-slate-50/60 border-t border-slate-100">
                    {/* 2.5-month warning (76 days) */}
                    {days > 0 && days <= 76 && (
                      <div className="mt-2 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-800">Lease expires in {days} days</p>
                          <p className="text-[10px] text-amber-700 mt-0.5">Consider reaching out to the tenant about renewal now.</p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
                      <div>
                        <p className="text-slate-400">Security deposit</p>
                        <p className="font-semibold text-slate-800">{formatCurrency(lease.deposit)}</p>
                      </div>
                      <div>
                        <p className="text-slate-400">Annual rent</p>
                        <p className="font-semibold text-emerald-700">{formatCurrency(lease.monthlyRent * 12)}</p>
                      </div>
                    </div>

                    {lease.notes && (
                      <p className="text-xs text-slate-500 mt-2 italic">"{lease.notes}"</p>
                    )}

                    {/* History */}
                    {lease.history.length > 0 && <RentalHistory history={lease.history} />}

                    <div className="flex gap-2 mt-3">
                      <button
                        onClick={() => { setRenewingLease(lease); }}
                        className="flex-1 text-xs font-semibold px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                      >
                        Renew lease
                      </button>
                      <button
                        onClick={() => handleDelete(lease.id)}
                        className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 rounded-lg transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add lease form */}
      {showForm && (
        <LeaseForm mortgageId={mortgageId} onSave={handleAdd} onClose={() => setShowForm(false)} />
      )}
      {/* Renew lease form */}
      {renewingLease && (
        <LeaseForm
          mortgageId={mortgageId}
          existing={renewingLease}
          isRenewal
          onSave={handleAdd}
          onClose={() => setRenewingLease(null)}
        />
      )}
    </div>
  );
};

export default LeaseTracker;
