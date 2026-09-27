import { vetAnimals } from '../domain/demo';
import { treatmentPlans } from '../domain/treatmentPlans';

export function TreatmentPlan({ animalTag }: { animalTag: string }) {
  const animal = vetAnimals.find(a => a.tag === animalTag);
  const steps = treatmentPlans[animalTag];
  if (!animal || !steps) return null;
  return <section className="treatment-plan" aria-label={`План лечения, бирка №${animalTag}`}>
    <header><strong>План лечения</strong></header>
    <p className="treatment-plan-animal">{animal.breed}</p>
    <ol>{steps.map(step => <li key={step.id}>
      <span className={`procedure-status ${step.completed ? 'completed' : ''}`} role="img" aria-label={step.completed ? 'Выполнено' : 'Предстоит'}>
        {step.completed && <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="m4 8 2.5 2.5L12 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      </span>
      <div><strong>{step.title}</strong></div>
    </li>)}</ol>
  </section>;
}
