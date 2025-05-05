import type React from "react";

interface IHeaderProps {
    date: string;
    tool_name_version: string;
    schema_version: string;
}

export const Header: React.FC<IHeaderProps> = ({date, tool_name_version, schema_version}) => (
    <div className="flex justify-between border-b border-black pb-2 mb-4">
        <div className="font-bold">Creation Date: {new Date(date).toUTCString()}</div>
        <div className="font-bold text-center">Tool: {tool_name_version}</div>
        <div className="font-bold text-right">Schema Version: {schema_version}</div>
    </div>
)