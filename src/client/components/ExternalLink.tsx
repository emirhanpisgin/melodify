import { cn } from "../../lib/utils";

/**
 * ExternalLink opens a URL in the user's default browser using Electron's shell API.
 */

interface ExternalLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
    children?: React.ReactNode
}

export default function ExternalLink({ className, href, children, ...props }: ExternalLinkProps) {
    return (
        <a
            onClick={(e) => {
                e.preventDefault()
                if (href) {
                    window.electronAPI.openExternal(href)
                }
            }}
            className={cn("cursor-pointer", className)}
            {...props}
        >
            {children}
        </a>
    )
}
