import logoUrl from '../assets/Logo/Logo.png';

const PDF_PAGE = { width: 595.28, height: 841.89, margin: 42 };
const pdfEncoder = new TextEncoder();
const pdfBytes = (value) => pdfEncoder.encode(value);
const pdfAscii = (value) => String(value ?? 'Not provided')
  .normalize('NFKD')
  .replace(/[^\x20-\x7E]/g, '')
  .replace(/\s+/g, ' ')
  .trim() || 'Not provided';
const pdfString = (value) => pdfAscii(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
const pdfWrap = (value, maxChars) => {
  const words = pdfAscii(value).split(' ');
  const lines = [];
  let line = '';
  words.forEach((word) => {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  return lines.length ? lines : ['Not provided'];
};
const pdfShort = (value, maxChars = 56) => {
  const safe = pdfAscii(value);
  return safe.length > maxChars ? `${safe.slice(0, Math.max(0, maxChars - 3))}...` : safe;
};

const concatPdfParts = (parts) => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const result = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
};

const loadReportLogo = () => new Promise((resolve) => {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth || 120;
    canvas.height = image.naturalHeight || 120;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(null);
        return;
      }
      resolve({ width: canvas.width, height: canvas.height, bytes: new Uint8Array(await blob.arrayBuffer()) });
    }, 'image/jpeg', 0.92);
  };
  image.onerror = () => resolve(null);
  image.src = logoUrl;
});

const createPdfBlob = ({ pages, logoImage }) => {
  const objects = [];
  const addObject = (body) => {
    objects.push(typeof body === 'string' ? pdfBytes(body) : body);
    return objects.length;
  };

  const catalogId = addObject('');
  const pagesId = addObject('');
  const fontId = addObject('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const logoId = logoImage ? addObject(concatPdfParts([
    pdfBytes(`<< /Type /XObject /Subtype /Image /Width ${logoImage.width} /Height ${logoImage.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${logoImage.bytes.length} >>\nstream\n`),
    logoImage.bytes,
    pdfBytes('\nendstream'),
  ])) : null;
  const pageIds = [];

  pages.forEach((content) => {
    const contentBytes = pdfBytes(content);
    const contentId = addObject(concatPdfParts([
      pdfBytes(`<< /Length ${contentBytes.length} >>\nstream\n`),
      contentBytes,
      pdfBytes('\nendstream'),
    ]));
    const resources = logoId
      ? `<< /Font << /F1 ${fontId} 0 R >> /XObject << /Logo ${logoId} 0 R >> >>`
      : `<< /Font << /F1 ${fontId} 0 R >> >>`;
    const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PDF_PAGE.width} ${PDF_PAGE.height}] /Resources ${resources} /Contents ${contentId} 0 R >>`);
    pageIds.push(pageId);
  });

  objects[catalogId - 1] = pdfBytes(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);
  objects[pagesId - 1] = pdfBytes(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);

  const parts = [pdfBytes('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')];
  const offsets = [0];
  let length = parts[0].length;
  objects.forEach((object, index) => {
    offsets.push(length);
    const wrapped = concatPdfParts([pdfBytes(`${index + 1} 0 obj\n`), object, pdfBytes('\nendobj\n')]);
    parts.push(wrapped);
    length += wrapped.length;
  });
  const xrefOffset = length;
  const xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n `).join('\n')}\ntrailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  parts.push(pdfBytes(xref));
  return new Blob([concatPdfParts(parts)], { type: 'application/pdf' });
};

