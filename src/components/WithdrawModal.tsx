import React, { useState } from 'react';
import { X, ArrowUpRight, CheckCircle2, Wallet, Smartphone, Gift, AlertCircle, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sound } from '../utils/sound';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  gems: number;
  onWithdraw: (amount: number, method: string) => void;
  soundEnabled: boolean;
  isBn: boolean;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  isOpen,
  onClose,
  balance,
  onWithdraw,
  soundEnabled,
  isBn,
}) => {
  const [method, setMethod] = useState<'bkash' | 'nagad' | 'recharge' | 'giftcard'>('bkash');
  const [accountNumber, setAccountNumber] = useState('');
  const [amountCoins, setAmountCoins] = useState(1000);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const bdtValue = (amountCoins / 10).toFixed(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (balance < amountCoins) {
      alert(isBn ? 'আপনার পর্যাপ্ত কয়েন নেই! অনুগ্রহ করে আগে আর্ন করুন।' : 'Insufficient balance! Please earn more coins first.');
      return;
    }
    if (!accountNumber) {
      alert(isBn ? 'অনুগ্রহ করে অ্যাকাউন্ট নম্বর দিন' : 'Please enter your account number/email');
      return;
    }

    sound.playSuccess(soundEnabled);
    try {
      confetti({ particleCount: 70, spread: 60 });
    } catch {
      // ignore
    }

    onWithdraw(amountCoins, method.toUpperCase());
    setSuccessMessage(
      isBn
        ? `৳${bdtValue} BDT উইথড্র রিকোয়েস্ট সফল হয়েছে! (${method.toUpperCase()} এ খুব শীঘ্রই পৌঁছাবে)`
        : `Withdrawal request for ৳${bdtValue} BDT sent successfully!`
    );

    setTimeout(() => {
      setSuccessMessage(null);
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1a1c23] border border-zinc-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-white space-y-5 max-h-[92dvh] sm:max-h-[88vh] my-auto overflow-y-auto custom-scrollbar">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm shrink-0">
              <Wallet className="w-5 h-5" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white font-['Outfit']">
              {isBn ? 'কয়েন রিডিম / উইথড্র' : 'Redeem & Cash Out'}
            </h3>
          </div>
          <button
            onClick={() => {
              sound.playClick(soundEnabled);
              onClose();
            }}
            className="p-2 rounded-xl bg-[#242731] hover:bg-[#2e323e] text-zinc-400 hover:text-white transition-colors border border-zinc-800 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {successMessage ? (
          <div className="p-6 rounded-2xl bg-[#0f1115] border border-emerald-500/40 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto animate-bounce" />
            <h4 className="font-bold text-base text-white font-['Outfit']">{isBn ? 'অভিনন্দন!' : 'Success!'}</h4>
            <p className="text-xs text-emerald-300 font-medium">{successMessage}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Method selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                {isBn ? 'পেমেন্ট মাধ্যম বেছে নিন' : 'Payment Method'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMethod('bkash')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    method === 'bkash'
                      ? 'bg-rose-500/10 border-rose-500/60 text-rose-300 ring-2 ring-rose-500/20'
                      : 'bg-[#14161c] border-zinc-800 text-zinc-300 hover:bg-[#242731]'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-rose-400" />
                  <span>bKash (বিকাশ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('nagad')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    method === 'nagad'
                      ? 'bg-orange-500/10 border-orange-500/60 text-orange-300 ring-2 ring-orange-500/20'
                      : 'bg-[#14161c] border-zinc-800 text-zinc-300 hover:bg-[#242731]'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-orange-400" />
                  <span>Nagad (নগদ)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('recharge')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    method === 'recharge'
                      ? 'bg-cyan-500/10 border-cyan-500/60 text-cyan-300 ring-2 ring-cyan-500/20'
                      : 'bg-[#14161c] border-zinc-800 text-zinc-300 hover:bg-[#242731]'
                  }`}
                >
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>Mobile Top-up</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('giftcard')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                    method === 'giftcard'
                      ? 'bg-purple-500/10 border-purple-500/60 text-purple-300 ring-2 ring-purple-500/20'
                      : 'bg-[#14161c] border-zinc-800 text-zinc-300 hover:bg-[#242731]'
                  }`}
                >
                  <Gift className="w-4 h-4 text-purple-400" />
                  <span>Gift Card</span>
                </button>
              </div>
            </div>

            {/* Amount Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                {isBn ? 'কয়েনের পরিমাণ' : 'Coin Package'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 2000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountCoins(amt)}
                    className={`py-2 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      amountCoins === amt
                        ? 'bg-amber-500/15 border-amber-400 text-amber-300 ring-2 ring-amber-400/30'
                        : 'bg-[#14161c] border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <div className="font-mono">{amt} Coins</div>
                    <div className="text-[10px] text-emerald-400 font-semibold">≈ ৳{amt / 10}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Account Input */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                {method === 'giftcard'
                  ? isBn
                    ? 'ইমেইল অ্যাড্রেস'
                    : 'Recipient Email'
                  : isBn
                  ? 'মোবাইল নম্বর (017...)'
                  : 'Phone Number'}
              </label>
              <input
                type="text"
                required
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder={method === 'giftcard' ? 'email@example.com' : '01XXXXXXXXX'}
                className="w-full px-4 py-2.5 rounded-xl bg-[#14161c] border border-zinc-800 text-white text-sm focus:outline-hidden focus:border-amber-400 transition-colors"
              />
            </div>

            <div className="flex items-center gap-2 p-3 rounded-xl bg-[#14161c] border border-zinc-800/80 text-[11px] text-zinc-400">
              <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span>
                {isBn
                  ? 'উইথড্র করার পর ১-২৪ ঘণ্টার মধ্যে টাকা স্বয়ংক্রিয়ভাবে প্রদান করা হয়।'
                  : 'Payouts are verified and processed securely within 1-24 hours.'}
              </span>
            </div>

            <button
              type="submit"
              disabled={balance < amountCoins}
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-black font-black text-xs uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>{isBn ? `৳${bdtValue} BDT উইথড্র করুন` : `Withdraw ৳${bdtValue} BDT`}</span>
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
