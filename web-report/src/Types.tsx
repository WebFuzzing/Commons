export interface IFaultsType {
    total_number: number;
    found_faults: Array<IFoundFaultsType>
}

export interface IFoundFaultsType {
    operation_id: string;
    test_case_id: string;
    fault_categories: Array<IFaultCategoriesType>
}

export interface IFaultCategoriesType {
    code: number;
    context: string;
}

export interface IProblemDetailsType {
    rest: IRestType
}

export interface IRestType {
    total_http_calls: number;
    endpoint_ids: Array<string>;
    covered_http_status: Array<ICoveredHttpStatusType>
}

export interface ICoveredHttpStatusType {
    endpoint_id: string;
    test_case_id: string;
    http_status: Array<number>;
}

export interface ITestCaseType {
    id: string;
    file_path: string;
    name: string;
    start_line: number;
    end_line: number;
}

export interface ICriteriaType {
    name: string;
    covered: number;
    total: number;
}

export interface IExtraType {
    tool_name: string;
    criteria: Array<ICriteriaType>;
}

export interface ITypes {
    schema_version: string;
    tool_name: string;
    tool_version: string;
    creation_time: string;
    faults: IFaultsType;
    problem_details: IProblemDetailsType;
    total_tests: number;
    test_file_paths: Array<string>;
    test_cases: Array<ITestCaseType>;
    extra: Array<IExtraType>
}

export interface ITestFilesType {
    name: string;
    code: string;
}

export interface IDashboardType {
    data: ITypes;
    test_files: Array<ITestFilesType>;
}