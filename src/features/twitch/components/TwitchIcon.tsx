import { cn } from "@/shared/utils";

interface TwitchIconProps extends React.HTMLAttributes<HTMLOrSVGElement> {
    className?: string;
}

export default function TwitchIcon({ className, ...props }: TwitchIconProps) {
    return (
        <svg
            className={cn("", className)}
            {...props}
            viewBox="0 0 256 256"
            xmlns="http://www.w3.org/2000/svg"
            version="1.1"
            width="256"
            height="256"
        >
            <g style={{ stroke: 'none', strokeWidth: 0, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'none', fillRule: 'nonzero', opacity: 1 }} transform="translate(1.4065934065934016 1.4065934065934016) scale(2.81 2.81)">
                <polygon points="77.14,41.79 64.29,54.64 51.43,54.64 40.18,65.89 40.18,54.64 25.71,54.64 25.71,6.43 77.14,6.43 " style={{ stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(255,255,255)', fillRule: 'nonzero', opacity: 1 }} transform="  matrix(1 0 0 1 0 0) " />
                <path d="M 22.5 0 L 6.429 16.071 v 57.857 h 19.286 V 90 l 16.071 -16.071 h 12.857 L 83.571 45 V 0 H 22.5 z M 77.143 41.786 L 64.286 54.643 H 51.429 l -11.25 11.25 v -11.25 H 25.714 V 6.429 h 51.429 V 41.786 z" style={{ stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(0,0,0)', fillRule: 'nonzero', opacity: 1 }} transform=" matrix(1 0 0 1 0 0) " strokeLinecap="round" />
                <rect x="61.07" y="17.68" rx="0" ry="0" width="6.43" height="19.29" style={{ stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(0,0,0)', fillRule: 'nonzero', opacity: 1 }} transform=" matrix(1 0 0 1 0 0) " />
                <rect x="43.39" y="17.68" rx="0" ry="0" width="6.43" height="19.29" style={{ stroke: 'none', strokeWidth: 1, strokeDasharray: 'none', strokeLinecap: 'butt', strokeLinejoin: 'miter', strokeMiterlimit: 10, fill: 'rgb(0,0,0)', fillRule: 'nonzero', opacity: 1 }} transform=" matrix(1 0 0 1 0 0) " />
            </g>
        </svg>
    );
}
