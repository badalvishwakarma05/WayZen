import React, { useState, useEffect } from 'react';
import { PartnerCoupon, PartnerVenue, UserRedemption } from '../../types/rewards';
import { Venue } from '../../types/accessibility';
import { useAccessibility } from '../../context/AccessibilityContext';
import { X, Store, PlusCircle, CheckCircle2, QrCode, AlertCircle, ShieldCheck } from 'lucide-react';

interface VenuePartnerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  venues: Venue[];
  partners: PartnerVenue[];
  coupons: PartnerCoupon[];
  redemptions: UserRedemption[];
  onCreateCoupon: (coupon: PartnerCoupon) => void;
  onVerifyRedemption: (code: string) => boolean;
}

export const VenuePartnerPortalModal: React.FC<VenuePartnerPortalModalProps> = ({
  isOpen,
  onClose,
  venues,
  partners,
  coupons,
  redemptions,
  onCreateCoupon,
  onVerifyRedemption,
}) => {
  const { announce } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'verify' | 'create' | 'coupons'>('verify');

  // Verify redemption code state
  const [codeToVerify, setCodeToVerify] = useState('');
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Create coupon form state
  const [selectedVenueId, setSelectedVenueId] = useState(venues[0]?.id || '');
  const [couponTitle, setCouponTitle] = useState('');
  const [discountValue, setDiscountValue] = useState('');
  const [pointsCost, setPointsCost] = useState(150);
  const [budgetTotal, setBudgetTotal] = useState(50);
  const [limitPerUser, setLimitPerUser] = useState(1);
  const [expiryDays, setExpiryDays] = useState(30);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = codeToVerify.trim().toUpperCase();
    if (!clean) return;

    const success = onVerifyRedemption(clean);
    if (success) {
      setVerificationResult({
        success: true,
        message: `Success! Code ${clean} verified and marked as REDEEMED. Apply discount to customer bill.`,
      });
      announce(`Code ${clean} successfully verified.`);
      setCodeToVerify('');
    } else {
      setVerificationResult({
        success: false,
        message: `Invalid or expired code: ${clean}. Please check the customer's active pass screen.`,
      });
    }
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const venue = venues.find((v) => v.id === selectedVenueId);
    if (!venue || !couponTitle.trim()) return;

    const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();

    const newCoupon: PartnerCoupon = {
      id: 'coupon-' + Date.now(),
      partnerId: 'partner-active-01',
      venueId: venue.id,
      venueName: venue.name,
      title: couponTitle.trim(),
      description: `Partner reward voucher for ${venue.name}.`,
      pointsCost,
      discountValue: discountValue.trim() || '15% Off Bill',
      budgetTotal,
      budgetRemaining: budgetTotal,
      limitPerUser,
      expiresAt,
      isActive: true,
    };

    onCreateCoupon(newCoupon);
    announce(`Created new reward coupon: ${newCoupon.title}`);
    setActiveTab('coupons');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600 text-white rounded-2xl shadow-md">
              <Store className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Merchant Operations
              </span>
              <h2 id="partner-modal-title" className="text-2xl font-black text-slate-900 dark:text-white">
                Venue Partner Portal
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close partner portal dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tab navigation */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 mb-6" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'verify'}
            onClick={() => setActiveTab('verify')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all min-h-[44px] ${
              activeTab === 'verify'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Verify Customer Code / QR</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'create'}
            onClick={() => setActiveTab('create')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all min-h-[44px] ${
              activeTab === 'create'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Coupon</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'coupons'}
            onClick={() => setActiveTab('coupons')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all min-h-[44px] ${
              activeTab === 'coupons'
                ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>My Active Coupons ({coupons.length})</span>
          </button>
        </div>

        {/* Tab 1: Live Verification */}
        {activeTab === 'verify' && (
          <div className="space-y-4" role="tabpanel">
            <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
                Redeem Customer AccessPass Code
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Enter the 8-character code shown on the customer's phone or simulated scanner.
              </p>

              <form onSubmit={handleVerifyCode} className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={codeToVerify}
                    onChange={(e) => setCodeToVerify(e.target.value.toUpperCase())}
                    placeholder="e.g. AP-4K9M-BLR"
                    className="flex-1 px-4 py-2.5 font-mono text-base font-black uppercase rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none min-h-[48px]"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md min-h-[48px]"
                  >
                    Verify & Mark Used
                  </button>
                </div>
              </form>

              {verificationResult && (
                <div
                  role="alert"
                  className={`mt-4 p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
                    verificationResult.success
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 text-rose-900 dark:text-rose-200'
                  }`}
                >
                  {verificationResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span className="font-semibold">{verificationResult.message}</span>
                </div>
              )}
            </div>

            {/* Quick Demo Assist */}
            <div className="p-3 bg-sky-50 dark:bg-sky-950/40 rounded-xl border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200">
              <span className="font-bold">Test Codes Currently in Wallet: </span>
              {redemptions.filter((r) => r.status === 'active').map((r) => r.redemptionCode).join(', ') || 'No active passes yet'}
            </div>
          </div>
        )}

        {/* Tab 2: Create Coupon */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateCoupon} className="space-y-4" role="tabpanel">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Select Venue Listing *
                </label>
                <select
                  value={selectedVenueId}
                  onChange={(e) => setSelectedVenueId(e.target.value)}
                  className="w-full text-xs font-semibold bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none min-h-[44px]"
                >
                  {venues.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Coupon Title *
                </label>
                <input
                  type="text"
                  required
                  value={couponTitle}
                  onChange={(e) => setCouponTitle(e.target.value)}
                  placeholder="e.g. 20% Off Weekend Brunch"
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Discount Value *
                </label>
                <input
                  type="text"
                  required
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder="e.g. 20% off total bill"
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Points Cost *
                </label>
                <input
                  type="number"
                  required
                  min={50}
                  step={50}
                  value={pointsCost}
                  onChange={(e) => setPointsCost(Number(e.target.value))}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Total Redemption Budget Cap *
                </label>
                <input
                  type="number"
                  required
                  min={5}
                  value={budgetTotal}
                  onChange={(e) => setBudgetTotal(Number(e.target.value))}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1">
                  Limit Per User *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={5}
                  value={limitPerUser}
                  onChange={(e) => setLimitPerUser(Number(e.target.value))}
                  className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-2.5 focus:outline-none min-h-[44px]"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md min-h-[44px]"
              >
                Publish Coupon Listing
              </button>
            </div>
          </form>
        )}

        {/* Tab 3: Active Coupons */}
        {activeTab === 'coupons' && (
          <div className="space-y-3" role="tabpanel">
            {coupons.map((c) => (
              <div
                key={c.id}
                className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-extrabold text-sm text-slate-900 dark:text-white block">
                    {c.title}
                  </span>
                  <span className="text-slate-500">
                    {c.venueName} • Cost: {c.pointsCost} pts • Budget remaining: {c.budgetRemaining}/{c.budgetTotal}
                  </span>
                </div>
                <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Active
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800 mt-6">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs rounded-xl min-h-[44px]"
          >
            Close Partner Portal
          </button>
        </div>
      </div>
    </div>
  );
};
