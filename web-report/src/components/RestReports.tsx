import {Card} from "@/components/ui/card.tsx";
import type React from "react";
import {CoveragePieChart} from "@/components/CoveragePieChart.tsx";
import {RESTReport} from "@/types/GeneratedTypes.tsx";
import {calculateAllStatusCounts} from "@/utils.tsx";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/components/ui/tooltip.tsx";
import info from "@/assets/info.json";

export const RestReports: React.FC<RESTReport> = ({total_http_calls, covered_http_status, endpoint_ids}) => {
    const total = endpoint_ids.length;
    const allStatusCounts = calculateAllStatusCounts(covered_http_status, endpoint_ids);

    return (
        <Card className="border-2 border-black p-6 rounded-none">
            <div className="mb-4">
                <h3 className="text-xl font-bold">REST Report</h3>
            </div>
            <div className="border-t border-black my-2"></div>

            <div className="grid grid-cols-2 gap-4 mb-6">
                <CoveragePieChart covered={allStatusCounts["2XX"]} total={total} color={"#7fd561"} label={"2XX"}/>
                <CoveragePieChart covered={allStatusCounts["3XX"]} total={total} color={"#b8c1e6"} label={"3XX"}/>
                <CoveragePieChart covered={allStatusCounts["4XX"]} total={total} color={"#FFAB5B"} label={"4XX"}/>
                <CoveragePieChart covered={allStatusCounts["5XX"]} total={total} color={"#930d3b"} label={"5XX"}/>
            </div>

            <div className="mt-6">

                <div className="flex justify-between font-bold">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span># Endpoints:</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{info.number_of_endpoints}</p>
                        </TooltipContent>
                    </Tooltip>
                    <span data-testid="rest-report-endpoint">{endpoint_ids.length}</span>
                </div>

                <div className="border-t border-black my-2"></div>
                <div className="flex justify-between font-bold">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span># HTTP Calls:</span>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>{info.number_of_http_calls}</p>
                        </TooltipContent>
                    </Tooltip>
                    <span data-testid="rest-report-http-calls">{total_http_calls}</span>
                </div>
                <div className="border-t border-black my-2"></div>
            </div>
        </Card>
    )
}