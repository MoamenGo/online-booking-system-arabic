'use client';

import { BOOKING_STEPS } from '@/lib/constants';

interface StepWizardProps {
  currentStep: number;
}

// ===== مكون خطوات الحجز المتتالية =====
export default function StepWizard({ currentStep }: StepWizardProps) {
  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="flex items-center">
        {BOOKING_STEPS.map((step, index) => (
          <div key={index} className="flex items-center flex-1">
            {/* نقطة الخطوة */}
            <div className="flex flex-col items-center">
              <div
                className={`step-indicator ${
                  index < currentStep
                    ? 'completed bg-green-500 text-white'
                    : index === currentStep
                    ? 'active bg-primary text-on-primary scale-110'
                    : 'upcoming bg-surface-variant text-on-surface-variant'
                }`}
              >
                {index < currentStep ? (
                  <span className="material-symbols-outlined text-[18px]">check</span>
                ) : (
                  <span className="text-label-md font-bold">{index + 1}</span>
                )}
              </div>
              <span
                className={`text-caption mt-1 whitespace-nowrap hidden sm:block ${
                  index === currentStep ? 'text-primary font-semibold' : 'text-on-surface-variant'
                }`}
              >
                {step.title}
              </span>
            </div>

            {/* الخط الرابط */}
            {index < BOOKING_STEPS.length - 1 && (
              <div
                className={`h-0.5 flex-1 mx-2 transition-colors duration-300 ${
                  index < currentStep ? 'bg-green-500' : 'bg-outline-variant'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
