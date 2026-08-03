import { Briefcase, Check, FileCheck2, Lightbulb, UserRound } from 'lucide-react'

const icons = [UserRound, Briefcase, Lightbulb, FileCheck2]

export default function ApplicationProgress({ currentStep, maxStep, onStepChange, steps }) {
  return <nav aria-label="Creator application progress" className="creator-application-progress">
    <ol>
      {steps.map((step, index) => {
        const Icon = icons[index]
        const complete = index < currentStep || (index <= maxStep && index !== currentStep)
        const current = index === currentStep
        return <li className={`${complete ? 'is-complete' : ''}${current ? ' is-current' : ''}`} key={step.shortTitle}>
          <button
            aria-current={current ? 'step' : undefined}
            aria-label={`Step ${index + 1}: ${step.shortTitle}${complete ? ', completed' : ''}`}
            disabled={index > maxStep}
            onClick={() => onStepChange(index)}
            type="button"
          >
            <span className="creator-application-progress__icon" aria-hidden="true">
              {complete ? <Check /> : <Icon />}
            </span>
            <span className="creator-application-progress__copy"><small>Step {index + 1}</small>{step.shortTitle}</span>
          </button>
        </li>
      })}
    </ol>
  </nav>
}
