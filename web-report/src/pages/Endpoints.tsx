import React, {useState} from "react";
import {Accordion} from "@/components/ui/accordion.tsx";
import {EndpointAccordion} from "@/components/EndpointAccordion.tsx";
import {WebFuzzingCommonsReport} from "@/types/GeneratedTypes.tsx";
import {StatusCodeFilters} from "@/components/StatusCodeFilters.tsx";

interface IProps {
    addTestTab: (value: string, event: React.MouseEvent<HTMLElement>) => void;
    data: WebFuzzingCommonsReport
}

export const Endpoints: React.FC<IProps> = ({addTestTab, data}) => {

    const transformJson = (original: WebFuzzingCommonsReport) => {

        const endpointMap = new Map<string, {
            endpoint: string,
            faults: {
                code: number,
                test_cases: string[]
            }[],
            http_status_codes: {
                code: number
                test_cases: string[]
            }[]
        }>();

        original.problem_details.rest?.endpoint_ids.forEach(endpoint => {
            endpointMap.set(endpoint, {
                endpoint,
                http_status_codes: [],
                faults: []
            });
        });

        original.faults.found_faults.forEach(fault => {
            if (!fault.operation_id) {
                return;
            }

            if (!endpointMap.has(fault.operation_id)) {
                console.log(`Endpoint ${fault.operation_id} not found in endpoint_ids`);
            }

            const endpointData = endpointMap.get(fault.operation_id);

            if (!endpointData) {
                return;
            }

            fault.fault_categories.forEach(faultCat => {
                let existingFault = endpointData.faults.find((f: { code: number; }) => f.code === faultCat.code);
                if (!existingFault) {
                    existingFault = {code: faultCat.code, test_cases: []};
                    endpointData.faults.push(existingFault);
                }
                if (!existingFault.test_cases.includes(fault.test_case_id)) {
                    existingFault.test_cases.push(fault.test_case_id);
                }
            });
        });

        if (original.problem_details.rest == null) {
            return Array.from([]);
        }

        original.problem_details.rest.covered_http_status.forEach(status => {
            if (!endpointMap.has(status.endpoint_id)) {
                console.log(`Endpoint ${status.endpoint_id} not found in endpoint_ids`);
            }

            const endpointData = endpointMap.get(status.endpoint_id);

            status.http_status.forEach(code => {
                if (!endpointData) {
                    return;
                }
                let existingStatus = endpointData.http_status_codes.find((s: { code: number; }) => s.code === code);
                if (!existingStatus) {
                    existingStatus = {code, test_cases: []};
                    endpointData.http_status_codes.push(existingStatus);
                }
                if (!existingStatus.test_cases.includes(status.test_case_id)) {
                    existingStatus.test_cases.push(status.test_case_id);
                }
            });
        });

        return Array.from(endpointMap.values());
    }

    const transformed = transformJson(data);
    const [filteredEndpoints, setFilteredEndpoints] = useState(transformed);

    const onFiltersChange = (activeFilters: Record<number, string>) => {
        // Filter the endpoints based on the active filters
        const filtered = transformed.filter(endpoint => {
            // If no filters are active, show all endpoints
            if (Object.keys(activeFilters).length === 0) {
                return true;
            }

            // Check if any status code or fault code is marked as "removed"
            const hasRemovedStatusCode = endpoint.http_status_codes.some(code =>
                activeFilters[code.code] === "removed"
            );
            const hasRemovedFaultCode = endpoint.faults.some(code =>
                activeFilters[-code.code] === "removed"
            );

            // Check if any status code or fault code is marked as "active"
            const hasActiveStatusCode = endpoint.http_status_codes.some(code =>
                activeFilters[code.code] === "active"
            );
            const hasActiveFaultCode = endpoint.faults.some(code =>
                activeFilters[-code.code] === "active"
            );

            const hasActiveFilter = activeFilters && Object.values(activeFilters).some((value) => value === "active");
            const hasRemovedFilter = activeFilters && Object.values(activeFilters).some((value) => value === "removed");

            if (!hasActiveFilter && !hasRemovedFilter) {
                // If no filters are active, show all endpoints
                return true;
            }

            if (hasActiveFilter) {
                if (hasRemovedFilter) {
                    // If there are both active and removed filters, check if the endpoint matches any of them
                    if(hasRemovedFaultCode || hasRemovedStatusCode) {
                        return false;
                    }

                    return !!(hasActiveStatusCode || hasActiveFaultCode);

                } else {
                    // If there are only active filters, check if the endpoint matches any of them
                    return !!(hasActiveStatusCode || hasActiveFaultCode);

                }
            } else if (hasRemovedFilter) {
                // If there are only removed filters, check if the endpoint matches any of them
                return !(hasRemovedStatusCode || hasRemovedFaultCode);

            } else {
                // If there are no active or removed filters, show all endpoints
                return true;
            }
        });
        setFilteredEndpoints(filtered);
    }

    return (
        <div className="border-2 border-black p-6 rounded-none w-[80%] mx-auto">
            <StatusCodeFilters data={transformed} onFiltersChange={onFiltersChange}/>
            <div className="flex items-center mb-2">
                <h3 className="text-sm font-medium text-gray-700 mr-3"># Endpoints:</h3>
                <div className="flex flex-wrap gap-2 font-bold font-mono">
                    <p className="text-black-400">{filteredEndpoints.length}</p> / <p className="text-red-400">{transformed.length}</p>
                </div>
            </div>
            <Accordion type="single" collapsible className="w-full">
                {
                    filteredEndpoints.map((item, index) => (
                        <EndpointAccordion data-testid="endpoint" key={index} value={`_${index}`}
                                           endpoint={item.endpoint}
                                           status_codes={item.http_status_codes} faults={item.faults}
                                           addTestTab={addTestTab}/>
                    ))
                }
            </Accordion>
        </div>
    )
}