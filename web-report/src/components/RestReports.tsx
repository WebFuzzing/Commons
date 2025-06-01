import {Card} from "@/components/ui/card.tsx";
import type React from "react";
import {CoveragePieChart} from "@/components/CoveragePieChart.tsx";
import {RESTReport} from "@/types/GeneratedTypes.tsx";
import {calculateAllStatusCounts, getText} from "@/lib/utils";
import info from "@/assets/info.json";
import {ReportTooltip} from "@/components/ui/report-tooltip.tsx";

export const RestReports: React.FC<RESTReport> = ({covered_http_status, endpoint_ids}) => {
    const total = endpoint_ids.length;
    const allStatusCounts = calculateAllStatusCounts(covered_http_status, endpoint_ids);

    return (
        <Card className="border-2 border-black p-6 rounded-none">
            <div className="mb-4">
                <h3 className="text-xl font-bold">REST Report</h3>
            </div>
            <div className="border-t border-black my-2"></div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <ReportTooltip tooltipText={getText(info.http_endpoint_codes, {
                    number_of_endpoints: allStatusCounts["2XX"],
                    code: "2XX",
                    total_endpoints: total
                })}>
                    <CoveragePieChart covered={allStatusCounts["2XX"]} total={total} color={"#7fd561"} label={"2XX"}/>
                </ReportTooltip>
                <ReportTooltip tooltipText={getText(info.http_endpoint_codes, {
                    number_of_endpoints: allStatusCounts["3XX"],
                    code: "3XX",
                    total_endpoints: total
                })}>
                    <CoveragePieChart covered={allStatusCounts["3XX"]} total={total} color={"#b8c1e6"} label={"3XX"}/>
                </ReportTooltip>
                <ReportTooltip tooltipText={getText(info.http_endpoint_codes, {
                    number_of_endpoints: allStatusCounts["4XX"],
                    code: "4XX",
                    total_endpoints: total
                })}>
                    <CoveragePieChart covered={allStatusCounts["4XX"]} total={total} color={"#FFAB5B"} label={"4XX"}/>
                </ReportTooltip>
                <ReportTooltip tooltipText={getText(info.http_endpoint_codes, {
                    number_of_endpoints: allStatusCounts["5XX"],
                    code: "5XX",
                    total_endpoints: total
                })}>
                    <CoveragePieChart covered={allStatusCounts["5XX"]} total={total} color={"#930d3b"} label={"5XX"}/>
                </ReportTooltip>
            </div>

            <div className="mt-6">

                <div className="flex justify-between font-bold">
                    <ReportTooltip tooltipText={info.number_of_endpoints}>
                        <span># Endpoints:</span>
                    </ReportTooltip>
                    <span data-testid="rest-report-endpoint">{endpoint_ids.length}</span>
                </div>
                <div className="border-t border-black my-2"></div>
            </div>
        </Card>
    )
}