
# Setup .net framework env

暴力的把Setup-MSBuild，Setup-VSTest和Setup-Nuget三个github actions搓成一团。  
Mix Setup-MSBuild, Setup-VSTest and Setup-Nuget together.  

# Usage

Basic:
```yaml
steps:
name: ASP.NET CI
on: [push]
jobs:
  build:
    runs-on: windows-latest

    steps:
    - uses: actions/checkout@master

    - name: Setup .net framework env
      uses: vrnobody/Setup-DotNetFrameworkEnv@v1

    - name: Nuget
      run: nuget restore MyProject.sln 

    - name: MSBuild
      run: msbuild MyProject.sln

    - name: VSTest
      run: vstest.console MyTestProject/bin/Release/MyTestProject.Test.dll
```


# License

The scripts and documentation in this project are released under the [MIT License](LICENSE)

# Credits

https://github.com/warrenbuckley/Setup-Nuget
https://github.com/warrenbuckley/Setup-MSBuild
https://github.com/Malcolmnixon/Setup-VSTest