

[![DOI](https://zenodo.org/badge/964562983.svg)](https://doi.org/10.5281/zenodo.16948757)



# Commons
Web Fuzzing Commons (WFC): A set of standards and library support for facilitating fuzzing Web APIs.

## DISCLAIMER

This is a new project, for which we are writing documentation now. 
More will be added in the next coming weeks. 


## Overview

WFC is aimed at developers of Web API fuzzers, by providing utilities and library support for tasks that are common for all fuzzers. 
Currently, we focus on REST APIs. 
But future versions of WFC will likely be extended to support GraphQL and RPC as well. 

There are 4 main contributions in WFC:

1) _WFC Authentication_: a JSON Schema definition to represent authentication information for fuzzers. Currently under [src/main/resources/wfc/schemas/auth.yaml](src/main/resources/wfc/schemas/auth.yaml). Documentation on how to use is can be found at [UNDER-CONSTRUCTION]. Examples of configurations files can be found in the [Web Fuzzing Dataset (WFD) repository](https://github.com/WebFuzzing/Dataset).   

2) _WFC Faults_: classification of existing automated oracles proposed in the literature of fuzzing web APIs. Currently under [src/main/resources/wfc/faults/fault_categories.json](src/main/resources/wfc/faults/fault_categories.json).

3) _WFC Report_: a JSON schema definition to represent output information from the fuzzers. Currently under [src/main/resources/wfc/schemas/report.yaml](src/main/resources/wfc/schemas/report.yaml).

4) _WFC Web Report_: a web application that is able to visualize and interact with fuzzer reports in WFC format. Currently under [web-report](web-report). 


To access this data, besides referring directly to this GitHub repository, we also package it in a Maven dependency library, [published on Maven Central](https://central.sonatype.com/artifact/com.webfuzzing/commons).

> If you need to access such data from other popular library repositories for other programming languages besides Java/Kotlin (e.g., Python), we are happy to deploy there as well if there is interest in it. In such a case, you can create a new Feature Request on the issue page.  

## For Fuzzer Developers

If you are a developer of a Web API fuzzer, there are 3 ways in which you can contribute:

1) If you developed a novel automated oracle for detecting faults in APIs, you can make a PR (or send us a description) to add its information to _WFC Faults_. 

2) If there is some authentication mechanism not currently expressible with WFC, please open a new issue to describe it. 

3) If you tried to integrate WFC in your fuzzer, but got stuck with some issues, let us know! We welcome contributions and people that want to join the development and standardization of WFC.  


## Citation

If you are using WFC in an academic work, you can cite the following:

> O. Sahin, M. Zhang, A. Arcuri.
**WFC/WFD: Web Fuzzing Commons, Dataset and Guidelines to Support Experimentation in REST API Fuzzing**.
[arxiv 2509.01612](https://arxiv.org/abs/2509.01612)


## Fuzzers Supporting WFC

WFC has been initially developed by the authors of [EvoMaster](https://github.com/WebFuzzing/EvoMaster). 
If your fuzzer supports now WFC (e.g., implements authentication mechanisms based on WFC schema definition, and can output results in WFC report format), create a PR (or send us a message) and we will add information about it here.

Current fuzzers (fully/partially) supporting WFC:
* [EvoMaster](https://github.com/WebFuzzing/EvoMaster)




