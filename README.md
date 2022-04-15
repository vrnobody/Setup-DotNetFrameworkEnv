
# Setup .net framework env

暴力的把Setup-MSBuild，Setup-VSTest和Setup-Nuget三个github actions搓成一团。  
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
      - uses: actions/checkout@v2

      - name: Setup .net framework env
        uses: vrnobody/Setup-DotNetFrameworkEnv@v1.2.6

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

# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Credits

https://github.com/warrenbuckley/Setup-Nuget  
https://github.com/warrenbuckley/Setup-MSBuild  
https://github.com/Malcolmnixon/Setup-VSTest  
