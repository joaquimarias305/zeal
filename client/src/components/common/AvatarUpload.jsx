import { useRef, useState } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const MAX_MB = 5;

export default function AvatarUpload({
  currentUrl,
  name = 'avatar',
  endpoint = '/uploads/avatar',
  size = 'lg',
  onUploaded,
}) {
  const { updateUser } = useAuth();
  const inputRef = useRef(null);
  const [preview, setPreview] = useState(currentUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const sizeCls = size === 'lg' ? 'w-24 h-24 text-3xl' : 'w-16 h-16 text-xl';
  const initials = name?.[0]?.toUpperCase() || '?';

  const handleFile = async (file) => {
    if (!file) return;
    if (!['image/jpeg','image/png','image/webp'].includes(file.type)) {
      toast.error('Solo se permiten imágenes JPEG, PNG o WebP');
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`La imagen no puede superar ${MAX_MB} MB`);
      return;
    }

    // Local preview while uploading
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append(endpoint.includes('logo') ? 'logo' : 'avatar', file);

      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          setProgress(Math.round((e.loaded / e.total) * 100));
        },
      });

      const uploadedUrl = data.avatar_url || data.logo_url;
      setPreview(uploadedUrl);

      if (endpoint.includes('avatar')) {
        updateUser({ avatar_url: uploadedUrl });
      }

      toast.success('Imagen actualizada ✅');
      onUploaded?.(uploadedUrl);
    } catch (err) {
      setPreview(currentUrl || null);
      toast.error(err.response?.data?.error || 'Error al subir la imagen');
    } finally {
      setUploading(false);
      setProgress(0);
      URL.revokeObjectURL(objectUrl);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className={`relative rounded-2xl overflow-hidden ${sizeCls} flex-shrink-0
          bg-brand-100 flex items-center justify-center
          hover:opacity-90 transition-opacity cursor-pointer group`}
        title="Cambiar foto"
      >
        {preview ? (
          <img src={preview} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <span className="font-bold text-brand-600">{initials}</span>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100
          transition-opacity flex items-center justify-center rounded-2xl">
          <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
          </svg>
        </div>

        {/* Upload progress ring */}
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
            <div className="relative w-10 h-10">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="#e5e7eb" strokeWidth="3"/>
                <circle cx="18" cy="18" r="15" fill="none" stroke="#f97316" strokeWidth="3"
                  strokeDasharray={`${(progress / 100) * 94} 94`}
                  strokeLinecap="round"/>
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-brand-600">
                {progress}%
              </span>
            </div>
          </div>
        )}
      </button>

      {/* Hidden input */}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/jpeg,image/png,image/webp"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <p className="text-xs text-gray-400">
        {uploading ? 'Subiendo…' : 'Toca para cambiar foto (máx. 5 MB)'}
      </p>
    </div>
  );
}
