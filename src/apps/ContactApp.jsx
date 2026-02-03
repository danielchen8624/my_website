import './ResumeApp.css';

export default function ContactApp() {
  const contacts = [
    {
      id: 'github',
      label: 'GitHub',
      value: 'github.com/danielchen8624',
      link: 'https://github.com/danielchen8624',
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      value: 'linkedin.com/in/danielchen0113',
      link: 'https://www.linkedin.com/in/daniel-chen0113/',
    },
    {
      id: 'email',
      label: 'Email',
      value: 'daniel.chen0113@gmail.com',
      link: 'mailto:daniel.chen0113@gmail.com',
    },
    {
      id: 'twitter',
      label: 'Twitter/X',
      value: '@danielchen0113',
      link: 'https://x.com/danielchen0113'
    },
    {
      id: 'instagram',
      label: 'Instagram',
      value: '@daniel_c_hen',
      link: 'https://www.instagram.com/daniel_c_hen/'
    }
  ];

  return (
    <div className="resume-app">
      {/* WordPad-style Toolbar */}
      <div className="resume-toolbar">
        <div className="toolbar-group">
          <button className="toolbar-btn" title="Save">Save</button>
          <button className="toolbar-btn" title="Print">Print</button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button className="toolbar-btn" title="Cut">Cut</button>
          <button className="toolbar-btn" title="Copy">Copy</button>
          <button className="toolbar-btn" title="Paste">Paste</button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <select className="toolbar-select" defaultValue="Arial">
            <option>Arial</option>
            <option>Times New Roman</option>
            <option>Courier New</option>
          </select>
          <select className="toolbar-select toolbar-size" defaultValue="11">
            <option>10</option>
            <option>11</option>
            <option>12</option>
            <option>14</option>
          </select>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button className="toolbar-btn format-btn" title="Bold"><b>B</b></button>
          <button className="toolbar-btn format-btn" title="Italic"><i>I</i></button>
          <button className="toolbar-btn format-btn" title="Underline"><u>U</u></button>
        </div>
      </div>

      {/* Ruler */}
      <div className="resume-ruler">
        <div className="ruler-marks">
          {[...Array(17)].map((_, i) => (
            <span key={i} className="ruler-mark">{i}</span>
          ))}
        </div>
      </div>

      {/* Document Content */}
      <div className="resume-content">
        <div className="resume-paper">
          {/* Header */}
          <header className="resume-header">
            <h1>Contact Information</h1>
          </header>

          {/* Contact Details */}
          <section className="resume-section">
            <h2>Get In Touch</h2>
            <p style={{ marginBottom: '16px' }}>
              Feel free to reach out! Click any link below to connect with me.
            </p>
            <ul className="skills-list">
              {contacts.map((contact) => (
                <li key={contact.id} style={{ marginBottom: '8px' }}>
                  <strong>{contact.label}:</strong>{' '}
                  <a
                    href={contact.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {contact.value}
                  </a>
                </li>
              ))}
            </ul>
          </section>

        </div>
      </div>
    </div>
  );
}
