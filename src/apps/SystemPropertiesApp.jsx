import { useState } from 'react';

export default function SystemPropertiesApp() {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'device', label: 'Device Manager' },
    { id: 'performance', label: 'Performance' },
  ];

  return (
    <div style={{
      background: '#c0c0c0',
      padding: '8px',
      minHeight: '100%',
      fontFamily: 'Tahoma, Arial, sans-serif',
      fontSize: '12px',
    }}>
      {/* Tabs */}
      <div style={{ display: 'flex', marginBottom: '-2px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '4px 12px',
              border: '2px outset #fff',
              borderBottom: activeTab === tab.id ? 'none' : '2px outset #fff',
              background: activeTab === tab.id ? '#c0c0c0' : '#a0a0a0',
              cursor: 'pointer',
              marginRight: '2px',
              position: 'relative',
              zIndex: activeTab === tab.id ? 1 : 0,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{
        border: '2px outset #fff',
        padding: '16px',
        minHeight: '300px',
      }}>
        {activeTab === 'general' && (
          <div>
            {/* System Info */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
              <div style={{ fontSize: '48px' }}>💻</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>System:</div>
                <div style={{ marginLeft: '10px' }}>
                  Microsoft Windows 95<br />
                  4.00.950 B
                </div>
              </div>
            </div>

            <hr style={{ border: '1px inset #808080', margin: '16px 0' }} />

            {/* Registration */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontWeight: 'bold' }}>Registered to:</div>
              <div style={{ marginLeft: '10px', marginTop: '4px' }}>
                Daniel Chen<br />
                Personal Computer<br />
                12345-OEM-0012345-67890
              </div>
            </div>

            <hr style={{ border: '1px inset #808080', margin: '16px 0' }} />

            {/* Computer Info */}
            <div style={{ display: 'flex', gap: '20px' }}>
              <div style={{ fontSize: '32px' }}>🖥️</div>
              <div>
                <div style={{ fontWeight: 'bold' }}>Computer:</div>
                <div style={{ marginLeft: '10px' }}>
                  GenuineIntel<br />
                  Intel Pentium 133MHz Processor<br />
                  128.0 MB RAM
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'device' && (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
              📁 Computer
            </div>
            <div style={{ marginLeft: '20px' }}>
              <div>📁 CD-ROM</div>
              <div style={{ marginLeft: '20px' }}>💿 ATAPI CD-ROM Drive</div>
              <div>📁 Disk drives</div>
              <div style={{ marginLeft: '20px' }}>💾 WDC AC22100H</div>
              <div>📁 Display adapters</div>
              <div style={{ marginLeft: '20px' }}>🖥️ S3 Trio64V+ (generic)</div>
              <div>📁 Keyboard</div>
              <div style={{ marginLeft: '20px' }}>⌨️ Standard 101/102-Key</div>
              <div>📁 Mouse</div>
              <div style={{ marginLeft: '20px' }}>🖱️ Microsoft PS/2 Mouse</div>
              <div>📁 Sound, video and game controllers</div>
              <div style={{ marginLeft: '20px' }}>🔊 Sound Blaster 16</div>
            </div>
          </div>
        )}

        {activeTab === 'performance' && (
          <div>
            <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>
              Performance Status
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <div>Memory: 128.0 MB of RAM</div>
              <div style={{
                width: '200px',
                height: '16px',
                background: '#fff',
                border: '2px inset #808080',
                marginTop: '4px',
              }}>
                <div style={{
                  width: '35%',
                  height: '100%',
                  background: '#000080',
                }} />
              </div>
              <div style={{ fontSize: '10px', color: '#666' }}>35% in use</div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <div>System Resources: 78% free</div>
              <div style={{
                width: '200px',
                height: '16px',
                background: '#fff',
                border: '2px inset #808080',
                marginTop: '4px',
              }}>
                <div style={{
                  width: '78%',
                  height: '100%',
                  background: '#008000',
                }} />
              </div>
            </div>

            <div style={{
              padding: '10px',
              border: '2px inset #808080',
              background: '#fff',
              marginTop: '20px',
            }}>
              Your system is configured for optimal performance.
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'flex-end', 
        gap: '8px',
        marginTop: '12px',
      }}>
        <button style={{
          padding: '4px 20px',
          border: '2px outset #fff',
          background: '#c0c0c0',
          cursor: 'pointer',
        }}>
          OK
        </button>
        <button style={{
          padding: '4px 20px',
          border: '2px outset #fff',
          background: '#c0c0c0',
          cursor: 'pointer',
        }}>
          Cancel
        </button>
      </div>
    </div>
  );
}
