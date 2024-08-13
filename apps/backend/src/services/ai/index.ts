import { Injectable, Inject } from '@nestjs/common';
import { LatexService } from '../latex';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { load } from 'js-yaml';
import type { ExercisesDescription, ExercisesLatex } from '../../types/exercise';
import { writeFileSync } from 'fs';

const yamlExampleUniqueSelection = `
uniqueSelection:
  - question: >
      ¿Cuál de los siguientes gráficos corresponse a una función cuadrática?
    answers:
      - >
        \\begin{tikzpicture}
        \\begin{axis}[width=7cm, height=5cm, domain=-5:5, samples=100, axis lines=middle, xlabel={$x$}, ylabel={$y$}, tick label style={font=\\footnotesize}]
        \\addplot[draw=red] {x^2};
        \\end{axis}
        \\end{tikzpicture}
      - >
        \\begin{tikzpicture}
        \\begin{axis}[width=7cm, height=5cm, domain=-5:5, samples=100, axis lines=middle, xlabel={$x$}, ylabel={$y$}, tick label style={font=\\footnotesize}]
        \\addplot[draw=red] {x*2};
        \\end{axis}
        \\end{tikzpicture}
      - >
        \\begin{tikzpicture}
        \\begin{axis}[width=7cm, height=5cm, domain=-5:5, samples=100, axis lines=middle, xlabel={$x$}, ylabel={$y$}, tick label style={font=\\footnotesize}]
        \\addplot[draw=red] {x^3};
        \\end{axis}
        \\end{tikzpicture}
      - >
        \\begin{tikzpicture}
        \\begin{axis}[width=7cm, height=5cm, domain=-5:5, samples=100, axis lines=middle, xlabel={$x$}, ylabel={$y$}, tick label style={font=\\footnotesize}]
        \\addplot[draw=red] {x*3-4};
        \\end{axis}
        \\end{tikzpicture}
      - >
        \\begin{tikzpicture}
        \\begin{axis}[width=7cm, height=5cm, domain=-5:5, samples=100, axis lines=middle, xlabel={$x$}, ylabel={$y$}, tick label style={font=\\footnotesize}]
        \\addplot[draw=red] {ln(x)};
        \\end{axis}
        \\end{tikzpicture}
`.trim();

const yamlExampleDevelopment = `
development:
  - question: >
      Haz un gráfico de función. $f(x)={x}^{2}$
    answer: >
      \\begin{tikzpicture}
      \\begin{axis}[width=7cm, height=5cm, domain=-5:5, samples=100, axis lines=middle, xlabel={$x$}, ylabel={$y$}, tick label style={font=\\footnotesize}]
      \\addplot[draw=red] {x^2};
      \\end{axis}
      \\end{tikzpicture}
`.trim();

const yamlExampleTrueOrFalse = `
trueOrFalse:
  - question: >
      Esta afirmación que puede ser verdadera o falsa
    answer: false
`.trim();

@Injectable()
export class AiService {
  @Inject(LatexService)
  private readonly latexService = new LatexService();

  getSectionsToUse(exercises: ExercisesDescription) {
    return Object.keys(exercises).filter((section: keyof ExercisesDescription) => exercises[section].length > 0) as (keyof ExercisesDescription)[];
  }

  getExample(section: keyof ExercisesDescription) {
    return {
      uniqueSelection: yamlExampleUniqueSelection,
      development: yamlExampleDevelopment,
      trueOrFalse: yamlExampleTrueOrFalse
    }[section];
  }

  getYamlDescription(section: keyof ExercisesDescription) {
    return {
      uniqueSelection:
        'El valor de "uniqueSelection" es una lista de mapas donde cada mapa tiene la clave "question" y la clave "answers". "question" tiene código LaTeX y "answers" es una lista de códigos LaTeX. Las respuestas correctas en "answers" siempre debe estar en el index 0. Yo las desordenaré después.',
      development: 'El valor de "development" es una lista de mapas donde cada mapa tiene la clave "question" y la clave "answer". "question" tiene código LaTeX y "answer" es código LaTeX',
      trueOrFalse:
        'El valor de "trueOrFalse" es una lista de mapas donde cada mapa tiene la clave "question" y la clave "answer". "question" tiene código LaTeX con una afirmación que puede ser verdadera o falsa y "answer" un booleano que indica si la afirmación es verdadera o falsa'
    }[section];
  }

  getDescriptionAndQuantity(exercises: ExercisesDescription, section: keyof ExercisesDescription) {
    return [`A continuación te describo las preguntas de ${section}:`, ...exercises[section].map((exercise) => `${exercise.quantity} pregunta(s): ${exercise.description}`)].join('\n');
  }

  async getExercisesLatexCodes(exercises: ExercisesDescription, subject: string, contextSchool: string, contextEstudent: string) {
    const completePrompt = [
      `Soy profesor de "${subject}" y estoy creando un examen.`,
      contextSchool === '' ? '' : `Contexto del colegio: ${contextSchool}`,
      contextEstudent === '' ? '' : `Contexto del estudiante: ${contextEstudent}`,
      `Debes darme un YAML que contenga un mapa con las claves ${this.getSectionsToUse(exercises).join(', ')}`,
      ...this.getSectionsToUse(exercises).map((section) => this.getYamlDescription(section)),
      'A continuación te muestro un ejemplo de YAML que me puedes responder.',
      ...this.getSectionsToUse(exercises).map((section) => this.getExample(section)),
      '',
      'Puedes usar estar librerías de LaTeX:',
      this.latexService.packages,
      '',
      this.getSectionsToUse(exercises)
        .map((section) => this.getDescriptionAndQuantity(exercises, section))
        .join('\n\n')
    ].join('\n');

    const response = await generateText({
      model: google('models/gemini-1.5-flash-latest'),
      prompt: completePrompt,
      maxTokens: Math.trunc(20000),
      temperature: 0,
      maxRetries: 3
    });
    const match = response.text.match(/```yaml([\s\S]*?)```/);
    const text = match?.[1] ?? response.text;
    const exercisesFromIa: ExercisesLatex = load(text);

    if (process.env.NODE_ENV === 'development') {
      writeFileSync('latex.yaml', text, 'utf-8');
      writeFileSync('latex.json', JSON.stringify(exercisesFromIa), 'utf-8');
    }

    return exercisesFromIa;
  }
}
