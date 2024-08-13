import { Component, inject, OnInit } from '@angular/core';
import { ViewportScroller } from '@angular/common';

import { InputTextModule } from 'primeng/inputtext';
import { InputTextareaModule } from 'primeng/inputtextarea';
import { InputNumberModule } from 'primeng/inputnumber';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DropdownModule } from 'primeng/dropdown';
import { MessagesModule } from 'primeng/messages';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { RippleModule } from 'primeng/ripple';
import { SkeletonModule } from 'primeng/skeleton';

import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';
import { FormArray, FormGroup, FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-create-exam',
  templateUrl: './createExam.component.html',
  styleUrl: './createExam.component.scss',
  standalone: true,
  providers: [MessageService],
  imports: [
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    InputTextModule,
    InputTextareaModule,
    FloatLabelModule,
    ButtonModule,
    CheckboxModule,
    DropdownModule,
    InputNumberModule,
    ToastModule,
    RippleModule,
    MessagesModule,
    SkeletonModule
  ]
})
export class CreateExamComponent implements OnInit {
  sanitizer = inject(DomSanitizer);
  httpClient = inject(HttpClient);
  translateService = inject(TranslateService);
  viewportScroller = inject(ViewportScroller);
  messageService = inject(MessageService);

  async ngOnInit() {
    for (const subject of this.subjects) {
      this.subjectsTranslated.push({
        value: subject,
        label: this.translateService.instant('createExam.' + subject)
      });
    }
  }

  subjects = [
    'languageAndCommunication',
    'mathematics',
    'physics',
    'chemistry',
    'biology',
    'naturalSciences',
    'geographyAndSocialSciences',
    'physicalEducation',
    'visualArts',
    'music',
    'technology',
    'english'
  ];
  subjectsTranslated = [] as { label: string; value: string }[];

  examDataForm = new FormGroup({
    exercises: new FormGroup({
      uniqueSelection: new FormArray(
        [] as FormGroup<{
          description: FormControl<string>;
          quantity: FormControl<number>;
        }>[]
      ),
      development: new FormArray(
        [] as FormGroup<{
          description: FormControl<string>;
          quantity: FormControl<number>;
        }>[]
      ),
      trueOrFalse: new FormArray(
        [] as FormGroup<{
          description: FormControl<string>;
          quantity: FormControl<number>;
        }>[]
      )
    }),
    contextSchool: new FormControl('', {
      validators: [Validators.maxLength(200)],
      nonNullable: true
    }),
    contextEstudent: new FormControl('', {
      validators: [Validators.maxLength(200)],
      nonNullable: true
    }),
    subject: new FormControl('', {
      validators: [Validators.required],
      nonNullable: true
    }),
    includeAnswers: new FormControl(true, {
      validators: [Validators.required],
      nonNullable: true
    })
  });

  readonly sections = ['uniqueSelection', 'development', 'trueOrFalse'] as const;
  getSectionArray(section: (typeof this.sections)[number]) {
    return this.examDataForm.get('exercises.' + section) as FormArray;
  }

  isCreatingPdf = false;
  pdfUrl: undefined | SafeResourceUrl = undefined;

  setExample() {
    this.examDataForm = new FormGroup({
      exercises: new FormGroup({
        uniqueSelection: new FormArray([
          new FormGroup({
            description: new FormControl('Multiplicación de matrices', {
              validators: [Validators.required, Validators.minLength(1), Validators.maxLength(200)],
              nonNullable: true
            }),
            quantity: new FormControl(1, {
              validators: [Validators.required, Validators.min(1), Validators.max(10)],
              nonNullable: true
            })
          }),
          new FormGroup({
            description: new FormControl('Suma de fracciones', {
              validators: [Validators.required, Validators.minLength(1), Validators.maxLength(200)],
              nonNullable: true
            }),
            quantity: new FormControl(1, {
              validators: [Validators.required, Validators.min(1), Validators.max(10)],
              nonNullable: true
            })
          })
        ]),
        development: new FormArray([
          new FormGroup({
            description: new FormControl('Se da una función cuadrática y se pide su gráfica', {
              validators: [Validators.required, Validators.minLength(1), Validators.maxLength(200)],
              nonNullable: true
            }),
            quantity: new FormControl(1, {
              validators: [Validators.required, Validators.min(1), Validators.max(10)],
              nonNullable: true
            })
          })
        ]),
        trueOrFalse: new FormArray([
          new FormGroup({
            description: new FormControl('Multiplicación de números negativos', {
              validators: [Validators.required, Validators.min(1), Validators.max(10)],
              nonNullable: true
            }),
            quantity: new FormControl(1, {
              validators: [Validators.required, Validators.min(1), Validators.max(10)],
              nonNullable: true
            })
          })
        ])
      }),
      contextSchool: new FormControl('Colegio laico con el propósito de impulsar el idioma inglés de los estudiantes', { nonNullable: true }),
      contextEstudent: new FormControl('Evaluación que pretende hacer que los estudiantes puedan crear soluciones', { nonNullable: true }),
      subject: new FormControl('mathematics', {
        validators: [Validators.required, Validators.maxLength(200)],
        nonNullable: true
      }),
      includeAnswers: new FormControl(true, {
        validators: [Validators.required],
        nonNullable: true
      })
    });
  }

  addRow(section: (typeof this.sections)[number]) {
    const exerciseSection = this.examDataForm.get('exercises.' + section) as FormArray;
    exerciseSection.push(
      new FormGroup({
        description: new FormControl('', {
          validators: [Validators.required, Validators.minLength(1), Validators.maxLength(200)],
          nonNullable: true
        }),
        quantity: new FormControl(1, {
          validators: [Validators.required, Validators.min(1), Validators.max(10)],
          nonNullable: true
        })
      })
    );
  }

  deleteRow(section: (typeof this.sections)[number], index: number) {
    const exerciseSection = this.examDataForm.get('exercises.' + section) as FormArray;
    exerciseSection.removeAt(index);
  }

  getExamCanBeCreated(): boolean {
    const thereIsAtLeastExercise = this.sections.some((section) => Number(this.examDataForm.getRawValue().exercises[section].length) > 0);
    return thereIsAtLeastExercise && this.examDataForm.valid && !this.isCreatingPdf;
  }

  async createTest(event: Event) {
    event.preventDefault();

    this.messageService.add({
      severity: 'info',
      summary: this.translateService.instant('createExam.initExamCreation'),
      sticky: true
    });

    this.isCreatingPdf = true;

    this.httpClient
      .post<{
        success: boolean;
        errors: string[];
        data: { fileName: string };
      }>(
        '/api/exam',
        {
          ...this.examDataForm.value,
          subject: this.translateService.instant('createExam.' + this.examDataForm.value.subject)
        },
        { responseType: 'json' }
      )
      .pipe(
        finalize(() => {
          this.isCreatingPdf = false;
        })
      )
      .subscribe({
        next: (response) => {
          this.messageService.clear();
          this.messageService.add({
            severity: 'success',
            summary: this.translateService.instant('createExam.examCreationSucceded')
          });
          this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`/api/pdf/${response.data.fileName}`);
          setTimeout(() => this.viewportScroller.scrollToAnchor('exam-pdf'), 100);
        },
        error: () => {
          this.messageService.clear();
          this.messageService.add({
            severity: 'error',
            summary: this.translateService.instant('createExam.examCreationFailed'),
            sticky: true
          });
          this.pdfUrl = undefined;
        }
      });
  }
}
