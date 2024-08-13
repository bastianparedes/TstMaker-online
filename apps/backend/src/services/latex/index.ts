import { Injectable } from '@nestjs/common';
import type { ExercisesLatex } from '../../types/exercise';
import { getShuffledArray } from '../../utils/array';
/* import { readFileSync } from 'fs'; */
/* import { join } from 'path'; */

@Injectable()
export class LatexService {
  readonly packages = `
\\documentclass{article}%
\\usepackage[T1]{fontenc}%
\\usepackage[utf8]{inputenc}%
\\usepackage{lmodern}%
\\usepackage{textcomp}%
\\usepackage{lastpage}%
\\usepackage{ragged2e}%
\\usepackage{setspace}%
\\usepackage{longtable}%
\\usepackage{tabularx}%
\\usepackage{gensymb}%
\\usepackage{amsmath}%
\\usepackage{amssymb}%
\\usepackage{enumitem}%
\\usepackage{graphicx}%
\\usepackage{tikz}%
\\usepackage{tkz-euclide}%
\\usepackage{siunitx}%
\\usepackage{fourier}%
\\usepackage{fancyhdr}%
\\usepackage{pgfplots}%
\\usepackage{adjustbox}%
%\\usepackage[papersize={21.59cm, 27.94cm}, tmargin=2.0cm, bmargin=2.0cm, lmargin=2.0cm, rmargin=2.0cm]{geometry}%
\\usepackage[a4paper, margin=1cm, bmargin=2cm]{geometry}%
\\usetikzlibrary{fit, shapes.geometric, quotes, angles, through, intersections}%
\\renewcommand{\\[}{\\begin{math}} \\renewcommand{\\]}{\\end{math}}%
\\renewcommand{\\frac}{\\dfrac}%
\\usepackage[strings]{underscore}%
  `.trim();

  studentDataTable = `
\\begin{longtable}{|p{0.475\\linewidth}|p{0.475\\linewidth}|}%
  \\hline%
  Establecimiento:&Profesor(a):%
  \\\\%
  \\hline%
  Asignatura:&Curso:%
  \\\\%
  \\hline%
\\end{longtable}%
  `.trim();

  getLatexSectionUniqueSelection(exercises: NonNullable<ExercisesLatex['uniqueSelection']>) {
    const questionsLatex = ['\\hfill \\break', '\\textbf{Item selección múltiple:} Encierra la alternativa correcta de cada ejercicio.%', '\\begin{longtable}{|p{0.975\\linewidth}|}%', '\\hline%'];

    const correctAnswersLatex = ['\\hfill \\break', '\\textbf{Item selección múltiple:}%', '\\begin{enumerate}[label=\\arabic*)]%'];

    exercises.forEach((exercise, indexExercise) => {
      questionsLatex.push('\\begin{minipage}[t]{\\linewidth}%');
      questionsLatex.push('\\vspace{5pt}%');
      questionsLatex.push(`\\begin{enumerate}[label=\\arabic*),start=${indexExercise + 1}]%`);
      questionsLatex.push('\\item%');
      questionsLatex.push(exercise.question + '%');
      questionsLatex.push('\\end{enumerate}%');
      questionsLatex.push('\\begin{enumerate}[label=\\Alph*)]%');

      const shuffledArray = getShuffledArray(exercise.answers);
      const indexCorrectAnswer = shuffledArray.indexOf(exercise.answers[0]);
      correctAnswersLatex.push('\\item%');
      correctAnswersLatex.push(String.fromCharCode(65 + indexCorrectAnswer));

      shuffledArray.forEach((answer) => {
        questionsLatex.push('\\item%');
        questionsLatex.push('\\adjustbox{valign=t, minipage=\\linewidth}{%');
        questionsLatex.push(answer.trim() + '%');
        questionsLatex.push('}%');
      });

      questionsLatex.push('\\end{enumerate}%');
      questionsLatex.push('\\vspace{5pt}%');
      questionsLatex.push('\\end{minipage}%');
      questionsLatex.push('\\\\%');
      questionsLatex.push(`\\hline%`);
    });

    questionsLatex.push('\\end{longtable}%');
    correctAnswersLatex.push('\\end{enumerate}%');
    return {
      questions: questionsLatex.join('\n'),
      answers: correctAnswersLatex.join('\n')
    };
  }

  getLatexSectionDevelopment(exercises: NonNullable<ExercisesLatex['development']>) {
    const questionsLatex = ['\\hfill \\break%', '\\textbf{Item desarrollo:} Desarrolla lo solicitado en cada ejercicio.%'];

    const correctAnswersLatex = ['\\hfill \\break', '\\textbf{Item desarrollo:}%', '\\begin{enumerate}[label=\\arabic*)]%'];

    questionsLatex.push(`\\begin{enumerate}[label=\\arabic*),start=1]%`);
    exercises.forEach((exercise) => {
      questionsLatex.push('\\item%');
      questionsLatex.push('\\begin{minipage}[t]{\\linewidth}%');
      questionsLatex.push(exercise.question + '%');
      questionsLatex.push('\\end{minipage}%');
      questionsLatex.push('\\hfill \\break%');

      correctAnswersLatex.push('\\item%');
      correctAnswersLatex.push('\\adjustbox{valign=t, minipage=\\linewidth}{%');
      correctAnswersLatex.push(exercise.answer.trim() + '%');
      correctAnswersLatex.push('}%');
    });

    questionsLatex.push('\\end{enumerate}%');
    correctAnswersLatex.push('\\end{enumerate}%');
    return {
      questions: questionsLatex.join('\n'),
      answers: correctAnswersLatex.join('\n')
    };
  }

  getLatexSectionTrueOrFalse(exercises: NonNullable<ExercisesLatex['trueOrFalse']>) {
    const questionsLatex = ['\\hfill \\break', '\\textbf{Item verdadero o falso:} Escribe una "V" o "F" según el enunciado sea verdadero o falso.%'];
    const correctAnswersLatex = ['\\hfill \\break', '\\textbf{Item desarrollo:}%', '\\begin{enumerate}[label=\\arabic*)]%'];

    questionsLatex.push(`\\begin{enumerate}[label=\\arabic*),start=1]%`);
    exercises.forEach((exercise) => {
      questionsLatex.push('\\item%');
      questionsLatex.push('___ \\begin{minipage}[t]{\\linewidth}%');
      questionsLatex.push(exercise.question + '%');
      questionsLatex.push('\\end{minipage}%');

      correctAnswersLatex.push('\\item%');
      correctAnswersLatex.push(exercise.answer ? 'V' : 'F' + '%');
    });
    questionsLatex.push('\\end{enumerate}%');
    correctAnswersLatex.push('\\end{enumerate}%');
    return {
      questions: questionsLatex.join('\n'),
      answers: correctAnswersLatex.join('\n')
    };
  }

  getCompleteLatexCode(body: string) {
    return [this.packages, '\\begin{document}%', this.studentDataTable, body, '\\end{document}%'].join('\n');
  }

  async getFileUrl(latexCode: string) {
    const formData = new FormData();

    formData.append('filecontents[]', new Blob([latexCode], { type: 'text/plain' }), 'document.tex');
    formData.append('filename[]', 'document.tex');
    formData.append('engine', 'pdflatex');
    formData.append('return', 'pdf');
    const response = await fetch('https://texlive.net/cgi-bin/latexcgi', {
      method: 'POST',
      body: formData
    });

    return response.url;
  }
}
