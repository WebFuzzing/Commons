import type React from "react";
import {ReportTooltip} from "@/components/ui/report-tooltip.tsx";
import info from "@/assets/info.json";

interface IHeaderProps {
    date: string;
    tool_name_version: string;
    schema_version: string;
}

export const Header: React.FC<IHeaderProps> = ({date, tool_name_version, schema_version}) => (
    <div className="flex justify-between border-b border-black pb-2 mb-4">
        <ReportTooltip tooltipText={info.creation_date}>
            <div className="font-bold" data-testid="header-creation-date">Creation Date: {new Date(date).toUTCString()}</div>
        </ReportTooltip>
        <ReportTooltip tooltipText={info.tool_name_version}>
            <div className="font-bold text-center" data-testid="header-tool-name-version">Tool: {tool_name_version}</div>
        </ReportTooltip>
        <ReportTooltip tooltipText={info.schema_version}>
             <div className="font-bold text-right" data-testid="header-schema-version">Schema Version: {schema_version}</div>
        </ReportTooltip>

    </div>
)