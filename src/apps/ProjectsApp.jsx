import { useState, useEffect } from 'react';
import Icon from '../components/Icon';
import { useFileSystem } from '../context/FileSystemContext';
import { useOS } from '../context/OSContext';

export default function ProjectsApp() {
  const { getFilesInFolder } = useFileSystem();
  const { openWindow } = useOS();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);

  useEffect(() => {
    const projectFiles = getFilesInFolder('projects');
    setProjects(projectFiles);
  }, [getFilesInFolder]);

  const handleDoubleClick = (project) => {
    if (project.appType === 'external-link' && project.url) {
      window.open(project.url, '_blank');
    } else {
      // Open folder in new window or navigate? 
      // Exploring the folder is the standard behavior for a folder.
      openWindow(project.id, project);
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Address Bar */}
      <div className="explorer-address-bar">
        <span>Address:</span>
        <div style={{ flex: 1, display: 'flex', border: '1px solid #7f9db9', background: 'white' }}>
            <div style={{ padding: '2px' }}><Icon icon="folder" size={16} /></div>
            <input
              className="explorer-address-input"
              value="C:\Users\Daniel\Projects"
              readOnly
              style={{ border: 'none', width: '100%' }}
            />
        </div>
      </div>

      {/* Project Grid */}
      <div className="explorer-grid" style={{ flex: 1 }}>
        {projects.length === 0 ? (
           <div style={{ padding: '16px', color: '#808080' }}>No projects found.</div>
        ) : (
          projects.map((project) => (
            <div
              key={project.id}
              className={`explorer-item ${selectedProject?.id === project.id ? 'selected' : ''}`}
              onClick={() => setSelectedProject(project)}
              onDoubleClick={() => handleDoubleClick(project)}
            >
              <div className="explorer-item-icon">
                <Icon icon={project.icon || 'folder'} size={32} />
              </div>
              <div className="explorer-item-label">{project.name}</div>
            </div>
          ))
        )}
      </div>

      {/* Status Bar */}
      <div className="explorer-status-bar">
        <div style={{ width: '200px' }}>{projects.length} object(s)</div>
        <div style={{ flex: 1 }}></div>
        <div style={{ width: '200px', paddingLeft: '10px' }}>
             {selectedProject ? selectedProject.name : ''}
        </div>
      </div>
    </div>
  );
}
