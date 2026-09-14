package com.webfuzzing.commons.faults;


import java.util.Objects;

public enum DefinedFaultCategory implements FaultCategory {

    /*
        TODO
        code label are still up to discussion and re-arrangement...
     */

    // 1xx: HTTP/REST
    // 2xx: Schema/Robustness
    // 3xx: Security
    // others: currently WiP
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
    HTTP_STATUS_NO_NON_STANDARD_CODES(101, "HTTP Violation: no-non-standard-codes", "invalidStatusCode",
            "HTTP status codes outside the range 100-599 are not valid."),
    HTTP_STATUS_NO_201_IF_DELETE(102, "HTTP Violation: no-201-if-delete", "201OnDelete",
            "A DELETE operation is meant to remove a resource, and so it should not states to 201 create one."),
    HTTP_STATUS_NO_201_IF_GET(103, "HTTP Violation: no-201-if-get", "201OnGet",
            "A GET operation is meant to retrieve a resource, and so it should not states to 201 create one."),
    HTTP_STATUS_NO_201_IF_PATCH(104, "HTTP Violation: no-201-if-patch", "201OnPatch",
            "A PATCH operation is meant to modify a resource, and so it should not states to 201 create one."),
    HTTP_STATUS_NO_204_IF_CONTENT(105, "HTTP Violation: no-204-if-content", "204WhenContent",
            "If a response contains a payload, it should not state it 204 contains none."),
    HTTP_STATUS_NO_413_IF_NO_PAYLOAD(106, "HTTP Violation: no-413-if-no-payload", "413WhenNoPayload",
            "Cannot state a payload is too large if there is no payload."),
    HTTP_STATUS_NO_415_IF_NO_PAYLOAD(107, "HTTP Violation: no-415-if-no-payload", "415WhenNoPayload",
            "Cannot state a payload is of the wrong type if there is no payload."),
    HTTP_STATUS_NO_304_IF_NO_GET_OR_HEAD(108, "HTTP Violation: no-304-if-no-get-or-head", "304OnWrongVerb",
            "A 304 response is not valid if the request was not either a GET or a HEAD."),
    HTTP_STATUS_NO_401_IF_NO_WWW_AUTHENTICATE(109, "HTTP Violation: no-401-if-no-authenticate", "401MissingWwwAuthenticate",
            "If an API responds with a 401 non-authenticated error, such response MUST contain a www-authenticate header, with the needed information." +
                    " In HTTP, this is not optional."),
    HTTP_STATUS_NO_405_IF_NO_ALLOW(110, "HTTP Violation: no-405-if-no-allow", "405MissingAllow",
            "A 405 Not Allowed response must contain an Allow header specifying what is allowed."),
    HTTP_STATUS_NO_205_IF_CONTENT(111,"HTTP Violation: no-205-if-content","205WhenContent",
            "If a response contains a payload, it should not return a 205, as that requires no payload."),
    HTTP_STATUS_NO_426_IF_NO_UPGRADE(112,"HTTP Violation: no-426-if-no-upgrade","426MissingUpgrade",
            "A 426 response must contain an Upgrade header with the needed information."),
    HTTP_NONWORKING_DELETE(113,"HTTP Violation: Resource Still Accessible After Successful DELETE", "deleteDoesNotWork",
            "If a resource is deleted, and the API responds that such request was successful, then such" +
                    " resource should no longer being available." +
                    " New requests to access it should fail." +
                    " Otherwise, if it is still possible to access the resource, then it was not really deleted." +
                    " Then, as such, it means that the delete operation is faulty."),
    HTTP_SIDE_EFFECTS_FAILED_MODIFICATION(114, "HTTP Violation: A Failed PUT or PATCH Must Not Change The Resource", "sideEffectsFailedModification",
            "Write operations that fail due to user errors should not leave side effects on the system." +
                    " There should not be partial updates: either all are applied, or none."),
    HTTP_REPEATED_CREATE_PUT(115, "HTTP Violation: Repeated PUT Creates Resource With 201 Instead of Updating", "repeatedCreatePut",
            "A PUT operation can either update (e.g., 200 or 204) or create (201) a resource." +
                    " If a resource is 201 created with a PUT, a second PUT should update the resource, and not be marked as recreated."),
    HTTP_MISLEADING_CREATE_PUT(116, "HTTP Violation: Misleading PUT 201 Creates When Resource Already Exists", "misleadingCreatePut",
            "A PUT operation can either update (e.g., 200 or 204) or create (201) a resource." +
                    " If a resource already exists, than a PUT operation on it would update it, and not create it."),
    HTTP_PARTIAL_UPDATE_PUT(117, "HTTP Violation: The Verb PUT Must Make a Full Replacement", "partialUpdatePut",
            "A PUT operation is used to make a full replacement of a resource"),
    HTTP_NON_IDEMPOTENT_PUT(118, "HTTP Violation: PUT Implementation Must be Idempotent", "nonIdempotentPut",
            "A PUT operation is treated as idempotent. A write operation with a PUT that is not implemented as idempotent might have severe repercussions," +
                    " as such operation could be automatically repeated any entity involved in the HTTP connection without any warning to the user."),
    HTTP_INVALID_MERGE_PATCH(119, "HTTP Violation: Invalid JSON Merge Patch", "invalidMergePatch",
            "A JSON Merge Path has a specific semantics, defining how values are modified based on the input payloads." +
                    " Modifying entries not specified in the payload would be a clear implementation fault."),
    HTTP_INVALID_LOCATION(120, "HTTP Violation: Invalid Location HTTP Header", "returnsInvalidLocationHeader",
            "Even outside of 3xx redirections, the Location header can be used to specify for example where newly created resources can be accessed." +
                    " However, if a Location value point to a path for which there is no valid operation (not necessarily a GET) in the API, then such value might" +
                    " be likely wrong."),


