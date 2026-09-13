import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Wifi,
  WifiOff,
  Printer,
  RefreshCw,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  SlidersHorizontal,
  Info,
  Layers,
  MapPin,
  Calendar,
  Activity,
  FileText,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { Modal } from '../components/common/Modal';
import { LoadingState, EmptyState } from '../components/common/FeedbackStates';
import { KioskItem, KioskStatus, Role } from '../types';
import { getKiosksList, updateKioskStatus } from '../services/api/kiosks';

interface KiosksPageProps {
  role: Role;
}

export const KiosksPage: React.FC<KiosksPageProps> = ({ role }) => {
  const [loading, setLoading] = useState(true);
  const [kiosks, setKiosks] = useState<KioskItem[]>([]);
  const [isRealBackend, setIsRealBackend] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedKiosk, setSelectedKiosk] = useState<KioskItem | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'details' | 'telemetry' | 'usage'>('details');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

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

  const handleOpenDetail = (kiosk: KioskItem, tab: 'details' | 'telemetry' | 'usage' = 'details') => {
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
      setKiosks((prev) =>
        prev.map((item) => (item.id === kiosk.id ? res.updated! : item))
      );
      if (selectedKiosk && selectedKiosk.id === kiosk.id) {
        setSelectedKiosk(res.updated);
      }
    } else {
      setKiosks((prev) =>
        prev.map((item) => (item.id === kiosk.id ? { ...item, status: newStatus } : item))
      );
      if (selectedKiosk && selectedKiosk.id === kiosk.id) {
        setSelectedKiosk({ ...selectedKiosk, status: newStatus });
      }
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

        <button onClick={fetchKiosks} className="btn btn-secondary btn-sm">
          <RefreshCw size={14} /> Refresh Heartbeats
        </button>
      </div>

      {/* Fleet Overview Counters */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 160px), 1fr))', gap: '1rem' }}>
        <div
          onClick={() => setFilterStatus('all')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${filterStatus === 'all' ? 'var(--primary-700)' : 'var(--border-color)'}`,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
            Total Deployed Kiosks
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--slate-900)', marginTop: '0.25rem' }}>
            {total}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>All rural PACS locations</div>
        </div>

        <div
          onClick={() => setFilterStatus('online')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: 'var(--success-50)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${filterStatus === 'online' ? 'var(--success-700)' : 'transparent'}`,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success-700)', textTransform: 'uppercase' }}>
            Online & Ready
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--success-700)', marginTop: '0.25rem' }}>
            {online}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--success-700)' }}>Serving citizens actively</div>
        </div>

        <div
          onClick={() => setFilterStatus('maintenance')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: 'var(--warning-50)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${filterStatus === 'maintenance' ? 'var(--warning-700)' : 'transparent'}`,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--warning-700)', textTransform: 'uppercase' }}>
            Under Maintenance
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning-700)', marginTop: '0.25rem' }}>
            {maintenance}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--warning-700)' }}>Printer / sync attention</div>
        </div>

        <div
          onClick={() => setFilterStatus('offline')}
          style={{
            cursor: 'pointer',
            padding: '1rem',
            backgroundColor: 'var(--danger-50)',
            borderRadius: 'var(--radius-lg)',
            border: `2px solid ${filterStatus === 'offline' ? 'var(--danger-700)' : 'transparent'}`,
          }}
        >
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--danger-700)', textTransform: 'uppercase' }}>
            Offline / Disconnected
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger-700)', marginTop: '0.25rem' }}>
            {offline}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--danger-700)' }}>Power / network severed</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 'min(100%, 220px)' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--slate-400)',
            }}
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
            <button
              onClick={() => {
                setFilterStatus('all');
                setSearchQuery('');
              }}
              className="btn btn-secondary btn-sm"
            >
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

                return (
                  <tr key={kiosk.id}>
                    <td>
                      <span
                        style={{
                          fontWeight: 700,
                          fontFamily: 'var(--font-mono)',
                          color: 'var(--trust-700)',
                          fontSize: '0.85rem',
                        }}
                      >
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
                    </td>
                    <td>
                      <Badge
                        variant={isOnline ? 'success' : isMaintenance ? 'warning' : 'danger'}
                        icon={isOnline ? <span className="pulse-dot" /> : undefined}
                      >
                        {kiosk.status}
                      </Badge>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                      {kiosk.lastActive}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color:
                            kiosk.health.printer === 'ready'
                              ? 'var(--success-700)'
                              : kiosk.health.printer === 'low_paper'
                              ? 'var(--warning-700)'
                              : 'var(--danger-700)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        <Printer size={13} />
                        {kiosk.health.printer === 'ready'
                          ? 'Ready'
                          : kiosk.health.printer === 'low_paper'
                          ? 'Paper Low'
                          : 'Check Roll'}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          color: kiosk.health.network === 'online' ? 'var(--success-700)' : 'var(--danger-700)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                        }}
                      >
                        {kiosk.health.network === 'online' ? <Wifi size={13} /> : <WifiOff size={13} />}
                        {kiosk.health.network}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {kiosk.softwareVersion}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenDetail(kiosk, 'details')}
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '0.25rem 0.5rem' }}
                        >
                          View Details
                        </button>
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

      {/* Kiosk Detail & Diagnostics Modal (Acceptance Demo 2) */}
      {selectedKiosk && (
        <Modal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          title={`Kiosk Telemetry: ${selectedKiosk.id}`}
          subtitle={`${selectedKiosk.pacsName} (${selectedKiosk.location})`}
          badge={
            <Badge
              variant={
                selectedKiosk.status === 'online'
                  ? 'success'
                  : selectedKiosk.status === 'maintenance'
                  ? 'warning'
                  : 'danger'
              }
            >
              {selectedKiosk.status}
            </Badge>
          }
          maxWidth="720px"
          footer={
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--slate-500)' }}>
                ℹ️ Remote restart disabled (backend hardware bridge not provisioned).
              </span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleToggleMaintenance(selectedKiosk)}
                  className="btn btn-secondary btn-sm"
                >
                  {selectedKiosk.status === 'maintenance' ? 'Set as Online' : 'Mark Maintenance'}
                </button>
                <button onClick={() => setIsDetailOpen(false)} className="btn btn-primary btn-sm">
                  Close
                </button>
              </div>
            </div>
          }
        >
          {/* Tabs inside modal */}
          <div
            style={{
              display: 'flex',
              gap: '0.5rem',
              borderBottom: '1px solid var(--border-color)',
              paddingBottom: '0.5rem',
            }}
          >
            <button
              onClick={() => setActiveModalTab('details')}
              className={`btn btn-sm ${activeModalTab === 'details' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Hardware Health
            </button>
            <button
              onClick={() => setActiveModalTab('usage')}
              className={`btn btn-sm ${activeModalTab === 'usage' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Citizen Usage
            </button>
            <button
              onClick={() => setActiveModalTab('telemetry')}
              className={`btn btn-sm ${activeModalTab === 'telemetry' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Telemetry Logs
            </button>
          </div>

          {activeModalTab === 'details' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              {/* Health Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', background: 'var(--slate-50)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600 }}>DEVICE HEALTH</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--success-700)', marginTop: '0.2rem' }}>
                    {selectedKiosk.health.device.toUpperCase()}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--slate-50)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600 }}>NETWORK</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedKiosk.health.network === 'online' ? 'var(--success-700)' : 'var(--danger-700)', marginTop: '0.2rem' }}>
                    {selectedKiosk.health.network.toUpperCase()}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--slate-50)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600 }}>THERMAL PRINTER</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedKiosk.health.printer === 'ready' ? 'var(--success-700)' : 'var(--warning-700)', marginTop: '0.2rem' }}>
                    {selectedKiosk.health.printer.toUpperCase()}
                  </div>
                </div>
                <div style={{ padding: '0.75rem', background: 'var(--slate-50)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                  <div style={{ fontSize: '0.7rem', color: 'var(--slate-500)', fontWeight: 600 }}>KNOWLEDGE SYNC</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: selectedKiosk.health.sync === 'synced' ? 'var(--trust-700)' : 'var(--warning-700)', marginTop: '0.2rem' }}>
                    {selectedKiosk.health.sync.toUpperCase()}
                  </div>
                </div>
              </div>

              {/* Hardware Spec List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: '0.65rem', fontSize: '0.825rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Local IP Address:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedKiosk.ipAddress}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Software Version:</span>
                  <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{selectedKiosk.softwareVersion}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Installation Date:</span>
                  <span style={{ fontWeight: 600 }}>{selectedKiosk.installationDate}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Uptime (30 Days):</span>
                  <span style={{ fontWeight: 600, color: 'var(--success-700)' }}>{selectedKiosk.uptimePercent}%</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Last Heartbeat Ping:</span>
                  <span style={{ fontWeight: 600 }}>{selectedKiosk.lastActive}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid var(--border-color)' }}>
                  <span style={{ color: 'var(--slate-500)' }}>Voice STT Engine:</span>
                  <span style={{ fontWeight: 600 }}>Bhashini + Groq Whisper</span>
                </div>
              </div>

              {selectedKiosk.notes && (
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--trust-50)', borderRadius: '6px', fontSize: '0.8rem', color: 'var(--trust-800)' }}>
                  <strong>Field Notes:</strong> {selectedKiosk.notes}
                </div>
              )}
            </div>
          )}

          {activeModalTab === 'usage' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div style={{ padding: '1rem', background: 'var(--primary-50)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--primary-700)', fontWeight: 600 }}>QUERIES SERVED TODAY</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary-800)' }}>
                    {selectedKiosk.queriesToday}
                  </div>
                </div>
                <div style={{ padding: '1rem', background: 'var(--trust-50)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--trust-700)', fontWeight: 600 }}>LIFETIME QUERIES</div>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--trust-800)' }}>
                    {selectedKiosk.totalQueries.toLocaleString()}
                  </div>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--slate-600)' }}>
                Most common farmer query domain on this kiosk: <strong>PMFBY Crop Insurance & KCC renewal</strong>. Over 82% of sessions utilized Marathi voice input.
              </p>
            </div>
          )}

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
