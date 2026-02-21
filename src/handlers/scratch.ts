import { FormatDefinition } from "../FormatHandler.ts";
import type { FileData, FileFormat, FormatHandler } from "../FormatHandler.ts";
import CommonFormats from "src/CommonFormats.ts";
import { loadPyodide } from "pyodide";

const SBFormat = new FormatDefinition(
    "Scratch 1 Project",
    "sb",
    "sb",
    "application/x-scratch-project",
    "archive"
);

const SB2Format = new FormatDefinition(
    "Scratch 2 Project",
    "sb2",
    "sb2",
    "application/x-scratch-project",
    "archive"
);

const SB3Format = new FormatDefinition(
    "Scratch 3 Project",
    "sb3",
    "sb3",
    "application/x.scratch.sb3",
    "archive"
);

const Sprite3Format = new FormatDefinition(
    "Scratch 3 Sprite",
    "sprite3",
    "sprite3",
    "application/x.scratch.sprite3",
    "archive"
);

function replaceFileExt(value, remove, add) {
  if (value.endsWith(remove)) value = value.slice(0, -remove.length);
  return value + add;
}

class sb3tosb2Handler implements FormatHandler {

  public name: string = "sb3tosb2";
  public ready: boolean = false;
  private pyodide = null;

  public supportedFormats?: FileFormat[] = [
    SB3Format.builder("sb3").allowFrom(),
    SB2Format.builder("sb2").allowTo(),
  ];

  async init () {
    this.ready = true;
  }

  async doConvert (
    inputFiles: FileData[],
    inputFormat: FileFormat,
    outputFormat: FileFormat
  ): Promise<FileData[]> {
    const inputFile = inputFiles[0];

    this.pyodide = await loadPyodide({ indexURL: "wasm", stdout: text => console.log(text), stderr: text => console.error(text) });
    await this.pyodide.loadPackage("audioop-lts");
    this.pyodide.FS.writeFile("input.sb3", inputFile.bytes);

    const argumentsCode = "import sys; sys.argv = ['python', 'sb3tosb2.py', '-c', 'input.sb3', 'output.sb2']";
    const mainCode = await (await fetch("wasm/sb3tosb2.py")).text();
    await this.pyodide.runPythonAsync(argumentsCode + "\n" + mainCode);

    const name = replaceFileExt(inputFile.name, ".sb3", ".sb2");
    const bytes = this.pyodide.FS.readFile("output.sb2");
    
    const outputFiles: FileData[] = [];
    outputFiles.push({
      name: name,
      bytes: bytes
    });
    return outputFiles;
  }

}

export default sb3tosb2Handler;
