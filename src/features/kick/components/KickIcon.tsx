import { cn } from "../../../shared/utils";

interface KickIconProps extends React.HTMLAttributes<HTMLOrSVGElement> { }

export default function KickIcon({ className, ...props }: KickIconProps) {
    return (
        <svg className={cn("", className)} {...props} viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" strokeLinejoin="round" strokeMiterlimit="2">
            <path d="M37 .036h164.448v113.621h54.71v-56.82h54.731V.036h164.448v170.777h-54.73v56.82h-54.711v56.8h54.71v56.82h54.73V512.03H310.89v-56.82h-54.73v-56.8h-54.711v113.62H37V.036z" fill="#000000" />
        </svg>
    );
}
