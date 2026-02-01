const skills = [
  {
    category: 'Languages',
    items: ['Python', 'Java', 'C', 'C++', 'JavaScript', 'TypeScript', 'SQL', 'HTML/CSS'],
  },
  {
    category: 'Tools/Frameworks',
    items: ['React.js', 'Next.js', 'React Native', 'Expo', 'Node.js', 'Express', 'FastAPI', 'PyTorch', 'Flask', 'Tailwind', 'NativeWind', 'Vite', 'Git', 'Vercel'],
  },
  {
    category: 'Cloud/Databases',
    items: ['PostgreSQL', 'MySQL', 'Firebase', 'SQLite', 'SQLAlchemy', 'AWS', 'Google Cloud'],
  },
];

export default function SkillsApp() {
  return (
    <div style={{ padding: '8px' }}>
      <div style={{
        marginBottom: '16px',
        paddingBottom: '8px',
        borderBottom: '2px solid #808080',
        fontWeight: 'bold'
      }}>
        My Computer - Skills & Technologies
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px'
      }}>
        {skills.map((skillGroup) => (
          <div
            key={skillGroup.category}
            style={{
              padding: '12px',
              backgroundColor: '#ffffff',
              border: '2px solid',
              borderColor: '#808080 #ffffff #ffffff #808080',
            }}
          >
            <div style={{
              marginBottom: '8px',
              fontWeight: 'bold'
            }}>
              {skillGroup.category}
            </div>
            
            <ul style={{ 
              listStyle: 'none', 
              padding: 0,
              margin: 0 
            }}>
              {skillGroup.items.map((item) => (
                <li 
                  key={item}
                  style={{ 
                    padding: '4px 0',
                    paddingLeft: '16px',
                    position: 'relative'
                  }}
                >
                  <span style={{ 
                    position: 'absolute', 
                    left: 0 
                  }}>•</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ 
        marginTop: '16px', 
        fontSize: '11px',
        color: '#808080',
        textAlign: 'center'
      }}>
        3 categories • Always learning more!
      </div>
    </div>
  );
}
