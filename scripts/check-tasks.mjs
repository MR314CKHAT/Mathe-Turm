/**
 * Prüft den Aufgaben-Generator: 4000 Aufgaben pro Klassenstufe und Rechenart.
 * Aufruf:  npm run check
 */
import { GRADES, OPS, generateTask, allowedOps } from '../src/utils/mathTasks.js';

const ROUNDS = 4000;

const ADD_SUB_MAX = { 1: 10, 2: 100, 3: 100, 4: 1000, 5: 10000 };
const MUL_LIMIT = {
  1: null,
  2: null,
  3: { a: 10, b: 10 },
  4: { a: 20, b: 10 },
  5: { a: 100, b: 12 },
};
const DIV_LIMIT = {
  1: null,
  2: null,
  3: { divisor: 10, quotient: 10 },
  4: { divisor: 10, quotient: 20 },
  5: { divisor: 12, quotient: 50 },
};

let checks = 0;
let errors = 0;

function fail(message) {
  errors += 1;
  if (errors < 25) console.error(`  ✗ ${message}`);
}

function parse(task) {
  const match = /^(\d+) (.+) (\d+)$/.exec(task.text);
  if (!match) return null;
  return {
    a: Number(match[1]),
    symbol: match[2],
    b: Number(match[3]),
    answer: task.answer,
    op: task.op,
  };
}

for (const grade of GRADES) {
  for (const op of OPS) {
    for (let i = 0; i < ROUNDS; i += 1) {
      const task = generateTask(grade.id, [op.id]);
      checks += 1;

      const data = parse(task);
      if (!data) {
        fail(`Klasse ${grade.id}/${op.id}: Aufgabe nicht lesbar: ${task.text}`);
        continue;
      }

      // Nur erlaubte Rechenarten dürfen vorkommen
      if (!allowedOps(grade.id).includes(data.op)) {
        fail(`Klasse ${grade.id}: verbotene Rechenart "${data.op}" (${task.text})`);
      }

      // Die Zahl der Antwort muss eine ganze Zahl >= 0 sein
      if (!Number.isInteger(data.answer) || data.answer < 0) {
        fail(`Klasse ${grade.id}/${op.id}: ungültige Antwort ${data.answer}`);
      }

      if (data.symbol === '+') {
        if (data.a + data.b !== data.answer) {
          fail(`Plus falsch: ${task.text} = ${data.answer}`);
        }
        if (data.answer > ADD_SUB_MAX[grade.id]) {
          fail(`Klasse ${grade.id}: Plus über Grenze: ${task.text} = ${data.answer}`);
        }
        if (data.a < 1 || data.b < 1) {
          fail(`Klasse ${grade.id}: Plus mit 0: ${task.text}`);
        }
      } else if (data.symbol === '−') {
        if (data.a - data.b !== data.answer) {
          fail(`Minus falsch: ${task.text} = ${data.answer}`);
        }
        if (data.answer < 1) {
          fail(`Klasse ${grade.id}: Minus negativ/null: ${task.text} = ${data.answer}`);
        }
        if (data.a > ADD_SUB_MAX[grade.id]) {
          fail(`Klasse ${grade.id}: Minus über Grenze: ${task.text}`);
        }
      } else if (data.symbol === '×') {
        if (data.a * data.b !== data.answer) {
          fail(`Mal falsch: ${task.text} = ${data.answer}`);
        }
        const limit = MUL_LIMIT[grade.id];
        if (!limit) {
          fail(`Klasse ${grade.id}: Mal sollte es nicht geben (${task.text})`);
        } else if (data.a > limit.a || data.b > limit.b) {
          fail(`Klasse ${grade.id}: Mal zu groß: ${task.text}`);
        }
      } else if (data.symbol === '÷') {
        if (data.b === 0 || data.a % data.b !== 0) {
          fail(`Division geht nicht glatt auf: ${task.text}`);
        }
        if (data.a / data.b !== data.answer) {
          fail(`Division falsch: ${task.text} = ${data.answer}`);
        }
        const limit = DIV_LIMIT[grade.id];
        if (!limit) {
          fail(`Klasse ${grade.id}: Geteilt sollte es nicht geben (${task.text})`);
        } else if (data.b > limit.divisor || data.answer > limit.quotient) {
          fail(`Klasse ${grade.id}: Division zu groß: ${task.text} = ${data.answer}`);
        }
      } else {
        fail(`Unbekanntes Rechenzeichen "${data.symbol}" in ${task.text}`);
      }
    }
  }
}

// leere/ungültige Auswahl darf nicht abstürzen
const fallback = generateTask(3, [], null);
checks += 1;
if (!fallback || !fallback.text) fail('Fallback-Aufgabe konnte nicht erzeugt werden.');

const unknownGrade = generateTask(99, ['add'], null);
checks += 1;
if (!unknownGrade || !unknownGrade.text) fail('Unbekannte Klassenstufe nicht abgefangen.');

console.log(`\n${checks} Aufgaben geprüft – ${errors === 0 ? 'alle in Ordnung ✅' : `${errors} Fehler ❌`}`);
process.exit(errors === 0 ? 0 : 1);
