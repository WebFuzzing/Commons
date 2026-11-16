# Governance

This document clarifies the governance rules behind the development and maintenance of this open-source project Web Fuzzing Commons (WFC). 

The main goal of WFC is to provide solutions to common problems for Web APIs fuzzers (currently focusing on REST, but in future it will be extended to others like GraphQL). 
A driving factor behind this was to simplify and enhance the execution of empirical comparisons in scientific publications related to web API fuzzing. 
However, benefits of WFC also extend to the final users of those fuzzers employing WFC. 

## Members

### Member Requirements

Specific individuals are not direct members of WFC, but rather existing fuzzers. The developers of each fuzzer in WFC then have to name one or more contact point for it. 
Regardless of the number of contact points, each fuzzer has only 1 vote when disagreements need to be resolved.
There is only one strong requirement to be part of WFC:

> Requirement: a fuzzer must have an official release in the last 12 months. 

We want to avoid involving (and waiting for replies!) fuzzers that are no longer maintained, as they would most likely not contribute to WFC's further improvements. 

### Member Roles

Currently, there are 3 different roles in WFC membership:

* _MAINTAINER_: highest level. Expected to actively contribute, and be available for comments typically within 5 working days, as required to approve all changes. 

* _CONTRIBUTOR_: propose changes, and having voting rights when discussing changes. A maintainer is also automatically a contributor.  

* _OBSERVER_: no voting right, but will get notified of major events in WFC (e.g., breaking changes). Can still provide feedback and be involved in the discussions (but, as stated, no voting rights).

### Joining With a Role

The authors of any existing fuzzer can ask to join as an _OBSERVER_, as long as the previously stated member requirements are all satisfied. 

To join as a _CONTRIBUTOR_, the fuzzer must have some minimal level of popularity. Currently, the threshold to quantify such popularity is 100 stars on GitHub. Fuzzers that do not reach such threshold can still ask to join as contributors, but that requires a majority vote of all current contributors.
On the one hand, we want to be as inclusive as possible. 
On the other hand, we want to keep some level of quality.

Any _CONTRIBUTOR_ can become a _MAINTAINER_, just by requesting it. However, the work expectations for maintainers are higher than for contributors (e.g., must check and approve all PRs in a timely manner). Maintainers have the same voting rights as the contributors.  

### Current Members

Currently, the members of WFC, with contact points, are:

_MAINTAINERS_
* [EvoMaster](https://github.com/WebFuzzing/EvoMaster) (@arcuri82)

_CONTRIBUTORS_
* [CATS](https://github.com/Endava/cats) (@en-milie)
* [Schemathesis](https://github.com/schemathesis/schemathesis) (@Stranger6667)
* [WuppieFuzz](https://github.com/TNO-S3/WuppieFuzz) (@grebnetiew, @ThomasTNO )

_OBSERVERS_
(Currently none)

## Activities

### Types of Activities

Currently, there three main types of activity. Each PR _must_ start its title with the activity name in brackets. 

* __\[BREAKING\]__: a breaking change in WFC, which would require update activities in all fuzzers using WFC. After 1.0 release, breaking changes should be minimized, ideally. Breaking changes require a majority vote among the contributors. Observers will be notified. 

* __\[ADDITION\]__: adding a new feature to WFC that does not require a direct change in any existing fuzzers. A typical example is adding a new fault category. If there is no objection raised, additions only require one maintainer and one other contributor to be approved. If objections are raised, a majority vote is required. Depending on the importance of the added features, observers might or might not be notified. 

* __\[MISC\]__: internal coding/documentation activity that has no direct impact on the implementations of the fuzzers using WFC. This could be adding some info to README, fixing typos, adding tests for schema validation, improvements to WFC Web Report, etc. Typically, only maintainers deal with this kind of activity. Depending on the importance of the changes, contributors might or might not be notified, at the discretion of the maintainers.

When some activities are still under discussion, and no PR is created yet, such discussions might or might not use those tags. 
For example, at the beginning of a discussion it might be unclear if a change is just an addition or if it will require a breaking change. 
Titles can be updated afterward to reflect any update in the discussions. 

### Time Expectation

Ideally, we would like to hear the opinions of all contributors before making changes to WFC.
However, shockingly, people have lives! 
Which include binding commitments that take precious time away from (typically) unpaid contributions to open-source projects. 

It is expected that, at times, not everyone can be reachable for comments. 
It can be a busy period at work, or being on vacation (where typical vacation periods can be very different around the globe). 
Still, we cannot put decisions in WFC on hold indefinitely.
Some time constrains need to be put in place when we need to make a decision. 
However, those deadlines will depend on the type of activity. 

* __\[BREAKING\]__: 1 month. If after 1 month there are still contributors that have not expressed an opinion, these contributors will be excluded in the decision process. Note that, if a contributor has no opinion on a given breaking change, they are still expected to write a "no opinion" comment, so the rest do not need to wait a month before implementing the change. As notifications can get missed, reminders should be sent (e.g., after 2 weeks, and 2 days before the deadline).

* __\[ADDITION\]__: 2 weeks. No reminder is sent. 

* __\[MISC\]__: 1 week. If there is currently only one maintainer, no wait is needed. 

### How To Notify

Notifications are done by @ tagging on GitHub (e.g., in PRs, issues and discussions) the contact points of each fuzzer. 
Reminders are sent by retagging, and by direct contact (e.g., emails and LinkedIn messages). 
It is responsibility of the maintainers to carry out those reminder communications. 

### SemVer

In this project, we follow `X.Y.Z` Semantic Versioning (SemVer). 
A breaking change requires increasing `X` (unless we are still on version `0.?.?`) when making a new release, whereas an addition would require increasing `Y`. For misc changes, those would typically be confined to increasing `Z`, albeit in some cases (e.g., when improving WFC Web Report) could need a change in `Y`. 


## Changes To This Document 

Any change on this document, regardless of how trivial it is, is automatically treated as a \[BREAKING\] change. 
As such, it requires consensus among all contributors, or a vote otherwise. 


