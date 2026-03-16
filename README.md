# Deprecated
This project is deprecated. Please consider using [https://github.com/vrnobody/setup-net45](https://github.com/vrnobody/setup-net45).  
2026-03-16

# Setup .net framework env
Combine Setup-MSBuild, Setup-VSTest and Setup-Nuget together.  

# Usage

Basic:
```yaml
name: .net framework CI

on: [push]

jobs:
  build:
    runs-on: windows-2019

    steps:
      - uses: actions/checkout@v6

      - name: Setup .net framework env
        uses: vrnobody/Setup-DotNetFrameworkEnv@v1.24

      - name: Restore Nuget packages
        run: nuget restore MyProject.sln

      - name: Build solution
        run: msbuild MyProject.sln -p:Configuration=Release

      - name: Run unit tests
        run: |
          function Invoke-VSTest {
            & "vstest.console.exe" $args
            if(-not $?){ throw "fail!" }
          }
          Invoke-VSTest "MyTestProject/bin/Release/MyTestProject.Test.dll"

```

# Development

```bash
git clone https://github.com/vrnobody/Setup-DotNetFrameworkEnv.git
cd Setup-DotNetFrameworkEnv
npm install
npm run build
```

# Update log
[update-log.md](./update-log.md)

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Credits

https://github.com/warrenbuckley/Setup-Nuget  
https://github.com/warrenbuckley/Setup-MSBuild  
https://github.com/Malcolmnixon/Setup-VSTest  
