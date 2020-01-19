import * as core from '@actions/core';
import * as tc from '@actions/tool-cache';
import * as exec from '@actions/exec';
import * as path from 'path';
import * as fs from 'fs';
import { ExecOptions } from '@actions/exec/lib/interfaces';

/*
Credits:
https://github.com/warrenbuckley/Setup-Nuget
https://github.com/warrenbuckley/Setup-MSBuild
https://github.com/Malcolmnixon/Setup-VSTest
*/

const nugetVersion = "latest";
const nugetUrl = `https://dist.nuget.org/win-x86-commandline/${nugetVersion}/nuget.exe`;

const vsWhereVersion = "2.7.1";
const vsWhereUrl = `https://github.com/microsoft/vswhere/releases/download/${vsWhereVersion}/vswhere.exe`;

async function Main() {
  try {

    if(process.platform !== 'win32'){
      core.setFailed("This action only works for Windows.");
      return;
    }

    const nugetLocation = tc.find("nuget", nugetVersion) || await DownloadNuget();
    core.debug(`Found nuget at ${nugetLocation}`);

    const vsWhereLocation = tc.find("vswhere", vsWhereVersion) || await DownloadVsWhere();
    core.debug(`Found vswhere.exe at ${vsWhereLocation} `);

    const AddToPathHelper = CreateAddToPathHelper(vsWhereLocation);
    AddToPathHelper("MSBuildPath", FindMSBuild);
    AddToPathHelper("VSTestPath", FindVSTest);

  } catch (error) {
    core.setFailed(error.message);
  }
}

Main();

async function DownloadNuget(): Promise<string>{

   // Download latest Nuget.exe
   core.debug("Downloading Nuget tool");
   const nugetPath = await tc.downloadTool(nugetUrl);

   // Rename the file which is a GUID without extension
   var folder = path.dirname(nugetPath);
   var fullPath = path.join(folder, "nuget.exe");
   fs.renameSync(nugetPath, fullPath);

   //Cache the directory with Nuget in it - which returns a NEW cached location
   var cachedToolDir = await tc.cacheDir(folder, "nuget", nugetVersion);
   core.debug(`Cached Tool Dir ${cachedToolDir}`);

   // Add Nuget.exe CLI tool to path for other steps to be able to access it
   core.addPath(cachedToolDir);

   return cachedToolDir;
}

async function DownloadVsWhere(): Promise<string> {

  core.debug(`Downloading VSWhere ${vsWhereVersion} tool`);
  const vsWherePath = await tc.downloadTool(vsWhereUrl);

  // Rename the file which is a GUID without extension
  var folder = path.dirname(vsWherePath);
  var fullPath = path.join(folder, "vswhere.exe");
  fs.renameSync(vsWherePath, fullPath);

  //Cache the directory with VSWhere in it - which returns a NEW cached location
  return await tc.cacheDir(folder, "vswhere", vsWhereVersion);
}

function CreateAddToPathHelper(vswhereLocation: string){
  let vw = vswhereLocation;
  return async function (tag: string, handler:(location: string) => Promise<string>){
    var path = await handler(vw);
    core.debug(`${tag} == ${path}`);
    core.addPath(path);  
  }
}

async function FindMSBuild(pathToVSWhere: string): Promise<string>{

  var msBuildPath = "";

  const options:ExecOptions = {};
  options.listeners = {
    stdout: (data: Buffer) => {
      var output = data.toString();
      msBuildPath += output;
    }
  };

  // Run VSWhere to tell us where MSBuild is
  var vsWhereExe = path.join(pathToVSWhere, "vswhere.exe");
  await exec.exec(vsWhereExe, ['-latest', '-requires', 'Microsoft.Component.MSBuild', '-find', 'MSBuild\\**\\Bin\\MSBuild.exe'], options);

  if(msBuildPath === ""){
    core.setFailed("Unable to find MSBuild.exe");
  }

  var folderForMSBuild = path.dirname(msBuildPath)
  core.debug(`MSBuild = ${msBuildPath}`);
  core.debug(`Folder for MSBuild ${folderForMSBuild}`);

  return folderForMSBuild;
}

async function FindVSTest(pathToVSWhere: string): Promise<string>{

  let vsTestPath = "";

  const options:ExecOptions = {};
  options.listeners = {
    stdout: (data: Buffer) => {
      var output = data.toString();
      vsTestPath += output;
    }
  };

  // Run VSWhere to tell us where VSTest.Console is
  var vsWhereExe = path.join(pathToVSWhere, "vswhere.exe");

  // https://github.com/Malcolmnixon/Setup-VSTest/pull/3/commits/a773224064f250e2c6d53ad44764727a7dcea5e4
  await exec.exec(vsWhereExe, ['-latest', '-products', '*', '-requires', 'Microsoft.VisualStudio.Workload.ManagedDesktop', 'Microsoft.VisualStudio.Workload.Web', '-requiresAny', '-property', 'installationPath'], options);

  if(vsTestPath === ""){
    core.setFailed("Unable to find VSTest.Console.exe");
  }

  // https://github.com/Malcolmnixon/Setup-VSTest/pull/3/commits/a773224064f250e2c6d53ad44764727a7dcea5e4
  vsTestPath = path.join(vsTestPath.trimRight(), '\\Common7\\IDE\\CommonExtensions\\Microsoft\\TestWindow\\vstest.console.exe')

  var folderForVSTest = path.dirname(vsTestPath)
  core.debug(`VSTest = ${vsTestPath}`);
  core.debug(`Folder for VSTest ${folderForVSTest}`);

  return folderForVSTest;
}