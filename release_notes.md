# SNAPSHOT

Under development in `master` branch.

# 0.6.0

- Added CreateUsers option in auth specs. This is useful to specify how to create new users on the fly during the fuzzing process.  

# 0.5.1

- Web Report: fixed bug in which low-code view did not work for test comments written in Python and JavaScript

# 0.5.0

- Web Report: added new "Warnings" tab to show all general warnings reported by the fuzzer
- Web Report: added new "Examples" tab to filter tests by the named examples they use (if any)
- Web Report: fixed bug in which accordions' state was not saved when changing tab.

# 0.4.1

- Fixed bugs in Web Report related to endpoint filters when changing tab.

# 0.4.0

- Auth Schema: replaced 'required' with 'x-required' in few places to deal with issue with template resolution
- Web Report: added first version of test case manual validation

# 0.3.0

- Web Report: displayed icon, and fixed some coloring and description issues
- Added 4 new fault categories related to latest security work

# 0.2.0

- breaking changes: refactored how _TokenHandling_ is defined in auth schema
- in report, added info on _executionTimeInSeconds_ and _evaluatedHttpCalls_

# 0.1.0

- first public release
- integration with Zenodo

# 0.0.6

- removed yarn
- HTTP status can now be optional (needed when HTTP calls timeout)
- better description for schema errors

# 0.0.5

- New security fault categories

# 0.0.4

- Fixed camelCase in schemas
- Fixed handling of timestamp
- Provided fault category descriptions

# 0.0.3
- Removing all annotations in generated DTOs

# 0.0.2
- Support for auth

# 0.0.1
- First draft version