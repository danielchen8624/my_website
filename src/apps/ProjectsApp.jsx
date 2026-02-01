import { useState } from 'react';
import Icon from '../components/Icon';

const projects = [
  {
    id: 1,
    name: 'Project Alpha',
    icon: 'folder',
    description: 'A full-stack web application built with React and Node.js',
    link: '#',
  },
  {
    id: 2,
    name: 'Project Beta',
    icon: 'folder',
    description: 'An interactive data visualization dashboard',
    link: '#',
  },
  {
    id: 3,
    name: 'Project Gamma',
    icon: 'folder',
    description: 'A mobile-first e-commerce platform',
    link: '#',
  },
  {
    id: 4,
    name: 'Project Delta',
    icon: 'folder',
    description: 'An AI-powered chatbot application',
    link: '#',
  },
  {
    id: 5,
    name: 'Retro OS Website',
    icon: 'my-computer',
    description: 'This website! A Windows 95 themed portfolio.',
    link: '#',
  },
  {
    id: 6,
    name: 'README.txt',
    icon: 'notepad',
    description: 'Click on any project folder to learn more!',
    link: null,
  },
];

export default function ProjectsApp() {
  const [selectedProject, setSelectedProject] = useState(null);

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Address Bar */}
      <div className="explorer-address-bar">
        <span>Address:</span>
        <input
          className="explorer-address-input"
          value="C:\Users\Daniel\Projects"
          readOnly
        />
      </div>

      {/* Project Grid */}
      <div className="explorer-grid" style={{ flex: 1 }}>
        {projects.map((project) => (
          <div
            key={project.id}
            className={`explorer-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
            onClick={() => setSelectedProject(project)}
            onDoubleClick={() => project.link && window.open(project.link, '_blank')}
          >
            <div className="explorer-item-icon">
              <Icon icon={project.icon} size={32} />
            </div>
            <div className="explorer-item-label">{project.name}</div>
          </div>
        ))}
      </div>

      {/* Status Bar */}
      {selectedProject && (
        <div style={{ 
          padding: '4px 8px', 
          borderTop: '2px solid #808080',
          backgroundColor: '#c0c0c0',
          fontSize: '11px'
        }}>
          {selectedProject.description}
        </div>
      )}
    </div>
  );
}
