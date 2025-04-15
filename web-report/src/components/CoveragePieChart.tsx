import {Cell, Label, Pie, PieChart, ResponsiveContainer} from "recharts";
import type React from "react";

interface ICoverageData {
    covered: number;
    total: number;
    color: string;
    label: string;
}

export const CoveragePieChart: React.FC<ICoverageData> = ({covered, total, color, label}) => {
    const data = [
        {name: 'Covered', value: covered, color: color},
        {name: 'Total', value: total-covered, color: "#FFF2DB"},
    ]

    return (
        <div className="flex flex-col items-center">
            <div className="text-lg font-bold">{label}</div>
            <div className="w-32 h-32">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={0}
                            outerRadius={60}
                            fill="#8884d8"
                            dataKey="value"
                            stroke="#000"
                            strokeWidth={3}
                        >
                            {data.map((_entry, index) => (
                                <Cell key={`cell-${index}`} fill={_entry.color}/>
                            ))}
                            <Label
                                value={`${covered}/${total}`}
                                position="left"
                                fill="#000000"
                                style={{fontSize: "16px", fontWeight: "bold"}}
                            />
                        </Pie>
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}