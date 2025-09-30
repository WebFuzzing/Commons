# Authentication with WFC

The API/SUT might require authenticated requests.
And there are several different mechanism to do authentication.

This documentation explains, with some examples, how WFC can be used to create auth configuration files using the JSON Schema defined in [auth.yaml](src/main/resources/wfc/schemas/auth.yaml).

The idea is to define in configuration files (e.g., in YAML and TOML formats) how authentication can be done, by defining info for some users. 
This information needs to be actually existing and valid, as the APIs will need to validate it. 

As this info is specific to the testing environment in which the fuzzing is done, it is not something that should be really specified in the API schemas (e.g., OpenAPI for REST). 
Therefore, separated configurations are a necessity.  

These configuration files just specify _how_ authentication can be done with concrete values (e.g., user ids and passwords). 
Still, it is up to the fuzzers to read such information, and then make the correct authentication calls. 

> __NOTE:__ If the type of authentication you need is not currently supported, please open a new feature request on [our issue page](https://github.com/WebFuzzing/Commons/issues).


## Static Tokens

```
auth:
  - name: FOO
    fixedHeaders:
      - name: Authorization
        value: " some static token for FOO"
  - name: BAR
    fixedHeaders:
      - name: Authorization
        value: " some static token for BAR"
```

An array called `auth` is instantiated, having each entry representing the authentication info for different users. 
In this example, two users are defined: _FOO_ and _BAR_.
The names here are just for documentation (e.g., fuzzers could use such names as comments when generating test cases using such info).

When they need to authenticate, these users require some fixed values in some specified HTTP header, sent on each HTTP call.   
This is for example what needed in HTTP Basic (RFC-7617).
The "token" here is static, e.g., not changing.
This could be for example including userid and password of the user, possibly encoded in different formats (e.g., Base64).
Such credentials (i.e., userid/password) would not change per user, and so can be specified only once.

Everytime a fuzzer want to make an authenticated call with user _BAR_, based on that information it should send the HTTP requests with `Authorization: some static token for BAR` header. 

Static tokens are not really recommended, and should be avoided. 
Still, WFC enables to support their definition, if needed.  

## Dynamic Tokens

A common practice is to send a login request to a login endpoint (on same the API, or a third-party one), and extract a _dynamic_ token from the response. 
The token can be used in following HTTP requests. 
The token will be specific for the user, and have a limited lifespan in which it is valid for authentication. 

Let's consider this following example of configuration:

```
auth:
  - name: foo
    loginEndpointAuth:
      payloadRaw: "{\"username\": \"foo\", \"password\": \"123\"}"
  - name: bar
    loginEndpointAuth:
      payloadUserPwd:
        username: bar
        password: "456"
        usernameField: username
        passwordField: password

authTemplate:
  loginEndpointAuth:
    endpoint: /login
    verb: POST
    contentType: application/json
    expectCookies: true
```

Here, 2 example users are specified under `auth`: `foo` and `bar`, with their passwords.

The payload sent to the login endpoint could be either specified as it is (i.e., with `payloadRaw`), or with username/password separately (from which the right payload is automatically derived and formatted based on the `contentType`, e.g., `application/json` or `application/x-www-form-urlencoded`).

There are several pieces of information that would be the same for both users:
* `endpoint`: the path for the endpoint with the login (can use `externalEndpointURL` if it is on a different server).
* `verb`: the HTTP verb used to make the request (typically it is a `POST`).
* `contentType`: specify how the payload will be sent (e.g., JSON in this case).
* `expectCookies`: tell the fuzzer that from the login endpoint we expect to get a cookie for the authentication.

To avoid duplication, shared info can be defined in the `authTemplate` object.

Note that, at times, username/password information might be passed via a header (e.g., with `Basic`), instead of with a body payload.
This is supported with the array `headers`, in which each header can be specified with a `name` and `value`.
For example:

```
auth:
  - name: test
    loginEndpointAuth:
      endpoint: /api/login
      verb: POST
      headers:
        - name: Authorization
          value: "Basic dGVzdDp0ZXN0Cg=="
```



If instead of cookies we have a token to be extracted from the JSON response of the login endpoint, we can use something like:

```
auth:
  loginEndpointAuth:
     # ... other data here
     token:
        headerPrefix="Bearer "
        extractFromField = "/token/authToken"
        httpHeaderName="Authorization"
```

What will happen here is that a fuzzer will make a POST to `/login` and then extract the field `token.authToken` from the JSON response (the entry `extractFromField` is treated as a JSON Pointer (RFC 6901)).
Assume for example we have `token.authToken = 123456`.
In the following auth requests, then the fuzzer will make requests with HTTP header: `Authorization:Bearer 123456`.


## Fuzzer Configurations

Having right authentication credentials is essential when testing real-world APIs.
As such, preparing an authentication configuration file would hence become a common practice.  
Still, the fuzzer itself might have different configuration settings not related to authentication (e.g., related to where to output the generated tests, and for how long to run the fuzzer).
Such info could be passed on the command-line as program inputs, or specified in a configuration file. 
In this latter case, having two different configuration files (one for authentication and one for internal settings) might be cumbersome. 

To avoid such issue, WFC Authentication supports the object `configs`. 
This is an object of string fields. 
It can be treated as a map/dictionary of `key:value` pairs. 
Each key is a fuzzer configuration property, with given chosen value.
As each configuration property will be specific to each fuzzer, the map is generic from string keys to string values. 

The following is an example for the fuzzer _EvoMaster_.
If there is no `em.yaml` file, _EvoMaster_ generates automatically an empty configuration file `em.yaml`, where all available options are commented out. 
This includes the `config` object, as well as `auth` and `authTemplate`.

```
### Template configuration file for EvoMaster.
### Most important parameters are already present here, commented out.
### Note that there are more parameters that can be configured. For a full list, see:
### https://github.com/EMResearch/EvoMaster/blob/master/docs/options.md
### or check them with the --help option.


configs:  {} # remove this {} when specifying properties
#   bbSwaggerUrl: ""
#   bbTargetUrl: ""
#   blackBox: false
#   configPath: "em.yaml"
#   endpointFocus: null
#   endpointPrefix: null
#   endpointTagFilter: null
#   header0: ""
#   header1: ""
#   header2: ""
#   maxTime: "5m"
#   outputFilePrefix: "EvoMaster"
#   outputFileSuffix: "Test"
#   outputFolder: "generated_tests"
#   outputFormat: "DEFAULT"
#   overrideOpenAPIUrl: ""
#   prematureStop: ""
#   ratePerMinute: 0
#   sutControllerHost: "localhost"
#   sutControllerPort: 40100
#   testTimeout: 60



### Authentication configurations.
### For each possible registered user, can provide an AuthenticationDto object to define how to log them in.
### Different types of authentication mechanisms can be configured here.
### For more information, read: https://github.com/EMResearch/EvoMaster/blob/master/docs/auth.md

#auth:
#  - name: ?
#    fixedHeaders:
#      - name: ?
#        value: ?
#    loginEndpointAuth:
#        endpoint: ?
#        externalEndpointURL: ?
#        payloadRaw: ?
#        payloadUserPwd:
#            username: ?
#            password: ?
#            usernameField: ?
#            passwordField: ?
#        verb: GET | POST
#        contentType: ?
#        token:
#            extractFromField: ?
#            httpHeaderName: ?
#            headerPrefix: ?
#        expectCookies: true | false


### Authentication Template.
### When defining auth info for several test users, lot of info might be replicated, e.g.:
###   endpoint: /login
###   verb: POST
###   contentType: application/json
###   expectCookies: true
### To avoid replicating same setting over and over again, common settings can be put in a template.
### When this configuration file is loaded, all fields from the template are applied to all
### fields in the auth settings, unless those are not 'null' (i.e., they will not be overridden).
### Note that, as names must be unique, 'name' field should not be specified in the template.


#authTemplate:
#    fixedHeaders:
#      - name: ?
#        value: ?
#    loginEndpointAuth:
#        endpoint: ?
#        externalEndpointURL: ?
#        payloadRaw: ?
#        payloadUserPwd:
#            username: ?
#            password: ?
#            usernameField: ?
#            passwordField: ?
#        verb: GET | POST
#        contentType: ?
#        token:
#            extractFromField: ?
#            httpHeaderName: ?
#            headerPrefix: ?
#        expectCookies: true | false
```










