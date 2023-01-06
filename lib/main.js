"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const tc = __importStar(require("@actions/tool-cache"));
const exec = __importStar(require("@actions/exec"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
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
function Main() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            if (process.platform !== 'win32') {
                core.setFailed("This action only works for Windows.");
                return;
            }
            const nugetLocation = tc.find("nuget", nugetVersion) || (yield DownloadNuget());
            core.debug(`Found nuget at ${nugetLocation}`);
            const vsWhereLocation = tc.find("vswhere", vsWhereVersion) || (yield DownloadVsWhere());
            core.debug(`Found vswhere.exe at ${vsWhereLocation} `);
            const AddToPathHelper = CreateAddToPathHelper(vsWhereLocation);
            AddToPathHelper("MSBuildPath", FindMSBuild);
            AddToPathHelper("VSTestPath", FindVSTest);
        }
        catch (error) {
            if (error instanceof Error) {
                core.setFailed(error.message);
            }
        }
    });
}
Main();
function DownloadNuget() {
    return __awaiter(this, void 0, void 0, function* () {
        // Download latest Nuget.exe
        core.debug("Downloading Nuget tool");
        const nugetPath = yield tc.downloadTool(nugetUrl);
        // Rename the file which is a GUID without extension
        var folder = path.dirname(nugetPath);
        var fullPath = path.join(folder, "nuget.exe");
        fs.renameSync(nugetPath, fullPath);
        //Cache the directory with Nuget in it - which returns a NEW cached location
        var cachedToolDir = yield tc.cacheDir(folder, "nuget", nugetVersion);
        core.debug(`Cached Tool Dir ${cachedToolDir}`);
        // Add Nuget.exe CLI tool to path for other steps to be able to access it
        core.addPath(cachedToolDir);
        return cachedToolDir;
    });
}
function DownloadVsWhere() {
    return __awaiter(this, void 0, void 0, function* () {
        core.debug(`Downloading VSWhere ${vsWhereVersion} tool`);
        const vsWherePath = yield tc.downloadTool(vsWhereUrl);
        // Rename the file which is a GUID without extension
        var folder = path.dirname(vsWherePath);
        var fullPath = path.join(folder, "vswhere.exe");
        fs.renameSync(vsWherePath, fullPath);
        //Cache the directory with VSWhere in it - which returns a NEW cached location
        return yield tc.cacheDir(folder, "vswhere", vsWhereVersion);
    });
}
function CreateAddToPathHelper(vswhereLocation) {
    let vw = vswhereLocation;
    return function (tag, handler) {
        return __awaiter(this, void 0, void 0, function* () {
            var path = yield handler(vw);
            core.debug(`${tag} == ${path}`);
            core.addPath(path);
        });
    };
}
function FindMSBuild(pathToVSWhere) {
    return __awaiter(this, void 0, void 0, function* () {
        var msBuildPath = "";
        const options = {};
        options.listeners = {
            stdout: (data) => {
                var output = data.toString();
                msBuildPath += output;
            }
        };
        // Run VSWhere to tell us where MSBuild is
        var vsWhereExe = path.join(pathToVSWhere, "vswhere.exe");
        yield exec.exec(vsWhereExe, ['-latest', '-requires', 'Microsoft.Component.MSBuild', '-find', 'MSBuild\\**\\Bin\\MSBuild.exe'], options);
        if (msBuildPath === "") {
            core.setFailed("Unable to find MSBuild.exe");
        }
        var folderForMSBuild = path.dirname(msBuildPath);
        core.debug(`MSBuild = ${msBuildPath}`);
        core.debug(`Folder for MSBuild ${folderForMSBuild}`);
        return folderForMSBuild;
    });
}
function FindVSTest(pathToVSWhere) {
    return __awaiter(this, void 0, void 0, function* () {
        let vsTestPath = "";
        const options = {};
        options.listeners = {
            stdout: (data) => {
                var output = data.toString();
                vsTestPath += output;
            }
        };
        // Run VSWhere to tell us where VSTest.Console is
        var vsWhereExe = path.join(pathToVSWhere, "vswhere.exe");
        // https://github.com/Malcolmnixon/Setup-VSTest/pull/3/commits/a773224064f250e2c6d53ad44764727a7dcea5e4
        yield exec.exec(vsWhereExe, ['-latest', '-products', '*', '-requires', 'Microsoft.VisualStudio.Workload.ManagedDesktop', 'Microsoft.VisualStudio.Workload.Web', '-requiresAny', '-property', 'installationPath'], options);
        if (vsTestPath === "") {
            core.setFailed("Unable to find VSTest.Console.exe");
        }
        // https://github.com/Malcolmnixon/Setup-VSTest/pull/3/commits/a773224064f250e2c6d53ad44764727a7dcea5e4
        vsTestPath = path.join(vsTestPath.trimRight(), '\\Common7\\IDE\\CommonExtensions\\Microsoft\\TestWindow\\vstest.console.exe');
        var folderForVSTest = path.dirname(vsTestPath);
        core.debug(`VSTest = ${vsTestPath}`);
        core.debug(`Folder for VSTest ${folderForVSTest}`);
        return folderForVSTest;
    });
}
