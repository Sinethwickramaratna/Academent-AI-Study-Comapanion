import { useCallback, useEffect, useMemo, useState } from 'react';
import NotesActionButton from '../components/NotesActionButton';
import LoadingEffect from '../components/LoadingEffect';
import NotesSectionHeader from '../components/NotesSectionHeader';
import TopBar from '../components/TopBar';
import useNoteManagement from '../Services/useNoteManagement';
import useQuizGenerator from '../Services/useQuizGenerator';
import './quizgeneratorpage.css';

const DIFFICULTY_RULES = {
  easy: 'MCQ and True/False questions',
  medium: 'MCQ, True/False, Fill in the Blank, and Cloze questions',
  hard: 'MCQ, True/False, Fill in the Blank, Cloze, Scenario-Based, and Short Answer questions',
};

const difficultyLabels = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const statusLabels = {
  not_attempted: 'Not Attempted',
  partially_attempted: 'Partially Attempted',
  completed: 'Completed',
};

const toDateLabel = (value) => {
  const date = value?.toDate?.() || value;
  if (!(date instanceof Date)) return 'Just now';
  return new Intl.DateTimeFormat('en', { month: 'short', day: '2-digit', year: 'numeric' }).format(date);
};

const answerToText = (answer) => Array.isArray(answer) ? answer.join(', ') : answer || 'No answer';

const shuffleAnswers = (answers = []) => {
  const items = [...answers];

  for (let index = items.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[randomIndex]] = [items[randomIndex], items[index]];
  }

  return items;
};

const flattenStudyMaterials = (semesters = []) => {
  const materials = [];

  const visitFolder = (folder, path) => {
    const folderPath = `${path} / ${folder.title}`;

    (folder.notes || []).forEach((note) => materials.push({
      id: note.noteId,
      sourceId: note.noteId,
      type: 'note',
      title: note.title,
      path: folderPath,
      content: note.content,
      icon: 'description',
    }));

    (folder.pdfs || []).forEach((pdf) => materials.push({
      id: pdf.pdfId,
      sourceId: pdf.pdfId,
      type: 'pdf',
      title: pdf.title,
      path: folderPath,
      content: `${pdf.title}\n${pdf.url}`,
      url: pdf.url,
      icon: 'picture_as_pdf',
    }));

    (folder.folders || []).forEach((child) => visitFolder(child, folderPath));
  };

  semesters.forEach((semester) => {
    (semester.modules || []).forEach((module) => {
      const modulePath = `${semester.title} / ${module.title || module.moduleId}`;

      (module.notes || []).forEach((note) => materials.push({
        id: note.noteId,
        sourceId: note.noteId,
        type: 'note',
        title: note.title,
        path: modulePath,
        content: note.content,
        icon: 'description',
      }));

      (module.pdfs || []).forEach((pdf) => materials.push({
        id: pdf.pdfId,
        sourceId: pdf.pdfId,
        type: 'pdf',
        title: pdf.title,
        path: modulePath,
        content: `${pdf.title}\n${pdf.url}`,
        url: pdf.url,
        icon: 'picture_as_pdf',
      }));

      (module.folders || []).forEach((folder) => visitFolder(folder, modulePath));
    });
  });

  return materials;
};

