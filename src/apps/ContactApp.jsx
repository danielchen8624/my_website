export default function ContactApp() {
  const contacts = [
    {
      id: 'github',
      icon: '',
      label: 'GitHub',
      value: 'github.com/danielchen8624',
      link: 'https://github.com/danielchen8624',
    },
    {
      id: 'linkedin',
      icon: '',
      label: 'LinkedIn',
      value: 'linkedin.com/in/danielchen0113',
      link: 'https://www.linkedin.com/in/daniel-chen0113/',
    },
    {
      id: 'email',
      icon: '',
      label: 'Email',
      value: 'daniel.chen0113@gmail.com',
      link: 'mailto:daniel.chen0113@gmail.com',
    },
    {
      id: 'twitter',
      icon: '',
      label: 'Twitter/X',
      value: '@danielchen0113',
      link: 'https://x.com/danielchen0113'
    },
    {
      id: 'instagram',
      icon: '',
      label: 'Instagram',
      value: '@daniel_c_hen',
      link: 'https://www.instagram.com/daniel_c_hen/'
    }
  ];

  return (
    <div style={{ padding: '8px' }}>
      <div style={{ marginBottom: '16px', fontWeight: 'bold' }}>
        📬 Contact Information
      </div>
      
      <div style={{ marginBottom: '16px', fontStyle: 'italic' }}>
        Click any link below to connect with me!
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <tbody>
          {contacts.map((contact) => (
            <tr key={contact.id}>
              <td style={{ padding: '8px 4px', width: '30px' }}>
                {contact.icon}
              </td>
              <td style={{ padding: '8px 4px', fontWeight: 'bold' }}>
                {contact.label}:
              </td>
              <td style={{ padding: '8px 4px' }}>
                <a
                  href={contact.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ 
                    color: '#0000ff', 
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  {contact.value}
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ 
        marginTop: '24px', 
        padding: '8px',
        backgroundColor: '#ffffcc',
        border: '1px solid #808080'
      }}>
        💡 <strong>Tip:</strong> You can also find me through the Start Menu --{'>'} Help!
      </div>
    </div>
  );
}