    // 2xx: schema

    SCHEMA_INVALID_RESPONSE(200, "Schema Violation: Received A Response From API With A Structure/Data That Is Not Matching Its Schema",
            "returnsMismatchResponseWithSchema",
            "A schema, like for example OpenAPI for REST, defines the structures not only of the inputs but" +
                    " also the outputs of the API." +
                    " If what returned by an API is not conforming to its schema, then it is a clear fault." +
                    " However, whether the fault is in the API (i.e., it does not conform to the schema) or in the schema" +
                    " itself (i.e., it is underspecified, or having mistakes) is something that cannot be known for" +
                    " sure without debugging the issue."),
    SCHEMA_INVALID_ALLOW(201, "Schema Violation: Invalid Allow HTTP Header", "invalidAllow",
            "A returned Allow header specifies what operations (e.g., GET and PATCH) are available on a resource." +
                    " For consistency, this needs to match what actually defined in the schema of the API, apart from special cases" +
                    " such as HEAD and OPTIONS."),
    SCHEMA_STATUS_NO_401_IF_NO_AUTH(202, "Schema Violation: no-401-if-no-auth", "401WhenNoAuth",
            "Should not return a 401 non-authenticated if there is no authentication in the definition of the API (or conversely, authentication definition" +
                    " is wrongly missing)."),
    SCHEMA_STATUS_NO_403_IF_NO_401(203, "Schema Violation: no-403-if-no-401", "403WhenNo401",
            "Should not return a 403 non-authorized if there is no 401 non-authenticated in the definition of the API (or conversely, such definition" +
                    " is wrongly missing)."),
    SCHEMA_STATUS_HAS_406_IF_ACCEPT(204, "Schema Violation: has-406-if-accept", "406WhenValid",
            "If a valid payload is sent based on what declared in the schema, it should not happen that the API responds with a 406" +
                    " non-valid payload type."),
    SCHEMA_STATUS_NO_501_IF_IMPLEMENTED(205, "Schema Violation: no-501-if-implemented", "501OnDeclaredEndpoint",
            "If a schema defines an endpoint, then a call on it should not return a 501 Non-Implemented."),
    SCHEMA_VALIDATION_BYPASS(206, "Received Success Response When Sending Wrong Data",
            "successOnInvalidInputs",
            "API inputs might have constraints (e.g., integers in a specific range, and strings matching a" +
                    " given regular expression)." +
                    " Also, they need be to of specific types (e.g., integers, booleans, strings, dates, arrays and objects)." +
                    " If some input data does not satisfy the type on constraints defined in the schema, then the API should" +
                    " mark the request as 'user error'." +
                    " However, if for any reason the request is processed successfully, then it is a fault." +
                    " Either the schema is incorrect, or the API is not properly discarding invalid data."),



    // 3xx: security

