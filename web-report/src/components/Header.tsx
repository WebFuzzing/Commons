import type React from "react";
import {ReportTooltip} from "@/components/ui/report-tooltip.tsx";
import {Switch} from "@/components/ui/switch.tsx";
import info from "@/assets/info.json";
import {useAppContext} from "@/AppProvider.tsx";

const ICON_URL = "/assets/icon.svg";

interface IHeaderProps {
    date: string;
    toolNameVersion: string;
    schemaVersion: string;
}

export const Header: React.FC<IHeaderProps> = ({date, toolNameVersion, schemaVersion}) => {
    const {lowCodeMode, setLowCodeMode} = useAppContext();

    return (
        <>
            <div className="flex justify-between items-center border-b border-black pb-2 mb-4">
                <div className="font-extrabold">WEB FUZZING COMMONS</div>
                <ReportTooltip tooltipText="Show only /** */ documentation comments instead of full test source code.">
                    <label
                        htmlFor="low-code-switch"
                        className="flex items-center gap-2 text-sm font-bold cursor-pointer select-none"
                        data-testid="header-low-code-toggle"
                    >
                        <span>Low-code view</span>
                        <Switch
                            id="low-code-switch"
                            checked={lowCodeMode}
                            onCheckedChange={setLowCodeMode}
                        />
                    </label>
                </ReportTooltip>
            </div>
            <div className="flex justify-between border-b border-black pb-2 mb-4">
                <ReportTooltip tooltipText={info.creationDate}>
                    <div className="font-bold" data-testid="header-creation-date">Creation Date: {new Date(date).toUTCString()}</div>
                </ReportTooltip>
                <ReportTooltip tooltipText={info.toolNameVersion}>
                    <div className="font-bold text-center flex items-center justify-center gap-2" data-testid="header-tool-name-version">
                        <span>Tool: {toolNameVersion}</span>
                        <img
                            src={ICON_URL}
                            alt=""
                            className="h-8 w-8 object-contain"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                    </div>
                </ReportTooltip>
                <ReportTooltip tooltipText={info.schemaVersion}>
                    <div className="font-bold text-right" data-testid="header-schema-version">Schema Version: {schemaVersion}</div>
                </ReportTooltip>
            </div>
        </>
    );
};
