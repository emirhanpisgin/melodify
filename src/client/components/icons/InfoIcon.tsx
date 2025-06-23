interface InfoIconProps extends React.HTMLAttributes<HTMLOrSVGElement> { }

export default function InfoIcon({ className, ...props }: InfoIconProps) {
    return (
        <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1}
            className={className}
            {...props}
        >
            <circle
                cx={12}
                cy={12}
                r={11}
                stroke="currentColor"
                strokeWidth={2}
                fill="none"
            />
            <circle
                cx={12}
                cy={8}
                r={1.2}
                fill="currentColor"
                stroke="none"
            />
            <rect
                x={11}
                y={11}
                width={2}
                height={6}
                rx={1}
                fill="currentColor"
                stroke="none"
            />
        </svg>
    );
}
