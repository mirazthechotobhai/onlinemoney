import React, { useState, useRef } from 'react';
import { X, Upload, Check, Sparkles, Image as ImageIcon, Loader2, Cloud, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AVATAR_PRESETS } from '../data/initialData';
import { sound } from '../utils/sound';
import { uploadImageToImgBB } from '../services/imgbb';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatar: string;
  onSelectAvatar: (url: string) => void;
  soundEnabled: boolean;
  isBn: boolean;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  currentAvatar,
  onSelectAvatar,
  soundEnabled,
  isBn,
}) => {
  const [customUrl, setCustomUrl] = useState('');
  const [preview, setPreview] = useState(currentAvatar);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error & success states
    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);

    try {
      sound.playClick(soundEnabled);
      // Upload directly to ImgBB
      const uploadedUrl = await uploadImageToImgBB(file);

      setPreview(uploadedUrl);
      onSelectAvatar(uploadedUrl);
      sound.playSuccess(soundEnabled);
      setUploadSuccess(
        isBn
          ? 'ছবি ImgBB ক্লাউডে সফলভাবে আপলোড হয়েছে!'
          : 'Profile photo uploaded to ImgBB successfully!'
      );
    } catch (err: any) {
      console.error('ImgBB Upload Error:', err);
      setUploadError(
        err.message ||
          (isBn
            ? 'ছবি আপলোড করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
            : 'Failed to upload image. Please try again.')
      );
    } finally {
      setIsUploading(false);
      // Reset input value so same file can be re-selected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyCustomUrl = () => {
    if (customUrl.trim()) {
      setPreview(customUrl.trim());
      onSelectAvatar(customUrl.trim());
      sound.playSuccess(soundEnabled);
      setUploadSuccess(isBn ? 'কাস্টম ইমেজ লিংক সেভ করা হয়েছে!' : 'Custom image URL applied!');
      setCustomUrl('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#1a1c23] border border-zinc-800 rounded-3xl shadow-2xl p-5 sm:p-6 text-white space-y-5 max-h-[92dvh] sm:max-h-[88vh] my-auto overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-['Outfit']">
                {isBn ? 'প্রোফাইল ছবি নির্বাচন ও আপলোড' : 'Profile Photo & ImgBB Upload'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                {isBn ? 'ImgBB ক্লাউড হোস্টিং সাপোর্টেড' : 'Powered by ImgBB Cloud API'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick(soundEnabled);
              onClose();
            }}
            className="p-2 rounded-xl bg-[#242731] hover:bg-[#2e323e] text-zinc-400 hover:text-white transition-colors border border-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Selected Preview */}
        <div className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-[#0f1115] border border-zinc-800 relative overflow-hidden">
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              referrerPolicy="no-referrer"
              className="w-24 h-24 rounded-2xl object-cover ring-4 ring-amber-400/50 shadow-lg bg-[#1a1c23]"
            />
            {isUploading && (
              <div className="absolute inset-0 rounded-2xl bg-black/75 flex flex-col items-center justify-center gap-1 backdrop-blur-xs">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                <span className="text-[10px] font-bold text-amber-400">ImgBB...</span>
              </div>
            )}
          </div>
          <span className="text-xs font-semibold text-zinc-400">
            {isBn ? 'বর্তমান প্রোফাইল প্রিভিউ' : 'Current Profile Preview'}
          </span>
        </div>

        {/* Feedback messages */}
        {uploadError && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {/* ImgBB Local File Upload Section */}
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
            <span>{isBn ? 'ডিভাইস থেকে নতুন ছবি আপলোড' : 'Upload from Local Device'}</span>
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-mono lowercase">
              <Cloud className="w-3 h-3" /> ImgBB API
            </span>
          </label>

          <input
            type="file"
            ref={fileInputRef}
            accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
            onChange={handleFileUpload}
            disabled={isUploading}
            className="hidden"
            id="imgbb-file-input"
          />

          <label
            htmlFor="imgbb-file-input"
            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
              isUploading
                ? 'border-amber-400/50 bg-amber-500/5 opacity-80 cursor-wait'
                : 'border-zinc-700 hover:border-amber-400 bg-[#14161c] hover:bg-[#1a1c23] active:scale-[0.99]'
            }`}
          >
            {isUploading ? (
              <>
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                <p className="text-xs font-bold text-amber-400">
                  {isBn ? 'ImgBB তে ছবি আপলোড হচ্ছে...' : 'Uploading image to ImgBB...'}
                </p>
                <span className="text-[10px] text-zinc-400">
                  {isBn ? 'অনুগ্রহ করে একটু অপেক্ষা করুন' : 'Please wait a moment'}
                </span>
              </>
            ) : (
              <>
                <div className="p-2.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-inner">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-zinc-200">
                    {isBn ? 'ফাইল বাছাই করতে এখানে ক্লিক করুন' : 'Click to browse & upload image'}
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-0.5">
                    JPG, PNG, WEBP, GIF (Auto uploaded via ImgBB)
                  </p>
                </div>
              </>
            )}
          </label>
        </div>

        {/* Presets Grid */}
        <div className="pt-2 border-t border-zinc-800/80">
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2.5">
            {isBn ? 'অথবা রেডিমেড প্রিমিয়াম অ্যাভাটার' : 'Or Choose Preset Avatar'}
          </label>
          <div className="grid grid-cols-4 gap-2.5">
            {AVATAR_PRESETS.map((url, idx) => {
              const isSelected = preview === url;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setUploadError(null);
                    setUploadSuccess(null);
                    setPreview(url);
                    onSelectAvatar(url);
                    sound.playClick(soundEnabled);
                  }}
                  className={`relative rounded-xl p-0.5 overflow-hidden transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                    isSelected ? 'ring-2 ring-amber-400 scale-105' : 'opacity-75 hover:opacity-100'
                  }`}
                >
                  <img
                    src={url}
                    alt={`Avatar ${idx + 1}`}
                    referrerPolicy="no-referrer"
                    className="w-full h-14 object-cover rounded-[10px]"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-amber-400/25 flex items-center justify-center">
                      <div className="p-1 rounded-full bg-amber-400 text-black shadow-md">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Direct Image URL input */}
        <div className="pt-2 border-t border-zinc-800/80 space-y-2">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            {isBn ? 'সরাসরি ইমেজ লিংক (URL)' : 'Direct Image Link (URL)'}
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={customUrl}
              onChange={(e) => setCustomUrl(e.target.value)}
              placeholder="https://i.ibb.co/..."
              className="flex-1 px-3 py-2 rounded-xl bg-[#14161c] border border-zinc-800 text-white text-xs focus:outline-hidden focus:border-amber-400 transition-colors"
            />
            <button
              type="button"
              onClick={handleApplyCustomUrl}
              disabled={!customUrl.trim()}
              className="px-3 py-2 rounded-xl bg-[#242731] hover:bg-[#2e323e] disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer border border-zinc-700"
            >
              {isBn ? 'প্রয়োগ' : 'Apply'}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            sound.playSuccess(soundEnabled);
            onClose();
          }}
          className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 active:scale-98 text-black font-black text-xs uppercase tracking-wider shadow-lg transition-all cursor-pointer"
        >
          {isBn ? 'সম্পন্ন করুন' : 'Save & Close'}
        </button>
      </div>
    </div>
  );
};

