import React from 'react';
import { Check } from 'lucide-react';

interface StepperProps {
    steps: string[];
    currentStep: number;
    onStepChange: (step: number) => void;
}

export const Stepper: React.FC<StepperProps> = ({ steps, currentStep, onStepChange }) => {
    return (
        <div className="w-full py-4">
            <div className="flex items-center justify-between relative">
                {/* Progress Bar Background */}
                <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-gray-200 rounded-full -z-10" />

                {/* Active Progress Bar */}
                <div
                    className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-blue-600 rounded-full -z-10 transition-all duration-300 ease-in-out"
                    style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />

                {steps.map((step, index) => {
                    const isCompleted = index < currentStep;
                    const isCurrent = index === currentStep;
                    const isPending = index > currentStep;

                    let alignmentClasses = "left-1/2 -translate-x-1/2 text-center";
                    if (index === 0) alignmentClasses = "left-0 text-left";
                    if (index === steps.length - 1) alignmentClasses = "right-0 text-right";

                    return (
                        <div
                            key={step}
                            className="relative flex flex-col items-center cursor-pointer group"
                            onClick={() => onStepChange(index)}
                        >
                            <div
                                className={`
                  w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-200 bg-white z-10
                  ${isCompleted ? 'border-blue-600 bg-blue-600 text-white' : ''}
                  ${isCurrent ? 'border-blue-600 text-blue-600' : ''}
                  ${isPending ? 'border-gray-300 text-gray-400' : ''}
                `}
                            >
                                {isCompleted ? (
                                    <Check size={16} strokeWidth={3} />
                                ) : (
                                    <span className="text-sm font-semibold">{index + 1}</span>
                                )}
                            </div>
                            <span
                                className={`
                  absolute top-10 ${alignmentClasses} text-[10px] sm:text-xs font-medium transition-colors duration-200 w-max max-w-[100px] leading-tight
                  ${isCurrent ? 'text-blue-600 font-bold' : 'text-gray-500'}
                  ${isPending ? 'text-gray-400' : ''}
                `}
                            >
                                {step}
                            </span>
                        </div>
                    );
                })}
            </div>
            {/* Spacer for the absolute positioned labels */}
            <div className="h-10" />
        </div>
    );
};
