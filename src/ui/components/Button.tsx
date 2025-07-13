import { forwardRef, ButtonHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    children?: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, children, ...props }, ref) => {
        return (
            <button
                className={twMerge(
                    clsx(
                        "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm border-none font-medium text-white transition-colors focus:outline-none focus:ring-melodify-primary focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
                        "bg-melodify-primary hover:bg-melodify-primary-dark",
                        className
                    )
                )}
                ref={ref}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export { Button };
