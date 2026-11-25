Hi,

we are the authors of Web Fuzzing Commons (WFC) [https://github.com/WebFuzzing/Commons](https://github.com/WebFuzzing/Commons).
This is a community driven project stewarded by the authors of the most popular REST API fuzzers, currently including
[CATS](https://github.com/Endava/cats),
[EvoMaster](https://github.com/WebFuzzing/EvoMaster),
[Schemathesis](https://github.com/schemathesis/schemathesis),
and [WuppieFuzz](https://github.com/TNO-S3/WuppieFuzz).

We are contacting the authors of all the major fuzzers for Web APIs (at least 100 stars on GitHub) that are still maintained (ie, a new release in the last 12 months), to see if they want to join us in this project. 

WFC has 2 main goals: 

1) defining a common standard for declarative configurations of authentication information in fuzzing REST APIs.
Instead of authentication scripts, the idea is to provide info in YAML/TOML configuration files, and then let the fuzzers make the actual authentication calls.
This has few advantages: scripts can be reused between different fuzzers (useful for empirical comparisons) and require no coding skills for the users (e.g., testers). It also simplifies supporting test suite outputs in different formats (e.g., Python and Java).

2) defining a common taxonomy of existing automated oracles proposed in the literature of fuzzing Web APIs. This is needed when results of detected faults are compared among fuzzers, and also to have a common vocabulary for the different types of detected faults. 

Note that WFC is already fully supported by these fuzzers. 
However, changes might be needed in the future. 
If interested, this is an opportunity to be part of those discussions. 
If you want to join, you can read our [Governance Charter](https://github.com/WebFuzzing/Commons/blob/master/GOVERNANCE.md) first.

cheers

WFC Team