import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";

interface CustomTooltipProps {
    tooltipText: string;
    className?: string;
    onClick?: (event: React.MouseEvent) => void;
    children: React.ReactNode;
}

export const ReportTooltip: React.FC<CustomTooltipProps> = ({
                                                                children,
                                                                tooltipText,
                                                                className = '',
                                                                onClick,
                                                            }) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div onClick={onClick} className={`${className}`}>
                    {children}
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>{tooltipText}</p>
            </TooltipContent>
        </Tooltip>
    );
};