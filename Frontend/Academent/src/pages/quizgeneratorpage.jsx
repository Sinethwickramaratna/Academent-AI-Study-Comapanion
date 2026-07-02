import { useMemo, useState } from 'react';
import NotesActionButton from '../components/NotesActionButton';
import NotesSectionHeader from '../components/NotesSectionHeader';
import TopBar from '../components/TopBar';
import useNoteManagement from '../Services/useNoteManagement';
import './quizgeneratorpage.css';

const DIFFICULTY_RULES = {
  Easy: 'MCQ and True/False questions',
  Medium: 'MCQ, True/False, Fill in the Blank, and Cloze questions',
  Hard: 'MCQ, True/False, Fill in the Blank, Cloze, Scenario-Based, and Short Answer questions',
};

const SAMPLE_QUIZZES = [
  {
    id: 'quiz-analytics-foundations',
    title: 'Data Analytics Foundations',
    location: 'Semester 01 / Module 01',
    difficulty: 'Medium',
    questionCount: 6,
    status: 'Completed',
    score: 84,
    progress: 100,
    createdAt: 'Jul 01, 2026',
  },
  {
    id: 'quiz-research-methods',
    title: 'Research Methods Revision',
    location: 'Semester 01 / Module 02',
    difficulty: 'Hard',
    questionCount: 8,
    status: 'Partially Attempted',
    progress: 45,
    createdAt: 'Jun 28, 2026',
  },
  {
    id: 'quiz-database-basics',
    title: 'Database Basics Quick Check',
    location: 'Semester 02 / Database Systems',
    difficulty: 'Easy',
    questionCount: 5,
    status: 'Not Attempted',
    progress: 0,
    createdAt: 'Jun 25, 2026',
  },
];

const SAMPLE_QUESTIONS = [
  {
    question_number: 1,
    type: 'MCQ',
    question: 'Which metric is commonly used to summarize central tendency?',
    options: ['Median', 'Variance', 'Range', 'Outlier'],
    answer: 'Median',
  },
  {
    question_number: 2,
    type: 'FILL_BLANK',
    question: 'A dataset column is also known as a ________.',
    options: ['field', 'folder', 'record', 'chart'],
    answer: 'field',
  },
  {
    question_number: 3,
    type: 'TRUE_FALSE',
    question: 'Data cleaning should happen before final analysis.',
    answer: 'True',
  },
  {
    question_number: 4,
    type: 'CLOZE',
    question: 'Data quality includes ________, ________, and ________.',
    answers: ['accuracy', 'completeness', 'timeliness'],
  },
  {
    question_number: 5,
    type: 'SCENARIO',
    question: 'A survey has many duplicate responses. What should you do before reporting results?',
    options: ['Remove or resolve duplicate records', 'Ignore the duplicates', 'Only change the chart color', 'Delete the full dataset'],
    answer: 'Remove or resolve duplicate records',
  },
  {
    question_number: 6,
    type: 'SHORT_ANSWER',
    question: 'Explain why completeness matters when preparing data for analysis.',
    answer: 'Completeness matters because missing values can bias analysis, reduce confidence, and lead to incorrect conclusions.',
  },
];

const createGeneratedQuiz = ({ title, difficulty, questionCount, selectedItems }) => ({
  id: `quiz-${Date.now()}`,
  title: title.trim() || `${difficulty} AI Study Quiz`,
  location: selectedItems[0]?.path?.split(' / ').slice(0, 2).join(' / ') || 'Selected study materials',
  difficulty,
  questionCount,
  status: 'Not Attempted',
  progress: 0,
  createdAt: new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(new Date()),
});