const createLayout = ({ continuedTitle, logoImage }) => {
  const pages = [];
  let commands = [];
  let y = PDF_PAGE.height - PDF_PAGE.margin;

  const add = (command) => commands.push(command);
  const color = (hex) => {
    const value = hex.replace('#', '');
    const r = parseInt(value.slice(0, 2), 16) / 255;
    const g = parseInt(value.slice(2, 4), 16) / 255;
    const b = parseInt(value.slice(4, 6), 16) / 255;
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`;
  };
  const text = (value, x, textY, size = 10, fill = '#171326') => add(`${color(fill)} rg BT /F1 ${size} Tf ${x} ${textY} Td (${pdfString(value)}) Tj ET`);
  const line = (x1, y1, x2, y2, stroke = '#e5ddf3') => add(`${color(stroke)} RG ${x1} ${y1} m ${x2} ${y2} l S`);
  const rect = (x, rectY, width, height, fill = '#fbf9ff') => add(`${color(fill)} rg ${x} ${rectY} ${width} ${height} re f`);
  const addPage = (continued = true) => {
    pages.push(commands.join('\n'));
    commands = [];
    y = PDF_PAGE.height - PDF_PAGE.margin;
    if (continued) {
      text(continuedTitle, PDF_PAGE.margin, y, 12, '#4d2b8c');
      y -= 20;
      line(PDF_PAGE.margin, y, PDF_PAGE.width - PDF_PAGE.margin, y, '#4d2b8c');
      y -= 24;
    }
  };
  const ensure = (height) => {
    if (y - height < PDF_PAGE.margin) addPage();
  };
  const heading = (value) => {
    ensure(34);
    y -= 8;
    text(value, PDF_PAGE.margin, y, 15, '#4d2b8c');
    y -= 12;
    line(PDF_PAGE.margin, y, PDF_PAGE.width - PDF_PAGE.margin, y, '#e5ddf3');
    y -= 18;
  };
  const wrappedText = (value, x, maxWidth, size = 9, fill = '#171326') => {
    const lines = pdfWrap(value, Math.max(12, Math.floor(maxWidth / (size * 0.52))));
    lines.forEach((item) => {
      text(item, x, y, size, fill);
      y -= size + 4;
    });
  };
  const keyValues = (title, items) => {
    heading(title);
    const columnWidth = (PDF_PAGE.width - PDF_PAGE.margin * 2 - 12) / 2;
    for (let index = 0; index < items.length; index += 2) {
      ensure(48);
      [0, 1].forEach((offset) => {
        const item = items[index + offset];
        if (!item) return;
        const x = PDF_PAGE.margin + offset * (columnWidth + 12);
        rect(x, y - 31, columnWidth, 38);
        text(item[0], x + 8, y - 5, 8, '#6f667a');
        text(pdfShort(item[1], 42), x + 8, y - 22, 10, '#171326');
      });
      y -= 48;
    }
  };
  const table = (title, columns, rows, emptyText) => {
    heading(title);
    if (!rows.length) {
      ensure(26);
      rect(PDF_PAGE.margin, y - 22, PDF_PAGE.width - PDF_PAGE.margin * 2, 28);
      text(emptyText, PDF_PAGE.margin + 8, y - 10, 9, '#6f667a');
      y -= 38;
      return;
    }
    const totalWidth = PDF_PAGE.width - PDF_PAGE.margin * 2;
    const widths = columns.map((column) => column.width || totalWidth / columns.length);
    ensure(26);
    rect(PDF_PAGE.margin, y - 18, totalWidth, 24, '#4d2b8c');
    let x = PDF_PAGE.margin;
    columns.forEach((column, index) => {
      text(column.label, x + 6, y - 9, 8, '#ffffff');
      x += widths[index];
    });
    y -= 28;
    rows.forEach((row, rowIndex) => {
      ensure(30);
      rect(PDF_PAGE.margin, y - 18, totalWidth, 24, rowIndex % 2 ? '#ffffff' : '#fbf9ff');
      x = PDF_PAGE.margin;
      columns.forEach((column, index) => {
        const maxChars = column.maxChars || Math.max(10, Math.floor((widths[index] - 12) / 4.5));
        text(pdfShort(column.value(row), maxChars), x + 6, y - 9, 8, '#171326');
        x += widths[index];
      });
      y -= 24;
    });
    y -= 8;
  };
  const bullets = (title, items, emptyText) => {
    heading(title);
    if (!items.length) {
      wrappedText(emptyText, PDF_PAGE.margin, PDF_PAGE.width - PDF_PAGE.margin * 2, 9, '#6f667a');
      y -= 8;
      return;
    }
    items.forEach((item) => {
      ensure(36);
      text('-', PDF_PAGE.margin, y, 10, '#4d2b8c');
      wrappedText(item, PDF_PAGE.margin + 14, PDF_PAGE.width - PDF_PAGE.margin * 2 - 14, 9, '#171326');
      y -= 2;
    });
  };
  const setY = (value) => {
    y = value;
  };
  const getY = () => y;
  const finish = () => {
    pages.push(commands.join('\n'));
    return createPdfBlob({ pages, logoImage });
  };

  return { add, text, line, rect, keyValues, table, bullets, setY, getY, finish };
};

const formatExportDate = (value = new Date()) => new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(value);
const valueOrFallback = (value, fallback = 'Not provided') => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : fallback;
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value && typeof value.toDate === 'function') return formatExportDate(value.toDate());
  if (value instanceof Date) return formatExportDate(value);
  if (value === 0) return '0';
  const text = String(value ?? '').trim();
  return text || fallback;
};
const titleFromKey = (key) => String(key || '')
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[-_]+/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .replace(/^./, (letter) => letter.toUpperCase()) || 'Setting';
const toRoleLabel = (role) => titleFromKey(role || 'Student');

export const createAnalyticsReportPdfBlob = async ({ analytics, profile, currentUser }) => {
  const academicProfile = profile?.academicProfile || {};
  const learningPreferences = profile?.learningPreferences || {};
  const subjects = Array.isArray(academicProfile.subjects) ? academicProfile.subjects.join(', ') : academicProfile.subjects;
  const fullName = profile?.fullName || currentUser?.displayName || 'Student';
  const generatedAt = formatExportDate(new Date());
  const logoImage = await loadReportLogo();
  const report = createLayout({ continuedTitle: 'Academent Analytics Report - continued', logoImage });

  if (logoImage) report.add('q 54 0 0 54 42 744 cm /Logo Do Q');
  report.text('Analytics Report', logoImage ? 108 : 42, 785, 24, '#4d2b8c');
  report.text('Academent AI Study Companion', logoImage ? 108 : 42, 766, 11, '#6f667a');
  report.text(generatedAt, 410, 785, 9, '#171326');
  report.text(`Range: ${analytics.rangeLabel}`, 410, 768, 9, '#6f667a');
  report.setY(718);
  report.line(PDF_PAGE.margin, report.getY(), PDF_PAGE.width - PDF_PAGE.margin, report.getY(), '#4d2b8c');
  report.setY(report.getY() - 20);

  report.keyValues('Student Details', [
    ['Student name', fullName],
    ['Email', currentUser?.email || profile?.email],
    ['Major / Program', academicProfile.major],
    ['Education level', academicProfile.educationLevel],
    ['Subjects', subjects],
    ['Study style', learningPreferences.studyStyle],
    ['Weekly target', learningPreferences.weeklyHours],
    ['Report range', analytics.rangeLabel],
  ]);
  report.table('Performance Summary', [
    { label: 'Metric', value: (item) => item.label, width: 155 },
    { label: 'Value', value: (item) => item.value, width: 80 },
    { label: 'Change', value: (item) => item.change?.label || '0', width: 80 },
    { label: 'Note', value: (item) => item.helper, width: 196 },
  ], analytics.summaryCards, 'No summary data available.');
  report.table('Study Progress', [
    { label: 'Period', value: (item) => item.day, width: 260 },
    { label: 'Study time', value: (item) => item.hours, width: 251 },
  ], analytics.studyBars, 'No study sessions in this range.');
  report.table('Quiz Performance', [
    { label: 'Module', value: (item) => item.subject, width: 330 },
    { label: 'Average score', value: (item) => `${item.score}%`, width: 181 },
  ], analytics.subjectScores, 'No completed quizzes in this range.');
  report.table('Flash Cards', [
    { label: 'Metric', value: (item) => item.label, width: 300 },
    { label: 'Value', value: (item) => item.value, width: 211 },
  ], [
    { label: 'Total cards', value: analytics.flash.cards },
    { label: 'Mastered cards', value: analytics.flash.mastered },
    { label: 'Due now', value: analytics.flash.due },
    { label: 'Retention rate', value: `${analytics.flash.retentionRate}%` },
  ], 'No flashcard data yet.');
  report.table('Subject / Module Progress', [
    { label: 'Module', value: (item) => item.name, width: 220 },
    { label: 'Progress', value: (item) => `${item.progress}%`, width: 80 },
    { label: 'Study time', value: (item) => item.hours, width: 90 },
    { label: 'Average score', value: (item) => item.score, width: 121 },
  ], analytics.modules, 'No module progress data yet.');
  report.table('Upcoming Planner Items', [
    { label: 'Type', value: (item) => item.type, width: 90 },
    { label: 'Title', value: (item) => item.title, width: 200 },
    { label: 'When', value: (item) => item.time, width: 135 },
    { label: 'Status', value: (item) => item.status, width: 86 },
  ], analytics.plannerItems, 'No upcoming planner items.');
  report.table('Weak Areas', [
    { label: 'Topic', value: (item) => item.topic, width: 270 },
    { label: 'Score', value: (item) => item.score, width: 90 },
    { label: 'Action', value: (item) => item.action, width: 151 },
  ], analytics.weakAreas, 'No weak areas detected in this range.');
  report.bullets('AI Learning Insights', analytics.aiInsights, 'No insights available yet.');
  report.bullets('Recent Activity', analytics.recentActivity.map((item) => `${item.title}: ${item.detail} (${item.time})`), 'No recent activity yet.');

  report.text(`Generated for ${fullName} by Academent AI Study Companion`, PDF_PAGE.margin, 32, 8, '#6f667a');
  return report.finish();
};

export const createProfileDataPdfBlob = async ({ profile, currentUser, form, completion }) => {
  const academicProfile = profile?.academicProfile || {};
  const learningPreferences = profile?.learningPreferences || {};
  const appPreferences = profile?.appPreferences || {};
  const fullName = valueOrFallback(form?.fullName || profile?.fullName || currentUser?.displayName, 'Student');
  const email = valueOrFallback(form?.email || profile?.email || currentUser?.email);
  const generatedAt = formatExportDate(new Date());
  const uid = valueOrFallback(currentUser?.uid || profile?.uid);
  const subjects = valueOrFallback(form?.subjects?.length ? form.subjects : academicProfile.subjects);
  const notifications = form?.notifications || appPreferences.notifications || {};
  const notificationRows = Object.entries(notifications).map(([key, enabled]) => ({
    setting: titleFromKey(key),
    enabled: Boolean(enabled),
  }));
  const logoImage = await loadReportLogo();
  const report = createLayout({ continuedTitle: 'Academent Profile Data Export - continued', logoImage });

  if (logoImage) report.add('q 54 0 0 54 42 744 cm /Logo Do Q');
  report.text('Profile Data Export', logoImage ? 108 : 42, 785, 24, '#4d2b8c');
  report.text('Academent AI Study Companion', logoImage ? 108 : 42, 766, 11, '#6f667a');
  report.text(generatedAt, 410, 785, 9, '#171326');
  report.text(`User ID: ${pdfShort(uid, 22)}`, 410, 768, 9, '#6f667a');
  report.setY(718);
  report.line(PDF_PAGE.margin, report.getY(), PDF_PAGE.width - PDF_PAGE.margin, report.getY(), '#4d2b8c');
  report.setY(report.getY() - 20);

  report.keyValues('Account Details', [
    ['Student name', fullName],
    ['Email', email],
    ['Role', toRoleLabel(profile?.role)],
    ['Email verified', Boolean(currentUser?.emailVerified || profile?.emailVerified)],
    ['User ID', uid],
    ['Profile completion', completion !== undefined ? `${completion}%` : 'Not calculated'],
    ['Phone number', form?.phoneNumber || profile?.phoneNumber],
    ['Profile photo', form?.photoURL || profile?.photoURL || currentUser?.photoURL ? 'Available' : 'Not provided'],
  ]);
  report.keyValues('Academic Profile', [
    ['University', form?.university || academicProfile.university],
    ['Degree', form?.degree || academicProfile.degree],
    ['Major / Program', form?.major || academicProfile.major],
    ['Semester', form?.semester || academicProfile.semester],
    ['Academic year', form?.academicYear || academicProfile.academicYear],
    ['Language', form?.language || appPreferences.language || academicProfile.language],
    ['Subjects', subjects],
    ['Education level', academicProfile.educationLevel],
  ]);
  report.keyValues('Learning Preferences', [
    ['Learning style', form?.learningStyle || learningPreferences.studyStyle],
    ['Difficulty', form?.difficultyPreference || learningPreferences.difficultyPreference],
    ['Preferred time', form?.preferredStudyTime || learningPreferences.preferredStudyTime],
    ['Weekly target', learningPreferences.weeklyHours],
  ]);
  report.bullets('Study Goal', [
    valueOrFallback(form?.studyGoal || learningPreferences.studyGoal, 'No study goal has been set.'),
  ], 'No study goal has been set.');
  report.keyValues('App Preferences', [
    ['Theme mode', form?.themeMode || appPreferences.themeMode],
    ['Language', form?.language || appPreferences.language],
    ['Accent color', form?.accentColor || appPreferences.accentColor],
    ['Notifications', notificationRows.length ? `${notificationRows.length} settings` : 'No settings saved'],
  ]);
  report.table('Notification Settings', [
    { label: 'Setting', value: (item) => item.setting, width: 360 },
    { label: 'Status', value: (item) => (item.enabled ? 'Enabled' : 'Disabled'), width: 151 },
  ], notificationRows, 'No notification settings saved.');
  report.bullets('Export Notes', [
    'This PDF includes the profile and account details available from the Profile & Settings window.',
    'Current edits in the profile form are included in this export, even before they are saved.',
    'Password data and authentication secrets are not included in Academent exports.',
  ], 'No export notes available.');

  report.text(`Generated for ${fullName} by Academent AI Study Companion`, PDF_PAGE.margin, 32, 8, '#6f667a');
  return report.finish();
};
