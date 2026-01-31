import './ResumeApp.css';

export default function ResumeApp() {
  return (
    <div className="resume-app">
      {/* WordPad-style Toolbar */}
      <div className="resume-toolbar">
        <div className="toolbar-group">
          <button className="toolbar-btn" title="Save">💾</button>
          <button className="toolbar-btn" title="Print">🖨️</button>
        </div>
        <div className="toolbar-divider" />
        <div className="toolbar-group">
          <button className="toolbar-btn" title="Cut">✂️</button>
          <button className="toolbar-btn" title="Copy">📋</button>
          <button className="toolbar-btn" title="Paste">📄</button>
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
            <h1>Daniel Chen</h1>
            <div className="contact-info">
              <span>[Tel]: 647-915-4852</span>
              <span>[Mail]: <a href="mailto:daniel.chen0113@gmail.com">daniel.chen0113@gmail.com</a></span>
              <span>[LinkedIn]: <a href="https://www.linkedin.com/in/daniel-chen0113/" target="_blank" rel="noopener noreferrer">daniel-chen0113</a></span>
              <span>[GitHub]: <a href="https://github.com/danielchen8624" target="_blank" rel="noopener noreferrer">danielchen8624</a></span>
            </div>
          </header>

          {/* Education */}
          <section className="resume-section">
            <h2>Education</h2>
            <div className="resume-entry">
              <div className="entry-header">
                <strong>University of Waterloo</strong>
                <span className="entry-location">Waterloo, ON</span>
              </div>
              <div className="entry-subheader">
                <em>Computer Science + Finance</em>
              </div>
              <ul>
                <li>Courses: Data Structures & Algorithms, Object-Oriented Programming, Functional Programming</li>
                <li>Awards: President's Scholarship of Distinction (<strong>$2,000</strong>)</li>
              </ul>
            </div>
          </section>

          {/* Technical Skills */}
          <section className="resume-section">
            <h2>Technical Skills</h2>
            <ul className="skills-list">
              <li><strong>Languages:</strong> Python, Java, C, C++, JavaScript, TypeScript, SQL, HTML/CSS</li>
              <li><strong>Tools/Frameworks:</strong> React.js, Next.js, React Native, Expo, Node.js, Express, FastAPI, PyTorch, Flask, Tailwind, NativeWind, Vite, Git, Vercel</li>
              <li><strong>Cloud/Databases:</strong> PostgreSQL, MySQL, Firebase, SQLite, SQLAlchemy, AWS, Google Cloud</li>
            </ul>
          </section>

          {/* Experience */}
          <section className="resume-section">
            <h2>Experience</h2>
            
            <div className="resume-entry">
              <div className="entry-header">
                <strong>Leading Software Engineer</strong>
                <span className="entry-date">May 2025 – Present</span>
              </div>
              <div className="entry-subheader">
                <em>Fresh Water Cleaning Services</em>
                <span className="entry-location">Toronto, ON</span>
              </div>
              <ul>
                <li><strong>Leading end-to-end</strong> development and iteration of a full-scale <strong>React Native + Firebase + TypeScript</strong> mobile app; shipped from concept to <a href="https://apps.apple.com/ca/app/dcoasis/id6752588044" target="_blank" rel="noopener noreferrer"><strong>App Store</strong></a> release in <strong>under 8 weeks</strong>.</li>
                <li><strong>Building and own the core operational platform</strong> used daily to manage <strong>2,500+ condo units</strong>; implemented <strong>Firestore security</strong> rules and <strong>EAS CI/CD</strong> to power workflows for the <strong>$1M+ ARR</strong> services business.</li>
                <li><strong>Reduced</strong> scheduling and reporting time by <strong>65%</strong> and <strong>improved</strong> maintenance response speed by <strong>112%</strong> by automating task distribution, progress tracking, and real-time issue flagging.</li>
                <li><strong>Collaborating</strong> directly with the <strong>CEO as a strategic partner</strong>; aligning product roadmap, scaling plans, and feature expansion for rollout to additional property management clients.</li>
              </ul>
            </div>

            <div className="resume-entry">
              <div className="entry-header">
                <strong>Founding Software Engineer</strong>
                <span className="entry-date">October 2025 – Present</span>
              </div>
              <div className="entry-subheader">
                <em>Momentum</em>
                <span className="entry-location">Toronto, ON</span>
              </div>
              <ul>
                <li><strong>Building</strong> <a href="https://momentumaiwebsitefinal.vercel.app/" target="_blank" rel="noopener noreferrer"><em>Momentum</em></a>, an AI calendar copilot (<strong>Next.js, Node.js, TypeScript, PostgreSQL</strong>) with <strong>live Google Calendar sync</strong>; combining <strong>LLM parsing (OpenAI API)</strong> with a <strong>constraint/score-based engine</strong> using <strong>beam search + pruning</strong> to generate <strong>validated, conflict-free</strong> reschedule proposals.</li>
                <li><strong>Secured $3,000</strong> in pre-seed funding, <strong>growing</strong> a <strong>50+ person early-access</strong> list, and <strong>earned 80% positive MVP feedback</strong> from 15 beta testers over a 2-week testing period.</li>
              </ul>
            </div>
          </section>

          {/* Projects / Achievements */}
          <section className="resume-section">
            <h2>Projects / Achievements</h2>
            
            <div className="resume-entry">
              <div className="entry-header">
                <strong>World Robot Olympiad International Final</strong>
                <span className="entry-tech">Python, NumPy, OpenCV, Arduino IDE</span>
              </div>
              <ul>
                <li>Engineered a fully autonomous <strong>self-driving robot car</strong> using <strong>Python</strong>, integrating <strong>Arduino</strong> and <strong>OpenCV</strong> for real-time obstacle detection and navigation.</li>
                <li>Achieved <strong>1st Place in Canada</strong> and <strong>6th globally</strong> among over <strong>2,000+ international contestants</strong> across 40 countries.</li>
                <li>Set the <strong>all-time Canadian record</strong> in the Future Engineers category at the <strong>2023 World Robot Olympiad</strong> held in Panama.</li>
              </ul>
            </div>

            <div className="resume-entry">
              <div className="entry-header">
                <strong>UofT Global Engineering Challenge Hackathon</strong>
                <span className="entry-tech">Python, NumPy, OpenCV, Google Colab</span>
              </div>
              <ul>
                <li>Developed a <strong>computer vision model</strong> to detect and classify <strong>fraudulent food tickets</strong> from image data, leveraging <strong>CNN architectures</strong> for feature extraction.</li>
                <li>Achieved <strong>94%+</strong> accuracy classifying genuine vs. counterfeit tickets by curating and augmenting a <strong>custom image dataset</strong> using <strong>NumPy</strong> and <strong>OpenCV</strong>.</li>
                <li>Won the <strong>Best Counterfeit Design Award</strong> among 10+ teams, recognized for developing one of the most accurate and efficient <strong>ML-based detection systems</strong>.</li>
              </ul>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
