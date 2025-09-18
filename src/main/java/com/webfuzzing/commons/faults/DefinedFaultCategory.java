package com.webfuzzing.commons.faults;


import java.util.Objects;

public enum DefinedFaultCategory implements FaultCategory {

    /*
        TODO
        code label are still up to discussion and re-arrangement...
     */

    // 1xx: Base
    // might keep other 2xx,...,8xx for other groups (eg, security, GraphQL, RPC)
    // 9xx is reserved for custom codes

    HTTP_STATUS_500(100, "HTTP Status 500",
            "causes500_internalServerError",
            "The HTTP status code 500 represents a 'Server Error'." +
                    " Typically, when there is crash in the business logic of the tested backend, like for example due to" +
                    " a null-pointer exception, the server would not crash, but rather return a response with status code 500." +
                    " Therefore, the presence of such a response 'might' indicate the presence of a fault in the backend." +
                    " However, such code might also be used for other cases that have nothing to do with software faults." +
                    " For example, if a request cannot be handled due to issue with the environment, e.g., databases and " +
                    " communications with other APIs, a status code 500 could be sent." +
                    " As such, although there is high chances that a 500 status code might point to the presence of a" +
                    " software fault in the tested application, they still need to be manually checked due to possible 'false-positive'."),

    SCHEMA_INVALID_RESPONSE(101, "Received A Response From API With A Structure/Data That Is Not Matching Its Schema",
            "returnsMismatchResponseWithSchema",
            "A schema, like for example OpenAPI for REST, defines the structures not only of the inputs but" +
                    " also the outputs of the API." +
                    " If what returned by an API is not conforming to its schema, then it is a clear fault." +
                    " However, whether the fault is in the API (i.e., it does not conform to the schema) or in the schema" +
                    " itself (i.e., it is underspecified, or having mistakes) is something that cannot be known for" +
                    " sure without debugging the issue."),

    SCHEMA_VALIDATION_BYPASS(102, "Received Success Response When Sending Wrong Data",
            "successOnInvalidInputs",
            "API inputs might have constraints (e.g., integers in a specific range, and strings matching a" +
                    " given regular expression)." +
                    " Also, they need be to of specific types (e.g., integers, booleans, strings, dates, arrays and objects)." +
                    " If some input data does not satisfy the type on constraints defined in the schema, then the API should" +
                    " mark the request as 'user error'." +
                    " However, if for any reason the request is processed successfully, then it is a fault." +
                    " Either the schema is incorrect, or the API is not properly discarding invalid data."),

    DELETE_NOT_WORKING(103, "Resource Still Accessible After Being Deleted",
            "deleteNotWorking",
            "If a resource is deleted, and the API responds that such request was successful, then such" +
                    " resource should no longer being available." +
                    " New requests to access it should fail." +
                    " Otherwise, if it is still possible to access the resource, then it was not really deleted." +
                    " Then, as such, it means that the delete operation is faulty."),

    FAILED_CREATION_SIDE_EFFECTS(104, "Failed Creation of Resource Has Side Effects on Backend",
            "sideEffectsOnFailedCreation",
            "The API might expose endpoints to create new resources." +
                    " The creation of a new resource might fail due to non-satisfied input constraints, or based" +
                    " on constraints in the state of the backend." +
                    " If the API reports that the creation operation failed, then such action should have no side-effects" +
                    " The resource (e.g., with partial data) should not be accessible."),


    // 2xx: security

    SQL_INJECTION(200, "SQL Injection (SQLi)",
            "vulnerableToSQLInjection",
            "Input data was not properly sanitized." +
                    " Its use in SQL commands led to execute arbitrary commands on the database." +
                    " See OWASP Top 10 for more information."),

    XSS(201, "Cross-Site Scripting (XSS)",
            "vulnerableToXSS",
            "XSS is an attack in which it is possible to inject malicious scripts into web pages viewed users." +
                    " This works as well in APIs, if the malicious payload is stored as it is," +
                    " and then read afterwards by a frontend web application." +
                    " See OWASP Top 10 for more information."),

    SSRF(202,"Server-Side Request Forgery (SSRF)",
            "vulnerableToSSRF",
            "Some inputs might be URLs, which are then used by the API to retrieve data from external services." +
                    " However, if the hostnames of these URLs are not verified, the API could be tricked into making requests" +
                    " towards servers it should not to, like for example the 'localhost'." +
                    " See OWASP Top 10 for more information."),

    MASS_ASSIGNMENT(203,"Mass Assignment",
            "vulnerableToMassAssignment",
            "This vulnerability exploits possible active record pattern misconfigurations to modify fields of " +
                    " a record that should not be accessible via the API." +
                    " See OWASP Top 10 for more information."),

    SECURITY_EXISTENCE_LEAKAGE(204, "Leakage Information Existence of Protected Resource",
            "allowsUnauthorizedAccessToProtectedResource",
            "When accessing a protected resource, could get as a response a 403 not-authorized status code." +
                    " If the resource does not exist, then returning a 404 would be a security leak, as now the client would" +
                    " know if resources, they have no access to, do exist or not." +
                    " In these cases, to avoid unauthorized information leakage, a server should consistently either always return 403" +
                    " or 404 for protected resources, regardless of whether they exist or not."),

    SECURITY_NOT_RECOGNIZED_AUTHENTICATED(205, "Wrongly Not Recognized as Authenticated",
            "authenticatedButWronglyToldNot",
            "If the user is providing valid credentials, and if they try to access a protected resource," +
                    " they should get a status code 403 (not authorized), and not 401 (not authenticated)." +
                    " With a 401, the user might wrongly think there is a problem with their credentials, and not that they" +
                    " have no right to access to that resource." +
                    " However, to avoid false positives related to misconfigured credentials, these credentials should be first" +
                    " successfully validated on some other resources before flagging a returned 401 as a server fault."),

    SECURITY_WRONG_AUTHORIZATION(206, "Allowed To Modify Resource That Likely Should Had Been Protected",
            "missedAuthorizationCheck",
            "BOLA and BFLA are major security vulnerabilities. To avoid users accessing protected resources," +
                    " authorization mechanisms are usually put in place." +
                    " However, it can happen that, on some endpoints, these authorization mechanisms are missing or misconfigured" +
                    " by mistake." +
                    " This can have disastrous consequences, e.g., a regular user deleting all data from all other users." +
                    " However, access policies could be arbitrarily complex, where some users might validly interact with" +
                    " some resources of other users." +
                    " A common example is 'administrator' users." +
                    " Without a formal specification describing in details the access policies in place, it is hard to say" +
                    " automatically if we are in the case of a BOLA/BFLA vulnerability." +
                    " Still, some heuristics could be used to flag highly suspicious cases." +
                    " For example, if a user is blocked with a 403 to do a PUT and a PATCH on a resource, it would" +
                    " be quite suspicious if a DELETE would work just fine on that resource.")
    ;

    private final int code;

    private final String name;

    private final String testCaseLabel;

    private final String fullDescription;

    DefinedFaultCategory(int code, String name, String testCaseLabel, String fullDescription) {
        this.code = code;
        this.name = Objects.requireNonNull(name);
        this.testCaseLabel = Objects.requireNonNull(testCaseLabel);
        this.fullDescription = Objects.requireNonNull(fullDescription);
    }

    @Override
    public int getCode() {
        return code;
    }

    @Override
    public String getDescriptiveName() {
        return name;
    }

    @Override
    public String getTestCaseLabel() {
        return testCaseLabel;
    }

    @Override
    public String getFullDescription() {
        return fullDescription;
    }
}
