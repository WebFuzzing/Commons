package com.webfuzzing.commons.faults;

import com.fasterxml.jackson.annotation.JsonFormat;

import java.util.Objects;

@JsonFormat(shape = JsonFormat.Shape.OBJECT)
public enum DefinedFaultCategory implements FaultCategory {

    /*
        TODO
        code label are still up to discussion and re-arrangement...
     */

    // 1xx: Base
    // might keep other 2xx,...,8xx for other groups (eg, security, GraphQL, RPC)
    // 9xx is reserved for custom codes

    HTTP_STATUS_500(100, "HTTP Status 500", "causes500_internalServerError",
            "The HTTP status code 500 represents a 'Server Error'." +
                    " Typically, when there is crash in the business logic of the tested backend, like for example due to" +
                    " a null-pointer exception, the server would not crash, but rather return a response with status code 500." +
                    " Therefore, the presence of such a response 'might' indicate the presence of a fault in the backend." +
                    " However, such code might also be used for other cases that have nothing to do with software faults." +
                    " For example, if a request cannot be handled due to issue with the environment, e.g., databases and " +
                    " communications with other APIs, a status code 500 could be sent." +
                    " As such, although there is high chances that a 500 status code might point to the presence of a" +
                    " software fault in the tested application, they still need to be manually checked due to possible 'false-positive'."),

    SCHEMA_INVALID_RESPONSE(101, "Received A Response From API That Is Not Valid According To Its Schema", "returnsSchemaInvalidResponse",
            "A schema, like for example OpenAPI for REST, defines the structures not only of the inputs but" +
                    " also the outputs of the API." +
                    " If what returned by an API is not conforming to its schema, then it is a clear fault." +
                    " However, whether the fault is in the API (i.e., it does not conform to the schema) or in the schema" +
                    " itself (i.e., it is underspecified, or having mistakes) is something that cannot be known for" +
                    " sure without debugging the issue."),


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
