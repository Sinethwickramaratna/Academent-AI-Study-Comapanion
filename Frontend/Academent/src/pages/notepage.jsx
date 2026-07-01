import { useState } from 'react';
import FolderVaultCard from '../components/FolderVaultCard';
import NotesActionButton from '../components/NotesActionButton';
import NotesBreadcrumb from '../components/NotesBreadcrumb';
import NotesSectionHeader from '../components/NotesSectionHeader';
import TopBar from '../components/TopBar';
import './notepage.css';

function NotePage({ profile, currentUser }) {
  const [activeSemester, setActiveSemester] = useState(null);

  const fullName = profile?.fullName || currentUser?.displayName || "Student";
  const photoURL = currentUser?.photoURL || profile?.photoURL || "";

  const semesters = [
    { id: 1, title: "Semester 1", subtitle: "Foundation archive", files: 18, progress: 82, accent: "cyan", icon: "neurology" },
    { id: 2, title: "Semester 2", subtitle: "Core systems", files: 24, progress: 64, accent: "violet", icon: "hub" },
    { id: 3, title: "Semester 3", subtitle: "Research stack", files: 31, progress: 48, accent: "emerald", icon: "science" },
    { id: 4, title: "Semester 4", subtitle: "Exam capsule", files: 16, progress: 91, accent: "amber", icon: "auto_stories" },
    { id: 5, title: "Semester 5", subtitle: "Project vault", files: 27, progress: 36, accent: "rose", icon: "token" },
  ];

  const semesterModules = [
    {
      semesterId: 1,
      modules: [
        { moduleId: "MATH101", title: "Mathematics", subtitle: "Calculus and vectors", files: 5, progress: 78, accent: "cyan", icon: "functions" },
        { moduleId: "PHYS101", title: "Physics", subtitle: "Motion lab notes", files: 3, progress: 62, accent: "violet", icon: "speed" },
        { moduleId: "CHEM101", title: "Chemistry", subtitle: "Atomic systems", files: 4, progress: 70, accent: "emerald", icon: "science" },
      ],
    },
    {
      semesterId: 2,
      modules: [
        { moduleId: "CS201", title: "Computer Science", subtitle: "Logic and code", files: 6, progress: 74, accent: "violet", icon: "terminal" },
        { moduleId: "ENG201", title: "English Literature", subtitle: "Critical essays", files: 4, progress: 51, accent: "rose", icon: "history_edu" },
        { moduleId: "HIST201", title: "History", subtitle: "Timeline archive", files: 5, progress: 66, accent: "amber", icon: "account_balance" },
      ],
    },
    {
      semesterId: 3,
      modules: [
        { moduleId: "BIO301", title: "Biology", subtitle: "Cell systems", files: 7, progress: 84, accent: "emerald", icon: "biotech" },
        { moduleId: "CHEM301", title: "Advanced Chemistry", subtitle: "Reaction network", files: 5, progress: 58, accent: "amber", icon: "experiment" },
        { moduleId: "PHYS301", title: "Advanced Physics", subtitle: "Quantum notes", files: 6, progress: 46, accent: "cyan", icon: "orbit" },
      ],
    },
    {
      semesterId: 4,
      modules: [
        { moduleId: "CS401", title: "Algorithms", subtitle: "Complexity vault", files: 8, progress: 88, accent: "violet", icon: "schema" },
        { moduleId: "MATH401", title: "Linear Algebra", subtitle: "Matrix systems", files: 5, progress: 72, accent: "cyan", icon: "grid_on" },
        { moduleId: "STAT401", title: "Statistics", subtitle: "Probability engine", files: 4, progress: 63, accent: "rose", icon: "monitoring" },
      ],
    },
    {
      semesterId: 5,
      modules: [
        { moduleId: "CS501", title: "Machine Learning", subtitle: "Model training", files: 9, progress: 81, accent: "emerald", icon: "model_training" },
        { moduleId: "AI501", title: "Artificial Intelligence", subtitle: "Neural workspace", files: 7, progress: 76, accent: "violet", icon: "psychology" },
        { moduleId: "DATA501", title: "Data Science", subtitle: "Dataset capsule", files: 6, progress: 69, accent: "amber", icon: "database" },
      ],
    },
  ];

  const selectedSemester = semesters.find((semester) => semester.id === activeSemester);
  const selectedModules = semesterModules.find((semester) => semester.semesterId === activeSemester)?.modules || [];

  return (
    <main className="p-gutter md:p-margin-desktop space-y-xl notes-page">
      <TopBar fullName={fullName} photoURL={photoURL} searchPlaceholder="Search your knowledge base..." />

      {activeSemester ? (
        <section>
          <NotesBreadcrumb
            items={[
              { label: "My Notes", onClick: () => setActiveSemester(null) },
              { label: selectedSemester?.title || "Semester", active: true },
            ]}
          />

          <NotesSectionHeader
            title={`${selectedSemester?.title || "Semester"} Modules`}
            description="Module folders linked to this semester vault"
            backAction={(
              <NotesActionButton
                className="back-button"
                icon="chevron_left"
                label="Back"
                onClick={() => setActiveSemester(null)}
              />
            )}
            action={(
              <NotesActionButton
                icon="create_new_folder"
                label="New Module Folder"
              />
            )}
          />

          <div className="folder-vault-grid modules-vault-grid">
            {selectedModules.map((module) => (
              <FolderVaultCard
                key={module.moduleId}
                folder={module}
                kicker={module.moduleId}
              />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <NotesBreadcrumb
            items={[
              { label: "My Notes" },
            ]}
          />

          <NotesSectionHeader
            title="My Notes"
            description="Your personal knowledge base"
            action={(
              <NotesActionButton
                icon="create_new_folder"
                label="New Semester Folder"
              />
            )}
          />

          <div className="folder-vault-grid">
            {semesters.map((semester) => (
              <FolderVaultCard
                key={semester.id}
                folder={semester}
                kicker={`S${semester.id.toString().padStart(2, '0')} NODE`}
                onClick={() => setActiveSemester(semester.id)}
              />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

export default NotePage;