function StudyMaterialTree({ semesters, selectedIds, expandedIds, onToggleExpanded, onToggleSelected }) {
  const renderMaterial = (item, path) => {
    const material = {
      id: item.id,
      sourceId: item.id,
      type: item.type,
      title: item.title,
      path,
      content: item.content || `${item.title}\n${item.url || ''}`,
      url: item.url,
      icon: item.type === 'pdf' ? 'picture_as_pdf' : 'description',
    };

    return (
      <label key={`${item.type}-${item.id}`} className="quiz-tree-file">
        <input
          checked={selectedIds.includes(material.id)}
          type="checkbox"
          onChange={() => onToggleSelected(material)}
        />
        <span className="material-symbols-outlined">{material.icon}</span>
        <span>{material.title}</span>
      </label>
    );
  };

  const renderFolder = (folder, path) => {
    const folderKey = `folder-${folder.folderId}`;
    const isOpen = expandedIds.includes(folderKey);
    const folderPath = `${path} / ${folder.title}`;

    return (
      <div key={folder.folderId} className="quiz-tree-branch">
        <button type="button" className="quiz-tree-node" onClick={() => onToggleExpanded(folderKey)}>
          <span className="material-symbols-outlined">{isOpen ? 'expand_more' : 'chevron_right'}</span>
          <span className="material-symbols-outlined">folder</span>
          <span>{folder.title}</span>
        </button>
        {isOpen && (
          <div className="quiz-tree-children">
            {(folder.notes || []).map((note) => renderMaterial({ ...note, id: note.noteId, type: 'note' }, folderPath))}
            {(folder.pdfs || []).map((pdf) => renderMaterial({ ...pdf, id: pdf.pdfId, type: 'pdf' }, folderPath))}
            {(folder.folders || []).map((child) => renderFolder(child, folderPath))}
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

function CreateQuizModal({ semesters, onClose, onGenerate, isGenerating }) {
  const [difficulty, setDifficulty] = useState('medium');
  const [questionCount, setQuestionCount] = useState(6);
  const [title, setTitle] = useState('');
  const [expandedIds, setExpandedIds] = useState(() => {
    const firstSemester = semesters[0];
    const firstModule = firstSemester?.modules?.[0];
    return [firstSemester && `semester-${firstSemester.semesterId}`, firstModule && `module-${firstModule.moduleId}`].filter(Boolean);
  });
  const [selectedItems, setSelectedItems] = useState([]);

  const selectedIds = selectedItems.map((item) => item.id);
  const toggleExpanded = (id) => setExpandedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  const toggleSelected = (item) => setSelectedItems((current) => current.some((selected) => selected.id === item.id) ? current.filter((selected) => selected.id !== item.id) : [...current, item]);
  const removeSelected = (id) => setSelectedItems((current) => current.filter((item) => item.id !== id));
  const canGenerate = selectedItems.length > 0 && questionCount >= 1 && !isGenerating;

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
                    <span>{difficultyLabels[level]}</span>
                  </label>
                ))}
              </div>
              <p>{DIFFICULTY_RULES[difficulty]}</p>
            </fieldset>
            <label className="quiz-form-field">
              <span>Number of questions</span>
              <input min="1" max="20" type="number" value={questionCount} onChange={(event) => setQuestionCount(Number(event.target.value))} />
            </label>
          </section>

          <section className="quiz-setup-card quiz-material-card">
            <div className="quiz-setup-card__heading">
              <div>
                <h4>Select Study Materials</h4>
                <p>Pick notes and PDFs from your saved note structure.</p>
              </div>
            </div>
            <StudyMaterialTree semesters={semesters} selectedIds={selectedIds} expandedIds={expandedIds} onToggleExpanded={toggleExpanded} onToggleSelected={toggleSelected} />
          </section>

          <aside className="quiz-setup-card quiz-selected-panel">
            <h4>Selected Items</h4>
            {selectedItems.length ? (
              <div className="quiz-selected-list">
                {selectedItems.map((item) => (
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
          <button className="quiz-button quiz-button--ghost" type="button" onClick={onClose} disabled={isGenerating}>Cancel</button>
          <button className="quiz-button quiz-button--primary" type="button" disabled={!canGenerate} onClick={() => onGenerate({ title, difficulty, questionCount, selectedItems })}>
            <span className="material-symbols-outlined">auto_awesome</span>
            {isGenerating ? <LoadingEffect variant="inline" title="Generating" /> : 'Generate Quiz'}
          </button>
        </footer>
      </section>
    </div>
  );
}

function DeleteQuizModal({ quiz, onClose, onConfirm, isDeleting }) {
  if (!quiz) return null;

  return (
    <div className="quiz-modal-backdrop">
      <section className="quiz-delete-modal" role="dialog" aria-modal="true" aria-labelledby="delete-quiz-title">
        <header className="quiz-delete-modal__header">
          <span className="material-symbols-outlined">delete</span>
          <div>
            <p className="quiz-eyebrow">Remove quiz</p>
            <h3 id="delete-quiz-title">Delete {quiz.title}?</h3>
          </div>
        </header>
        <p>This will remove the quiz and its saved attempts from your account.</p>
        <footer className="quiz-modal__actions quiz-delete-modal__actions">
          <button className="quiz-button quiz-button--ghost" type="button" onClick={onClose} disabled={isDeleting}>Cancel</button>
          <button className="quiz-button quiz-button--danger" type="button" onClick={onConfirm} disabled={isDeleting}>
            <span className="material-symbols-outlined">delete</span>
            {isDeleting ? <LoadingEffect variant="inline" title="Deleting" /> : 'Delete Quiz'}
          </button>
        </footer>
      </section>
    </div>
  );
}
function QuizAttempt({ quiz, attempt, onBack, onSubmit, onSaveProgress, isSubmitting }) {
  const [index, setIndex] = useState(attempt.currentQuestionIndex || 0);
  const [answers, setAnswers] = useState(attempt.userAnswers || {});
  const [saveState, setSaveState] = useState('Saved');
  const questions = quiz.questions || [];
  const question = questions[index] || questions[0];
  const progress = questions.length ? Math.round(((index + 1) / questions.length) * 100) : 0;
  const clozeAnswerChoices = useMemo(() => (
    question?.type === 'CLOZE' ? shuffleAnswers(question.answers || []) : []
  ), [question?.answers, question?.questionId, question?.type]);

  useEffect(() => {
    if (!attempt?.attemptId || !question) return undefined;
    const savingHandle = window.setTimeout(() => setSaveState('Saving...'), 0);
    const handle = window.setTimeout(() => {
      onSaveProgress(attempt.attemptId, {
        quizId: quiz.quizId,
        userAnswers: answers,
        currentQuestionIndex: index,
        progressPercentage: progress,
      })
        .then(() => setSaveState('Saved'))
        .catch(() => setSaveState('Unable to save'));
    }, 450);

    return () => {
      window.clearTimeout(savingHandle);
      window.clearTimeout(handle);
    };
  }, [answers, attempt?.attemptId, index, onSaveProgress, progress, question, quiz.quizId]);

  const setAnswer = useCallback((value) => {
    setAnswers((current) => ({
      ...current,
      [question.questionId]: {
        ...(current[question.questionId] || {}),
        answer: value,
        isCorrect: null,
        marks: null,
        feedback: '',
      },
    }));
  }, [question]);

  const setClozeAnswer = (blankIndex, value) => {
    const currentAnswer = answers[question.questionId]?.answer;
    const next = Array.isArray(currentAnswer) ? [...currentAnswer] : [];
    next[blankIndex] = value;
    setAnswer(next);
  };

  if (!question) {
    return (
      <main className="p-gutter md:p-margin-desktop quiz-page">
        <section className="quiz-empty-state"><h3>This quiz has no questions.</h3></section>
      </main>
    );
  }

  const currentAnswer = answers[question.questionId]?.answer;
  const renderQuestionBody = () => {

    if (question.type === 'MCQ' || question.type === 'FILL_BLANK' || question.type === 'SCENARIO') {
      return (
        <div className="quiz-option-grid">
          {(question.options || []).map((option) => (
            <button key={option} className={currentAnswer === option ? 'quiz-answer-option quiz-answer-option--selected' : 'quiz-answer-option'} type="button" onClick={() => setAnswer(option)}>
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
            <button key={option} className={currentAnswer === option ? 'quiz-answer-option quiz-answer-option--selected' : 'quiz-answer-option'} type="button" onClick={() => setAnswer(option)}>
              {option}
            </button>
          ))}
        </div>
      );
    }

    if (question.type === 'CLOZE') {
      const parts = question.question.split('________');
      const clozeAnswers = Array.isArray(currentAnswer) ? currentAnswer : [];
      const handleBlankDrop = (event, blankIndex) => {
        event.preventDefault();
        const droppedAnswer = event.dataTransfer.getData('text/plain');
        if (droppedAnswer) setClozeAnswer(blankIndex, droppedAnswer);
      };

      return (
        <div className="quiz-cloze">
          <p className="quiz-cloze-sentence">
            {parts.map((part, partIndex) => (
              <span key={`${part}-${partIndex}`}>
                {part}
                {partIndex < parts.length - 1 && (
                  <button
                    className={clozeAnswers[partIndex] ? 'quiz-inline-blank quiz-inline-blank--filled' : 'quiz-inline-blank'}
                    type="button"
                    onClick={() => setClozeAnswer(partIndex, '')}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleBlankDrop(event, partIndex)}
                    aria-label={`Blank ${partIndex + 1}`}
                  >
                    {clozeAnswers[partIndex] || `Blank ${partIndex + 1}`}
                  </button>
                )}
              </span>
            ))}
          </p>
          <div className="quiz-chip-bank">
            {clozeAnswerChoices.map((answer) => (
              <button key={answer} type="button" draggable onDragStart={(event) => event.dataTransfer.setData('text/plain', answer)}>{answer}</button>
            ))}
          </div>
        </div>
      );
    }

    return <textarea className="quiz-short-answer" value={currentAnswer || ''} placeholder="Type your answer here..." onChange={(event) => setAnswer(event.target.value)} />;
  };

  return (
    <main className="p-gutter md:p-margin-desktop quiz-page">
      <section className="quiz-attempt-shell">
        <header className="quiz-attempt-header">
          <button className="quiz-button quiz-button--ghost" type="button" onClick={onBack}><span className="material-symbols-outlined">chevron_left</span>Back</button>
          <div>
            <p className="quiz-eyebrow">Question {index + 1} of {questions.length} - {saveState}</p>
            <h2>{quiz.title}</h2>
          </div>
          <span className="quiz-type-badge">{question.type.replace('_', ' ')}</span>
        </header>

        <div className="quiz-progress-track"><span style={{ width: `${progress}%` }} /></div>

        <article className="quiz-question-card">
          {question.type !== 'CLOZE' && <h3>{question.question}</h3>}
          {renderQuestionBody()}
        </article>

        <footer className="quiz-attempt-actions">
          <button className="quiz-button quiz-button--ghost" type="button" disabled={index === 0 || isSubmitting} onClick={() => setIndex((current) => current - 1)}>Previous</button>
          {index < questions.length - 1 ? (
            <button className="quiz-button quiz-button--primary" type="button" disabled={isSubmitting} onClick={() => setIndex((current) => current + 1)}>Next</button>
          ) : (
            <button className="quiz-button quiz-button--primary" type="button" disabled={isSubmitting} onClick={() => onSubmit(answers)}>{isSubmitting ? <LoadingEffect variant="inline" title="Submitting" /> : 'Submit Quiz'}</button>
          )}
        </footer>
      </section>
    </main>
  );
}

function QuizResults({ quiz, result, onRetake, onBack, isWorking }) {
  const evaluatedAnswers = result.evaluatedAnswers || {};
  const reviews = (quiz.questions || []).map((question) => {
    const evaluation = evaluatedAnswers[question.questionId] || {};
    const marks = Number(evaluation.marks || 0);
    const status = marks >= 1 ? 'Correct' : marks > 0 ? 'Partially Correct' : 'Incorrect';
    const correctAnswer = question.type === 'CLOZE' ? (question.answers || []).join(', ') : question.answer;

    return {
      question,
      userAnswer: answerToText(evaluation.answer),
      correctAnswer: answerToText(correctAnswer),
      status,
      feedback: evaluation.feedback || '',
      correctExplanation: evaluation.correctExplanation || '',
    };
  });

  return (
    <main className="p-gutter md:p-margin-desktop quiz-page">
      <section className="quiz-results-hero">
        <div>
          <p className="quiz-eyebrow">Quiz results</p>
          <h2>{result.percentage}%</h2>
          <p>{quiz.title}</p>
        </div>
        <div className="quiz-result-stats">
          <span><strong>{result.correctCount}</strong> Correct</span>
          <span><strong>{result.partiallyCorrectCount}</strong> Partial</span>
          <span><strong>{result.incorrectCount}</strong> Incorrect</span>
        </div>
      </section>

      <section className="quiz-review-list">
        {reviews.map((review) => (
          <article key={review.question.questionId} className={`quiz-review-card quiz-review-card--${review.status.toLowerCase().replace(' ', '-')}`}>
            <div>
              <span>{review.status}</span>
              <h3>{review.question.question}</h3>
            </div>
            <p><strong>Your answer:</strong> {review.userAnswer}</p>
            <p><strong>Correct answer:</strong> {review.correctAnswer}</p>
            {review.feedback && <p><strong>Why your answer is {review.status.toLowerCase()}:</strong> {review.feedback}</p>}
            {review.correctExplanation && <p><strong>Explanation:</strong> {review.correctExplanation}</p>}
          </article>
        ))}
      </section>

      <div className="quiz-results-actions">
        <button className="quiz-button quiz-button--ghost" type="button" onClick={onBack}>Back to Quiz Generator</button>
        <button className="quiz-button quiz-button--primary" type="button" disabled={isWorking} onClick={onRetake}>Retake Quiz</button>
      </div>
    </main>
  );
}

function QuizGeneratorPage({ profile, currentUser, initialQuizId, onInitialQuizOpened }) {
  const notes = useNoteManagement();
  const quizStore = useQuizGenerator();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [resultState, setResultState] = useState(null);
  const [quizPendingDelete, setQuizPendingDelete] = useState(null);
  const [openedInitialQuizId, setOpenedInitialQuizId] = useState(null);
  const fullName = profile?.fullName || currentUser?.displayName || 'Student';
  const photoURL = currentUser?.photoURL || profile?.photoURL || '';
  useMemo(() => flattenStudyMaterials(notes.data.semesters || []), [notes.data.semesters]);

  const openQuiz = async (quiz) => {
    const attempt = quiz.status === 'completed'
      ? await quizStore.retakeQuiz(quiz)
      : await quizStore.startOrContinueQuiz(quiz);
    setResultState(null);
    setActiveSession({ quiz, attempt });
  };

  useEffect(() => {
    if (!initialQuizId || openedInitialQuizId === initialQuizId || quizStore.loading || quizStore.working || activeSession) return;

    const quiz = quizStore.quizzes.find((item) => item.quizId === initialQuizId);
    if (!quiz) return;

    setOpenedInitialQuizId(initialQuizId);
    onInitialQuizOpened?.();
    openQuiz(quiz);
  }, [activeSession, initialQuizId, onInitialQuizOpened, openedInitialQuizId, quizStore.loading, quizStore.quizzes, quizStore.working]);

  const handleGenerate = async (payload) => {
    setIsCreateOpen(false);
    const quiz = await quizStore.generateQuiz(payload);
    const attempt = await quizStore.startOrContinueQuiz(quiz);
    setActiveSession({ quiz, attempt });
  };

  const handleSubmit = async (answers) => {
    const result = await quizStore.submitAttempt(activeSession.quiz, activeSession.attempt, answers);
    setResultState({ quiz: activeSession.quiz, result });
    setActiveSession(null);
  };

  const handleRetakeFromResults = async () => {
    if (!resultState?.quiz) return;
    const attempt = await quizStore.retakeQuiz(resultState.quiz);
    setActiveSession({ quiz: resultState.quiz, attempt });
    setResultState(null);
  };

  const handleDeleteQuiz = async () => {
    if (!quizPendingDelete) return;

    await quizStore.removeQuiz(quizPendingDelete);
    if (activeSession?.quiz?.quizId === quizPendingDelete.quizId) setActiveSession(null);
    if (resultState?.quiz?.quizId === quizPendingDelete.quizId) setResultState(null);
    setQuizPendingDelete(null);
  };

  if (activeSession) {
    return <QuizAttempt quiz={activeSession.quiz} attempt={activeSession.attempt} onBack={() => setActiveSession(null)} onSubmit={handleSubmit} onSaveProgress={quizStore.saveAttemptProgress} isSubmitting={quizStore.working} />;
  }

  if (resultState) {
    return <QuizResults quiz={resultState.quiz} result={resultState.result} onRetake={handleRetakeFromResults} onBack={() => setResultState(null)} isWorking={quizStore.working} />;
  }

  return (
    <main className="p-gutter md:p-margin-desktop space-y-xl quiz-page">
      <TopBar fullName={fullName} photoURL={photoURL} searchPlaceholder="Search quizzes, modules, or notes..." />

      <NotesSectionHeader title="Quiz Generator" description="Create and practice quizzes from your notes and study materials." action={<NotesActionButton icon="add_circle" label="Create New Quiz" onClick={() => setIsCreateOpen(true)} />} />

      {(quizStore.working || notes.loading) && (
        <LoadingEffect
          icon="auto_awesome"
          title={quizStore.working ? 'Generating your personalized quiz' : 'Loading quiz workspace'}
          message="Using selected notes, PDFs, extracted knowledge, and saved quiz progress."
        />
      )}

      {(quizStore.error || notes.error) && (
        <section className="quiz-error-panel">
          <span className="material-symbols-outlined">error</span>
          <p>{quizStore.error?.message || notes.error?.message}</p>
        </section>
      )}

      {quizStore.quizzes.length ? (
        <section className="quiz-card-grid">
          {quizStore.quizzes.map((quiz) => {
            const actionLabel = quiz.status === 'completed' ? 'Retake Quiz' : quiz.status === 'partially_attempted' ? 'Continue Quiz' : 'Attempt Quiz';
            const progress = quiz.status === 'completed' ? 100 : quiz.progressPercentage || 0;

            return (
              <article key={quiz.quizId} className="quiz-card">
                <div className="quiz-card__top">
                  <span className={`quiz-difficulty-badge quiz-difficulty-badge--${quiz.difficulty}`}>{difficultyLabels[quiz.difficulty] || quiz.difficulty}</span>
                  <span className="quiz-date">{toDateLabel(quiz.createdAt)}</span>
                </div>
                <h3>{quiz.title}</h3>
                <p>{quiz.selectedMaterials?.[0]?.path || 'Selected study materials'}</p>
                <div className="quiz-card__meta">
                  <span><span className="material-symbols-outlined">help</span>{quiz.totalQuestions} questions</span>
                  <span><span className="material-symbols-outlined">flag</span>{statusLabels[quiz.status] || quiz.status}</span>
                </div>
                {quiz.status === 'completed' ? (
                  <div className="quiz-score-pill">Score: {quiz.percentage ?? quiz.score}%</div>
                ) : (
                  <div className="quiz-progress-block">
                    <div><span>Progress</span><strong>{progress}%</strong></div>
                    <div className="quiz-progress-track"><span style={{ width: `${progress}%` }} /></div>
                  </div>
                )}
                <div className="quiz-card__actions">
                  <button className="quiz-icon-button quiz-icon-button--danger" type="button" disabled={quizStore.working} onClick={() => setQuizPendingDelete(quiz)} aria-label={`Delete ${quiz.title}`}>
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                  <button className="quiz-button quiz-button--primary" type="button" disabled={quizStore.working} onClick={() => openQuiz(quiz)}>{actionLabel}</button>
                </div>
              </article>
            );
          })}
        </section>
      ) : !quizStore.loading && (
        <section className="quiz-empty-state">
          <span className="material-symbols-outlined">quiz</span>
          <h3>No quizzes generated yet</h3>
          <p>Create your first AI-powered quiz from your notes and PDFs.</p>
          <NotesActionButton icon="add_circle" label="Create New Quiz" onClick={() => setIsCreateOpen(true)} />
        </section>
      )}

      {isCreateOpen && <CreateQuizModal semesters={notes.data.semesters || []} onClose={() => setIsCreateOpen(false)} onGenerate={handleGenerate} isGenerating={quizStore.working} />}
      <DeleteQuizModal quiz={quizPendingDelete} onClose={() => setQuizPendingDelete(null)} onConfirm={handleDeleteQuiz} isDeleting={quizStore.working} />
    </main>
  );
}

export default QuizGeneratorPage;
