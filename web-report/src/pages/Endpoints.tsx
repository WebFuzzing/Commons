import type React from "react";
import {Accordion} from "@/components/ui/accordion.tsx";
import {EndpointAccordion} from "@/components/EndpointAccordion.tsx";
import {WebFuzzingReport} from "@/types/GeneratedTypes.tsx";


interface IProps {
    addTestTab: (value: string, event: React.MouseEvent<HTMLElement>) => void;
    data: WebFuzzingReport
}

export const Endpoints: React.FC<IProps> = ({addTestTab, data}) => {

    const transformJson = (original: WebFuzzingReport) => {

        const endpointMap = new Map();

        original.faults.found_faults.forEach(fault => {
            if (!endpointMap.has(fault.operation_id)) {
                endpointMap.set(fault.operation_id, {
                    endpoint: fault.operation_id,
                    http_status_codes: [],
                    faults: []
                });
            }

            const endpointData = endpointMap.get(fault.operation_id);

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

        if(original.problem_details.rest == null){
            return Array.from([]);
        }

        original.problem_details.rest.covered_http_status.forEach(status => {
            if (!endpointMap.has(status.endpoint_id)) {
                endpointMap.set(status.endpoint_id, {
                    endpoint: status.endpoint_id,
                    http_status_codes: [],
                    faults: []
                });
            }

            const endpointData = endpointMap.get(status.endpoint_id);

            status.http_status.forEach(code => {
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

    return (
        <div className="border-2 border-black p-6 rounded-none w-[80%] mx-auto">
            <Accordion type="single" collapsible className="w-full">
                {
                    transformed.map((item, index) => (
                        <EndpointAccordion key={index} value={`_${index}`} endpoint={item.endpoint}
                                           status_codes={item.http_status_codes} faults={item.faults}
                                           addTestTab={addTestTab}/>
                    ))
                }
            </Accordion>
        </div>
    )
}