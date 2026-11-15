export class ValidationError extends Error {
  constructor(errors) {
    super('Validation failed');
    this.name = 'ValidationError';
    this.errors = errors; // { fieldName: 'message' }
  }
}

export const CASE_TYPES = ['Housing · Eviction', 'Housing · Repairs', 'Public Benefits', 'Immigration', 'Family Law'];
export const LANGUAGES = ['English', 'Spanish', 'Urdu', 'Arabic'];
export const TEAM = ['Sarah Patel', 'M. Brooks'];
export const DECISIONS = ['approve', 'return'];

const MAX_NOTE = 1000;
const NAME_CHARS = /^[\p{L}\p{M}][\p{L}\p{M}'’. -]*$/u;
const EMAIL = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/;
const CASE_ID = /^LA-\d{4}$/;
const REVIEW_ID = /^[a-z0-9-]{1,24}$/i;

export const clean = (v) =>
  String(v ?? '')
    .normalize('NFC')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const nameError = (value, label) => {
  if (!value) return `${label} is required.`;
  if (value.length < 2) return `${label} must be at least 2 characters.`;
  if (value.length > 50) return `${label} must be 50 characters or fewer.`;
  if (!/\p{L}/u.test(value) || !NAME_CHARS.test(value))
    return `${label} can only contain letters, spaces, hyphens, dots and apostrophes.`;
  return '';
};

const collect = (checks) => Object.fromEntries(Object.entries(checks).filter(([, msg]) => msg));

const finish = (errors, value) => {
  if (Object.keys(errors).length) throw new ValidationError(errors);
  return value;
};

export function assertCase(input = {}) {
  const value = {
    clientFirst: clean(input.clientFirst),
    clientLast: clean(input.clientLast),
    type: clean(input.type),
    language: clean(input.language),
    assignee: clean(input.assignee),
  };
  const errors = collect({
    clientFirst: nameError(value.clientFirst, 'First name'),
    clientLast: nameError(value.clientLast, 'Last name'),
    type: CASE_TYPES.includes(value.type) ? '' : 'Choose a valid case type.',
    language: LANGUAGES.includes(value.language) ? '' : 'Choose a valid language.',
    assignee: nameError(value.assignee, 'Case worker name'),
  });
  return finish(errors, value);
}

export function assertLogin(input = {}) {
  const email = clean(input.email).toLowerCase();
  const password = String(input.password ?? '');
  let emailMsg = '';
  if (!email) emailMsg = 'Email is required.';
  else if (email.length > 254 || !EMAIL.test(email)) emailMsg = 'Enter a valid email address.';

  let passMsg = '';
  if (!password) passMsg = 'Password is required.';
  else if (password.length < 8) passMsg = 'Password must be at least 8 characters.';
  else if (password.length > 128) passMsg = 'Password must be 128 characters or fewer.';

  return finish(collect({ email: emailMsg, password: passMsg }), { email, password });
}

export function assertCaseId(caseId) {
  const id = clean(caseId);
  return finish(collect({ caseId: CASE_ID.test(id) ? '' : 'Invalid case ID.' }), id);
}

export function assertReviewId(reviewId) {
  const id = clean(reviewId);
  return finish(collect({ id: REVIEW_ID.test(id) ? '' : 'Invalid review ID.' }), id);
}

export function assertDecision(input = {}) {
  const decision = clean(input.decision);
  const note = clean(input.note);
  let noteMsg = '';
  if (note.length > MAX_NOTE) noteMsg = `Note must be ${MAX_NOTE} characters or fewer.`;
  else if (decision === 'return' && !note) noteMsg = 'Add a reason before returning an output.';

  return finish(
    collect({ decision: DECISIONS.includes(decision) ? '' : 'Invalid decision.', note: noteMsg }),
    { decision, note }
  );
}

const FILE_TYPES = ['pdf', 'docx', 'xlsx', 'jpg', 'jpeg', 'png'];
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function assertUpload(files = []) {
  const list = Array.from(files || []);
  if (!list.length) throw new ValidationError({ files: 'Choose at least one file.' });
  if (list.length > 10) throw new ValidationError({ files: 'Upload 10 files or fewer at a time.' });
  for (const f of list) {
    const name = clean(f.name);
    const ext = name.includes('.') ? name.split('.').pop().toLowerCase() : '';
    if (!FILE_TYPES.includes(ext))
      throw new ValidationError({ files: `${name}: file type not allowed (PDF, DOCX, XLSX, JPG, PNG).` });
    if (!(f.size > 0) || f.size > MAX_FILE_BYTES)
      throw new ValidationError({ files: `${name}: must be between 1 byte and 25 MB.` });
  }
  return list.map((f) => ({
    name: clean(f.name).slice(0, 120),
    ext: f.name.split('.').pop().toLowerCase(),
    size: f.size,
    base64: f.base64 || '',
    content: f.content || '',
  }));
}

export function assertQuestion(q) {
  const v = clean(q);
  const msg =
    v.length < 3
      ? 'Ask a question with at least 3 characters.'
      : v.length > 300
      ? 'Question must be 300 characters or fewer.'
      : '';
  return finish(collect({ question: msg }), v);
}

export function assertSearch(q) {
  const v = clean(q);
  return finish(collect({ search: v.length > 100 ? 'Search must be 100 characters or fewer.' : '' }), v);
}

export function assertFlagId(id) {
  const v = clean(id);
  return finish(collect({ flag: /^f\d{1,6}$/.test(v) ? '' : 'Invalid flag.' }), v);
}

export function assertChecklistLabel(label) {
  const v = clean(label);
  return finish(collect({ item: v && v.length <= 60 ? '' : 'Invalid checklist item.' }), v);
}
