import React from "react";
import {Accordion} from "@/components/ui/accordion.tsx";
import {EndpointAccordion} from "@/components/EndpointAccordion.tsx";
import {StatusCodeFilters} from "@/components/StatusCodeFilters.tsx";
import {useAppContext} from "@/AppProvider.tsx";

interface IProps {
    addTestTab: (value: string, event: React.MouseEvent<HTMLElement>) => void;
    openEndpoint: string;
    setOpenEndpoint: (value: string) => void;
}

export const Endpoints: React.FC<IProps> = ({addTestTab, openEndpoint, setOpenEndpoint}) => {

    const {transformedReport, filteredEndpoints, statusFilters, setStatusFilters} = useAppContext();

    const declaredEndpoints = transformedReport.filter(endpoint => endpoint.declared);
    const filteredDeclaredEndpoints = filteredEndpoints.filter(endpoint => endpoint.declared);
    const undeclaredEndpoints = transformedReport.filter(endpoint => !endpoint.declared);
    const filteredUndeclaredEndpoints = filteredEndpoints.filter(endpoint => !endpoint.declared);

    return (
        <div className="border-2 border-black p-3 sm:p-6 rounded-none">
            <StatusCodeFilters data={transformedReport} filters={statusFilters} onFiltersChange={setStatusFilters}/>
            <div className="flex items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700 mr-3"># Endpoints:</h3>
                <div className="flex flex-wrap gap-2 font-bold font-mono">
                    <p className="text-black-400">{filteredDeclaredEndpoints.length}</p> / <p className="text-red-400">{declaredEndpoints.length}</p>
                </div>
            </div>
            {undeclaredEndpoints.length > 0 &&
                <div className="flex items-center mb-2">
                    <h3 className="text-sm font-medium text-gray-700 mr-3"># Faulty operations not in schema:</h3>
                    <div className="flex flex-wrap gap-2 font-bold font-mono">
                        <p className="text-black-400">{filteredUndeclaredEndpoints.length}</p> / <p className="text-amber-600">{undeclaredEndpoints.length}</p>
                    </div>
                </div>
            }
            <Accordion type="single" collapsible value={openEndpoint} onValueChange={setOpenEndpoint} className="w-full">
                {
                    filteredEndpoints.map((item, index) => (
                        <EndpointAccordion data-testid="endpoint" key={index} value={item.endpoint}
                                           endpoint={item.endpoint} declared={item.declared}
                                           statusCodes={item.httpStatusCodes} faults={item.faults}
                                           addTestTab={addTestTab}/>
                    ))
                }
            </Accordion>
        </div>
    )
}