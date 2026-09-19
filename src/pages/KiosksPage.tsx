import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Wifi,
  WifiOff,
  Printer,
  RefreshCw,
  Search,
  Info,
  MapPin,
  Activity,
  ExternalLink,
  PlusCircle,
  Map as MapIcon,
  Image as ImageIcon,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingState, EmptyState } from '../components/common/FeedbackStates';
import { KioskItem, KioskStatus, Role } from '../types';
import { getKiosksList, updateKioskStatus } from '../services/api/kiosks';
import { KioskFormModal } from './KioskFormModal';

interface KiosksPageProps {
  role: Role;
}

// ── Inline location map panel (no separate modal needed) ────────────────────
const MAPS_API_KEY = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || '';

function buildEmbedUrl(lat: number, lng: number): string {
  if (!MAPS_API_KEY) return '';
  return `https://www.google.com/maps/embed/v1/place?key=${MAPS_API_KEY}&q=${lat},${lng}&zoom=15`;
}

function buildExternalUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

// ── Location panel shown inside the detail modal ───────────────────────────
interface LocationPanelProps {
  kiosk: KioskItem;
}
const LocationPanel: React.FC<LocationPanelProps> = ({ kiosk }) => {
  const hasInstallCoords = kiosk.latitude != null && kiosk.longitude != null;
  const hasLastKnown = kiosk.lastKnownLatitude != null && kiosk.lastKnownLongitude != null;
  const embedUrl = hasInstallCoords ? buildEmbedUrl(kiosk.latitude!, kiosk.longitude!) : '';

  const row = (label: string, value: React.ReactNode) => (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.4rem 0',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '0.825rem',
        gap: '0.5rem',
      }}
    >
      <span style={{ color: 'var(--slate-500)', whiteSpace: 'nowrap' }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: 'right' }}>{value}</span>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>

      {/* Installation Photo */}
      {kiosk.installationPhotoPath && (
        <div
          style={{
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              padding: '0.4rem 0.75rem',
              background: 'var(--slate-50)',
              fontWeight: 600,
              fontSize: '0.8rem',
              borderBottom: '1px solid var(--border-color)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--slate-700)',
            }}
          >
            <ImageIcon size={14} /> Installation Photo
          </div>
          <img
            src={kiosk.installationPhotoPath}
            alt="Kiosk installation"
            style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', display: 'block' }}
          />
        </div>
      )}

      {/* Installation Location */}
      <div
        style={{
          padding: '0.75rem',
          background: 'var(--trust-50)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: 'var(--trust-700)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <MapPin size={12} /> Installation Location
        </div>

        {row('Address', kiosk.location || '—')}
        {row('District / State', `${kiosk.district}, ${kiosk.state}`)}

        {hasInstallCoords ? (
          <>
            {row('Latitude', kiosk.latitude!.toFixed(6))}
            {row('Longitude', kiosk.longitude!.toFixed(6))}
            {kiosk.locationAccuracy != null &&
              row('Accuracy', `± ${kiosk.locationAccuracy.toFixed(0)} m`)}
            {kiosk.locationSource &&
              row('Source', kiosk.locationSource.toUpperCase())}
            {row(
              'Open in Maps',
              <a
                href={buildExternalUrl(kiosk.latitude!, kiosk.longitude!)}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: 'var(--primary-600)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                <ExternalLink size={13} /> Open in Google Maps
              </a>
            )}
          </>
        ) : (
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--slate-400)',
              fontStyle: 'italic',
              padding: '0.25rem 0',
            }}
          >
            No GPS coordinates recorded for this kiosk.
          </div>
        )}
      </div>

      {/* Embedded map for installation coords */}
      {hasInstallCoords && (
        <div style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
          <div
            style={{
              padding: '0.4rem 0.75rem',
              background: 'var(--slate-50)',
              fontSize: '0.8rem',
              fontWeight: 600,
              color: 'var(--slate-700)',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            Map Preview
          </div>
          {embedUrl ? (
            <iframe
              width="100%"
              height="220"
              frameBorder="0"
              style={{ border: 0, display: 'block' }}
              src={embedUrl}
              allowFullScreen
              title="Kiosk location map"
            />
          ) : (
            <div
              style={{
                padding: '1.5rem',
                textAlign: 'center',
                background: 'var(--slate-50)',
                fontSize: '0.8rem',
                color: 'var(--slate-500)',
              }}
            >
              Map preview unavailable.{' '}
              <a
                href={buildExternalUrl(kiosk.latitude!, kiosk.longitude!)}
                target="_blank"
                rel="noreferrer"
                style={{ color: 'var(--primary-600)' }}
              >
                Open in Google Maps ↗
              </a>
            </div>
          )}
        </div>
      )}

      {/* Last Known Location */}
      <div
        style={{
          padding: '0.75rem',
          background: hasLastKnown ? 'var(--success-50)' : 'var(--slate-50)',
          borderRadius: '8px',
          border: '1px solid var(--border-color)',
        }}
      >
        <div
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            color: hasLastKnown ? 'var(--success-700)' : 'var(--slate-400)',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
          }}
        >
          <Activity size={12} /> Last Known Location (Device Telemetry)
        </div>

        {hasLastKnown ? (
          <>
            {row('Latitude', kiosk.lastKnownLatitude!.toFixed(6))}
            {row('Longitude', kiosk.lastKnownLongitude!.toFixed(6))}
            {kiosk.lastLocationUpdate &&
              row('Updated', kiosk.lastLocationUpdate)}
            {row(
              'Open in Maps',
              <a
                href={buildExternalUrl(kiosk.lastKnownLatitude!, kiosk.lastKnownLongitude!)}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  color: 'var(--primary-600)',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                <ExternalLink size={13} /> Open in Google Maps
              </a>
            )}
          </>
        ) : (
          <div
            style={{
              fontSize: '0.8rem',
              color: 'var(--slate-400)',
              fontStyle: 'italic',
            }}
          >
            No device location update received.
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Page ──────────────────────────────────────────────────────────────
export const KiosksPage: React.FC<KiosksPageProps> = ({ role }) => {
  const [loading, setLoading] = useState(true);
  const [kiosks, setKiosks] = useState<KioskItem[]>([]);
  const [isRealBackend, setIsRealBackend] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKiosk, setSelectedKiosk] = useState<KioskItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'location' | 'telemetry' | 'usage'>('details');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editKiosk, setEditKiosk] = useState<KioskItem | null>(null);

  const fetchKiosks = async () => {
    setLoading(true);
    try {
      const res = await getKiosksList();
      setKiosks(res.kiosks);
      setIsRealBackend(res.isRealBackend);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKiosks();
  }, []);

  const total = kiosks.length;
  const online = kiosks.filter((k) => k.status === 'online').length;
  const offline = kiosks.filter((k) => k.status === 'offline').length;
  const maintenance = kiosks.filter((k) => k.status === 'maintenance').length;

  const filteredKiosks = kiosks.filter((k) => {
    const matchesStatus = filterStatus === 'all' || k.status === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchesQuery =
      !searchQuery ||
      k.id.toLowerCase().includes(q) ||
      k.name.toLowerCase().includes(q) ||
      k.location.toLowerCase().includes(q) ||
      k.pacsName.toLowerCase().includes(q) ||
      k.district.toLowerCase().includes(q);
    return matchesStatus && matchesQuery;
  });

  const handleOpenDetail = (kiosk: KioskItem, tab: 'details' | 'location' | 'telemetry' | 'usage' = 'details') => {
    setSelectedKiosk(kiosk);
    setActiveModalTab(tab);
    setIsDetailOpen(true);
  };

  const handleToggleMaintenance = async (kiosk: KioskItem) => {
    const newStatus: KioskStatus = kiosk.status === 'maintenance' ? 'online' : 'maintenance';
    const res = await updateKioskStatus(kiosk.id, newStatus);
    setNotificationMsg(res.message);
    setTimeout(() => setNotificationMsg(null), 4000);
    if (res.updated) {
      setKiosks((prev) => prev.map((item) => (item.id === kiosk.id ? res.updated! : item)));
      if (selectedKiosk && selectedKiosk.id === kiosk.id) setSelectedKiosk(res.updated);
    } else {
      setKiosks((prev) => prev.map((item) => (item.id === kiosk.id ? { ...item, status: newStatus } : item)));
      if (selectedKiosk && selectedKiosk.id === kiosk.id) setSelectedKiosk({ ...selectedKiosk, status: newStatus });
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {/* Toast Feedback */}
      {notificationMsg && (
        <div
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'var(--trust-50)',
            border: '1px solid #93c5fd',
            borderRadius: 'var(--radius-md)',
            color: 'var(--trust-800)',
            fontSize: '0.85rem',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <Info size={16} />
          {notificationMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--slate-900)' }}>
              Kiosk Hardware Fleet Monitoring
            </h2>
            {isRealBackend ? (
              <Badge variant="live">Live Backend Data • /api/admin/kiosks</Badge>
            ) : (
              <Badge variant="demo">Telemetry Simulation</Badge>
            )}
          </div>
          <p style={{ fontSize: '0.875rem', color: 'var(--slate-500)', marginTop: '0.2rem' }}>
            Real-time status, printer diagnostics, network telemetry, and heartbeat monitoring of rural PACS touchpoints.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => { setEditKiosk(null); setIsFormOpen(true); }}
            className="btn btn-primary btn-sm"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <PlusCircle size={15} /> Add Kiosk
          </button>
          <button onClick={fetchKiosks} className="btn btn-secondary btn-sm">
            <RefreshCw size={14} /> Refresh Heartbeats
          </button>
        </div>
      </div>

      {/* Fleet Overview Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '1rem' }}>
        {[
          { label: 'Total Deployed Kiosks', value: total, sub: 'All rural PACS locations', color: 'var(--slate-900)', bg: '#fff', status: 'all', border: filterStatus === 'all' ? 'var(--primary-700)' : 'var(--border-color)' },
          { label: 'Online & Ready', value: online, sub: 'Serving citizens actively', color: 'var(--success-700)', bg: 'var(--success-50)', status: 'online', border: filterStatus === 'online' ? 'var(--success-700)' : 'transparent' },
          { label: 'Under Maintenance', value: maintenance, sub: 'Printer / sync attention', color: 'var(--warning-700)', bg: 'var(--warning-50)', status: 'maintenance', border: filterStatus === 'maintenance' ? 'var(--warning-700)' : 'transparent' },
          { label: 'Offline / Disconnected', value: offline, sub: 'Power / network severed', color: 'var(--danger-700)', bg: 'var(--danger-50)', status: 'offline', border: filterStatus === 'offline' ? 'var(--danger-700)' : 'transparent' },
        ].map(({ label, value, sub, color, bg, status, border }) => (
          <div
            key={status}
            onClick={() => setFilterStatus(status)}
            style={{ cursor: 'pointer', padding: '1rem', backgroundColor: bg, borderRadius: 'var(--radius-lg)', border: `2px solid ${border}` }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color, textTransform: 'uppercase' }}>{label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color, marginTop: '0.25rem' }}>{value}</div>
            <div style={{ fontSize: '0.75rem', color }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 220px)' }}>
          <Search
            size={16}
            style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}
          />
          <input
            type="text"
            placeholder="Search by Kiosk ID, PACS name, taluka, or district..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
          />
        </div>
        <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--slate-500)', fontWeight: 600 }}>Filter:</span>
          {(['all', 'online', 'maintenance', 'offline'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
              style={{ textTransform: 'capitalize' }}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Kiosks Table */}
      {loading ? (
        <LoadingState message="Polling kiosk heartbeat pings..." />
      ) : filteredKiosks.length === 0 ? (
        <EmptyState
          title="No Kiosks Found"
          description={`No kiosks match the filter "${filterStatus}" or query "${searchQuery}".`}
          action={
            <button onClick={() => { setFilterStatus('all'); setSearchQuery(''); }} className="btn btn-secondary btn-sm">
              Reset Filters
            </button>
          }
        />
      ) : (
        <div className="table-responsive card" style={{ padding: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Kiosk ID</th>
                <th>PACS / Centre</th>
                <th>Location</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>Printer</th>
                <th>Network</th>
                <th>Version</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredKiosks.map((kiosk) => {
                const isOnline = kiosk.status === 'online';
                const isMaintenance = kiosk.status === 'maintenance';
                const hasCoords = kiosk.latitude != null && kiosk.longitude != null;

                return (
                  <tr key={kiosk.id}>
                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--trust-700)', fontSize: '0.85rem' }}>
                        {kiosk.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--slate-900)' }}>{kiosk.pacsName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{kiosk.name}</div>
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{kiosk.district}, {kiosk.state}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>{kiosk.location}</div>
                      {hasCoords && (
                        <button
                          onClick={() => handleOpenDetail(kiosk, 'location')}
                          title="View map location"
                          style={{
                            marginTop: '0.25rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            fontSize: '0.72rem',
                            fontWeight: 600,
                            color: 'var(--primary-600)',
                            background: 'var(--primary-50)',
                            border: '1px solid var(--primary-200)',
                            borderRadius: '4px',
                            padding: '0.15rem 0.4rem',
                            cursor: 'pointer',
                          }}
                        >
                          <MapIcon size={11} /> View Map
                        </button>
                      )}
                    </td>
                    <td>
                      <Badge
                        variant={isOnline ? 'success' : isMaintenance ? 'warning' : 'danger'}
                        icon={isOnline ? <span className="pulse-dot" /> : undefined}
                      >
                        {kiosk.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>{kiosk.lastActive}</td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: kiosk.health.printer === 'ready' ? 'var(--success-700)' : kiosk.health.printer === 'low_paper' ? 'var(--warning-700)' : 'var(--danger-700)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Printer size={13} />
                        {kiosk.health.printer === 'ready' ? 'Ready' : kiosk.health.printer === 'low_paper' ? 'Paper Low' : 'Check Roll'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: kiosk.health.network === 'online' ? 'var(--success-700)' : 'var(--danger-700)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        {kiosk.health.network === 'online' ? <Wifi size={13} /> : <WifiOff size={13} />}
                        {kiosk.health.network}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>{kiosk.softwareVersion}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                        <button
                          onClick={() => handleOpenDetail(kiosk, 'details')}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          View Details
                        </button>
                        {hasCoords && (
                          <button
                            onClick={() => handleOpenDetail(kiosk, 'location')}
                            className="btn btn-secondary btn-sm"
                            title="View location on map"
                            style={{ padding: '0.25rem 0.5rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}
                          >
                            <MapPin size={12} /> Map
                          </button>
                        )}
                        <button
                          onClick={() => handleToggleMaintenance(kiosk)}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem', color: isMaintenance ? 'var(--success-700)' : 'var(--warning-700)' }}
                          title={isMaintenance ? 'Return to Online status' : 'Mark for maintenance inspection'}
                        >
                          {isMaintenance ? 'Clear Mnt' : 'Mark Mnt'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Kiosk Modal */}
      {isFormOpen && (
        <KioskFormModal
          initialData={editKiosk || undefined}
          onClose={() => { setIsFormOpen(false); setEditKiosk(null); }}
          onSaved={(newKiosk) => {
            if (editKiosk) {
              setKiosks(kiosks.map((k) => (k.id === newKiosk.id ? newKiosk : k)));
            } else {
              setKiosks([newKiosk, ...kiosks]);
            }
            setIsFormOpen(false);
            setEditKiosk(null);
            setNotificationMsg(`Kiosk ${newKiosk.name} saved successfully.`);
            setTimeout(() => setNotificationMsg(null), 3000);
          }}
        />
      )}

      {/* Kiosk Detail Modal */}
      {selectedKiosk && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Kiosk: ${selectedKiosk.id}`}
          subtitle={`${selectedKiosk.pacsName} · ${selectedKiosk.location}`}
          badge={
            <Badge
              variant={selectedKiosk.status === 'online' ? 'success' : selectedKiosk.status === 'maintenance' ? 'warning' : 'danger'}
            >
              {selectedKiosk.status}
            </Badge>
          }
          maxWidth="740px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                ℹ️ Remote restart disabled (backend hardware bridge not provisioned).
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => { setIsDetailOpen(false); setEditKiosk(selectedKiosk); setIsFormOpen(true); }}
                  className="btn btn-secondary btn-sm"
                >
                  Edit Kiosk
                </button>
                <button onClick={() => handleToggleMaintenance(selectedKiosk)} className="btn btn-secondary btn-sm">
                  {selectedKiosk.status === 'maintenance' ? 'Set as Online' : 'Mark Maintenance'}
                </button>
                <button onClick={() => setIsDetailOpen(false)} className="btn btn-primary btn-sm">
                  Close
                </button>
              </div>
            </div>
          }
        >
          {/* Tabs */}
          <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
            {(
              [
                { id: 'details', label: 'Hardware Health' },
                { id: 'location', label: '📍 Location & Map' },
                { id: 'usage', label: 'Citizen Usage' },
                { id: 'telemetry', label: 'Telemetry Logs' },
              ] as const
            ).map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setActiveModalTab(id)}
                className={`btn btn-sm ${activeModalTab === id ? 'btn-primary' : 'btn-secondary'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab: Hardware Health */}
          {activeModalTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {/* Health Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                {[
                  { label: 'DEVICE HEALTH', value: selectedKiosk.health.device, ok: selectedKiosk.health.device === 'ok' },
                  { label: 'NETWORK', value: selectedKiosk.health.network, ok: selectedKiosk.health.network === 'online' },
                  { label: 'THERMAL PRINTER', value: selectedKiosk.health.printer, ok: selectedKiosk.health.printer === 'ready' },
                  { label: 'KNOWLEDGE SYNC', value: selectedKiosk.health.sync, ok: selectedKiosk.health.sync === 'synced' },
                ].map(({ label, value, ok }) => (
                  <div key={label} style={{ padding: '0.75rem', background: 'var(--slate-50)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                    <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600 }}>{label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 700, color: ok ? 'var(--success-700)' : 'var(--warning-700)', marginTop: '0.2rem' }}>
                      {value.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Hardware Spec List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.65rem', fontSize: '0.825rem' }}>
                {[
                  { label: 'Local IP Address', value: selectedKiosk.ipAddress, mono: true },
                  { label: 'Software Version', value: selectedKiosk.softwareVersion, mono: true },
                  { label: 'Installation Date', value: selectedKiosk.installationDate },
                  { label: 'Uptime (30 Days)', value: `${selectedKiosk.uptimePercent}%`, highlight: 'var(--success-700)' },
                  { label: 'Last Heartbeat Ping', value: selectedKiosk.lastActive },
                  { label: 'Voice STT Engine', value: 'Bhashini + Groq Whisper' },
                ].map(({ label, value, mono, highlight }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                    <span style={{ color: 'var(--slate-500)' }}>{label}:</span>
                    <span style={{ fontWeight: 600, fontFamily: mono ? 'var(--font-mono)' : undefined, color: highlight }}>{value}</span>
                  </div>
                ))}
              </div>

              {selectedKiosk.notes && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--trust-50)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--trust-800)' }}>
                  <strong>Field Notes:</strong> {selectedKiosk.notes}
                </div>
              )}
            </div>
          )}

          {/* Tab: Location & Map */}
          {activeModalTab === 'location' && <LocationPanel kiosk={selectedKiosk} />}

          {/* Tab: Citizen Usage */}
          {activeModalTab === 'usage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '1rem', background: 'var(--primary-50)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600 }}>QUERIES SERVED TODAY</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)' }}>{selectedKiosk.queriesToday}</div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--trust-50)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--trust-700)', fontWeight: 600 }}>LIFETIME QUERIES</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--trust-800)' }}>{selectedKiosk.totalQueries.toLocaleString()}</div>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                Most common farmer query domain on this kiosk: <strong>PMFBY Crop Insurance & KCC renewal</strong>. Over 82% of sessions utilized Marathi voice input.
              </p>
            </div>
          )}

          {/* Tab: Telemetry */}
          {activeModalTab === 'telemetry' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.5rem' }}>
              <div
                style={{
                  backgroundColor: 'var(--slate-900)',
                  color: '#f8fafc',
                  padding: '1rem',
                  borderRadius: '6px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  maxHeight: '240px',
                  overflowY: 'auto',
                  lineHeight: 1.6,
                }}
              >
                <div>[18:32:10] HEARTBEAT_PING status=OK latency=42ms</div>
                <div>[18:32:11] AUDIO_MIC input_stream_ready=true sample_rate=16000Hz</div>
                <div>[18:32:15] PRINTER_STATUS paper_level=NORMAL temp=32C cutter=OK</div>
                <div>[18:32:20] KNOWLEDGE_CACHE version=2025.03.10 hash=9f82ab synced=true</div>
                <div>[18:32:25] AI_PROXY target=https://sih26088-cooperative-ai.onrender.com code=200</div>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};
