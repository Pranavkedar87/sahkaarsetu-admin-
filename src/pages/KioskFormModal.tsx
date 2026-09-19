import React, { useState, useRef } from 'react';
import { Camera, Upload, MapPin, Map as MapIcon, X } from 'lucide-react';
import { Modal } from '../components/common/Modal';
import { createKiosk, uploadKioskPhoto } from '../services/api/kiosks';
import { KioskItem } from '../types';

interface KioskFormModalProps {
  onClose: () => void;
  onSaved: (kiosk: KioskItem) => void;
  initialData?: KioskItem;
}

export const KioskFormModal: React.FC<KioskFormModalProps> = ({ onClose, onSaved, initialData }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [pacsName, setPacsName] = useState(initialData?.pacsName || '');
  const [location, setLocation] = useState(initialData?.location || '');
  
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>(initialData?.installationPhotoPath || '');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [latitude, setLatitude] = useState<string>(initialData?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState<string>(initialData?.longitude?.toString() || '');
  const [accuracy, setAccuracy] = useState<number | null>(initialData?.locationAccuracy || null);
  const [locationStatus, setLocationStatus] = useState<string>('');
  
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (!file.type.startsWith('image/')) {
        setErrorMsg('Please select a valid image file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size should be less than 5MB.');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
      setErrorMsg('');
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Browser does not support geolocation.');
      return;
    }
    setLocationStatus('Getting location...');
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLatitude(lat.toFixed(6));
        setLongitude(lng.toFixed(6));
        setAccuracy(position.coords.accuracy);
        setLocationStatus('Location captured');

        if (MAPS_API_KEY) {
          try {
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${MAPS_API_KEY}`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              setLocation(data.results[0].formatted_address);
            }
          } catch (e) {
            console.error('Geocoding failed', e);
          }
        }
      },
      (error) => {
        console.error(error);
        setLocationStatus('Location access was denied. Please allow location access or enter coordinates manually.');
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleSave = async () => {
    if (!name || !pacsName || !location) {
      setErrorMsg('Please fill in all required fields (Name, PACS, Address).');
      return;
    }
    setIsSaving(true);
    setErrorMsg('');

    try {
      let res;
      const payload = {
        name,
        pacs_name: pacsName,
        location,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        location_accuracy: accuracy || undefined,
        location_source: latitude && longitude ? 'gps' : undefined,
        status: initialData ? initialData.status : 'offline',
      };
      
      if (initialData) {
        // Edit flow
        const token = localStorage.getItem('sih_admin_auth');
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const editRes = await fetch(`/api/admin/kiosks/${initialData.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload)
        });
        const data = await editRes.json();
        res = { success: editRes.ok, message: 'Update success', data };
      } else {
        // Create flow
        res = await createKiosk(payload);
      }

      if (!res.success || !res.data) {
        throw new Error(res.message || 'Unable to save kiosk. Please try again.');
      }

      if (photo) {
        const uploadRes = await uploadKioskPhoto(res.data.id, photo);
        if (!uploadRes.success) {
          setErrorMsg('Kiosk saved, but photo upload failed: ' + uploadRes.message);
          setIsSaving(false);
          return;
        }
        res.data.installationPhotoPath = uploadRes.url;
      }

      onSaved(res.data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Unable to save kiosk. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const mapUrl = MAPS_API_KEY && latitude && longitude
    ? `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${latitude},${longitude}&zoom=15`
    : '';

  return (
    <Modal title="ADD NEW KIOSK" onClose={onClose} isOpen={true}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.5rem 0' }}>
        
        {errorMsg && (
          <div style={{ padding: '0.75rem', backgroundColor: 'var(--danger-50)', color: 'var(--danger-700)', borderRadius: '6px', fontSize: '0.85rem' }}>
            {errorMsg}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>Kiosk Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Nashik Central PACS Kiosk"
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>PACS / Location *</label>
          <input
            type="text"
            value={pacsName}
            onChange={(e) => setPacsName(e.target.value)}
            placeholder="e.g. Dindori Primary Agriculture Cooperative Society"
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.9rem' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>Installation Address *</label>
          <textarea
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Dindori Road, Nashik, Maharashtra"
            rows={2}
            style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', fontSize: '0.9rem', resize: 'vertical' }}
          />
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>PHOTO</label>
          {photoPreview ? (
            <div style={{ position: 'relative', width: '100%', maxWidth: '300px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
              <img src={photoPreview} alt="Preview" style={{ width: '100%', display: 'block' }} />
              <button 
                onClick={() => { setPhoto(null); setPhotoPreview(''); }}
                style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', padding: '4px', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} style={{ display: 'none' }} onChange={handlePhotoSelect} />
              <input type="file" accept="image/*" ref={fileInputRef} style={{ display: 'none' }} onChange={handlePhotoSelect} />
              
              <button onClick={() => cameraInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--slate-100)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                <Camera size={16} /> Capture Photo
              </button>
              <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'var(--slate-100)', border: '1px solid var(--border-color)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}>
                <Upload size={16} /> Upload Photo
              </button>
            </div>
          )}
        </div>

        <div style={{ borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }}></div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--slate-700)' }}>LOCATION</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Latitude:</span>
              <input type="number" step="any" value={latitude} onChange={(e) => setLatitude(e.target.value)} style={{ width: '100%', padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>Longitude:</span>
              <input type="number" step="any" value={longitude} onChange={(e) => setLongitude(e.target.value)} style={{ width: '100%', padding: '0.4rem', border: '1px solid var(--border-color)', borderRadius: '4px' }} />
            </div>
          </div>
          <button 
            onClick={handleGetCurrentLocation}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.5rem', background: 'var(--primary-50)', color: 'var(--primary-700)', border: '1px solid var(--primary-200)', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600 }}
          >
            <MapPin size={16} /> Use Current Location
          </button>
          
          {locationStatus && (
            <div style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem', color: locationStatus.includes('captured') ? 'var(--success-600)' : 'var(--slate-600)' }}>
              {locationStatus.includes('captured') && <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--success-600)' }} />}
              {locationStatus}
            </div>
          )}

          {mapUrl ? (
            <div style={{ marginTop: '0.5rem', border: '1px solid var(--border-color)', borderRadius: '6px', overflow: 'hidden', height: 200 }}>
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0 }}
                src={mapUrl}
                allowFullScreen
              />
            </div>
          ) : (latitude && longitude) ? (
            <div style={{ marginTop: '0.5rem', padding: '2rem', background: 'var(--slate-50)', textAlign: 'center', color: 'var(--slate-500)', fontSize: '0.85rem', border: '1px dashed var(--border-color)', borderRadius: '6px' }}>
              Map preview is temporarily unavailable. The saved coordinates are still available.
            </div>
          ) : null}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
          <button 
            onClick={onClose}
            disabled={isSaving}
            style={{ padding: '0.5rem 1rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            style={{ padding: '0.5rem 1.5rem', background: 'var(--primary-600)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 600 }}
          >
            {isSaving ? 'Saving...' : 'Save Kiosk'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
