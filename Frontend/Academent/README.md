# Academent AI - Frontend & Reusable Component Library

Academent AI is a premium AI-driven study companion designed to personalize the student learning experience. The frontend is built on **React** and **Vite**, utilizing **Tailwind CSS** for rich aesthetics and responsive layouts. 

This repository includes a centralized, reusable **Component Library** that eliminates code duplication across auth and onboarding modules, ensuring UI consistency and high performance.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
- [npm](https://www.npmjs.com/)

### Installation
1. Navigate to the frontend directory:
   ```bash
   cd Frontend/Academent
   ```
2. Install the dependencies:
   ```bash
   npm install
   ```

### Running Locally
To launch the Vite development server locally:
```bash
npx vite
# or
npm run dev
```

### Building for Production
To bundle the project for production:
```bash
npm run build
```

---

## 📁 Project Architecture & Component Library

All centralized UI controls are located in `src/components/` and are fully controlled, mapping props back to page-level states.

```
src/
├── assets/             # Brand logos and vector graphics
├── components/         # Shared, reusable Component Library
│   ├── CircularProgress.jsx
│   ├── FormInput.jsx
│   ├── FormSelect.jsx
│   ├── SelectionCard.jsx
│   ├── Sidebar.jsx
│   └── WebGLBackground.jsx
├── context/            # Global context providers (e.g. AuthContext)
├── pages/              # Structured views (Authentication, Onboarding, Dashboard)
│   ├── AcademicProfilePage.jsx
│   ├── DashboardPage.jsx
│   ├── FinalOnboardingPage.jsx
│   ├── LearningGoalsPage.jsx
│   ├── LoginPage.jsx
│   ├── ResetPasswordPage.jsx
│   ├── SignupPage.jsx
│   └── VerifyEmailPage.jsx
└── Services/           # API and third-party wrappers (Firebase/Firestore auth)
```

---

## 🎨 Reusable Components Documentation

### 1. `WebGLBackground`
An organic, animated WebGL shader background featuring fluid gradients. It replaces the complex local canvas and resizing hooks across auth and onboarding modules.
- **Props**:
  - `opacity` (number): Canvas drawing layer opacity (default: `0.3`).
- **Usage**:
  ```jsx
  import WebGLBackground from '../components/WebGLBackground';

  function AuthLayout() {
    return (
      <div className="relative">
        <WebGLBackground opacity={0.3} />
        <div className="relative z-10">Form Content</div>
      </div>
    );
  }
  ```

### 2. `CircularProgress`
An SVG circular progress ring that represents onboarding step completion status.
- **Props**:
  - `percentage` (number): The completion percentage (e.g., `33`, `66`, `100`).
  - `size` (number): Diameter of the circle in pixels (default: `56`).
- **Usage**:
  ```jsx
  import CircularProgress from '../components/CircularProgress';

  <CircularProgress percentage={66} size={56} />
  ```

### 3. `FormInput`
A flexible input component supporting text, email, and password types. Includes inline visual indicators for password strength and character counts.
- **Props**:
  - `id` (string): Unique identifier for label mapping.
  - `name` (string): Field name.
  - `label` (string): Field label.
  - `type` (string): Input element type (`text`, `email`, `password`).
  - `value` (string): Current state value.
  - `onChange` (function): Event handler callback.
  - `placeholder` (string): Placeholder text.
  - `showStrength` (boolean): Whether to calculate and display password security strength.
  - `required` (boolean): Native HTML validation.
- **Usage**:
  ```jsx
  import FormInput from '../components/FormInput';

  <FormInput
    id="email"
    name="email"
    label="Email Address"
    type="email"
    value={email}
    onChange={e => setEmail(e.target.value)}
    required
  />
  ```

### 4. `FormSelect`
A styled drop-down selection input wrapping native select capabilities.
- **Props**:
  - `id` (string): Unique component identifier.
  - `name` (string): Select element name.
  - `label` (string): Dropdown title label.
  - `value` (string): Active state value.
  - `onChange` (function): Selection handler.
  - `options` (array of objects): `[{ value, label }]` representing options.
  - `containerClassName` (string): Additional style overrides.
- **Usage**:
  ```jsx
  import FormSelect from '../components/FormSelect';

  <FormSelect
    id="degree"
    label="Academic Degree"
    value={degree}
    onChange={e => setDegree(e.target.value)}
    options={[
      { value: 'undergrad', label: 'Undergraduate' },
      { value: 'grad', label: 'Graduate' }
    ]}
  />
  ```

### 5. `SelectionCard`
A premium checkbox or radio selection card equipped with vector icons and hover transition animations, ideal for capturing learning style preferences.
- **Props**:
  - `id` (string): Unique element ID.
  - `name` (string): Group name.
  - `type` (string): Native selector type (`checkbox`, `radio`).
  - `checked` (boolean): Checked state.
  - `onChange` (function): Check change callback.
  - `icon` (string): Google Material Symbols icon name.
  - `label` (string): Display text description.
- **Usage**:
  ```jsx
  import SelectionCard from '../components/SelectionCard';

  <SelectionCard
    id="visual"
    name="studyStyle"
    type="radio"
    checked={studyStyle === 'visual'}
    onChange={() => setStudyStyle('visual')}
    icon="visibility"
    label="Visual Learner"
  />
  ```

### 6. `Sidebar`
The main navigation drawer and account control console for the student dashboard.
- **Props**:
  - `activeTab` (string): Active dashboard view ID.
  - `onTabChange` (function): Tab change callback.
  - `isMobileMenuOpen` (boolean): Toggle drawer state.
  - `onMobileMenuClose` (function): Mobile drawer close trigger.
  - `currentUser` (object): Logged-in user model from Auth context.
  - `profile` (object): Student profile data mapping from Firestore.
  - `onLogout` (function): Callback handler for signing out.
  - `onNewNote` (function): Trigger button callback to start new study session.
- **Usage**:
  ```jsx
  import Sidebar from '../components/Sidebar';

  <Sidebar
    activeTab={activeTab}
    onTabChange={setActiveTab}
    currentUser={currentUser}
    profile={profile}
    onLogout={handleLogout}
    onNewNote={handleNewNote}
  />
  ```

---

## ⚡ Key Refactoring Gains

1. **Reduced Boilerplate**: Abstracted ~800 lines of duplicate WebGL setup, resizing hooks, SVG progress definitions, and layout configurations.
2. **Design Token Alignment**: Standardized responsive dimensions and spacing matching the platform's material typography rules.
3. **Accessibility (A11y) & SEO**: Implemented native `aria` guidelines, unique interactive IDs, HTML5 semantic layout structures (`main`, `aside`, `section`), and dynamic document titles.