    SECURITY_SQL_INJECTION(300, "SQL Injection (SQLi)",
            "vulnerableToSQLInjection",
            "Input data was not properly sanitized." +
                    " Its use in SQL commands led to execute arbitrary commands on the database." +
                    " See OWASP Top 10 for more information."),
    SECURITY_XSS(301, "Cross-Site Scripting (XSS)",
            "vulnerableToXSS",
            "XSS is an attack in which it is possible to inject malicious scripts into web pages viewed users." +
                    " This works as well in APIs, if the malicious payload is stored as it is," +
                    " and then read afterwards by a frontend web application." +
                    " See OWASP Top 10 for more information."),
    SECURITY_SSRF(302,"Server-Side Request Forgery (SSRF)",
            "vulnerableToSSRF",
            "Some inputs might be URLs, which are then used by the API to retrieve data from external services." +
                    " However, if the hostnames of these URLs are not verified, the API could be tricked into making requests" +
                    " towards servers it should not to, like for example the 'localhost'." +
                    " See OWASP Top 10 for more information."),
    SECURITY_MASS_ASSIGNMENT(303,"Mass Assignment",
            "vulnerableToMassAssignment",
            "This vulnerability exploits possible active record pattern misconfigurations to modify fields of " +
                    " a record that should not be accessible via the API." +
                    " See OWASP Top 10 for more information."),
    SECURITY_EXISTENCE_LEAKAGE(304, "Leakage Information Existence of Protected Resource",
            "allowsUnauthorizedAccessToProtectedResource",
            "When accessing a protected resource, could get as a response a 403 not-authorized status code." +
                    " If the resource does not exist, then returning a 404 would be a security leak, as now the client would" +
                    " know if resources, they have no access to, do exist or not." +
                    " In these cases, to avoid unauthorized information leakage, a server should consistently either always return 403" +
                    " or 404 for protected resources, regardless of whether they exist or not."),
    SECURITY_NOT_RECOGNIZED_AUTHENTICATED(305, "Wrongly Not Recognized as Authenticated",
            "authenticatedButWronglyToldNot",
            "If the user is providing valid credentials, and if they try to access a protected resource," +
                    " they should get a status code 403 (not authorized), and not 401 (not authenticated)." +
                    " With a 401, the user might wrongly think there is a problem with their credentials, and not that they" +
                    " have no right to access to that resource." +
                    " However, to avoid false positives related to misconfigured credentials, these credentials should be first" +
                    " successfully validated on some other resources before flagging a returned 401 as a server fault."),
    SECURITY_WRONG_AUTHORIZATION(306, "Allowed To Modify Resource That Likely Should Had Been Protected",
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
                    " be quite suspicious if a DELETE would work just fine on that resource."),
    SECURITY_IGNORE_ANONYMOUS(307, "A Protected Resource Is Accessible Without Providing Any Authentication",
            "ignoreAnonymous",
            "Protected resources would return a 403 status code when a user that has no rights to them tries" +
                    " to access them. Without providing a formal specification, it might not be possible to know which users" +
                    " have rights or not on a resource. However, being able to access it with no authentication, while some" +
                    " authenticated users are blocked, would be a major security vulnerability. Blocked users could simply" +
                    " drop their authentication credentials to access those protected resources."),
    SECURITY_ANONYMOUS_MODIFICATIONS(308, "Anonymous Modifications",
            "anonymousModifications",
            "Not all systems require authentication when reading data, or creating new ones." +
                    " Without a formal specification, a fuzzer cannot know if a resource is expected to be public or not." +
                    " However, 'modifying' data (e.g., with DELETE, PUT and PATCH) with no credentials is problematic. " +
                    " A user could delete all existing data, or change any new data as soon as it is created by others."),
    SECURITY_LEAKED_STACK_TRACES(309, "Leaked Stack Trace",
            "leakedStackTrace",
            "In case of bugs, the internal business logic of the tested application could throw exceptions." +
                    " For debugging reasons, the responses from the HTTP server could contain the stack-trace of those" +
                    " thrown exceptions." +
                    " Albeit useful for debugging, those stack-traces could reveal internal details of the system." +
                    " This would be a security leak if those debugging settings are left in production."),
    SECURITY_HIDDEN_ACCESSIBLE_ENDPOINT(310, "Hidden Accessible Endpoint",
            "hiddenAccessible",
            "To test an API, there is the need of a schema that specifies what endpoints can be called." +
                    " Being able to call endpoints that are not declared in the schema is a potential risk, as those" +
                    " might be either forgotten endpoints, work-in-progress, admin-only endpoints, etc., whose security" +
                    " protections might not be fully tested or in place." +
                    " Either the call should fail for auth reasons (e.g., 401 and 403 in REST APIs), or the system" +
                    " should respond that the endpoint does not exist (e.g., 405 and 501)."),



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