const flattenStudyMaterials = (semesters = []) => {
  const materials = [];

  const visitFolder = (folder, path) => {
    (folder.notes || []).forEach((note) => materials.push({
      id: `note-${note.noteId}`,
      sourceId: note.noteId,
      type: 'note',
      title: note.title,
      path: `${path} / ${folder.title}`,
      icon: 'description',
    }));

    (folder.pdfs || []).forEach((pdf) => materials.push({
      id: `pdf-${pdf.pdfId}`,
      sourceId: pdf.pdfId,
      type: 'pdf',
      title: pdf.title,
      path: `${path} / ${folder.title}`,
      icon: 'picture_as_pdf',
    }));

    (folder.folders || []).forEach((child) => visitFolder(child, `${path} / ${folder.title}`));
  };

  semesters.forEach((semester) => {
    (semester.modules || []).forEach((module) => {
      const modulePath = `${semester.title} / ${module.title || module.moduleId}`;

      (module.notes || []).forEach((note) => materials.push({
        id: `note-${note.noteId}`,
        sourceId: note.noteId,
        type: 'note',
        title: note.title,
        path: modulePath,
        icon: 'description',
      }));

      (module.pdfs || []).forEach((pdf) => materials.push({
        id: `pdf-${pdf.pdfId}`,
        sourceId: pdf.pdfId,
        type: 'pdf',
        title: pdf.title,
        path: modulePath,
        icon: 'picture_as_pdf',
      }));

      (module.folders || []).forEach((folder) => visitFolder(folder, modulePath));
    });
  });

  return materials;
};

