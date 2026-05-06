import { motion, AnimatePresence } from 'motion/react';
import { X, Check } from 'lucide-react';
import Cropper, { Area } from 'react-easy-crop';

interface CropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageToCrop: string | null;
  crop: { x: number, y: number };
  setCrop: (crop: { x: number, y: number }) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  onCropComplete: (processedArea: Area, pixelArea: Area) => void;
  handleApplyCrop: () => void;
  isUpdating: boolean;
}

const CropModal = ({
  isOpen,
  onClose,
  imageToCrop,
  crop,
  setCrop,
  zoom,
  setZoom,
  onCropComplete,
  handleApplyCrop,
  isUpdating,
}: CropModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && imageToCrop && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold font-sans text-slate-900">Enrich Avatar</h3>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={20} className="text-slate-400" />
              </button>
            </div>
            <div className="relative h-[400px] bg-slate-50">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                cropShape="round"
                showGrid={false}
              />
            </div>
            <div className="p-8 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Magnification</span>
                  <span className="text-[10px] font-bold text-[#58334a]">{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-[#58334a]"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyCrop}
                disabled={isUpdating}
                className="w-full py-5 bg-[#58334a] text-white rounded-2xl font-bold text-[12px] uppercase tracking-[0.2em] shadow-xl shadow-purple-900/20 flex items-center justify-center gap-3 disabled:opacity-50 font-sans"
              >
                {isUpdating ? <span className="animate-spin text-xl">⏳</span> : <Check size={18} />}
                Confirm Selection
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CropModal;
