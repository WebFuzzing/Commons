import type React from "react";
import {ReportTooltip} from "@/components/ui/report-tooltip.tsx";
import info from "@/assets/info.json";

interface IHeaderProps {
    date: string;
    toolNameVersion: string;
    schemaVersion: string;
}

export const Header: React.FC<IHeaderProps> = ({date, toolNameVersion, schemaVersion}) => (
    <>
        <div className="justify-between border-b border-black pb-2 mb-4">
            <div className="font-extrabold">WEB FUZZING COMMONS</div>
        </div>
        <div className="flex justify-between border-b border-black pb-2 mb-4">
            <ReportTooltip tooltipText={info.creationDate}>
                <div className="font-bold" data-testid="header-creation-date">Creation Date: {new Date(date).toUTCString()}</div>
            </ReportTooltip>
            <ReportTooltip tooltipText={info.toolNameVersion}>
                <div className="font-bold text-center" data-testid="header-tool-name-version">Tool: {toolNameVersion}</div>
            </ReportTooltip>
            <ReportTooltip tooltipText={info.schemaVersion}>
                <div className="font-bold text-right" data-testid="header-schema-version">Schema Version: {schemaVersion}</div>
            </ReportTooltip>
        </div>
    </>
)