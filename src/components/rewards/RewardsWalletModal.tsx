import React, { useState, useEffect } from 'react';
import { PartnerCoupon, PointsLedgerEntry, UserRedemption } from '../../types/rewards';
import { calculateUserPointsBalance, validateCouponRedemption, generateRedemptionCode } from '../../scoring/rewards';
import { useAccessibility } from '../../context/AccessibilityContext';
import { X, Award, Gift, Ticket, History, Check, AlertCircle, Sparkles, QrCode } from 'lucide-react';

interface RewardsWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  coupons: PartnerCoupon[];
  ledger: PointsLedgerEntry[];
  redemptions: UserRedemption[];
  onRedeemCoupon: (coupon: PartnerCoupon, newRedemption: UserRedemption, pointsDelta: number) => void;
}

export const RewardsWalletModal: React.FC<RewardsWalletModalProps> = ({
  isOpen,
  onClose,
  coupons,
  ledger,
  redemptions,
  onRedeemCoupon,
}) => {
  const { announce } = useAccessibility();
  const [activeTab, setActiveTab] = useState<'catalog' | 'passes' | 'ledger'>('catalog');
  const [redemptionError, setRedemptionError] = useState('');
  const [justRedeemedCode, setJustRedeemedCode] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const currentBalance = calculateUserPointsBalance(ledger);

  const handleClaim = (coupon: PartnerCoupon) => {
    setRedemptionError('');
    const validation = validateCouponRedemption(coupon, currentBalance, redemptions);

    if (!validation.isValid) {
      setRedemptionError(validation.error || 'Failed to redeem coupon.');
      return;
    }

    const code = generateRedemptionCode();
    const newRedemption: UserRedemption = {
      id: 'redemption-' + Date.now(),
      userId: 'demo-user-blr-01',
      couponId: coupon.id,
      couponTitle: coupon.title,
      venueName: coupon.venueName,
      discountValue: coupon.discountValue,
      redemptionCode: code,
      status: 'active',
      expiresAt: coupon.expiresAt,
      createdAt: new Date().toISOString(),
    };

    onRedeemCoupon(coupon, newRedemption, -coupon.pointsCost);
    setJustRedeemedCode(code);
    setActiveTab('passes');
    announce(`Successfully redeemed ${coupon.title}! Your code is ${code}.`);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm overflow-y-auto"
    >
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 md:p-8 my-8 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500 text-white rounded-2xl shadow-md">
              <Award className="w-7 h-7" aria-hidden="true" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                AccessPath Rewards
              </span>
              <h2 id="wallet-modal-title" className="text-2xl font-black text-slate-900 dark:text-white">
                Accessibility Wallet
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close rewards wallet dialog"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Balance Card */}
        <div className="p-5 bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-white rounded-2xl shadow-md mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-100 block">
              Verified Accessible Points
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black tracking-tight">{currentBalance}</span>
              <span className="text-sm font-bold text-amber-100">pts available</span>
            </div>
            <p className="text-xs text-amber-100 mt-1">
              Earned exclusively through verified, geofenced public place audits.
            </p>
          </div>

          <div className="p-3 bg-black/15 backdrop-blur-sm rounded-xl text-xs space-y-1">
            <span className="font-bold block uppercase text-[10px] text-amber-200">How You Earn:</span>
            <div>• Base review: <strong>50 pts</strong></div>
            <div>• Photo verified: <strong>+50 pts</strong></div>
            <div>• First mapper bonus: <strong>+200 pts</strong></div>
          </div>
        </div>

        {redemptionError && (
          <div
            role="alert"
            className="p-3.5 mb-4 bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 rounded-xl text-rose-900 dark:text-rose-200 text-xs flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
            <span>{redemptionError}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 mb-6" role="tablist">
          <button
            role="tab"
            aria-selected={activeTab === 'catalog'}
            onClick={() => setActiveTab('catalog')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all min-h-[44px] ${
              activeTab === 'catalog'
                ? 'border-sky-600 text-sky-700 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Redeem Partner Coupons ({coupons.length})</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'passes'}
            onClick={() => setActiveTab('passes')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all min-h-[44px] ${
              activeTab === 'passes'
                ? 'border-sky-600 text-sky-700 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Ticket className="w-4 h-4" />
            <span>My Active Passes ({redemptions.filter((r) => r.status === 'active').length})</span>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'ledger'}
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold border-b-2 transition-all min-h-[44px] ${
              activeTab === 'ledger'
                ? 'border-sky-600 text-sky-700 dark:text-sky-400'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Points Ledger Audit</span>
          </button>
        </div>

        {/* Tab 1: Coupons Catalog */}
        {activeTab === 'catalog' && (
          <div className="space-y-3" role="tabpanel">
            {coupons.map((coupon) => {
              const canAfford = currentBalance >= coupon.pointsCost;

              return (
                <div
                  key={coupon.id}
                  className="p-4 bg-slate-50 dark:bg-slate-850 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {coupon.discountValue}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        {coupon.venueName}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {coupon.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      {coupon.description}
                    </p>

                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span>Remaining budget: {coupon.budgetRemaining} of {coupon.budgetTotal}</span>
                      <span>•</span>
                      <span>Limit: {coupon.limitPerUser} per explorer</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0 w-full sm:w-auto">
                    <span className="text-lg font-black text-amber-700 dark:text-amber-400">
                      {coupon.pointsCost} pts
                    </span>

                    <button
                      type="button"
                      disabled={!canAfford || coupon.budgetRemaining <= 0}
                      onClick={() => handleClaim(coupon)}
                      className="px-5 py-2 bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-sm min-h-[44px] disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {canAfford ? 'Redeem Voucher' : 'Need More Points'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Tab 2: My Active Passes */}
        {activeTab === 'passes' && (
          <div className="space-y-4" role="tabpanel">
            {redemptions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 dark:bg-slate-850 rounded-2xl border text-slate-500">
                You haven't claimed any partner vouchers yet. Redeem one with your points above!
              </div>
            ) : (
              redemptions.map((redemption) => (
                <div
                  key={redemption.id}
                  className="p-5 bg-gradient-to-br from-white to-sky-50 dark:from-slate-900 dark:to-slate-850 rounded-2xl border-2 border-sky-400/60 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-300">
                        Active Partner Pass
                      </span>
                      <span className="text-xs text-slate-500">
                        {redemption.venueName}
                      </span>
                    </div>

                    <h3 className="text-lg font-black text-slate-900 dark:text-white">
                      {redemption.couponTitle}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      Present this verification code or QR to venue staff at billing to redeem.
                    </p>
                  </div>

                  {/* Code Card */}
                  <div className="p-3 bg-white dark:bg-slate-800 rounded-xl border-2 border-dashed border-sky-500 text-center shrink-0">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Merchant Claim Code
                    </span>
                    <span className="text-xl font-mono font-black text-sky-700 dark:text-sky-300 tracking-wider">
                      {redemption.redemptionCode}
                    </span>
                    <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-slate-500">
                      <QrCode className="w-3.5 h-3.5 text-sky-600" />
                      <span>Ready for Scan</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Append-Only Points Ledger Audit */}
        {activeTab === 'ledger' && (
          <div className="space-y-2" role="tabpanel">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2">
              Append-Only Points Ledger (Audit Trail)
            </h3>

            {ledger.map((entry) => (
              <div
                key={entry.id}
                className="p-3.5 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">
                    {entry.description}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(entry.createdAt).toLocaleDateString()} • Status: {entry.escrowStatus}
                  </span>
                </div>

                <span
                  className={`text-sm font-extrabold ${
                    entry.pointsDelta > 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {entry.pointsDelta > 0 ? `+${entry.pointsDelta}` : entry.pointsDelta} pts
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
            Close Wallet
          </button>
        </div>
      </div>
    </div>
  );
};