function StudyMaterialTree({ semesters, selectedIds, expandedIds, onToggleExpanded, onToggleSelected }) {
  const renderMaterial = (item, path) => (
    <label key={`${item.type}-${item.id}`} className="quiz-tree-file">
      <input
        checked={selectedIds.includes(`${item.type}-${item.id}`)}
        type="checkbox"
        onChange={() => onToggleSelected({ ...item, id: `${item.type}-${item.id}`, path })}
      />
      <span className="material-symbols-outlined">{item.type === 'pdf' ? 'picture_as_pdf' : 'description'}</span>
      <span>{item.title}</span>
    </label>
  );

  const renderFolder = (folder, path) => {
    const folderKey = `folder-${folder.folderId}`;
    const isOpen = expandedIds.includes(folderKey);

    return (
      <div key={folder.folderId} className="quiz-tree-branch">
        <button type="button" className="quiz-tree-node" onClick={() => onToggleExpanded(folderKey)}>
          <span className="material-symbols-outlined">{isOpen ? 'expand_more' : 'chevron_right'}</span>
          <span className="material-symbols-outlined">folder</span>
          <span>{folder.title}</span>
        </button>
        {isOpen && (
          <div className="quiz-tree-children">
            {(folder.notes || []).map((note) => renderMaterial({ ...note, id: note.noteId, type: 'note' }, `${path} / ${folder.title}`))}
            {(folder.pdfs || []).map((pdf) => renderMaterial({ ...pdf, id: pdf.pdfId, type: 'pdf' }, `${path} / ${folder.title}`))}
            {(folder.folders || []).map((child) => renderFolder(child, `${path} / ${folder.title}`))}
          </div>
        )}
      </div>
    );
  };

  if (!semesters.length) {
    return (
      <div className="quiz-tree-empty">
        <span className="material-symbols-outlined">source_environment</span>
        <p>Add notes or PDFs in My Notes to generate quizzes from your own study materials.</p>
      </div>
    );
  }

  return (
    <div className="quiz-tree">
      {semesters.map((semester) => {
        const semesterKey = `semester-${semester.semesterId}`;
        const semesterOpen = expandedIds.includes(semesterKey);

        return (
          <div key={semester.semesterId} className="quiz-tree-branch">
            <button type="button" className="quiz-tree-node quiz-tree-node--root" onClick={() => onToggleExpanded(semesterKey)}>
              <span className="material-symbols-outlined">{semesterOpen ? 'expand_more' : 'chevron_right'}</span>
              <span className="material-symbols-outlined">auto_stories</span>
              <span>{semester.title}</span>
            </button>
            {semesterOpen && (
              <div className="quiz-tree-children">
                {(semester.modules || []).map((module) => {
                  const moduleKey = `module-${module.moduleId}`;
                  const moduleOpen = expandedIds.includes(moduleKey);
                  const modulePath = `${semester.title} / ${module.title || module.moduleId}`;

                  return (
                    <div key={module.moduleId} className="quiz-tree-branch">
                      <button type="button" className="quiz-tree-node" onClick={() => onToggleExpanded(moduleKey)}>
                        <span className="material-symbols-outlined">{moduleOpen ? 'expand_more' : 'chevron_right'}</span>
                        <span className="material-symbols-outlined">topic</span>
                        <span>{module.title || module.moduleId}</span>
                      </button>
                      {moduleOpen && (
                        <div className="quiz-tree-children">
                          {(module.notes || []).map((note) => renderMaterial({ ...note, id: note.noteId, type: 'note' }, modulePath))}
                          {(module.pdfs || []).map((pdf) => renderMaterial({ ...pdf, id: pdf.pdfId, type: 'pdf' }, modulePath))}
                          {(module.folders || []).map((folder) => renderFolder(folder, modulePath))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function CreateQuizModal({ semesters, selectedItems, onClose, onGenerate }) {
  const [difficulty, setDifficulty] = useState('Medium');
  const [questionCount, setQuestionCount] = useState(6);
  const [title, setTitle] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => {
    const firstSemester = semesters[0];
    const firstModule = firstSemester?.modules?.[0];
    return [firstSemester && `semester-${firstSemester.semesterId}`, firstModule && `module-${firstModule.moduleId}`].filter(Boolean);
  });
  const [localSelected, setLocalSelected] = useState(selectedItems);

  const selectedIds = localSelected.map((item) => item.id);
  const toggleExpanded = (id) => setExpandedIds((current) => (
    current.includes(id) ? current.filter((item) => item !== id) : [...current, id]
  ));
  const toggleSelected = (item) => setLocalSelected((current) => (
    current.some((selected) => selected.id === item.id)
      ? current.filter((selected) => selected.id !== item.id)
      : [...current, item]
  ));
  const removeSelected = (id) => setLocalSelected((current) => current.filter((item) => item.id !== id));

  return (
    <div className="quiz-modal-backdrop">
      <section className="quiz-modal" role="dialog" aria-modal="true" aria-labelledby="create-quiz-title">
        <header className="quiz-modal__header">
          <div>
            <p className="quiz-eyebrow">AI quiz setup</p>
            <h3 id="create-quiz-title">Create New Quiz</h3>
            <p>Choose preferences and study materials before generation.</p>
          </div>
          <button className="quiz-icon-button" type="button" onClick={onClose} aria-label="Close create quiz">
            <span className="material-symbols-outlined">close</span>
          </button>
        </header>

        <div className="quiz-modal__body">
          <section className="quiz-setup-card">
            <h4>Quiz Preferences</h4>
            <label className="quiz-form-field">
              <span>Optional quiz title</span>
              <input value={title} placeholder="e.g. Week 04 Data Quality" onChange={(event) => setTitle(event.target.value)} />
            </label>
            <fieldset className="quiz-difficulty-picker">
              <legend>Difficulty</legend>
              <div>
                {Object.keys(DIFFICULTY_RULES).map((level) => (
                  <label key={level} className="quiz-difficulty-choice">
                    <input checked={difficulty === level} type="radio" name="difficulty" onChange={() => setDifficulty(level)} />
                    <span>{level}</span>
                  </label>
                ))}
              </div>
              <p>{DIFFICULTY_RULES[difficulty]}</p>
            </fieldset>
            <label className="quiz-form-field">
              <span>Number of questions</span>
              <input min="3" max="20" type="number" value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} />
            </label>
          </section>

          <section className="quiz-setup-card quiz-material-card">
            <div className="quiz-setup-card__heading">
              <div>
                <h4>Select Study Materials</h4>
                <p>Pick notes and PDFs from your saved note structure.</p>
              </div>
            </div>
            <StudyMaterialTree
              semesters={semesters}
              selectedIds={selectedIds}
              expandedIds={expandedIds}
              onToggleExpanded={toggleExpanded}
              onToggleSelected={toggleSelected}
            />
          </section>

          <aside className="quiz-setup-card quiz-selected-panel">
            <h4>Selected Items</h4>
            {localSelected.length ? (
              <div className="quiz-selected-list">
                {localSelected.map((item) => (
                  <div key={item.id} className="quiz-selected-item">
                    <span className="material-symbols-outlined">{item.icon}</span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.path}</small>
                    </div>
                    <button type="button" onClick={() => removeSelected(item.id)} aria-label={`Remove ${item.title}`}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="quiz-selected-empty">Select at least one note or PDF to generate a personalized quiz.</p>
            )}
          </aside>
        </div>

        <footer className="quiz-modal__actions">
          <button className="quiz-button quiz-button--ghost" type="button" onClick={onClose}>Cancel</button>
          <button
            className="quiz-button quiz-button--primary"
            type="button"
            disabled={!localSelected.length}
            onClick={() => onGenerate({ title, difficulty, questionCount, selectedItems: localSelected })}
          >
            <span className="material-symbols-outlined">auto_awesome</span>
            Generate Quiz
          </button>
        </footer>
      </section>
    </div>
  );
}

function QuizAttempt({ quiz, questions, onBack, onSubmit }) {
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const question = questions[index];
  const progress = Math.round(((index + 1) / questions.length) * 100);

  const setAnswer = (value) => setAnswers((current) => ({ ...current, [question.question_number]: value }));
  const setClozeAnswer = (blankIndex, value) => {
    const current = Array.isArray(answers[question.question_number]) ? answers[question.question_number] : [];
    const next = [...current];
    next[blankIndex] = value;
    setAnswer(next);
  };

  const renderQuestionBody = () => {
    const currentAnswer = answers[question.question_number];

    if (question.type === 'MCQ' || question.type === 'FILL_BLANK' || question.type === 'SCENARIO') {
      return (
        <div className="quiz-option-grid">
          {(question.options || []).map((option) => (
            <button
              key={option}
              className={currentAnswer === option ? 'quiz-answer-option quiz-answer-option--selected' : 'quiz-answer-option'}
              type="button"
              onClick={() => setAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    if (question.type === 'TRUE_FALSE') {
      return (
        <div className="quiz-true-false">
          {['True', 'False'].map((option) => (
            <button
              key={option}
              className={currentAnswer === option ? 'quiz-answer-option quiz-answer-option--selected' : 'quiz-answer-option'}
              type="button"
              onClick={() => setAnswer(option)}
            >
              {option}
            </button>
          ))}
        </div>
      );
    }

    if (question.type === 'CLOZE') {
      const parts = question.question.split('________');
      const clozeAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];

      return (
        <div className="quiz-cloze">
          <p className="quiz-cloze-sentence">
            {parts.map((part, partIndex) => (
              <span key={`${part}-${partIndex}`}>
                {part}
                {partIndex < parts.length - 1 && (
                  <select value={clozeAnswers[partIndex] || ''} onChange={(event) => setClozeAnswer(partIndex, event.target.value)}>
                    <option value="">Drop answer</option>
                    {question.answers.map((answer) => <option key={answer} value={answer}>{answer}</option>)}
                  </select>
                )}
              </span>
            ))}
          </p>
          <div className="quiz-chip-bank">
            {question.answers.map((answer) => (
              <button key={answer} type="button" draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', answer)}>
                {answer}
              </button>
            ))}
          </div>
          <div className="quiz-drop-row">
            {question.answers.map((_, blankIndex) => (
              <button
                key={blankIndex}
                className="quiz-drop-zone"
                type="button"
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => setClozeAnswer(blankIndex, event.dataTransfer.getData('text/plain'))}
              >
                {clozeAnswers[blankIndex] || `Blank ${blankIndex + 1}`}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <textarea
        className="quiz-short-answer"
        value={currentAnswer || ''}
        placeholder="Type your answer here..."
        onChange={(event) => setAnswer(event.target.value)}
      />
    );
  };

  return (
    <main className="p-gutter md:p-margin-desktop quiz-page">
      <section className="quiz-attempt-shell">
        <header className="quiz-attempt-header">
          <button className="quiz-button quiz-button--ghost" type="button" onClick={onBack}>
            <span className="material-symbols-outlined">chevron_left</span>
            Back
          </button>
          <div>
            <p className="quiz-eyebrow">Question {index + 1} of {questions.length}</p>
            <h2>{quiz.title}</h2>
          </div>
          <span className="quiz-type-badge">{question.type.replace('_', ' ')}</span>
        </header>

        <div className="quiz-progress-track">
          <span style={{ width: `${progress}%` }} />
        </div>

        <article className="quiz-question-card">
          <h3>{question.question}</h3>
          {renderQuestionBody()}
        </article>

        <footer className="quiz-attempt-actions">
          <button className="quiz-button quiz-button--ghost" type="button" disabled={index === 0} onClick={() => setIndex((current) => current - 1)}>Previous</button>
          {index < questions.length - 1 ? (
            <button className="quiz-button quiz-button--primary" type="button" onClick={() => setIndex((current) => current + 1)}>Next</button>
          ) : (
            <button className="quiz-button quiz-button--primary" type="button" onClick={() => onSubmit(answers)}>Submit Quiz</button>
          )}
        </footer>
      </section>
    </main>
  );
}

function QuizResults({ quiz, questions, answers, onRetake, onBack }) {
  const reviews = questions.map((question) => {
    const userAnswer = answers[question.question_number];
    const correctAnswer = question.type === 'CLOZE' ? question.answers.join(', ') : question.answer;
    const normalizedUser = Array.isArray(userAnswer) ? userAnswer.join(', ') : userAnswer || 'No answer';
    const isCorrect = question.type === 'CLOZE'
      ? question.answers.every((answer, index) => userAnswer?.[index] === answer)
      : String(userAnswer || '').trim().toLowerCase() === String(question.answer || '').trim().toLowerCase();
    const isPartial = question.type === 'SHORT_ANSWER' && normalizedUser !== 'No answer' && !isCorrect;

    return {
      question,
      userAnswer: normalizedUser,
      correctAnswer,
      status: isCorrect ? 'Correct' : isPartial ? 'Partially Correct' : 'Incorrect',
      feedback: question.type === 'SHORT_ANSWER'
        ? 'Short answers can be sent to /api/quiz/evaluate-short-answer for OpenAI-based feedback and marking.'
        : '',
    };
  });
  const correct = reviews.filter((review) => review.status === 'Correct').length;
  const partial = reviews.filter((review) => review.status === 'Partially Correct').length;
  const incorrect = reviews.length - correct - partial;
  const score = Math.round(((correct + partial * 0.5) / reviews.length) * 100);

  return (
    <main className="p-gutter md:p-margin-desktop quiz-page">
      <section className="quiz-results-hero">
        <div>
          <p className="quiz-eyebrow">Quiz results</p>
          <h2>{score}%</h2>
          <p>{quiz.title}</p>
        </div>
        <div className="quiz-result-stats">
          <span><strong>{correct}</strong> Correct</span>
          <span><strong>{partial}</strong> Partial</span>
          <span><strong>{incorrect}</strong> Incorrect</span>
        </div>
      </section>

      <section className="quiz-review-list">
        {reviews.map((review) => (
          <article key={review.question.question_number} className={`quiz-review-card quiz-review-card--${review.status.toLowerCase().replace(' ', '-')}`}>
            <div>
              <span>{review.status}</span>
              <h3>{review.question.question}</h3>
            </div>
            <p><strong>Your answer:</strong> {review.userAnswer}</p>
            <p><strong>Correct answer:</strong> {review.correctAnswer}</p>
            {review.feedback && <p><strong>Feedback:</strong> {review.feedback}</p>}
          </article>
        ))}
      </section>

      <div className="quiz-results-actions">
        <button className="quiz-button quiz-button--ghost" type="button" onClick={onBack}>Back to Quiz Generator</button>
        <button className="quiz-button quiz-button--primary" type="button" onClick={onRetake}>Retake Quiz</button>
      </div>
    </main>
  );
}

function QuizGeneratorPage({ profile, currentUser }) {
  const notes = useNoteManagement();
  const [quizzes, setQuizzes] = useState(SAMPLE_QUIZZES);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [resultState, setResultState] = useState(null);
  const allMaterials = useMemo(() => flattenStudyMaterials(notes.data.semesters || []), [notes.data.semesters]);
  const fullName = profile?.fullName || currentUser?.displayName || 'Student';
  const photoURL = currentUser?.photoURL || profile?.photoURL || '';

  const startQuiz = (quiz) => {
    setResultState(null);
    setActiveQuiz(quiz);
  };

  const handleGenerate = (payload) => {
    setIsCreateOpen(false);
    setIsGenerating(true);

    window.setTimeout(() => {
      const generatedQuiz = createGeneratedQuiz(payload);
      setQuizzes((current) => [generatedQuiz, ...current]);
      setIsGenerating(false);
      startQuiz(generatedQuiz);
    }, 1300);
  };

  const handleSubmit = (answers) => {
    setQuizzes((current) => current.map((quiz) => (
      quiz.id === activeQuiz.id ? { ...quiz, status: 'Completed', progress: 100, score: 84 } : quiz
    )));
    setResultState({ quiz: activeQuiz, answers });
    setActiveQuiz(null);
  };

  if (activeQuiz) {
    return <QuizAttempt quiz={activeQuiz} questions={SAMPLE_QUESTIONS} onBack={() => setActiveQuiz(null)} onSubmit={handleSubmit} />;
  }

  if (resultState) {
    return (
      <QuizResults
        quiz={resultState.quiz}
        questions={SAMPLE_QUESTIONS}
        answers={resultState.answers}
        onRetake={() => startQuiz(resultState.quiz)}
        onBack={() => setResultState(null)}
      />
    );
  }

  return (
    <main className="p-gutter md:p-margin-desktop space-y-xl quiz-page">
      <TopBar fullName={fullName} photoURL={photoURL} searchPlaceholder="Search quizzes, modules, or notes..." />

      <NotesSectionHeader
        title="Quiz Generator"
        description="Create and practice quizzes from your notes and study materials."
        action={<NotesActionButton icon="add_circle" label="Create New Quiz" onClick={() => setIsCreateOpen(true)} />}
      />

      {isGenerating && (
        <section className="quiz-generating-panel">
          <span className="material-symbols-outlined">auto_awesome</span>
          <div>
            <h3>Generating your personalized quiz...</h3>
            <p>Using selected notes, PDFs, and difficulty preferences.</p>
          </div>
          <div className="quiz-generating-dots"><span /><span /><span /></div>
        </section>
      )}

      {quizzes.length ? (
        <section className="quiz-card-grid">
          {quizzes.map((quiz) => {
            const actionLabel = quiz.status === 'Completed' ? 'Retake Quiz' : quiz.status === 'Partially Attempted' ? 'Continue Quiz' : 'Attempt Quiz';

            return (
              <article key={quiz.id} className="quiz-card">
                <div className="quiz-card__top">
                  <span className={`quiz-difficulty-badge quiz-difficulty-badge--${quiz.difficulty.toLowerCase()}`}>{quiz.difficulty}</span>
                  <span className="quiz-date">{quiz.createdAt}</span>
                </div>
                <h3>{quiz.title}</h3>
                <p>{quiz.location}</p>
                <div className="quiz-card__meta">
                  <span><span className="material-symbols-outlined">help</span>{quiz.questionCount} questions</span>
                  <span><span className="material-symbols-outlined">flag</span>{quiz.status}</span>
                </div>
                {quiz.status === 'Completed' ? (
                  <div className="quiz-score-pill">Score: {quiz.score}%</div>
                ) : (
                  <div className="quiz-progress-block">
                    <div><span>Progress</span><strong>{quiz.progress}%</strong></div>
                    <div className="quiz-progress-track"><span style={{ width: `${quiz.progress}%` }} /></div>
                  </div>
                )}
                <button className="quiz-button quiz-button--primary" type="button" onClick={() => startQuiz(quiz)}>{actionLabel}</button>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="quiz-empty-state">
          <span className="material-symbols-outlined">quiz</span>
          <h3>No quizzes generated yet</h3>
          <p>Create your first AI-powered quiz from your notes and PDFs.</p>
          <NotesActionButton icon="add_circle" label="Create New Quiz" onClick={() => setIsCreateOpen(true)} />
        </section>
      )}

      {isCreateOpen && (
        <CreateQuizModal
          semesters={notes.data.semesters || []}
          selectedItems={allMaterials.slice(0, 0)}
          onClose={() => setIsCreateOpen(false)}
          onGenerate={handleGenerate}
        />
      )}
    </main>
  );
}

export default QuizGeneratorPage;
