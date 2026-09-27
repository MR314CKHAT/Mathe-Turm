/**
 * Aufgaben-Generator für den Mathe-Turm.
 *
 * Regeln:
 *  - Subtraktion ergibt nie eine negative Zahl.
 *  - Division geht immer glatt auf (kein Rest, kein Komma).
 *  - Es werden nur die Rechenarten benutzt, die zur Klassenstufe passen
 *    UND vom Spieler ausgewählt wurden.
 */

let taskCounter = 0;

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (list) => list[randInt(0, list.length - 1)];

/** Alle Rechenarten mit Anzeige-Infos. */
export const OPS = [
  { id: 'add', label: 'Plus', symbol: '+', emoji: '➕', name: '+ rechnen' },
  { id: 'sub', label: 'Minus', symbol: '−', emoji: '➖', name: '− rechnen' },
  { id: 'mul', label: 'Mal', symbol: '×', emoji: '✖️', name: '× rechnen' },
  { id: 'div', label: 'Geteilt', symbol: '÷', emoji: '➗', name: '÷ rechnen' },
];

/** Klassenstufen mit Zahlenraum und erlaubten Rechenarten. */
export const GRADES = [
  {
    id: 1,
    label: 'Klasse 1',
    hint: 'Zahlen bis 10',
    allowed: ['add', 'sub'],
  },
  {
    id: 2,
    label: 'Klasse 2',
    hint: 'Zahlen bis 20 und bis 100',
    allowed: ['add', 'sub'],
  },
  {
    id: 3,
    label: 'Klasse 3',
    hint: 'bis 100 · kleines Einmaleins',
    allowed: ['add', 'sub', 'mul', 'div'],
  },
  {
    id: 4,
    label: 'Klasse 4',
    hint: 'bis 1.000 · großes Einmaleins',
    allowed: ['add', 'sub', 'mul', 'div'],
  },
  {
    id: 5,
    label: 'Klasse 5',
    hint: 'bis 10.000 · große Zahlen',
    allowed: ['add', 'sub', 'mul', 'div'],
  },
];

/** Aufgabengrenzen je Klassenstufe. */
const CONFIG = {
  1: {
    add: { maxes: [10] },
    sub: { maxes: [10] },
  },
  2: {
    add: { maxes: [20, 100] },
    sub: { maxes: [20, 100] },
  },
  3: {
    add: { maxes: [100], minA: 10, minB: 10 },
    sub: { maxes: [100], minA: 20, minB: 10, minResult: 10 },
    mul: { a: [2, 10], b: [2, 10] },
    div: { divisor: [2, 10], quotient: [2, 10] },
  },
  4: {
    add: { maxes: [100, 1000], minA: 10 },
    sub: { maxes: [100, 1000], minA: 20, minB: 10, minResult: 10 },
    mul: { a: [2, 20], b: [2, 10] },
    div: { divisor: [2, 10], quotient: [2, 20] },
  },
  5: {
    add: { maxes: [1000, 10000], minA: 100 },
    sub: { maxes: [1000, 10000], minA: 200, minB: 100, minResult: 100 },
    mul: { a: [11, 100], b: [2, 12] },
    div: { divisor: [2, 12], quotient: [2, 50] },
  },
};

function makeAdd(cfg) {
  const max = pick(cfg.maxes);
  const minA = cfg.minA ?? 1;
  const minB = cfg.minB ?? 1;
  const aMax = Math.max(minA, max - minB);
  const a = randInt(minA, aMax);
  const b = randInt(minB, max - a);
  return { a, b, answer: a + b };
}

function makeSub(cfg) {
  const max = pick(cfg.maxes);
  const minB = cfg.minB ?? 1;
  const minResult = cfg.minResult ?? 1;
  const aMin = Math.min(max, Math.max(cfg.minA ?? 2, minB + minResult));
  const a = randInt(aMin, max);
  const b = randInt(minB, a - minResult);
  return { a, b, answer: a - b };
}

function makeMul(cfg) {
  const a = randInt(cfg.a[0], cfg.a[1]);
  const b = randInt(cfg.b[0], cfg.b[1]);
  // größere Zahl nach vorn, das liest sich leichter
  const [x, y] = a >= b ? [a, b] : [b, a];
  return { a: x, b: y, answer: x * y };
}

function makeDiv(cfg) {
  const divisor = randInt(cfg.divisor[0], cfg.divisor[1]);
  const quotient = randInt(cfg.quotient[0], cfg.quotient[1]);
  return { a: divisor * quotient, b: divisor, answer: quotient };
}

function opSymbol(opId) {
  const op = OPS.find((entry) => entry.id === opId);
  return op ? op.symbol : '?';
}

/** Erlaubte Rechenarten für eine Klassenstufe. */
export function allowedOps(gradeId) {
  const grade = GRADES.find((g) => g.id === gradeId);
  return grade ? grade.allowed : [];
}

/**
 * Erzeugt eine neue Aufgabe.
 * @param {number} gradeId  Klassenstufe (1-5)
 * @param {string[]} opIds  gewünschte Rechenarten
 * @param {string} [avoidText] Text der vermieden werden soll (keine Dopplung)
 */
export function generateTask(gradeId, opIds, avoidText = null) {
  const grade = GRADES.find((g) => g.id === gradeId) || GRADES[1];
  const cfg = CONFIG[grade.id];
  const usable = opIds.filter((id) => grade.allowed.includes(id) && cfg[id]);
  const ops = usable.length > 0 ? usable : [grade.allowed[0]];

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const op = pick(ops);
    let parts;
    switch (op) {
      case 'add':
        parts = makeAdd(cfg.add);
        break;
      case 'sub':
        parts = makeSub(cfg.sub);
        break;
      case 'mul':
        parts = makeMul(cfg.mul);
        break;
      case 'div':
        parts = makeDiv(cfg.div);
        break;
      default:
        parts = makeAdd(cfg.add);
    }
    const text = `${parts.a} ${opSymbol(op)} ${parts.b}`;
    if (text !== avoidText) {
      taskCounter += 1;
      return { id: `t${taskCounter}`, op, text, answer: parts.answer };
    }
  }

  // Notfall (praktisch unerreichbar): letzte Aufgabe trotzdem zurückgeben
  const parts = makeAdd(cfg.add);
  taskCounter += 1;
  return {
    id: `t${taskCounter}`,
    op: 'add',
    text: `${parts.a} + ${parts.b}`,
    answer: parts.answer,
  };
}

const PRAISE = [
  'Richtig! 🎉',
  'Super gemacht! ⭐',
  'Klasse! 🚀',
  'Genau so! 👏',
  'Weiter so! 🌟',
  'Perfekt! 💪',
  'Spitze! 🏆',
  'Wahnsinn! 🤩',
];

export function randomPraise() {
  return pick(PRAISE);
}
