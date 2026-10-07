# Web Fuzzing Commons

[Web Fuzzing Commons (WFC)](https://github.com/WebFuzzing/Commons)  is a set of standards and library support for facilitating fuzzing Web APIs.

This Python library contains all the static assets of [WFC](https://github.com/WebFuzzing/Commons).
Currently:

```
data/
├── auth.yaml
├── fault_categories.json
├── report.yaml
└── webreport/
    ├── index.html
    ├── robots.txt
    ├── webreport.bat
    ├── webreport.command
    └── assets/
        ├── report.css
        └── report.js    
```

The library can be installed with:

`python3 -m pip install webfuzzing-commons`

and then be used inside a Python program with for example:

```
from importlib import resources

file_ref = resources.files('webfuzzing_commons').joinpath('data','auth.yaml')

content = file_ref.read_text(encoding='utf-8')

print(content)
```