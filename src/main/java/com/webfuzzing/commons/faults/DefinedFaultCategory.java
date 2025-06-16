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

    SCHEMA_INVALID_RESPONSE(101, "Received A Response From API That Is Not Valid According To Its Schema",
            "returnsSchemaInvalidResponse",
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
