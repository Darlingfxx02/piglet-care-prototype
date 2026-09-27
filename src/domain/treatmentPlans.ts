export interface TreatmentStep { id: string; title: string; detail: string; completed: boolean }
// Presentation fixtures, not clinical instructions. Statuses are set by the clinic.
export const treatmentPlans: Record<string, TreatmentStep[]> = {
  '018': [
    { id: 'exam', title: 'Первичный осмотр', detail: 'Завершён', completed: true },
    { id: 'tests', title: 'Исследования', detail: 'Результаты получены', completed: true },
    { id: 'review', title: 'Повторный осмотр', detail: 'Запланирован', completed: false },
    { id: 'summary', title: 'Заключение врача', detail: 'После осмотра', completed: false },
  ],
  '057': [
    { id: 'exam', title: 'Осмотр перед вакцинацией', detail: 'Завершён', completed: true },
    { id: 'vaccination', title: 'Вакцинация', detail: 'Запланирована', completed: false },
    { id: 'observation', title: 'Наблюдение после процедуры', detail: 'После вакцинации', completed: false },
    { id: 'documents', title: 'Обновление документов', detail: 'После завершения', completed: false },
  ],
  '071': [
    { id: 'exam', title: 'Первичный осмотр', detail: 'Завершён', completed: true },
    { id: 'tests', title: 'Исследования', detail: 'Результаты получены', completed: true },
    { id: 'course', title: 'Лечебные процедуры', detail: 'Курс продолжается', completed: false },
    { id: 'control', title: 'Контрольные исследования', detail: 'После курса', completed: false },
    { id: 'review', title: 'Повторный осмотр', detail: 'Запланирован', completed: false },
    { id: 'summary', title: 'Заключение и рекомендации', detail: 'После осмотра', completed: false },
  ],
};
export const isTreatmentPlanQuestion = (text: string) => /план.*леч|леч.*план|процедур|этап.*леч|курс.*леч/i.test(text);
